const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const Assessment = require('../models/Assessment');
const AssessmentSection = require('../models/AssessmentSection');
const AssessmentAttempt = require('../models/AssessmentAttempt');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const CodingTest = require('../models/CodingTest');
const QuizAttempt = require('../models/QuizAttempt');
const StudentAnswer = require('../models/StudentAnswer');
const StudentCodingSubmission = require('../models/StudentCodingSubmission');
const User = require('../models/User');

const asyncHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next);

router.use(authMiddleware);

// ─── Helper: build section details ───────────────────────────────────────────
const buildSectionDetails = async (sections) => {
  const result = [];
  for (const sec of sections) {
    let title = '';
    let desc = '';
    let questions = null;
    let codingTest = null;

    if (sec.sectionType === 'QUIZ' && sec.referenceId) {
      const quiz = await Quiz.findById(sec.referenceId);
      if (quiz) {
        title = quiz.title;
        desc = quiz.description || '';
        const qs = await Question.find({ quiz: quiz._id });
        questions = qs.map((q) => ({
          id: q._id,
          questionText: q.questionText,
          questionImage: q.questionImage,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          marks: q.marks,
          quizId: quiz._id,
          multiAnswer: q.correctAnswer && q.correctAnswer.includes(','),
          // NOTE: correctAnswer intentionally excluded for students
        }));
      }
    } else if (sec.sectionType === 'CODING' && sec.referenceId) {
      const ct = await CodingTest.findById(sec.referenceId);
      if (ct) {
        title = ct.title;
        desc = ct.description || '';
        codingTest = {
          id: ct._id,
          title: ct.title,
          description: ct.description,
          sampleInput: ct.sampleInput,
          sampleOutput: ct.sampleOutput,
          difficulty: ct.difficulty,
          testCases: ct.testCases.map((tc) => ({ input: tc.input })), // hide expected output
          scheduledFor: ct.scheduledFor,
          validUntil: ct.validUntil,
        };
      }
    }

    result.push({
      id: sec._id,
      type: sec.sectionType,
      referenceId: sec.referenceId,
      order: sec.sectionOrder,
      title,
      description: desc,
      questions,
      codingTest,
    });
  }
  return result;
};

// ─── Helper: calculate total marks ───────────────────────────────────────────
const calcTotalMarks = async (sections) => {
  let total = 0;
  for (const sec of sections) {
    if (sec.sectionType === 'QUIZ' && sec.referenceId) {
      const qs = await Question.find({ quiz: sec.referenceId });
      total += qs.reduce((sum, q) => sum + (q.marks || 1), 0);
    } else if (sec.sectionType === 'CODING') {
      total += 20;
    }
  }
  return total;
};

// ── GET /assessment/:token — fetch assessment by share token ──────────────────
router.get('/:token', asyncHandler(async (req, res) => {
  let assessment = await Assessment.findOne({ shareToken: req.params.token });

  // Fallback: try as ID
  if (!assessment) {
    try {
      assessment = await Assessment.findById(req.params.token);
    } catch {}
  }

  if (!assessment) {
    return res.status(404).json({ success: false, message: 'Assessment not found' });
  }

  const sections = await AssessmentSection.find({ assessment: assessment._id }).sort({ sectionOrder: 1 });
  const sectionDetails = await buildSectionDetails(sections);
  const totalMarks = await calcTotalMarks(sections);

  res.json({
    success: true,
    data: {
      id: assessment._id,
      title: assessment.title,
      description: assessment.description,
      durationMinutes: assessment.durationMinutes,
      shareToken: assessment.shareToken,
      active: assessment.active,
      scheduledFor: assessment.scheduledFor,
      validUntil: assessment.validUntil,
      passingPercentage: assessment.passingPercentage,
      totalMarks,
      sections: sectionDetails,
    },
  });
}));

// ── POST /assessment/enroll — register a new student during assessment ─────────
router.post('/enroll', asyncHandler(async (req, res) => {
  const { name, email, phone } = req.query;
  if (!name || !email) {
    return res.status(400).json({ success: false, message: 'name and email are required' });
  }

  let user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    // Determine admin from referrer context — try any admin as fallback
    const admin = await User.findOne({ role: 'ADMIN' });
    user = await User.create({
      name,
      email: email.toLowerCase(),
      password: Math.random().toString(36).slice(-8),
      phone: phone || null,
      role: 'STUDENT',
      createdBy: admin?._id || null,
    });
    // Re-fetch to get full object (password is hashed via pre-save)
    user = await User.findById(user._id);
  }

  res.json({
    success: true,
    data: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone },
  });
}));

// ── POST /assessment/start ─────────────────────────────────────────────────────
router.post('/start', asyncHandler(async (req, res) => {
  const { assessmentId, studentId } = req.query;
  if (!assessmentId || !studentId) {
    return res.status(400).json({ success: false, message: 'assessmentId and studentId are required' });
  }

  const assessment = await Assessment.findById(assessmentId);
  if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found' });

  const student = await User.findById(studentId);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

  // Resume existing IN_PROGRESS attempt
  const existing = await AssessmentAttempt.findOne({
    assessment: assessmentId,
    student: studentId,
    status: 'IN_PROGRESS',
  });
  if (existing) {
    return res.json({
      success: true,
      data: {
        attemptId: existing._id,
        assessmentId: existing.assessment,
        studentId: existing.student,
        status: existing.status,
        startedAt: existing.startedAt,
      },
    });
  }

  // Create new attempt
  const attempt = await AssessmentAttempt.create({
    assessment: assessmentId,
    student: studentId,
    status: 'IN_PROGRESS',
  });

  // Create QuizAttempts for each QUIZ section
  const sections = await AssessmentSection.find({ assessment: assessmentId }).sort({ sectionOrder: 1 });
  for (const sec of sections) {
    if (sec.sectionType === 'QUIZ' && sec.referenceId) {
      const quiz = await Quiz.findById(sec.referenceId);
      if (quiz) {
        await QuizAttempt.create({
          student: studentId,
          quiz: quiz._id,
          status: 'IN_PROGRESS',
          assessmentAttempt: attempt._id,
        });
      }
    }
  }

  res.status(201).json({
    success: true,
    data: {
      attemptId: attempt._id,
      assessmentId: attempt.assessment,
      studentId: attempt.student,
      status: attempt.status,
      startedAt: attempt.startedAt,
    },
  });
}));

// ── POST /assessment/submit ───────────────────────────────────────────────────
router.post('/submit', asyncHandler(async (req, res) => {
  const { attemptId, answers } = req.body;
  // answers: { [questionId]: selectedOption }

  const attempt = await AssessmentAttempt.findById(attemptId).populate('assessment');
  if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });

  if (attempt.status === 'SUBMITTED') {
    return res.json({
      success: true,
      data: {
        attemptId: attempt._id,
        score: attempt.score,
        percentage: attempt.percentage,
        passed: attempt.passed,
        status: attempt.status,
      },
    });
  }

  const sections = await AssessmentSection.find({ assessment: attempt.assessment._id }).sort({ sectionOrder: 1 });
  const quizAttempts = await QuizAttempt.find({ assessmentAttempt: attempt._id });

  let totalScore = 0;
  let totalMaxScore = 0;

  for (const sec of sections) {
    if (sec.sectionType === 'QUIZ' && sec.referenceId) {
      const quiz = await Quiz.findById(sec.referenceId);
      if (!quiz) continue;

      const questions = await Question.find({ quiz: quiz._id });
      const quizMax = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
      totalMaxScore += quizMax;

      // Find or create a quiz attempt for this section
      let qa = quizAttempts.find(
        (a) => a.quiz && a.quiz.toString() === sec.referenceId.toString()
      );
      if (!qa) {
        qa = await QuizAttempt.create({
          student: attempt.student,
          quiz: quiz._id,
          status: 'IN_PROGRESS',
          assessmentAttempt: attempt._id,
        });
      }

      let sectionScore = 0;
      for (const q of questions) {
        const selected = answers && answers[q._id.toString()];
        let isCorrect = false;

        if (selected && selected.trim() && q.correctAnswer) {
          const correctSet = new Set(q.correctAnswer.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean));
          const selectedSet = new Set(selected.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean));
          isCorrect =
            correctSet.size === selectedSet.size &&
            [...correctSet].every((c) => selectedSet.has(c));
        }

        if (isCorrect) sectionScore += q.marks || 1;

        // Persist student answer
        if (selected !== undefined && selected !== null) {
          await StudentAnswer.findOneAndUpdate(
            { attempt: qa._id, question: q._id },
            { selectedOption: selected, isCorrect },
            { upsert: true, new: true }
          );
        }
      }

      const cappedScore = Math.min(sectionScore, quizMax);
      await QuizAttempt.findByIdAndUpdate(qa._id, {
        score: cappedScore,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      });
      totalScore += cappedScore;

    } else if (sec.sectionType === 'CODING' && sec.referenceId) {
      const codingMax = 20;
      totalMaxScore += codingMax;

      const codingSub = await StudentCodingSubmission.findOne({
        assessmentAttempt: attempt._id,
        codingTest: sec.referenceId,
      });
      if (codingSub?.passed) totalScore += codingMax;
    }
  }

  const percentage = totalMaxScore > 0
    ? Math.round((totalScore / totalMaxScore) * 10000) / 100
    : 100;

  const passingPct = attempt.assessment?.passingPercentage;
  const passed = passingPct == null || percentage >= passingPct;

  const updated = await AssessmentAttempt.findByIdAndUpdate(
    attempt._id,
    { status: 'SUBMITTED', score: totalScore, percentage, passed, submittedAt: new Date() },
    { new: true }
  );

  res.json({
    success: true,
    data: {
      attemptId: updated._id,
      score: updated.score,
      totalMarks: totalMaxScore,
      percentage: updated.percentage,
      passed: updated.passed,
      status: updated.status,
      submittedAt: updated.submittedAt,
    },
  });
}));

// ── POST /assessment/submit-coding ────────────────────────────────────────────
router.post('/submit-coding', asyncHandler(async (req, res) => {
  const { assessmentAttemptId, codingTestId, code, language, passed } = req.body;
  if (!assessmentAttemptId || !codingTestId) {
    return res.status(400).json({ success: false, message: 'assessmentAttemptId and codingTestId are required' });
  }

  const attempt = await AssessmentAttempt.findById(assessmentAttemptId);
  if (!attempt) return res.status(404).json({ success: false, message: 'Assessment attempt not found' });

  await StudentCodingSubmission.findOneAndUpdate(
    { assessmentAttempt: assessmentAttemptId, codingTest: codingTestId },
    { code, language, passed: !!passed, assessmentAttempt: assessmentAttemptId, codingTest: codingTestId },
    { upsert: true, new: true }
  );

  res.json({ success: true, message: 'Coding submission saved' });
}));

module.exports = router;
