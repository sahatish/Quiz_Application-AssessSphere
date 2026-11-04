import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Editor from '@monaco-editor/react'
import { questionApi, attemptApi, studentQuizApi, examTokenApi, codingApi, assessmentApi } from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import {
  ZoomIn, ZoomOut,
  ChevronLeft, ChevronRight, CheckCircle2, Clock, Send,
  AlertTriangle, Shield, Flag, Play, Terminal, XCircle, Loader2, ArrowLeft, ShieldAlert
} from 'lucide-react'
import FaceDetectionGuard from '../../components/FaceDetectionGuard'
import CameraSetupGate from '../../components/CameraSetupGate'

const LANGUAGES = [
  { val: 'javascript', label: 'JavaScript' },
  { val: 'python',     label: 'Python 3'   },
  { val: 'java',       label: 'Java'        },
  { val: 'cpp',        label: 'C++'         },
]

const STARTERS = {
  javascript: '// Read input from stdin if needed\n// const fs = require("fs");\n// const input = fs.readFileSync(0, "utf-8").trim();\n\n// Write your solution here\n',
  python:     'import sys\n# Read input from stdin if needed\n# input_data = sys.stdin.read().strip()\n\n# Write your solution here\n',
  java:       'import java.util.Scanner;\n\npublic class Solution {\n    public static void main(String[] args) {\n        // Scanner sc = new Scanner(System.in);\n        // String input = sc.hasNext() ? sc.nextLine() : "";\n        \n        // Write your solution here\n        \n    }\n}\n',
  cpp:        '#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    // string input;\n    // if (cin >> input) { ... }\n    \n    // Write your solution here\n    \n    return 0;\n}\n',
}

const diffClass = { EASY: 'badge-easy', MEDIUM: 'badge-medium', HARD: 'badge-hard' }
const MAX_VIOLATIONS = 3

export default function UnifiedAssessment() {
  const { id } = useParams()
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const tokenStudentId = searchParams.get('studentId')
  const activeStudentId = tokenStudentId || user?.id

  const attemptIdRef = useRef(null)
  const autoSubmittedRef = useRef(false)
  const antiCheatActiveRef = useRef(false)
  const violRef = useRef(0)
  const cameraStreamRef = useRef(null)
  const locationStateRef = useRef(location.state) // capture once — don't add location.state to effect deps
  const imageContainerRef = useRef(null)
  
  const handleFinishRef = useRef(null)
  useEffect(() => {
    handleFinishRef.current = handleFinish
  })

  // Candidate enrollment details (if accessing via shared link without active session)
  const [candidateForm, setCandidateForm] = useState({ name: '', email: '', phone: '' })
  const [candidateSubmitting, setCandidateSubmitting] = useState(false)

  const handleCandidateSubmit = async (e) => {
    e.preventDefault()
    setCandidateSubmitting(true)
    try {
      const res = await assessmentApi.enroll(candidateForm.name, candidateForm.email, candidateForm.phone)
      const userData = res.data.data
      login(userData)
      toast.success(`Welcome, ${userData.name}! Please proceed to the system check.`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register. Please try again.')
    } finally {
      setCandidateSubmitting(false)
    }
  }

  // System Setup
  const [cameraVerified, setCameraVerified] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Assessment Data
  const [exam, setExam] = useState(null)
  const [questions, setQuestions] = useState([])
  const [codingTests, setCodingTests] = useState([])
  const [attemptId, setAttemptId] = useState(null)

  // Assessment Progress
  const [currentSection, setCurrentSection] = useState('quiz') // quiz, coding
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [currentCoding, setCurrentCoding] = useState(0)

  // MCQ state
  const [answers, setAnswers] = useState({})
  const [markedForReview, setMarkedForReview] = useState(new Set())
  const [quizAttemptMap, setQuizAttemptMap] = useState({})

  // Coding state (stored per coding test ID)
  const [codingStates, setCodingStates] = useState({})

  // Proctoring/Anti-cheat
  const [violations, setViolations] = useState(0)

  // Resizable Terminal State
  const [consoleHeight, setConsoleHeight] = useState(240)
  const [isConsoleResizing, setIsConsoleResizing] = useState(false)

  useEffect(() => {
    if (!isConsoleResizing) return
    const handleMouseMove = (e) => {
      const newHeight = window.innerHeight - e.clientY
      setConsoleHeight(Math.max(100, Math.min(newHeight, window.innerHeight * 0.8)))
    }
    const handleMouseUp = () => setIsConsoleResizing(false)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isConsoleResizing])
  const [violationPopup, setViolationPopup] = useState(null)
  const [isProctoringPaused, setIsProctoringPaused] = useState(false)
  const isProctoringPausedRef = useRef(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [timeLeft, setTimeLeft] = useState(null)

  // Compilation/Submission UI state (for the active coding challenge)
  const [consoleOutput, setConsoleOutput] = useState(null)

  // Editor Layout State
  const [panelWidth, setPanelWidth] = useState(380)
  const [isResizing, setIsResizing] = useState(false)
  
  // Quiz Layout State
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024)

  useEffect(() => {
    if (!isResizing) return
    const handleMouseMove = (e) => {
      // Allow resizing between 200px and 60% of the screen width
      setPanelWidth(Math.max(200, Math.min(e.clientX, window.innerWidth * 0.6)))
    }
    const handleMouseUp = () => setIsResizing(false)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  useEffect(() => {
    if (cameraVerified) {
      window.scrollTo(0, 0);
      const timer = setTimeout(() => { antiCheatActiveRef.current = true }, 2000)
      return () => clearTimeout(timer)
    }
  }, [cameraVerified])

  // ── Init ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!cameraVerified) return
    let cancelled = false

    const init = async () => {
      try {
        // 1. Fetch details of the unified assessment using the share token
        const detailsRes = await assessmentApi.getByToken(id)
        if (cancelled) return
        const assessment = detailsRes.data.data

        // 2. Start the master assessment attempt session
        const startRes = await assessmentApi.startAttempt(assessment.id, activeStudentId)
        if (cancelled) return

        const aId = startRes.data.data.attemptId
        setAttemptId(aId)
        attemptIdRef.current = aId

        // Store the Quiz ID -> QuizAttempt ID map returned by the backend
        const qAttemptMap = startRes.data.data.quizAttemptMap || {}
        setQuizAttemptMap(qAttemptMap)

        setExam(assessment) // Unified assessment metadata

        // Consolidate questions and coding tests from the sections
        const allQuestions = []
        const allCodingTests = []
        const sortedSections = assessment.sections || []

        sortedSections.forEach(section => {
          // ── DEBUG: print raw section data
          console.log('[Init] Section:', JSON.stringify({ type: section.type, sectionType: section.sectionType, referenceId: section.referenceId, questionsCount: section.questions?.length ?? 'NULL', hasCodingTest: !!section.codingTest }))

          // Handle both 'type' and 'sectionType' field names, case-insensitive
          const sType = (section.type || section.sectionType || '').toString().toUpperCase()
          if (sType === 'QUIZ' && section.questions && section.questions.length > 0) {
            const tagged = section.questions.map(q => ({
              ...q,
              quizAttemptId: qAttemptMap[String(section.referenceId)] ?? qAttemptMap[section.referenceId]
            }))
            allQuestions.push(...tagged)
            console.log('[Init] ✅ Added', tagged.length, 'questions from quiz section')
          } else if (sType === 'CODING' && section.codingTest) {
            allCodingTests.push(section.codingTest)
            console.log('[Init] ✅ Added coding test', section.codingTest.id)
          } else {
            console.warn('[Init] ⚠️ Skipped section | type:', section.type, '| questions:', section.questions?.length ?? 'null', '| codingTest:', !!section.codingTest)
          }
        })

        setQuestions(allQuestions)
        setCodingTests(allCodingTests)

        // Initialize coding states
        const initialCodingStates = {}
        allCodingTests.forEach(test => {
          initialCodingStates[test.id] = {
            code: STARTERS.javascript,
            language: 'javascript',
            output: null,
            running: false,
            submitting: false,
            passed: false
          }
        })
        setCodingStates(initialCodingStates)

        // Set countdown timer if exam has a duration
        if (assessment.durationMinutes && assessment.durationMinutes > 0) {
          setTimeLeft(assessment.durationMinutes * 60)
        }

        // Set initial section: if no MCQ questions, start with coding
        if (allQuestions.length === 0 && allCodingTests.length > 0) {
          setCurrentSection('coding')
          console.warn('[Init] ⚠️ No MCQ questions loaded! Auto-routing to coding section. Check sections above.')
        }
        console.log('[Init] FINAL: questions=', allQuestions.length, 'codingTests=', allCodingTests.length)

        if (locationStateRef.current?.requestFullscreen) {
          try { await document.documentElement.requestFullscreen() } catch {}
        }
      } catch (err) {
        if (cancelled) return
        const msg = err.response?.data?.message || ''
        if (document.fullscreenElement) {
          try { await document.exitFullscreen() } catch {}
        }
        toast.error(msg || 'Could not start assessment. Please try again.')
        if (window.history.length > 1) {
          navigate(-1)
        } else {
          navigate('/', { replace: true })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    init()
    return () => { cancelled = true }
  }, [cameraVerified, id, activeStudentId]) // ← location.state removed: it's an object ref that changes every render causing init() re-runs

  // ── Timer countdown ────────────────────────────────────────────
  useEffect(() => {
    if (timeLeft === null || !cameraVerified || loading) return
    if (timeLeft <= 0) {
      if (!autoSubmittedRef.current) {
        autoSubmittedRef.current = true
        toast('⏱️ Time is up! Submitting exam…', { duration: 3000, icon: '⏱️' })
        setTimeout(() => {
          if (handleFinishRef.current) {
            handleFinishRef.current(true)
          }
        }, 1500)
      }
      return
    }
    const tick = setInterval(() => setTimeLeft(t => t - 1), 1000)
    return () => clearInterval(tick)
  }, [timeLeft, cameraVerified, loading])

  // ── Anti-cheat violation recorder ────────────────────────────────
  const handleViolation = useCallback((reason) => {
    if (!antiCheatActiveRef.current || autoSubmittedRef.current || isProctoringPausedRef.current) return
    
    isProctoringPausedRef.current = true
    setIsProctoringPaused(true)
    
    violRef.current += 1
    const count = violRef.current
    setViolations(count)

    const isAutoSubmit = count >= MAX_VIOLATIONS
    setViolationPopup({ count, reason, autoSubmit: isAutoSubmit })

    if (isAutoSubmit) {
      autoSubmittedRef.current = true
      setTimeout(() => {
        if (handleFinishRef.current) {
          handleFinishRef.current(true)
        }
      }, 2500)
    }
  }, [])

  // ── Anti-cheat event listeners ─────────────────────────────────
  useEffect(() => {
    if (!cameraVerified || loading) return

    const onBlur = () => handleViolation('Window focus lost — switching windows is not allowed.')
    const onVisibility = () => { if (document.hidden) handleViolation('Tab switching detected.') }
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault()
        handleViolation('Opening new tab detected.')
      }
    }
    const onFullscreen = () => {
      if (!document.fullscreenElement) handleViolation('Fullscreen was exited.')
    }

    const checkInterval = setInterval(() => {
      if (antiCheatActiveRef.current && !document.fullscreenElement) {
        handleViolation('Fullscreen is required for this assessment.')
      }
    }, 500)

    window.addEventListener('blur', onBlur)
    document.addEventListener('visibilitychange', onVisibility)
    document.addEventListener('keydown', onKey)
    document.addEventListener('fullscreenchange', onFullscreen)
    return () => {
      clearInterval(checkInterval)
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('visibilitychange', onVisibility)
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('fullscreenchange', onFullscreen)
    }
  }, [cameraVerified, loading, handleViolation])

  // ── MCQ option selection ─────────────────────────────────────────
  const selectAnswer = useCallback((questionId, option, quizAttemptId, isMulti) => {
    console.log('[Answer] Selecting questionId:', questionId, 'option:', option, 'isMulti:', isMulti)
    setAnswers(prev => {
      let newValue
      if (isMulti) {
        const current = prev[questionId] ? prev[questionId].split(',') : []
        const next = new Set(current)
        if (next.has(option)) next.delete(option)
        else next.add(option)
        newValue = Array.from(next).sort().join(',')
      } else {
        // Single-answer: radio style - replace entirely, toggle off if same
        newValue = prev[questionId] === option ? '' : option
      }
      console.log('[Answer] New answers state for q', questionId, ':', newValue)
      return { ...prev, [questionId]: newValue }
    })
  }, [])

  const toggleReview = (questionId) => {
    setMarkedForReview(prev => {
      const next = new Set(prev)
      if (next.has(questionId)) next.delete(questionId)
      else next.add(questionId)
      return next
    })
  }

  // ── Coding editor action handlers ───────────────────────────────
  const handleCodeChange = (val) => {
    const activeTest = codingTests[currentCoding]
    if (!activeTest) return
    setCodingStates(prev => ({
      ...prev,
      [activeTest.id]: {
        ...prev[activeTest.id],
        code: val
      }
    }))
  }

  const handleLangChange = (newLang) => {
    const activeTest = codingTests[currentCoding]
    if (!activeTest) return
    setCodingStates(prev => ({
      ...prev,
      [activeTest.id]: {
        ...prev[activeTest.id],
        language: newLang,
        code: STARTERS[newLang]
      }
    }))
  }

  const handleRunCode = async () => {
    const activeTest = codingTests[currentCoding]
    if (!activeTest) return
    const currentState = codingStates[activeTest.id]

    setCodingStates(prev => ({
      ...prev,
      [activeTest.id]: { ...prev[activeTest.id], running: true }
    }))
    setConsoleOutput(null)

    try {
      const res = await codingApi.run({
        codingTestId: activeTest.id,
        code: currentState.code,
        language: currentState.language.toUpperCase()
      })
      const data = res.data.data
      setConsoleOutput({ type: 'submit', data })
      
      setCodingStates(prev => ({
        ...prev,
        [activeTest.id]: {
          ...prev[activeTest.id],
          running: false,
          output: { type: 'submit', data }
        }
      }))
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Execution error'
      setConsoleOutput({ type: 'error', data: errMsg })
      setCodingStates(prev => ({
        ...prev,
        [activeTest.id]: {
          ...prev[activeTest.id],
          running: false,
          output: { type: 'error', data: errMsg }
        }
      }))
    }
  }

  const handleSubmitCode = async () => {
    const activeTest = codingTests[currentCoding]
    if (!activeTest) return
    const currentState = codingStates[activeTest.id]

    setCodingStates(prev => ({
      ...prev,
      [activeTest.id]: { ...prev[activeTest.id], submitting: true }
    }))
    setConsoleOutput(null)

    try {
      const res = await codingApi.submit({
        codingTestId: activeTest.id,
        code: currentState.code,
        language: currentState.language.toUpperCase()
      })
      const data = res.data.data
      setConsoleOutput({ type: 'submit', data })

      const passed = data?.status === 'ACCEPTED' || data?.testCasesPassed === data?.totalTestCases
      toast[passed ? 'success' : 'error'](
        passed ? `✅ All ${data.testCasesPassed || ''} tests passed!` : `❌ ${data.testCasesPassed || 0}/${data.totalTestCases || '?'} tests passed`
      )

      // Save record in database via studentCodingSubmission
      try {
        await assessmentApi.submitCoding(
          attemptIdRef.current,
          activeTest.id,
          currentState.code,
          currentState.language.toUpperCase(),
          passed
        )
      } catch (err) {
        console.error("Failed to record code submission:", err)
      }

      setCodingStates(prev => ({
        ...prev,
        [activeTest.id]: {
          ...prev[activeTest.id],
          submitting: false,
          passed: passed,
          output: { type: 'submit', data }
        }
      }))
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Submission error'
      setConsoleOutput({ type: 'error', data: errMsg })
      setCodingStates(prev => ({
        ...prev,
        [activeTest.id]: {
          ...prev[activeTest.id],
          submitting: false,
          output: { type: 'error', data: errMsg }
        }
      }))
    }
  }

  // ── Final Submit ───────────────────────────────────────────────
  const handleFinish = async (force = false) => {
    if (!force && !showConfirm) {
      setShowConfirm(true)
      return
    }
    setShowConfirm(false)
    setIsSubmitting(true)

    try {
      // Auto-submit all coding tests before final assessment submission
      if (codingTests && codingTests.length > 0) {
        const codingPromises = codingTests.map(async (ct) => {
          const state = codingStates[ct.id]
          if (state && state.code && state.code.trim() !== '') {
            try {
              let passed = state.passed
              if (!passed) {
                const res = await codingApi.submit({
                  codingTestId: ct.id,
                  code: state.code,
                  language: state.language.toUpperCase()
                })
                const data = res.data.data
                passed = data?.status === 'ACCEPTED' || data?.testCasesPassed === data?.totalTestCases
              }
              
              await assessmentApi.submitCoding(
                attemptIdRef.current,
                ct.id,
                state.code,
                state.language.toUpperCase(),
                passed
              )
            } catch (err) {
              console.error(`Failed to auto-submit coding test ${ct.id}:`, err)
            }
          }
        })
        await Promise.all(codingPromises)
      }

      // Filter out empty-string answers (toggled off) before submitting
      const cleanAnswers = Object.fromEntries(
        Object.entries(answers).filter(([, v]) => v && v.trim() !== '')
      )
      console.log('[Submit] attemptId:', attemptIdRef.current)
      console.log('[Submit] answers map:', cleanAnswers)
      console.log('[Submit] total answered:', Object.keys(cleanAnswers).length, 'of', questions.length)

      const res = await assessmentApi.submitAttempt(attemptIdRef.current, cleanAnswers)
      const result = res.data?.data || {}
      console.log('[Submit] backend result:', result)

      if (token) {
        try { await examTokenApi.consume(token) } catch {}
      }
      toast.success('Assessment submitted successfully!')
      if (document.fullscreenElement) {
        try { await document.exitFullscreen() } catch {}
      }
      navigate('/student/success', {
        replace: true,
        state: {
          score: result.score,
          percentage: result.percentage,
          passed: result.passed
        }
      })
    } catch (err) {
      console.error('Submit failed:', err?.response?.data || err)
      const errorMsg = err?.response?.data?.message || err?.message || 'Submission failed. Please try again.'
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (s) => {
    if (s === null) return '--:--'
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  const isUrgent = timeLeft !== null && timeLeft <= 60
  const timerClass = timeLeft > 0
    ? timeLeft <= 60 ? 'danger' : timeLeft <= 180 ? 'warning' : ''
    : ''

  if (!activeStudentId) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, color: 'var(--text-main)' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'var(--glass-card)', border: '1px solid var(--glass-border)', borderRadius: 24, padding: '48px', maxWidth: 460, width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h1 style={{ fontSize: 24, color: 'var(--text-main)', fontWeight: 800, marginBottom: 8 }}>Candidate Enrollment</h1>
            <p style={{ color: 'var(--text-sec)', fontSize: 14 }}>Please provide your details to begin the assessment.</p>
          </div>
          <form onSubmit={handleCandidateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 8 }}>Full Name *</label>
              <input required value={candidateForm.name} onChange={e => setCandidateForm(f => ({ ...f, name: e.target.value }))} className="input-field" placeholder="John Doe" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 8 }}>Email Address *</label>
              <input required type="email" value={candidateForm.email} onChange={e => setCandidateForm(f => ({ ...f, email: e.target.value }))} className="input-field" placeholder="john@example.com" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 8 }}>Phone Number</label>
              <input type="tel" value={candidateForm.phone} onChange={e => setCandidateForm(f => ({ ...f, phone: e.target.value }))} className="input-field" placeholder="+1 234 567 8900" />
            </div>
            <button type="submit" disabled={candidateSubmitting} style={{ width: '100%', padding: '14px', borderRadius: 12, background: 'linear-gradient(135deg,var(--primary),var(--primary-400))', color: '#fff', fontSize: 15, fontWeight: 700, border: 'none', cursor: candidateSubmitting ? 'not-allowed' : 'pointer', marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {candidateSubmitting ? <Loader2 size={18} className="spin" /> : null}
              {candidateSubmitting ? 'Registering...' : 'Start Assessment'}
            </button>
          </form>
        </motion.div>
      </div>
    )
  }

  if (!cameraVerified) {
    return (
      <CameraSetupGate
        onReady={(stream) => {
          cameraStreamRef.current = stream
          setCameraVerified(true)
        }}
        onCancel={() => navigate(-1)}
        title="Assessment System Check"
      />
    )
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    )
  }

  const answered = Object.keys(answers).length
  const totalQuestions = questions.length
  const progress = totalQuestions > 0 ? (answered / totalQuestions) * 100 : 0

  return (
    <div style={{ height: '100vh', overflow: 'hidden', background: 'var(--bg-main)', color: 'var(--text-main)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Proctoring camera & guard */}
      <FaceDetectionGuard onViolation={handleViolation} sharedStream={cameraStreamRef.current} isPaused={isProctoringPaused} />

      {/* Violation Popup Overlay */}
      <AnimatePresence>
        {violationPopup && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              style={{ background: 'var(--glass-card)', border: '1px solid #ef4444', borderRadius: 24, padding: 40, maxWidth: 480, width: '100%', textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <AlertTriangle size={32} color="#ef4444" />
              </div>
              <h2 style={{ color: 'var(--text-main)', fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Proctoring Alert</h2>
              <p style={{ color: '#ef4444', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Violation Detected: {violationPopup.reason}</p>
              <p style={{ color: 'var(--text-sec)', fontSize: 14, marginBottom: 24 }}>
                This is warning <strong style={{ color: '#f87171' }}>{violationPopup.count} of {MAX_VIOLATIONS}</strong>.
                {violationPopup.autoSubmit ? ' Maximum violations reached. The assessment is being submitted automatically.' : ' Please keep your face aligned, do not switch tabs or windows, and remain silent.'}
              </p>
              {!violationPopup.autoSubmit && (
                <button onClick={() => {
                  setViolationPopup(null);
                  try { document.documentElement.requestFullscreen().catch(() => {}) } catch(e) {}
                  setTimeout(() => {
                    isProctoringPausedRef.current = false;
                    setIsProctoringPaused(false);
                  }, 2000);
                }} className="btn-primary" style={{ margin: '0 auto' }}>I Understand</button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm Final Submit Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(5,8,22,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 15 }}
              style={{ background: 'var(--glass-card)', border: '1px solid var(--glass-border)', borderRadius: 24, padding: 32, maxWidth: 460, width: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-main)', marginBottom: 12 }}>Submit Assessment?</h3>
              <p style={{ color: 'var(--text-sec)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                Are you sure you want to finish the entire assessment? Once submitted, you cannot change your answers or write any more code.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => setShowConfirm(false)} 
                  disabled={isSubmitting}
                  style={{ padding: '10px 20px', borderRadius: 10, background: 'var(--glass-bg)', border: 'none', color: 'var(--text-sec)', fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.6 : 1 }}
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleFinish(true)} 
                  disabled={isSubmitting}
                  className="btn-primary" 
                  style={{ background: 'linear-gradient(135deg,var(--primary),var(--primary-400))', display: 'flex', alignItems: 'center', gap: '8px', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}
                >
                  {isSubmitting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                  {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Section View Routing */}
      {currentSection === 'quiz' ? (
        // ── QUIZ SECTION ─────────────────────────────────────────────────────────────
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          {/* Header Bar */}
          <div style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 40, backdropFilter: 'blur(12px)' }}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8" style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px', minHeight: 72 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{exam?.title}</span>
                <span style={{ background: 'rgba(37,99,235,0.15)', color: 'var(--primary-400)', padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>QUIZ</span>
              </div>

              <div style={{ flex: 1, width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>
                  <span style={{ color: 'var(--text-sec)' }}>Progress: {answered} / {totalQuestions}</span>
                  <span style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    color: isUrgent ? '#f87171' : '#38bdf8',
                    fontFamily: 'monospace', fontSize: 15, fontWeight: 700,
                    ...(isUrgent ? { animation: 'pulse 1s ease-in-out infinite' } : {}),
                  }}>
                    <Clock size={14} /> {timeLeft !== null ? formatTime(timeLeft) : 'No limit'}
                  </span>
                </div>
                <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                {violations > 0 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                    <ShieldAlert size={14} /> {violations}/{MAX_VIOLATIONS}
                  </span>
                )}
                {codingTests.length > 0 && (
                  <button onClick={() => setCurrentSection('coding')} className="btn-sec" style={{ padding: '10px 20px' }}>
                    Coding Section <ChevronRight size={14} />
                  </button>
                )}
                <button onClick={() => setShowConfirm(true)} className="btn-primary" style={{ padding: '10px 20px' }}>
                  <Send size={14} /> Submit Exam
                </button>
              </div>
            </div>
          </div>

          {/* Main Area */}
          <div className="flex-1 p-4 md:p-8 flex flex-col" style={{ minHeight: 0 }}>
            {totalQuestions === 0 ? (
              <div style={{ textAlign: 'center', marginTop: 80 }}>
                <p style={{ color: 'var(--text-sec)', marginBottom: 20 }}>No MCQ questions in this section.</p>
                {codingTests.length > 0 && (
                  <button onClick={() => setCurrentSection('coding')} className="btn-primary">Go to Coding Section</button>
                )}
              </div>
            ) : (
              <div className="max-w-[1400px] mx-auto w-full flex-1 flex flex-col relative overflow-hidden">
                
                {/* Floating open button when sidebar is collapsed */}
                {!isSidebarOpen && (
                  <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="absolute z-10 flex items-center justify-center transition-all hover:bg-[var(--glass-hover)]"
                    style={{ top: 24, right: 0, width: 32, height: 40, borderRadius: '8px 0 0 8px', color: 'var(--text-main)', border: '1px solid var(--border)', borderRight: 'none', cursor: 'pointer', background: 'var(--input-bg)' }}
                    title="Open Questions Panel"
                  >
                    <ChevronLeft size={18} />
                  </button>
                )}

                <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                  
                  {/* Main Content Area (Left + Middle) */}
                  <div className="flex-1 flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-[var(--glass-border)] overflow-hidden transition-all duration-300">
                    
                    {/* Left Side: Question Text & Image */}
                    <div className="flex-1 flex flex-col gap-6 overflow-y-auto" style={{ padding: 24 }}>
                      <AnimatePresence mode="wait">
                        <motion.div key={currentQuestion} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}
                          className="flex flex-col flex-1 h-full">
  
                          {/* Question Header */}
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(37,99,235,0.15)', color: 'var(--primary-400)', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {currentQuestion + 1}
                              </div>
                              <span style={{ fontSize: 14, color: 'var(--text-sec)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                Question {currentQuestion + 1} of {totalQuestions}
                              </span>
                              {markedForReview.has(questions[currentQuestion]?.id) && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 6, padding: '3px 8px' }}>
                                  <Flag size={10} /> Marked for Review
                                </span>
                              )}
                            </div>
  
                            <button onClick={() => toggleReview(questions[currentQuestion]?.id)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                                background: markedForReview.has(questions[currentQuestion]?.id) ? 'rgba(245,158,11,0.15)' : 'var(--glass-hover)',
                                color: markedForReview.has(questions[currentQuestion]?.id) ? '#f59e0b' : 'var(--text-sec)',
                              }}>
                              <Flag size={13} /> {markedForReview.has(questions[currentQuestion]?.id) ? 'Unmark' : 'Mark for Review'}
                            </button>
                          </div>
  
                          {/* Question Text */}
                          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.6, marginBottom: questions[currentQuestion]?.questionImage ? 24 : 0 }}>
                            {questions[currentQuestion]?.questionText
                              ? questions[currentQuestion]?.questionText
                                  .split(/(?=Statement-[IVX]+:|Assertion:|Reason:)/)
                                  .filter(part => part.trim() !== '')
                                  .map((part, idx, arr) => (
                                    <span key={idx} style={{ display: 'block', marginBottom: idx < arr.length - 1 ? 8 : 0 }}>
                                      {part.trim()}
                                    </span>
                                  ))
                              : null}
                          </h2>
                          
                          {/* Image */}
                          {questions[currentQuestion]?.questionImage && (
                            <div ref={imageContainerRef} style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0, borderRadius: 12, overflow: 'hidden' }}>
                              <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 8, zIndex: 10 }}>
                                <button onClick={() => setZoomLevel(z => Math.min(3, z + 0.25))} className="btn-ghost" style={{ padding: 8, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }} title="Zoom In"><ZoomIn size={18} /></button>
                                <button onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.25))} className="btn-ghost" style={{ padding: 8, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }} title="Zoom Out"><ZoomOut size={18} /></button>
                                <button onClick={() => setZoomLevel(1)} className="btn-ghost" style={{ padding: '8px 12px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', fontSize: 12, fontWeight: 700 }}>Reset</button>
                              </div>
                              <motion.img 
                                src={questions[currentQuestion]?.questionImage} 
                                alt="Question" 
                                drag={zoomLevel > 1}
                                dragConstraints={{ 
                                  left: -400 * (zoomLevel - 1), 
                                  right: 400 * (zoomLevel - 1), 
                                  top: -400 * (zoomLevel - 1), 
                                  bottom: 400 * (zoomLevel - 1) 
                                }}
                                animate={{ scale: zoomLevel, x: zoomLevel === 1 ? 0 : undefined, y: zoomLevel === 1 ? 0 : undefined }}
                                style={{ 
                                  maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', 
                                  cursor: zoomLevel > 1 ? 'grab' : 'default' 
                                }} 
                              />
                            </div>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>

                {/* Middle Section: Options (25%) */}
                <div className="w-full lg:w-[400px] flex-shrink-0 flex flex-col relative" style={{ height: '100%' }}>
                  <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px', paddingRight: !isSidebarOpen ? 48 : 24, display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 32 }}>
                      {[
                        { key: 'A', val: questions[currentQuestion]?.optionA },
                        { key: 'B', val: questions[currentQuestion]?.optionB },
                        { key: 'C', val: questions[currentQuestion]?.optionC },
                        { key: 'D', val: questions[currentQuestion]?.optionD }
                      ].filter(o => o.val).map(opt => {
                        const q = questions[currentQuestion]
                        const isMulti = q?.multiAnswer === true
                        const isSelected = answers[q?.id]?.split(',').filter(Boolean).includes(opt.key)
                        return (
                          <div key={opt.key} onClick={() => selectAnswer(q?.id, opt.key, q?.quizAttemptId, isMulti)}
                            className={`option-card ${isSelected ? 'active' : ''}`}
                            style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderRadius: 14, cursor: 'pointer', border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--glass-border)'}`, background: isSelected ? 'rgba(37,99,235,0.08)' : 'var(--glass-bg)', transition: 'all 0.15s' }}>
                            <div style={{
                              width: 22, height: 22, flexShrink: 0,
                              borderRadius: isMulti ? 4 : '50%',
                              border: isSelected ? '2px solid var(--primary-400)' : '2px solid var(--glass-border)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: isSelected ? 'rgba(37,99,235,0.1)' : 'transparent'
                            }}>
                              {isSelected && <div style={{ width: isMulti ? 12 : 10, height: isMulti ? 12 : 10, borderRadius: isMulti ? 2 : '50%', background: 'var(--primary-400)' }} />}
                            </div>
                            <span style={{ fontSize: 14, fontWeight: 500, color: isSelected ? 'var(--primary)' : 'var(--text-sec)' }}>{opt.val}</span>
                          </div>
                        )
                      })}
                      {questions[currentQuestion]?.multiAnswer && (
                        <div style={{ fontSize: 12, color: 'var(--text-sec)', fontStyle: 'italic', marginTop: 4, textAlign: 'center' }}>✦ Select all that apply</div>
                      )}
                  </div>

                  {/* Nav Buttons */}
                  <div style={{ padding: '16px 24px', paddingRight: !isSidebarOpen ? 48 : 24, borderTop: '1px solid var(--glass-border)', background: 'var(--bg-main)', flexShrink: 0 }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button disabled={currentQuestion === 0} onClick={() => setCurrentQuestion(c => c - 1)} className="btn-sec flex-1" style={{ opacity: currentQuestion === 0 ? 0.3 : 1, padding: '12px 0', justifyContent: 'center' }}>
                        <ChevronLeft size={16} /> Prev
                      </button>
                      
                      {currentQuestion < totalQuestions - 1 ? (
                        <button onClick={() => setCurrentQuestion(c => c + 1)} className="btn-primary flex-1" style={{ padding: '12px 0', justifyContent: 'center' }}>
                          Next <ChevronRight size={16} />
                        </button>
                      ) : codingTests.length > 0 ? (
                        <button onClick={() => setCurrentSection('coding')} className="btn-primary flex-1" style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', padding: '12px 0', justifyContent: 'center' }}>
                          Coding <ChevronRight size={16} />
                        </button>
                      ) : (
                        <button onClick={() => setShowConfirm(true)} className="btn-primary flex-1" style={{ padding: '12px 0', justifyContent: 'center' }}>
                          Submit <CheckCircle2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

                {/* Right Side: Question Navigation Panel */}
                <div 
                  className={`border-t lg:border-t-0 lg:border-l border-[var(--glass-border)] transition-all duration-300 bg-[var(--bg-main)] lg:relative fixed inset-y-0 right-0 z-50 shadow-2xl lg:shadow-none overflow-hidden ${isSidebarOpen ? 'w-full lg:w-[320px] translate-x-0' : 'w-full lg:w-0 translate-x-full lg:translate-x-0 lg:border-l-0'}`}
                >
                  <div className="w-full lg:w-[320px] h-full flex flex-col" style={{ padding: 24, gap: 24, overflowY: 'auto' }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <button onClick={() => setIsSidebarOpen(false)} className="btn-ghost flex items-center justify-center hover:bg-[var(--glass-hover)] transition-all" style={{ padding: 6, borderRadius: 8, border: '1px solid var(--glass-border)', color: 'var(--text-sec)', cursor: 'pointer' }} title="Collapse Panel">
                          <ChevronRight size={16} />
                        </button>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Questions</h3>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                      {questions.map((q, idx) => {
                        const isCurrent = idx === currentQuestion
                        const isAnswered = answers[q.id] !== undefined
                        const isMarked = markedForReview.has(q.id)
                        let bg = 'var(--glass-bg)', color = 'var(--text-sec)', border = '1px solid var(--glass-border)'
                        if (isCurrent) {
                          bg = 'rgba(37,99,235,0.08)'
                          border = '2px solid var(--primary)'
                          color = 'var(--primary)'
                        } else if (isMarked) {
                          bg = 'rgba(245,158,11,0.1)'
                          color = '#f59e0b'
                          border = '1px solid rgba(245,158,11,0.3)'
                        } else if (isAnswered) {
                          bg = 'rgba(16,185,129,0.1)'
                          color = '#10b981'
                          border = '1px solid rgba(16,185,129,0.3)'
                        }
                        return (
                          <button key={q.id} onClick={() => { setCurrentQuestion(idx); if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
                            style={{ height: 42, borderRadius: 10, background: bg, border, color, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                            {idx + 1}
                          </button>
                        )
                      })}
                    </div>

                    <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12, borderTop: '1px solid var(--glass-border)', paddingTop: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }} /> Answered</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }} /> Marked for Review</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }} /> Unanswered</div>
                    </div>
                  </div>
                </div>
              </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        // ── CODING SECTION ───────────────────────────────────────────────────────────
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          {/* Header Bar */}
          <div className="editor-header">
            <div className="flex flex-wrap items-center gap-2 md:gap-4">
              {questions.length > 0 && (
                <button onClick={() => setCurrentSection('quiz')}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-main)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  <ArrowLeft size={14} /> Back to Quiz
                </button>
              )}
              {questions.length > 0 && <div style={{ width: 1, height: 16, background: 'var(--border)' }} />}
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>Coding Challenge</span>
              {codingTests.length > 1 ? (
                <select value={currentCoding} onChange={e => { setCurrentCoding(Number(e.target.value)); setConsoleOutput(null) }}
                  style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '4px 10px', borderRadius: 6, fontSize: 12, outline: 'none', cursor: 'pointer' }}>
                  {codingTests.map((t, idx) => <option key={t.id} value={idx}>Problem {idx + 1} of {codingTests.length}: {t.title}</option>)}
                </select>
              ) : codingTests.length === 1 ? (
                <span style={{ fontSize: 13, color: 'var(--text-sec)', background: 'var(--input-bg)', padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', fontWeight: 600 }}>
                  Problem 1 of 1: {codingTests[0].title}
                </span>
              ) : null}
              {violations > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 6, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>
                  <ShieldAlert size={12} /> {violations}/{MAX_VIOLATIONS}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              {/* Timer */}
              {timeLeft !== null && (
                <div className={`editor-timer ${timerClass}`}>
                  <Clock size={14} />
                  {formatTime(timeLeft)}
                </div>
              )}

              <select value={codingStates[codingTests[currentCoding]?.id]?.language || 'javascript'} onChange={e => handleLangChange(e.target.value)}
                style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '6px 12px', borderRadius: 6, fontSize: 13, outline: 'none', cursor: 'pointer' }}>
                {LANGUAGES.map(l => <option key={l.val} value={l.val} style={{ background: 'var(--input-bg)', color: 'var(--text-main)' }}>{l.label}</option>)}
              </select>

              <button onClick={handleRunCode} disabled={codingStates[codingTests[currentCoding]?.id]?.running}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, background: 'var(--input-bg)', border: '1px solid rgba(56,189,248,0.3)', color: '#38bdf8', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {codingStates[codingTests[currentCoding]?.id]?.running ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Play size={14} />} Run
              </button>

              <button onClick={handleSubmitCode} disabled={codingStates[codingTests[currentCoding]?.id]?.submitting}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 18px', borderRadius: 8, background: 'var(--input-bg)', border: '1px solid rgba(167,139,250,0.3)', color: 'var(--primary-400)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {codingStates[codingTests[currentCoding]?.id]?.submitting ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Send size={14} />} Submit Code
              </button>

              {currentCoding < codingTests.length - 1 ? (
                <button onClick={() => { setCurrentCoding(c => c + 1); setConsoleOutput(null) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 18px', borderRadius: 8, background: 'var(--primary)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 12px rgba(37,99,235,0.3)' }}>
                  Next Problem <ChevronRight size={14} />
                </button>
              ) : (
                <button onClick={() => setShowConfirm(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 18px', borderRadius: 8, background: 'linear-gradient(135deg,#ef4444,#dc2626)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 12px rgba(239,68,68,0.4)' }}>
                  Final Submit
                </button>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="editor-body" style={{ flex: 1, minHeight: 0 }}>
            {/* Problem Panel */}
            <div className="problem-panel" style={{ overflowY: 'auto', ...(window.innerWidth > 768 ? { width: panelWidth } : { width: '100%' }), flexShrink: 0 }}>
              {codingTests[currentCoding] ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-main)', marginBottom: 8, lineHeight: 1.3 }}>{codingTests[currentCoding].title}</h2>
                    <span className={`badge ${diffClass[codingTests[currentCoding].difficulty] || ''}`}>{codingTests[currentCoding].difficulty}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-sec)', marginBottom: 10 }}>Description</div>
                    <div className="leetcode-description" style={{ fontSize: 14, color: 'var(--text-main)', lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: codingTests[currentCoding].description }} />
                  </div>
                  {codingTests[currentCoding].sampleInput && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-sec)', marginBottom: 10 }}>Sample Input</div>
                      <pre style={{ background: 'var(--glass-hover)', padding: '12px 14px', borderRadius: 8, fontSize: 13, color: '#38bdf8', overflowX: 'auto', border: '1px solid rgba(56,189,248,0.2)', fontFamily: "'Fira Code', monospace", lineHeight: 1.6 }}>{codingTests[currentCoding].sampleInput}</pre>
                    </div>
                  )}
                  {codingTests[currentCoding].sampleOutput && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-sec)', marginBottom: 10 }}>Expected Output</div>
                      <pre style={{ background: 'var(--glass-hover)', padding: '12px 14px', borderRadius: 8, fontSize: 13, color: '#4ade80', overflowX: 'auto', border: '1px solid rgba(74,222,128,0.2)', fontFamily: "'Fira Code', monospace", lineHeight: 1.6 }}>{codingTests[currentCoding].sampleOutput}</pre>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}><div className="spinner" /></div>
              )}
            </div>

            {/* Resizer */}
            {window.innerWidth > 768 && (
              <div
                className={`resizer-handle ${isResizing ? 'active' : ''}`}
                onMouseDown={(e) => { e.preventDefault(); setIsResizing(true); }}
                style={{
                  width: 6,
                  cursor: 'col-resize',
                  background: isResizing ? 'var(--primary-200)' : 'transparent',
                  borderRight: '1px solid var(--glass-card)',
                  transition: 'background 0.2s',
                  zIndex: 10,
                  flexShrink: 0,
                  '&:hover': { background: 'var(--primary-100)' }
                }}
                onMouseEnter={(e) => { if(!isResizing) e.target.style.background = 'var(--glass-border)' }}
                onMouseLeave={(e) => { if(!isResizing) e.target.style.background = 'transparent' }}
              />
            )}

            {/* Monaco Editor Panel */}
            <div className="editor-right" style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
              <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
                <Editor
                  language={codingStates[codingTests[currentCoding]?.id]?.language || 'javascript'}
                  value={codingStates[codingTests[currentCoding]?.id]?.code || ''}
                  onChange={handleCodeChange}
                  theme="light"
                  options={{
                    fontSize: 15,
                    fontFamily: "'Fira Code', 'Cascadia Code', monospace",
                    fontLigatures: true,
                    minimap: { enabled: false },
                    padding: { top: 20 },
                    lineNumbers: 'on',
                    renderLineHighlight: 'all',
                    scrollBeyondLastLine: false,
                  }}
                />
              </div>

              {/* Horizontal Resizer Handle */}
              <div
                className={`horizontal-resizer ${isConsoleResizing ? 'active' : ''}`}
                onMouseDown={(e) => { e.preventDefault(); setIsConsoleResizing(true); }}
                style={{
                  height: 6,
                  cursor: 'row-resize',
                  background: isConsoleResizing ? 'var(--primary-200)' : 'transparent',
                  borderTop: '1px solid var(--border)',
                  transition: 'background 0.2s',
                  zIndex: 10,
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => { if(!isConsoleResizing) e.target.style.background = 'var(--glass-border)' }}
                onMouseLeave={(e) => { if(!isConsoleResizing) e.target.style.background = 'transparent' }}
              />

              {/* Console Output Panel */}
              <div style={{ height: consoleHeight, flexShrink: 0, background: 'var(--sidebar-bg)', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'var(--header-bg)', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--text-sec)' }}>
                  <Terminal size={14} /> Console / Output
                </div>
                <div style={{ flex: 1, padding: 16, overflowY: 'auto', fontFamily: "'Fira Code', monospace", fontSize: 13 }}>
                  {!consoleOutput ? (
                    <div style={{ color: 'var(--text-sec)', fontSize: 13 }}>Click "Run" or "Submit Code" to see compilation and test output here.</div>
                  ) : consoleOutput.type === 'error' ? (
                    <div style={{ color: '#ef4444' }}>{consoleOutput.data}</div>
                  ) : consoleOutput.type === 'run' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {consoleOutput.data.status === 'EXECUTED' || consoleOutput.data.output != null ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#4ade80', fontWeight: 700 }}><CheckCircle2 size={15} /> RUN SUCCESS</span>
                        ) : (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#ef4444', fontWeight: 700 }}><XCircle size={15} /> RUN FAIL</span>
                        )}
                        <span style={{ color: 'var(--text-sec)' }}>({consoleOutput.data.executionTimeMs || 0}ms)</span>
                      </div>
                      {consoleOutput.data.compileMessage && (
                        <pre style={{ color: 'var(--text-main)', whiteSpace: 'pre-wrap', background: 'var(--glass-hover)', padding: 12, borderRadius: 6 }}>{consoleOutput.data.compileMessage}</pre>
                      )}
                      <div>
                        <div style={{ color: 'var(--text-sec)', fontSize: 11, textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>Standard Output:</div>
                        <pre style={{ color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>{consoleOutput.data.output || consoleOutput.data.stdout || '(no stdout output)'}</pre>
                      </div>
                    </div>
                  ) : (
                    // Submit output
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          fontWeight: 700, padding: '4px 10px', borderRadius: 6, fontSize: 12,
                          background: consoleOutput.data.status === 'ACCEPTED' ? 'rgba(74,222,128,0.15)' : 'rgba(239,68,68,0.15)',
                          color: consoleOutput.data.status === 'ACCEPTED' ? '#4ade80' : '#ef4444'
                        }}>{consoleOutput.data.status}</span>
                        <span style={{ color: 'var(--text-sec)' }}>
                          Passed: {consoleOutput.data.testCasesPassed} / {consoleOutput.data.totalTestCases} test cases.
                        </span>
                      </div>
                      {consoleOutput.data.errorMessage && (
                        <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.06)', padding: 12, borderRadius: 6, border: '1px solid rgba(239,68,68,0.15)' }}>
                          <strong>Error message:</strong>
                          <pre style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>{consoleOutput.data.errorMessage}</pre>
                        </div>
                      )}
                      {consoleOutput.data.output && (
                        <div>
                          <div style={{ color: 'var(--text-sec)', fontSize: 11, textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>Standard Output:</div>
                          <pre style={{ color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>{consoleOutput.data.output}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
