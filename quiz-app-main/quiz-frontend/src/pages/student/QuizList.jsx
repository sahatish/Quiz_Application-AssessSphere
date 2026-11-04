import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Layout from '../../components/Layout'
import { studentQuizApi, attemptApi } from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { BookOpen, Clock, Star, ChevronRight, CheckCircle2, AlertCircle, Lock } from 'lucide-react'

export default function StudentQuizList() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    studentQuizApi.getAll()
      .then(r => setQuizzes(r.data.data || []))
      .finally(() => setLoading(false))
  }, [])

  const handleStart = async (quiz) => {
    try {
      // Try to start — backend will block if limit reached
      await attemptApi.start(quiz.id, user.id)
      navigate(`/student/quizzes/${quiz.id}`)
    } catch (err) {
      const msg = err.response?.data?.message || ''
      if (msg.includes('ATTEMPT_LIMIT_REACHED')) {
        toast.error('You have used all 2 attempts for this quiz.', { duration: 4000 })
      } else if (msg.includes('in-progress')) {
        navigate(`/student/quizzes/${quiz.id}`)
      } else {
        navigate(`/student/quizzes/${quiz.id}`)
      }
    }
  }

  return (
    <Layout title="Available Quizzes" subtitle="Browse and start your quizzes">
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 20 }}>
          {quizzes.map((quiz, i) => (
            <motion.div
              key={quiz.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card card-lift"
              style={{ padding: 24, display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
              onClick={() => navigate(`/student/quizzes/${quiz.id}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,rgba(37,99,235,0.2),rgba(79,70,229,0.2))', border: '1px solid rgba(37,99,235,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookOpen size={22} color="var(--primary-400)" />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: quiz.active ? 'rgba(74,222,128,0.12)' : 'rgba(100,116,139,0.15)', color: quiz.active ? '#4ade80' : '#64748b', border: `1px solid ${quiz.active ? 'rgba(74,222,128,0.3)' : 'rgba(100,116,139,0.2)'}` }}>
                  {quiz.active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <h3 style={{ fontSize: 25, fontWeight: 800, color: 'var(--text-main)', marginBottom: 8, lineHeight: 1.3 }}>{quiz.title}</h3>
              {quiz.description && (
                <p style={{ fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.6, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {quiz.description}
                </p>
              )}

              <div style={{ display: 'flex', gap: 16, marginBottom: 20, marginTop: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-sec)' }}>
                  <Clock size={14} color="#38bdf8" /> {quiz.durationMinutes} min
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-sec)' }}>
                  <Star size={14} color="#f59e0b" /> {quiz.totalMarks} marks
                </div>
              </div>

              <button
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={e => { e.stopPropagation(); navigate(`/student/quizzes/${quiz.id}`) }}
              >
                View Quiz <ChevronRight size={16} />
              </button>
            </motion.div>
          ))}
          {quizzes.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 80, color: 'var(--text-sec)' }}>
              <BookOpen size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontSize: 16 }}>No quizzes available yet.</p>
            </div>
          )}
        </div>
      )}
    </Layout>
  )
}
