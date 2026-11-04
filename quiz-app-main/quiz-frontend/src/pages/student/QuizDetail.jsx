import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../../components/Layout'
import { studentQuizApi, questionApi } from '../../api/axios'
import {
  BookOpen, Clock, HelpCircle, ArrowLeft, Play, CheckCircle,
  AlertTriangle, Monitor, ShieldCheck, Eye, Maximize2, Info, Lock
} from 'lucide-react'

export default function QuizDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [quiz, setQuiz] = useState(null)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState('info')
  // Read flag passed back from QuizAttempt when attempt limit is hit
  const [attemptsExhausted, setAttemptsExhausted] = useState(
    () => location.state?.attemptsExhausted === true
  )

  useEffect(() => {
    Promise.all([
      studentQuizApi.getById(id),
      questionApi.getForStudent(id),
    ]).then(([qr, qsR]) => {
      setQuiz(qr.data.data)
      setQuestions(qsR.data.data || [])
    }).finally(() => setLoading(false))
  }, [id])

  const handleStartQuiz = () => {
    try { document.documentElement.requestFullscreen().catch(() => {}) } catch(e) {}
    // Navigate — UnifiedAssessment handles starting the attempt
    navigate(`/assessment/${id}`, { state: { requestFullscreen: true } })
  }

  if (loading) return <Layout title="Loading..."><div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div></Layout>
  if (!quiz) return <Layout title="Not Found"><div style={{ textAlign: 'center', padding: 80, color: 'var(--text-sec)' }}>Quiz not found.</div></Layout>

  const rules = [
    { icon: Monitor, title: 'Full Screen Required', desc: 'The quiz runs in full-screen mode. Exiting full screen will be flagged.', color: 'var(--primary)' },
    { icon: Eye, title: 'Anti-Cheat Monitoring', desc: 'Switching tabs or windows is monitored. Three violations will auto-submit.', color: '#f87171' },
    { icon: ShieldCheck, title: 'No Going Back', desc: 'Once you start, you must complete the quiz in one sitting. You cannot pause.', color: '#38bdf8' },
    { icon: AlertTriangle, title: '3 Strike Rule', desc: 'Attempting to exit full screen or switch tabs 3 times will be treated as cheating and the quiz will be force-submitted.', color: '#fbbf24' },
  ]

  return (
    <Layout
      title={phase === 'info' ? quiz.title : 'Exam Instructions'}
      subtitle={phase === 'info' ? 'Review details before starting' : 'Read carefully before you begin'}
      action={<Link to="/student/dashboard" className="btn-ghost" style={{ padding: '8px 16px', fontSize: 13 }}><ArrowLeft size={14} /> Back</Link>}
    >
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <AnimatePresence mode="wait">

          {/* ── PHASE 1: Quiz Info ── */}
          {phase === 'info' && (
            <motion.div key="info" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* Attempts Exhausted Banner */}
              {attemptsExhausted && (
                <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                  style={{ padding: '20px 24px', borderRadius: 14, background: 'linear-gradient(135deg,rgba(239,68,68,0.12),rgba(220,38,38,0.08))', border: '1px solid rgba(239,68,68,0.35)', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Lock size={24} color="#f87171" />
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#f87171', marginBottom: 4 }}>Attempts Exhausted</div>
                    <div style={{ fontSize: 13, color: 'rgba(248,113,113,0.8)', lineHeight: 1.6 }}>
                      You have used all <strong>2 attempts</strong> for this quiz. No further attempts are allowed.
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Info Card */}
              <div className="card" style={{ padding: 32 }}>
                <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                  <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg,var(--primary),var(--primary-400))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(37,99,235,0.4)', flexShrink: 0 }}>
                    <BookOpen size={32} color="#fff" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-main)' }}>{quiz.title}</h2>
                      <span className={`badge ${quiz.active ? 'badge-active' : 'badge-off'}`}>{quiz.active ? 'Active' : 'Inactive'}</span>
                    </div>
                    {quiz.description && <p style={{ fontSize: 14.5, color: 'var(--text-sec)', lineHeight: 1.6, marginBottom: 24 }}>{quiz.description}</p>}

                    <div style={{ display: 'flex', gap: 16, paddingTop: 24, borderTop: '1px solid var(--glass-border)' }}>
                      {[
                        { icon: HelpCircle, label: 'Questions', val: questions.length },
                        ...(quiz.duration ? [{ icon: Clock, label: 'Duration', val: `${quiz.duration} min` }] : []),
                        ...(quiz.passMark ? [{ icon: CheckCircle, label: 'Pass Mark', val: `${quiz.passMark}%` }] : []),
                      ].map(({ icon: Icon, label, val }) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingRight: 24 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon size={18} color="var(--primary-400)" />
                          </div>
                          <div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)' }}>{val}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-sec)' }}>{label}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setPhase('instructions')}
                  disabled={!quiz.active || attemptsExhausted}
                  className="btn-primary"
                  style={{ opacity: (quiz.active && !attemptsExhausted) ? 1 : 0.4, cursor: (quiz.active && !attemptsExhausted) ? 'pointer' : 'not-allowed' }}
                >
                  {attemptsExhausted ? <><Lock size={16} /> Attempts Exhausted</> : <><Info size={16} /> View Instructions & Start</>}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── PHASE 2: Instructions ── */}
          {phase === 'instructions' && (
            <motion.div key="instructions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Warning Banner */}
              <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <AlertTriangle size={22} color="#fbbf24" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fbbf24' }}>Important — Read Before Starting</div>
                  <div style={{ fontSize: 13, color: 'var(--text-sec)', marginTop: 3 }}>
                    This is a monitored exam. Once you start, you cannot pause or go back. Follow all rules carefully.
                  </div>
                </div>
              </div>

              {/* Rules Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {rules.map(({ icon: Icon, title, desc, color }) => (
                  <div key={title} className="card" style={{ padding: 22 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 11, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                      <Icon size={20} color={color} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>{title}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.55 }}>{desc}</div>
                  </div>
                ))}
              </div>

              {/* Checklist */}
              <div className="card" style={{ padding: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Maximize2 size={16} color="#38bdf8" /> Before You Begin — Checklist
                </div>
                {[
                  'Ensure you have a stable internet connection',
                  'Close all other tabs and applications',
                  'Make sure you have enough time to complete the quiz',
                  `You have ${questions.length} question${questions.length !== 1 ? 's' : ''} to answer${quiz.duration ? ` within ${quiz.duration} minutes` : ''}`,
                  'Clicking "Begin Quiz" will trigger full-screen mode',
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <CheckCircle size={12} color="#4ade80" />
                    </div>
                    <span style={{ fontSize: 13.5, color: 'var(--text-sec)', lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 14, justifyContent: 'flex-end', marginTop: 4 }}>
                <button onClick={() => setPhase('info')} className="btn-ghost">
                  <ArrowLeft size={16} /> Go Back
                </button>
                <button
                  onClick={handleStartQuiz}
                  className="btn-primary"
                >
                  <Play size={17} fill="currentColor" /> I Understand — Begin Quiz
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </Layout>
  )
}
