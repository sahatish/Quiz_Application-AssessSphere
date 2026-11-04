import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import { adminApi } from '../api/axios'
import { Mail, Calendar, Trophy, CheckCircle2, XCircle, Clock, BarChart2, Award, Shield, BookOpen, User } from 'lucide-react'

export default function Profile() {
  const { user, isAdmin } = useAuth()
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isAdmin) {
      // Admin: load all results (shows stats about the platform they manage)
      adminApi.getStudentResults(user.id)
        .then(r => setResults(r.data.data || []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false))
    } else {
      // Student: load their own results via the admin endpoint
      adminApi.getStudentResults(user.id)
        .then(r => setResults(r.data.data || []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false))
    }
  }, [user?.id, isAdmin])

  const submitted = results.filter(r => r.status === 'SUBMITTED')
  const inProgress = results.filter(r => r.status === 'IN_PROGRESS')
  const avgScore = submitted.length > 0
    ? Math.round(submitted.reduce((s, r) => s + (r.totalMarks > 0 ? (r.score / r.totalMarks) * 100 : 0), 0) / submitted.length)
    : 0
  const passed = submitted.filter(r => r.totalMarks > 0 && (r.score / r.totalMarks) >= 0.5).length
  const bestScore = submitted.length > 0
    ? Math.max(...submitted.map(r => r.totalMarks > 0 ? Math.round((r.score / r.totalMarks) * 100) : 0))
    : 0

  // Get joined date from user object or fallback
  const joinedDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Member'

  return (
    <Layout title="My Profile" subtitle="Your account information and quiz history">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Hero Profile Card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card"
          style={{ padding: '36px 32px', background: 'linear-gradient(135deg, rgba(37,99,235,0.12) 0%, rgba(56,189,248,0.06) 100%)', border: '1px solid rgba(37,99,235,0.2)', position: 'relative', overflow: 'hidden' }}>
          {/* BG decoration */}
          <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle,rgba(37,99,235,0.15),transparent)', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'linear-gradient(135deg,var(--primary),var(--primary-400))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 34, fontWeight: 800, boxShadow: '0 0 30px rgba(37,99,235,0.4)' }}>
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div style={{ position: 'absolute', bottom: 2, right: 2, width: 22, height: 22, borderRadius: '50%', background: isAdmin ? 'var(--primary)' : '#4ade80', border: '2px solid var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isAdmin ? <Shield size={10} color="#fff" /> : <User size={10} color="#fff" />}
              </div>
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-main)', marginBottom: 6, letterSpacing: '-0.02em' }}>{user?.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-sec)', fontSize: 14, marginBottom: 10 }}>
                <Mail size={14} /> {user?.email}
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <span className={`badge ${isAdmin ? 'badge-admin' : 'badge-student'}`} style={{ fontSize: 12, padding: '4px 12px' }}>
                  {isAdmin ? '⚡ Admin' : '🎓 Student'}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-sec)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Calendar size={12} /> {joinedDate}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats grid — Student only */}
        {!isAdmin && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 16 }}>
            {[
              { label: 'Total Attempts', val: results.length, icon: BarChart2, color: 'var(--primary)', bg: 'rgba(37,99,235,0.12)' },
              { label: 'Completed', val: submitted.length, icon: CheckCircle2, color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
              { label: 'Avg Score', val: `${avgScore}%`, icon: Trophy, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
              { label: 'Quizzes Passed', val: passed, icon: Award, color: '#38bdf8', bg: 'rgba(56,189,248,0.12)' },
              { label: 'Best Score', val: `${bestScore}%`, icon: BookOpen, color: 'var(--primary-400)', bg: 'rgba(167,139,250,0.12)' },
            ].map(({ label, val, icon: Icon, color, bg }, i) => (
              <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="card" style={{ padding: '20px 18px', textAlign: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Icon size={22} color={color} />
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-main)' }}>{val}</div>
                <div style={{ fontSize: 12, color: 'var(--text-sec)', marginTop: 4 }}>{label}</div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Admin info card */}
        {isAdmin && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: 28, textAlign: 'center' }}>
            <Shield size={40} color="var(--primary)" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)', marginBottom: 8 }}>Administrator Account</div>
            <p style={{ fontSize: 14, color: 'var(--text-sec)', lineHeight: 1.6 }}>
              You have full access to manage quizzes, students, and view all results.
            </p>
          </motion.div>
        )}

        {/* Quiz History — student only */}
        {!isAdmin && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)', marginBottom: 20 }}>Quiz History</h2>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
            ) : results.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-sec)' }}>
                <BookOpen size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p>No quiz attempts yet. Go take a quiz!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {results.map((r, i) => {
                  const pct = r.totalMarks > 0 ? Math.round((r.score / r.totalMarks) * 100) : 0
                  const passColor = pct >= 70 ? '#4ade80' : pct >= 50 ? '#f59e0b' : '#f87171'
                  const isSubmitted = r.status === 'SUBMITTED'
                  return (
                    <motion.div key={r.attemptId} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: 16 }}>
                      {/* Icon */}
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: isSubmitted ? `${passColor}18` : 'rgba(251,191,36,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {isSubmitted
                          ? (pct >= 50 ? <CheckCircle2 size={20} color={passColor} /> : <XCircle size={20} color={passColor} />)
                          : <Clock size={20} color="#fbbf24" />}
                      </div>
                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.quizTitle}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-sec)' }}>
                          {r.submittedAt ? new Date(r.submittedAt).toLocaleString() : 'In progress'}
                        </div>
                      </div>
                      {/* Score + bar */}
                      {isSubmitted && (
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 20, fontWeight: 800, color: passColor }}>{pct}%</div>
                          <div style={{ fontSize: 12, color: 'var(--text-sec)' }}>{r.score}/{r.totalMarks} marks</div>
                        </div>
                      )}
                      {!isSubmitted && (
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#fbbf24', padding: '3px 10px', borderRadius: 20, background: 'rgba(251,191,36,0.1)' }}>In Progress</span>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </Layout>
  )
}
