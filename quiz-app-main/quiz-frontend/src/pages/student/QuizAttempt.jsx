import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { questionApi, attemptApi, studentQuizApi, examTokenApi } from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, CheckCircle2, Clock, Send, AlertTriangle, Shield, Flag } from 'lucide-react'
import FaceDetectionGuard from '../../components/FaceDetectionGuard'
import CameraSetupGate from '../../components/CameraSetupGate'

export default function QuizAttempt() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const tokenStudentId = searchParams.get('studentId')
  const activeStudentId = tokenStudentId || user?.id
  const attemptIdRef = useRef(null)
  const autoSubmittedRef = useRef(false)
  const antiCheatActiveRef = useRef(false)
  const imageContainerRef = useRef(null)

  const [questions, setQuestions] = useState([])
  const [quiz, setQuiz] = useState(null)
  const [attemptId, setAttemptId] = useState(null)
  const [current, setCurrent] = useState(0)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [answers, setAnswers] = useState({})
  const [markedForReview, setMarkedForReview] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState(null)   // seconds remaining
  const [showConfirm, setShowConfirm] = useState(false)
  const [violations, setViolations] = useState(0)
  const [violationPopup, setViolationPopup] = useState(null)
  const [cameraVerified, setCameraVerified] = useState(false)
  const cameraStreamRef = useRef(null)

  useEffect(() => {
    if (cameraVerified) {
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
        const [startRes, questRes, quizRes] = await Promise.all([
          attemptApi.start(id, activeStudentId),
          questionApi.getForStudent(id),
          studentQuizApi.getById(id),
        ])
        if (cancelled) return
        const aId = startRes.data.data.attemptId
        setAttemptId(aId)
        attemptIdRef.current = aId
        const qData = questRes.data.data || []
        setQuestions(qData)
        const qz = quizRes.data.data
        setQuiz(qz)
        // Set countdown timer if quiz has a duration
        if (qz?.durationMinutes && qz.durationMinutes > 0) {
          setTimeLeft(qz.durationMinutes * 60)
        }
        if (location.state?.requestFullscreen) {
          try { await document.documentElement.requestFullscreen() } catch {}
        }
      } catch (err) {
        if (cancelled) return
        const msg = err.response?.data?.message || ''
        if (document.fullscreenElement) {
          try { await document.exitFullscreen() } catch {}
        }
        if (msg.includes('ATTEMPT_LIMIT_REACHED')) {
          navigate(`/student/quizzes/${id}`, { replace: true, state: { attemptsExhausted: true } })
        } else {
          toast.error('Could not start quiz. Please try again.')
          navigate(`/student/quizzes/${id}`, { replace: true })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    init()
    return () => { cancelled = true }
  }, [cameraVerified, id, activeStudentId, navigate, location.state])

  // ── Countdown Timer — auto-submit when reaches 0 ─────────────
  useEffect(() => {
    if (timeLeft === null) return  // no duration set
    if (timeLeft <= 0) {
      // Time is up — auto submit
      if (!autoSubmittedRef.current) {
        autoSubmittedRef.current = true
        const aId = attemptIdRef.current
        toast('⏱️ Time is up! Submitting quiz…', { duration: 3000, icon: '⏱️' })
        setTimeout(async () => {
          if (aId) {
            try { await attemptApi.submit(aId) } catch {}
            if (document.fullscreenElement) { try { await document.exitFullscreen() } catch {} }
            navigate(`/student/success`)
          }
        }, 1500)
      }
      return
    }
    const tick = setInterval(() => setTimeLeft(t => t - 1), 1000)
    return () => clearInterval(tick)
  }, [timeLeft, navigate])

  // ── Anti-cheat ────────────────────────────────────────────────
  const handleViolation = useCallback((reason) => {
    if (!antiCheatActiveRef.current) return
    if (autoSubmittedRef.current) return
    setViolations(v => {
      const next = v + 1
      const aId = attemptIdRef.current
      if (next >= 3) {
        if (autoSubmittedRef.current) return next
        autoSubmittedRef.current = true
        setViolationPopup({ count: 3, reason, autoSubmit: true })
        setTimeout(async () => {
          if (aId) {
            try { await attemptApi.submit(aId) } catch {}
            if (document.fullscreenElement) { try { await document.exitFullscreen() } catch {} }
            navigate(`/student/success`)
          }
        }, 2500)
      } else {
        setViolationPopup({ count: next, reason, autoSubmit: false })
      }
      return next
    })
  }, [navigate])

  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) handleViolation('Exited full screen')
    }
    const onVisibilityChange = () => {
      if (document.hidden) handleViolation('Tab switch detected')
    }
    const onBlur = () => handleViolation('Window lost focus')
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault()
        handleViolation('Attempted to open a new tab')
      }
    }

    const checkInterval = setInterval(() => {
      if (antiCheatActiveRef.current && !document.fullscreenElement) {
        handleViolation('Fullscreen is required for this assessment.')
      }
    }, 2000)

    document.addEventListener('fullscreenchange', onFullscreenChange)
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('blur', onBlur)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      clearInterval(checkInterval)
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [handleViolation])

  const formatTime = (s) => {
    if (s === null) return '--:--'
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  const isUrgent = timeLeft !== null && timeLeft <= 60

  const selectAnswer = useCallback(async (questionId, option) => {
    setAnswers(prev => {
      const current = prev[questionId] ? prev[questionId].split(',') : []
      const next = new Set(current)
      if (next.has(option)) next.delete(option)
      else next.add(option)
      const newValue = Array.from(next).sort().join(',')
      
      const aId = attemptIdRef.current
      if (aId) {
        attemptApi.submitAnswer({ attemptId: aId, questionId, selectedOption: newValue }).catch(() => {})
      }
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

  const handleFinish = async () => {
    setSubmitting(true)
    try {
      await attemptApi.submit(attemptId)
      if (token) {
        try { await examTokenApi.consume(token) } catch {}
      }
      if (document.fullscreenElement) { try { await document.exitFullscreen() } catch {} }
      toast.success('Quiz submitted!')
      navigate(`/student/success`)
    } catch {
      toast.error('Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (!cameraVerified) {
    return (
      <CameraSetupGate
        onReady={(stream) => {
          cameraStreamRef.current = stream;
          setCameraVerified(true);
        }}
        onCancel={() => navigate(-1)}
        title="Quiz Setup"
      />
    )
  }

  if (loading) return <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>

  const q = questions[current]
  const answered = Object.keys(answers).length
  const progress = questions.length > 0 ? (answered / questions.length) * 100 : 0
  const options = q ? [
    { key: 'A', val: q.optionA }, { key: 'B', val: q.optionB },
    { key: 'C', val: q.optionC }, { key: 'D', val: q.optionD },
  ].filter(o => o.val) : []

  const isMarked = q && markedForReview.has(q.id)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)', display: 'flex', flexDirection: 'column' }}>

      {/* Header Bar */}
      <div style={{ height: 72, background: 'rgba(6,8,24,0.92)', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, zIndex: 40, backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', height: '100%', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 32 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>Progress: {answered} / {questions.length}</span>
              {/* Timer */}
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
          <button onClick={() => setShowConfirm(true)} className="btn-primary" style={{ padding: '12px 28px', fontSize: 15 }}>
            <Send size={15} /> Submit Quiz
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div style={{ flex: 1 }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderTop: '1px solid var(--glass-border)', minHeight: 'calc(100vh - 72px)' }}>

          {/* Left Side: Question Text & Image (50%) */}
          <div className="lg:col-span-2 flex flex-col gap-6" style={{ height: '100%', padding: 24 }}>
            <AnimatePresence mode="wait">
              <motion.div key={current} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}
                className="flex flex-col flex-1 h-full">

                {/* Question header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(37,99,235,0.15)', color: 'var(--primary-400)', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {current + 1}
                    </div>
                    <span style={{ fontSize: 14, color: 'var(--text-sec)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Question {current + 1} of {questions.length}
                    </span>
                    {isMarked && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 6, padding: '3px 8px' }}>
                        <Flag size={10} /> Marked for Review
                      </span>
                    )}
                  </div>
                  {/* Mark for review button */}
                  <button
                    onClick={() => q && toggleReview(q.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                      background: isMarked ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.06)',
                      color: isMarked ? '#f59e0b' : 'var(--text-sec)',
                    }}
                  >
                    <Flag size={13} />
                    {isMarked ? 'Unmark' : 'Mark for Review'}
                  </button>
                </div>

                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.6, marginBottom: q?.questionImage ? 24 : 0 }}>
                  {q?.questionText
                    ? q.questionText
                        .split(/(?=Statement-[IVX]+:|Assertion:|Reason:)/)
                        .filter(part => part.trim() !== '')
                        .map((part, i, arr) => (
                          <span key={i} style={{ display: 'block', marginBottom: i < arr.length - 1 ? 8 : 0 }}>
                            {part.trim()}
                          </span>
                        ))
                    : null}
                </h2>

                {/* Image */}
                {q?.questionImage && (
                  <div ref={imageContainerRef} style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0, borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 8, zIndex: 10 }}>
                      <button onClick={() => setZoomLevel(z => Math.min(3, z + 0.25))} className="btn-ghost" style={{ padding: 8, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }} title="Zoom In"><ZoomIn size={18} /></button>
                      <button onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.25))} className="btn-ghost" style={{ padding: 8, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }} title="Zoom Out"><ZoomOut size={18} /></button>
                      <button onClick={() => setZoomLevel(1)} className="btn-ghost" style={{ padding: '8px 12px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', fontSize: 12, fontWeight: 700 }}>Reset</button>
                    </div>
                    <motion.img 
                      src={q.questionImage} 
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
          <div style={{ borderLeft: '1px solid var(--glass-border)', borderRight: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', padding: '24px 16px', position: 'relative' }}>
            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 100 }}>
              {options.map(({ key, val }) => {
                const sel = answers[q.id]?.split(',').includes(key)
                return (
                  <button key={key} onClick={() => selectAnswer(q.id, key)} className={`option-btn ${sel ? 'selected' : ''}`} style={{ padding: '16px 20px', fontSize: 15, display: 'flex', alignItems: 'center', gap: 16, background: sel ? 'rgba(37,99,235,0.08)' : 'var(--glass-bg)', border: `1px solid ${sel ? 'var(--primary)' : 'var(--glass-border)'}`, borderRadius: 14 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: sel ? 'rgba(37,99,235,0.1)' : 'transparent', border: sel ? '2px solid var(--primary-400)' : '2px solid var(--glass-border)', color: sel ? 'var(--primary)' : 'var(--text-sec)', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {sel ? <div style={{ width: 12, height: 12, borderRadius: 2, background: 'var(--primary-400)' }} /> : key}
                    </div>
                    <span style={{ flex: 1, fontSize: 15, textAlign: 'left', color: sel ? 'var(--primary)' : 'var(--text-main)', fontWeight: 500 }}>{val}</span>
                  </button>
                )
              })}
            </div>

            {/* Prev / Next — sticky at viewport bottom */}
            <div style={{ position: 'sticky', bottom: 0, background: 'var(--bg-main)', paddingTop: 16, paddingBottom: 16, borderTop: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0} className="btn-sec flex-1" style={{ padding: '12px 0', fontSize: 14, opacity: current === 0 ? 0.4 : 1, cursor: current === 0 ? 'not-allowed' : 'pointer', justifyContent: 'center' }}>
                  <ChevronLeft size={16} /> Prev
                </button>
                <button onClick={() => setCurrent(c => Math.min(questions.length - 1, c + 1))} disabled={current === questions.length - 1} className="btn-primary flex-1" style={{ padding: '12px 0', fontSize: 14, opacity: current === questions.length - 1 ? 0.4 : 1, cursor: current === questions.length - 1 ? 'not-allowed' : 'pointer', justifyContent: 'center' }}>
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Right Side: Question Navigation Panel (25%) */}
          <div className="lg:col-span-1" style={{ display: 'flex', flexDirection: 'column', padding: 24, position: 'sticky', top: 72, height: 'calc(100vh - 72px)', overflowY: 'hidden' }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-sec)', marginBottom: 16, flexShrink: 0 }}>
              Questions
            </h3>
            {/* Scrollable number grid */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }}>
                {questions.map((qs, i) => {
                  const ans = answers[qs?.id]
                  const isCurr = i === current
                  const isRev = markedForReview.has(qs?.id)
                  let bg, color, border = 'transparent'
                  if (isCurr)           { bg = 'var(--primary-400)'; color = '#fff'; border = 'var(--primary)'; }
                  else if (isRev && ans) { bg = '#f59e0b'; color = '#fff'; border = '#d97706'; }
                  else if (isRev)       { bg = 'rgba(245,158,11,0.15)'; color = '#d97706'; border = 'rgba(245,158,11,0.4)'; }
                  else if (ans)         { bg = '#3b0764'; color = '#fff'; border = '#2e054e'; }
                  else                  { bg = 'rgba(255,255,255,0.1)'; color = '#fff'; border = 'rgba(255,255,255,0.2)'; }
                  return (
                    <button key={i} onClick={() => setCurrent(i)}
                      style={{ width: '100%', aspectRatio: '1/1', borderRadius: 8, background: bg, border: `1px solid ${border}`, color, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}>
                      {i + 1}
                    </button>
                  )
                })}
              </div>
            </div>
            {/* Legend — always visible at the bottom */}
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-sec)' }}><div style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--primary-400)', border: '1px solid var(--primary)', flexShrink: 0 }} /> Current</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-sec)' }}><div style={{ width: 10, height: 10, borderRadius: 3, background: '#3b0764', border: '1px solid #2e054e', flexShrink: 0 }} /> Answered</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-sec)' }}><div style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', flexShrink: 0 }} /> Marked for Review</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-sec)' }}><div style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', flexShrink: 0 }} /> Unanswered</div>
            </div>
          </div>
      </div>

      {/* ── Violation Modal ── */}
      <AnimatePresence>
        {violationPopup && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              style={{
                background: violationPopup.autoSubmit ? 'linear-gradient(135deg, #1a0a0a 0%, #2d0f0f 100%)' : 'linear-gradient(135deg, #0f0a1a 0%, #1a1040 100%)',
                border: `1px solid ${violationPopup.autoSubmit ? 'rgba(239,68,68,0.5)' : 'rgba(251,191,36,0.4)'}`,
                borderRadius: 24, padding: '48px 40px', maxWidth: 440, width: '100%', textAlign: 'center',
                boxShadow: violationPopup.autoSubmit ? '0 0 60px rgba(239,68,68,0.3), 0 24px 64px rgba(0,0,0,0.7)' : '0 0 60px rgba(251,191,36,0.2), 0 24px 64px rgba(0,0,0,0.7)',
              }}
            >
              <div style={{ width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px', background: violationPopup.autoSubmit ? 'rgba(239,68,68,0.15)' : 'rgba(251,191,36,0.12)', border: `2px solid ${violationPopup.autoSubmit ? 'rgba(239,68,68,0.5)' : 'rgba(251,191,36,0.4)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {violationPopup.autoSubmit ? <AlertTriangle size={38} color="#ef4444" /> : <Shield size={38} color="#fbbf24" />}
              </div>
              <div style={{ fontSize: violationPopup.autoSubmit ? 26 : 22, fontWeight: 800, color: violationPopup.autoSubmit ? '#ef4444' : '#fbbf24', marginBottom: 12 }}>
                {violationPopup.autoSubmit ? '⛔ Cheating Detected!' : '⚠️ Violation Warning'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
                {[1, 2, 3].map(n => (
                  <div key={n} style={{ width: 36, height: 36, borderRadius: '50%', background: n <= violationPopup.count ? (violationPopup.autoSubmit ? '#ef4444' : '#f59e0b') : 'rgba(255,255,255,0.08)', border: `2px solid ${n <= violationPopup.count ? (violationPopup.autoSubmit ? '#ef4444' : '#f59e0b') : 'rgba(255,255,255,0.15)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: n <= violationPopup.count ? '#fff' : '#475569', fontSize: 14, fontWeight: 800 }}>{n}</div>
                ))}
              </div>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 1.65, marginBottom: 28 }}>
                {violationPopup.autoSubmit
                  ? <>You have reached <strong style={{ color: '#ef4444' }}>3 violations</strong>. Your quiz is being <strong style={{ color: '#ef4444' }}>automatically submitted</strong>.</>
                  : <><strong style={{ color: '#fbbf24' }}>{violationPopup.reason}</strong>.<br />You have <strong style={{ color: '#fbbf24' }}>{violationPopup.count} of 3</strong> violations. One more will auto-submit.</>}
              </p>
              {!violationPopup.autoSubmit && (
                <button onClick={async () => { try { await document.documentElement.requestFullscreen() } catch {} setViolationPopup(null) }}
                  style={{ width: '100%', padding: '14px', borderRadius: 12, background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#000', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                  I Understand — Return to Quiz
                </button>
              )}
              {violationPopup.autoSubmit && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                  <div className="spinner" style={{ width: 16, height: 16, borderColor: 'rgba(239,68,68,0.3)', borderTopColor: '#ef4444' }} />
                  Submitting your quiz…
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Submit Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="modal-box" onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(251,191,36,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <AlertTriangle size={32} color="#fbbf24" />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-main)', marginBottom: 12 }}>Ready to submit?</h2>
              <p style={{ fontSize: 14, color: 'var(--text-sec)', lineHeight: 1.6, marginBottom: 8 }}>
                You have answered <strong style={{ color: '#38bdf8' }}>{answered}</strong> out of <strong style={{ color: 'var(--primary-400)' }}>{questions.length}</strong> questions.
              </p>
              {markedForReview.size > 0 && (
                <p style={{ fontSize: 13, color: '#f59e0b', marginBottom: 24 }}>
                  ⚠️ You have <strong>{markedForReview.size}</strong> question{markedForReview.size > 1 ? 's' : ''} marked for review.
                </p>
              )}
              {markedForReview.size === 0 && <div style={{ marginBottom: 24 }} />}
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setShowConfirm(false)} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button onClick={handleFinish} disabled={submitting} className="btn-primary" style={{ flex: 1, justifyContent: 'center', opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? 'Submitting...' : 'Yes, Submit'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {!submitting && (
        <FaceDetectionGuard
          sharedStream={cameraStreamRef.current}
          onViolation={handleViolation}
        />
      )}
    </div>
  )
}
