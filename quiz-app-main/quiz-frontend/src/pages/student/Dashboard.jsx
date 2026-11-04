import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Layout from '../../components/Layout'
import { studentQuizApi } from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { BookOpen, Clock, ChevronRight, Code2, Trophy, Search, Zap } from 'lucide-react'

export default function StudentDashboard() {
  const { user } = useAuth()
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    studentQuizApi.getAll()
      .then(r => setQuizzes(r.data.data || []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = quizzes.filter(q => q.title?.toLowerCase().includes(search.toLowerCase()))

  return (
    <Layout title={`Hey, ${user?.name?.split(' ')[0]} 👋`} subtitle="Choose a quiz or coding challenge to begin">
      {/* Top stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Available Assessments', val: quizzes.length, icon: BookOpen, color: 'var(--primary)', bg: 'rgba(37,99,235,0.1)', border: 'rgba(37,99,235,0.2)' },
          { label: 'Coding Challenges', val: 'Open', icon: Code2, color: '#38bdf8', bg: 'rgba(56,189,248,0.1)', border: 'rgba(56,189,248,0.2)' },
          { label: 'Achievements', val: '—', icon: Trophy, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)' },
        ].map(({ label, val, icon: Icon, color, bg, border }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            style={{ background: bg, border: `1px solid ${border}`, borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `rgba(0,0,0,0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={20} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--text-main)' }}>{val}</div>
              <div style={{ fontSize: 14, color: 'var(--text-sec)', marginTop: 3 }}>{label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quizzes section */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden' }}>
        {/* Header row */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>Available Assessments</h2>
            <p style={{ fontSize: 13, color: 'var(--text-sec)', marginTop: 4 }}>{filtered.length} quiz{filtered.length !== 1 ? 'zes' : ''} found</p>
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={14} color="#4b5563" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search quizzes…"
              className="input-field" style={{ paddingLeft: 36, fontSize: 13, padding: '8px 14px 8px 34px', width: 220 }} />
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: 24 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-sec)' }}>
              <BookOpen size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontSize: 14 }}>No quizzes found</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
              {filtered.map((quiz, i) => (
                <motion.div key={quiz.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Link to={`/student/quizzes/${quiz.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                    <div className="card card-lift" style={{ padding: '20px', height: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,var(--primary),var(--primary-400))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(37,99,235,0.3)' }}>
                          <Zap size={18} color="#fff" />
                        </div>
                        <span className={`badge ${quiz.active ? 'badge-active' : 'badge-off'}`}>
                          {quiz.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-main)', marginBottom: 8, lineHeight: 1.4 }}>{quiz.title}</h3>
                      {quiz.description && <p style={{ fontSize: 13, color: 'var(--text-sec)', marginBottom: 16, lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{quiz.description}</p>}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: 'var(--text-sec)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Clock size={13} /> {quiz.durationMinutes ? `${quiz.durationMinutes} min` : 'Open'}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Trophy size={13} /> {quiz.totalMarks || 0} marks
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--primary)', fontWeight: 700 }}>
                          Start <ChevronRight size={13} />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Coding shortcut */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        style={{ marginTop: 20, background: 'linear-gradient(135deg,rgba(56,189,248,0.08),rgba(37,99,235,0.08))', border: '1px solid rgba(56,189,248,0.15)', borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(56,189,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Code2 size={20} color="#38bdf8" />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-main)' }}>Coding Challenges</div>
            <div style={{ fontSize: 13, color: 'var(--text-sec)', marginTop: 3 }}>Solve programming problems with the Monaco editor</div>
          </div>
        </div>
        <Link to="/student/coding" className="btn-ghost" style={{ fontSize: 13, padding: '9px 18px' }}>
          Explore <ChevronRight size={14} />
        </Link>
      </motion.div>
    </Layout>
  )
}
