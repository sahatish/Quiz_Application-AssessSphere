import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import { Zap, BookOpen, Lock } from 'lucide-react'

/**
 * /quiz/:id  — Shareable quiz link
 * - If logged in as student → goes straight to /student/quizzes/:id
 * - If logged in as admin   → shows "login as student" message
 * - If not logged in        → saves the destination and redirects to /login
 */
export default function QuizShareRedirect() {
  const { id } = useParams()
  const { user, isAdmin, isStudent } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      // Save destination so Login can redirect after auth
      localStorage.setItem('quiz_redirect', `/student/quizzes/${id}`)
      navigate('/login', { replace: true, state: { redirect: `/student/quizzes/${id}`, quizId: id } })
    } else if (isStudent) {
      navigate(`/student/quizzes/${id}`, { replace: true })
    }
    // admin stays on this page — shows info box
  }, [user, isStudent, id, navigate])

  // Admin message
  if (isAdmin) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 24, padding: '48px 40px', maxWidth: 440, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,var(--primary),var(--primary-400))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 24px rgba(37,99,235,0.4)' }}>
            <BookOpen size={28} color="#fff" />
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-main)', marginBottom: 10 }}>Quiz Shared Link</div>
          <div style={{ fontSize: 14, color: 'var(--text-sec)', lineHeight: 1.7, marginBottom: 28 }}>
            You are currently signed in as an <strong style={{ color: '#fbbf24' }}>Admin</strong>. This link is for students. Share it with students so they can access this quiz directly.
          </div>
          <button onClick={() => navigate('/admin/dashboard')}
            style={{ padding: '10px 24px', background: 'linear-gradient(135deg,var(--primary),var(--primary-400))', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
            Go to Dashboard
          </button>
        </motion.div>
      </div>
    )
  }

  // Loading spinner while redirecting
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,var(--primary),var(--primary-400))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(37,99,235,0.4)' }}>
        <Zap size={22} color="#fff" />
      </div>
      <div style={{ color: 'var(--text-sec)', fontSize: 14 }}>Redirecting to quiz…</div>
      <div className="spinner" />
    </div>
  )
}
