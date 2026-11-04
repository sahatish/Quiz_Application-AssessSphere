import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Editor from '@monaco-editor/react'
import { codingApi, examTokenApi } from '../../api/axios'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Play, Send, Terminal, CheckCircle2, XCircle,
  Loader2, Clock, AlertTriangle, ShieldAlert, Maximize2
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
  javascript: '// Write your solution here\nfunction solution(input) {\n  // your code\n}\n',
  python:     '# Write your solution here\ndef solution(input):\n    pass\n',
  java:       'public class Solution {\n    public static void main(String[] args) {\n        // your code\n    }\n}\n',
  cpp:        '#include <iostream>\nusing namespace std;\n\nint main() {\n    // your code\n    return 0;\n}\n',
}
const diffClass = { EASY: 'badge-easy', MEDIUM: 'badge-medium', HARD: 'badge-hard' }

function fmt(s) {
  const m = Math.floor(s / 60), ss = s % 60
  return `${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`
}

const MAX_VIOLATIONS = 3

export default function CodeEditor() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [test, setTest]           = useState(null)
  const [lang, setLang]           = useState('javascript')
  const [code, setCode]           = useState(STARTERS.javascript)
  const [output, setOutput]       = useState(null)
  const [running, setRunning]     = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Anti-cheat state
  const [started, setStarted]       = useState(false)   // has fullscreen started?
  const [verifyingCamera, setVerifyingCamera] = useState(true)
  const [timeLeft, setTimeLeft]     = useState(0)
  const [violations, setViolations] = useState(0)
  const [violPopup, setViolPopup]   = useState(null)    // { count, autoSubmit }
  const [submitted, setSubmitted]   = useState(false)
  const [error, setError]           = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const violRef   = useRef(0)
  const timerRef  = useRef(null)
  const shellRef  = useRef(null)
  const cameraStreamRef = useRef(null)

  useEffect(() => {
    codingApi.getById(id).then(r => {
      const found = r.data.data
      if (!found) {
        setError('Coding challenge not found.')
      } else {
        setTest(found)
        if (found.timeLimitMinutes) setTimeLeft(found.timeLimitMinutes * 60)
      }
    }).catch(err => {
      console.error(err)
      setError(err.response?.data?.message || 'Failed to load coding challenge details.')
    })
  }, [id])

  // ── Auto-submit when time runs out ─────────────────────────────
  const doAutoSubmit = useCallback(async () => {
    if (submitted) return
    setSubmitted(true)
    setViolPopup(null)
    clearInterval(timerRef.current)
    try {
      const res = await codingApi.submit({ codingTestId: Number(id), code, language: lang.toUpperCase() })
      setOutput({ type: 'submit', data: res.data.data })
      toast.success('Auto-submitted — time is up!', { duration: 4000 })
    } catch {
      toast.error('Auto-submit failed')
    } finally {
      // Exit fullscreen then go back
      try { await document.exitFullscreen() } catch {}
      navigate('/student/success')
    }
  }, [submitted, id, code, lang, navigate])

  // ── Timer countdown ────────────────────────────────────────────
  useEffect(() => {
    if (!started || timeLeft <= 0 || submitted) return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); doAutoSubmit(); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [started, submitted, doAutoSubmit])

  // ── Fullscreen request ─────────────────────────────────────────
  const enterFullscreen = () => {
    const el = shellRef.current || document.documentElement
    el.requestFullscreen?.() || el.webkitRequestFullscreen?.()
  }

  const handleStart = (stream) => {
    cameraStreamRef.current = stream || cameraStreamRef.current
    enterFullscreen()
    setStarted(true)
    setVerifyingCamera(false)
    violRef.current = 0
    setViolations(0)
  }

  // ── Record a violation ─────────────────────────────────────────
  const recordViolation = useCallback((reason) => {
    if (submitted || !started) return
    violRef.current += 1
    const count = violRef.current
    setViolations(count)
    const autoSubmit = count >= MAX_VIOLATIONS
    setViolPopup({ count, reason, autoSubmit })
    if (autoSubmit) {
      setTimeout(() => doAutoSubmit(), 2500)
    }
  }, [submitted, started, doAutoSubmit])

  // ── Anti-cheat event listeners ─────────────────────────────────
  useEffect(() => {
    if (!started || submitted) return

    const onBlur = () => recordViolation('Window focus lost — switching windows is not allowed.')
    const onVisibility = () => { if (document.hidden) recordViolation('Tab switching detected.') }
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault(); recordViolation('Opening new tab detected.')
      }
      if (e.key === 'Escape') recordViolation('Escape key / fullscreen exit detected.')
    }
    const onFullscreen = () => {
      if (!document.fullscreenElement) recordViolation('Fullscreen was exited.')
    }

    window.addEventListener('blur', onBlur)
    document.addEventListener('visibilitychange', onVisibility)
    document.addEventListener('keydown', onKey)
    document.addEventListener('fullscreenchange', onFullscreen)
    return () => {
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('visibilitychange', onVisibility)
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('fullscreenchange', onFullscreen)
    }
  }, [started, submitted, recordViolation])

  // ── Handlers ───────────────────────────────────────────────────
  const handleRun = async () => {
    setRunning(true); setOutput(null)
    try {
      const res = await codingApi.run({ codingTestId: Number(id), code, language: lang.toUpperCase() })
      setOutput({ type: 'run', data: res.data.data })
    } catch (err) {
      setOutput({ type: 'error', data: err.response?.data?.message || 'Execution error' })
    } finally { setRunning(false) }
  }

  const handleSubmitCode = async () => {
    if (submitted) return
    setSubmitting(true); setOutput(null)
    try {
      const res = await codingApi.submit({ codingTestId: Number(id), code, language: lang.toUpperCase() })
      const data = res.data.data
      setOutput({ type: 'submit', data })
      const passed = data?.status === 'ACCEPTED' || data?.testCasesPassed === data?.totalTestCases
      toast[passed ? 'success' : 'error'](
        passed ? `✅ All ${data.testCasesPassed || ''} tests passed!` : `❌ ${data.testCasesPassed || 0}/${data.totalTestCases || '?'} tests passed`
      )
    } catch (err) {
      setOutput({ type: 'error', data: err.response?.data?.message || 'Submission error' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleFinishExam = async () => {
    if (submitted) return
    setShowConfirm(false)
    setSubmitting(true)
    try {
      // Consume the token to prevent retaking the test
      if (token) {
        try { await examTokenApi.consume(token) } catch {}
      }
      setSubmitted(true)
      clearInterval(timerRef.current)
      toast.success("Exam completed successfully!")
      setTimeout(async () => {
        try { await document.exitFullscreen() } catch {}
        navigate('/student/success')
      }, 2000)
    } catch (err) {
      toast.error("Failed to finish exam cleanly")
    } finally {
      setSubmitting(false)
    }
  }

  const timerClass = timeLeft > 0
    ? timeLeft <= 60 ? 'danger' : timeLeft <= 180 ? 'warning' : ''
    : ''

  // ── Pre-start screen ───────────────────────────────────────────
  if (verifyingCamera) {
    return <CameraSetupGate onReady={handleStart} onCancel={() => navigate(-1)} title="Camera Setup" />
  }

  if (!started) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: '#161b22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '40px 48px', maxWidth: 540, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Maximize2 size={28} color="var(--primary-400)" />
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-main)', marginBottom: 8 }}>
            {test?.title || 'Coding Challenge'}
          </h2>
          {test && <span className={`badge ${diffClass[test.difficulty] || ''}`} style={{ marginBottom: 20, display: 'inline-block' }}>{test.difficulty}</span>}
          <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12, padding: '16px 20px', marginBottom: 28, textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <AlertTriangle size={18} color="#fbbf24" />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#fbbf24' }}>Before You Begin</span>
            </div>
            {[
              'The editor will open in full-screen mode',
              'Tab switching or window blur counts as a violation',
              `3 violations = automatic submission`,
              'Make sure you have enough time to complete',
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <span style={{ color: '#4ade80', flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 13, color: 'var(--text-sec)' }}>{r}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            {/* Back button is no longer meaningful here without a dashboard, so removing it or mapping to home */}
            <button onClick={() => navigate('/')}
              style={{ padding: '12px 24px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-sec)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              <ArrowLeft size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} />Exit
            </button>
            <button onClick={() => setVerifyingCamera(true)}
              style={{ padding: '12px 28px', borderRadius: 10, background: 'linear-gradient(135deg,var(--primary),var(--primary-400))', border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(37,99,235,0.4)' }}>
              <Maximize2 size={15} style={{ marginRight: 8, verticalAlign: 'middle' }} />Start in Full Screen
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="editor-shell" ref={shellRef}>

      {/* Violation Modal */}
      <AnimatePresence>
        {violPopup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ scale: 0.85, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85 }}
              style={{ background: '#1a1f2e', border: `2px solid ${violPopup.autoSubmit ? '#ef4444' : '#f59e0b'}`, borderRadius: 20, padding: '36px 40px', maxWidth: 460, width: '100%', textAlign: 'center', boxShadow: `0 0 60px ${violPopup.autoSubmit ? 'rgba(239,68,68,0.4)' : 'rgba(245,158,11,0.3)'}` }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: violPopup.autoSubmit ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <ShieldAlert size={30} color={violPopup.autoSubmit ? '#f87171' : '#fbbf24'} />
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-main)', marginBottom: 8 }}>
                {violPopup.autoSubmit ? 'Auto-Submitting…' : `Violation ${violPopup.count} / ${MAX_VIOLATIONS}`}
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-sec)', marginBottom: 24, lineHeight: 1.6 }}>{violPopup.reason}</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 24 }}>
                {[1,2,3].map(n => (
                  <div key={n} style={{ width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, background: n <= violPopup.count ? (violPopup.autoSubmit ? '#ef4444' : '#f59e0b') : 'rgba(255,255,255,0.07)', border: `2px solid ${n <= violPopup.count ? (violPopup.autoSubmit ? '#ef4444' : '#f59e0b') : 'rgba(255,255,255,0.12)'}`, color: n <= violPopup.count ? '#fff' : '#475569' }}>{n}</div>
                ))}
              </div>
              {!violPopup.autoSubmit && (
                <button onClick={() => { setViolPopup(null); enterFullscreen() }}
                  style={{ padding: '12px 32px', borderRadius: 10, background: 'linear-gradient(135deg,#f59e0b,#d97706)', border: 'none', color: '#000', fontSize: 15, fontWeight: 700, cursor: 'pointer', width: '100%' }}>
                  I Understand — Return to Editor
                </button>
              )}
              {violPopup.autoSubmit && (
                <p style={{ fontSize: 13, color: '#f87171' }}>Submitting your code automatically…</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Finish Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="modal-overlay" style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
          }} onClick={() => setShowConfirm(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              style={{
                background: '#161b22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '36px 40px', maxWidth: 440, width: '100%', textAlign: 'center'
              }} onClick={e => e.stopPropagation()}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(251,191,36,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <AlertTriangle size={32} color="#fbbf24" />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-main)', marginBottom: 12 }}>Finish Exam?</h2>
              <p style={{ fontSize: 14, color: 'var(--text-sec)', lineHeight: 1.6, marginBottom: 24 }}>
                Are you sure you want to finish the exam? This will submit your final code and close your assessment session.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setShowConfirm(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-sec)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={handleFinishExam} disabled={submitting}
                  style={{ flex: 1, padding: '12px', borderRadius: 10, background: 'linear-gradient(135deg,#ef4444,#dc2626)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? 'Submitting...' : 'Yes, Finish'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <div className="editor-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {submitted && (
            <button onClick={() => { document.exitFullscreen?.(); navigate('/student/coding') }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-sec)', background: 'none', border: 'none', cursor: 'pointer' }}>
              <ArrowLeft size={14} /> Back
            </button>
          )}
          {!submitted && <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />}
          {test && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>{test.title}</span>
              <span className={`badge ${diffClass[test.difficulty] || ''}`}>{test.difficulty}</span>
            </div>
          )}
          {/* Violations indicator */}
          {violations > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 6, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>
              <ShieldAlert size={12} /> {violations}/{MAX_VIOLATIONS} violations
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Timer */}
          {timeLeft > 0 && !submitted && (
            <div className={`editor-timer ${timerClass}`}>
              <Clock size={14} />
              {fmt(timeLeft)}
            </div>
          )}

          <select value={lang} onChange={e => { setLang(e.target.value); setCode(STARTERS[e.target.value]) }}
            style={{ background: '#21262d', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--text-main)', padding: '6px 12px', borderRadius: 6, fontSize: 13, outline: 'none', cursor: 'pointer' }}>
            {LANGUAGES.map(l => <option key={l.val} value={l.val} style={{ background: '#161b22', color: 'var(--text-main)' }}>{l.label}</option>)}
          </select>

          <button onClick={handleRun} disabled={running || submitted}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, background: '#21262d', border: '1px solid rgba(56,189,248,0.3)', color: '#38bdf8', fontSize: 13, fontWeight: 600, cursor: running || submitted ? 'not-allowed' : 'pointer', opacity: submitted ? 0.4 : 1 }}>
            {running ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Play size={14} />} Run
          </button>

          <button onClick={handleSubmitCode} disabled={submitting || submitted}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 18px', borderRadius: 8, background: '#21262d', border: '1px solid rgba(167,139,250,0.3)', color: 'var(--primary-400)', fontSize: 13, fontWeight: 600, cursor: submitting || submitted ? 'not-allowed' : 'pointer', opacity: submitted ? 0.4 : 1 }}>
            {submitting ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Send size={14} />} Submit Code
          </button>

          <button onClick={() => setShowConfirm(true)} disabled={submitting || submitted}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 18px', borderRadius: 8, background: submitted ? '#21262d' : 'linear-gradient(135deg,#ef4444,#dc2626)', border: 'none', color: submitted ? '#64748b' : '#fff', fontSize: 13, fontWeight: 700, cursor: submitting || submitted ? 'not-allowed' : 'pointer', boxShadow: submitted ? 'none' : '0 2px 12px rgba(239,68,68,0.4)' }}>
            Finish Exam
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="editor-body">
        {/* Problem Panel */}
        <div className="problem-panel">
          {error ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#ef4444' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Failed to Load Challenge</h3>
              <p style={{ fontSize: 13, color: 'var(--text-sec)' }}>{error}</p>
            </div>
          ) : test ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-main)', marginBottom: 8, lineHeight: 1.3 }}>{test.title}</h2>
                <span className={`badge ${diffClass[test.difficulty] || ''}`}>{test.difficulty}</span>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-sec)', marginBottom: 10 }}>Description</div>
                <div 
                  className="leetcode-description"
                  style={{ fontSize: 14, color: 'var(--text-main)', lineHeight: 1.7 }} 
                  dangerouslySetInnerHTML={{ __html: test.description }}
                />
              </div>
              {test.sampleInput && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-sec)', marginBottom: 10 }}>Sample Input</div>
                  <pre style={{ background: '#0d1117', padding: '12px 14px', borderRadius: 8, fontSize: 13, color: '#38bdf8', overflowX: 'auto', border: '1px solid rgba(56,189,248,0.2)', fontFamily: "'Fira Code', monospace", lineHeight: 1.6 }}>{test.sampleInput}</pre>
                </div>
              )}
              {test.sampleOutput && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-sec)', marginBottom: 10 }}>Expected Output</div>
                  <pre style={{ background: '#0d1117', padding: '12px 14px', borderRadius: 8, fontSize: 13, color: '#4ade80', overflowX: 'auto', border: '1px solid rgba(74,222,128,0.2)', fontFamily: "'Fira Code', monospace", lineHeight: 1.6 }}>{test.sampleOutput}</pre>
                </div>
              )}
            </div>
          ) : <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}><div className="spinner" /></div>}
        </div>

        {/* Editor Area */}
        <div className="editor-right">
          <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
            <Editor
              language={lang}
              value={code}
              onChange={v => setCode(v || '')}
              theme="vs-dark"
              options={{
                fontSize: 15,
                fontFamily: "'Fira Code', 'Cascadia Code', monospace",
                fontLigatures: true,
                minimap: { enabled: false },
                padding: { top: 20 },
                lineNumbers: 'on',
                renderLineHighlight: 'all',
                scrollBeyondLastLine: false,
                readOnly: submitted,
              }}
            />
          </div>

          {/* Output */}
          <AnimatePresence>
            {output && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="output-panel">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Terminal size={14} color="#64748b" />
                  <span style={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-sec)' }}>Console Output</span>
                  {output.type === 'submit' && (() => {
                    const isPassed = output.data?.status === 'ACCEPTED' || output.data?.testCasesPassed === output.data?.totalTestCases
                    return isPassed
                      ? <CheckCircle2 size={16} color="#4ade80" style={{ marginLeft: 'auto' }} />
                      : <XCircle size={16} color="#f87171" style={{ marginLeft: 'auto' }} />
                  })()}
                  {output.type === 'run' && <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-sec)' }}>{output.data?.language} • {output.data?.executionTimeMs}ms</span>}
                </div>
                {output.type === 'run' && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-sec)', marginBottom: 6 }}>Output</div>
                    <pre style={{ fontSize: 13, fontFamily: "'Fira Code', monospace", color: '#38bdf8', whiteSpace: 'pre-wrap' }}>{output.data?.output}</pre>
                  </div>
                )}
                {output.type === 'submit' && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-sec)', marginBottom: 6 }}>Result</div>
                    <pre style={{ fontSize: 13, fontFamily: "'Fira Code', monospace", color: output.data?.status === 'ACCEPTED' ? '#4ade80' : '#f87171', whiteSpace: 'pre-wrap' }}>
{output.data?.status} — {output.data?.testCasesPassed}/{output.data?.totalTestCases} test cases passed ({output.data?.executionTimeMs}ms)
{output.data?.message || ''}
{output.data?.output && `\n\nExecution Output:\n${output.data.output}`}</pre>
                  </div>
                )}
                {output.type === 'error' && (
                  <pre style={{ fontSize: 13, fontFamily: "'Fira Code', monospace", color: '#f87171', whiteSpace: 'pre-wrap' }}>{output.data}</pre>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      {started && !submitted && (
        <FaceDetectionGuard
          sharedStream={cameraStreamRef.current}
          onViolation={recordViolation}
        />
      )}
    </div>
  )
}
