import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../../components/Layout'
import { adminQuizApi, questionApi, adminApi } from '../../api/axios'
import {
  BookOpen, Clock, HelpCircle, ArrowLeft, CheckCircle, AlertTriangle,
  Users, BarChart2, Award, Share2, RefreshCw, Calendar, Edit3, X, Loader2, Check, Trash2
} from 'lucide-react'
import toast from 'react-hot-toast'
import ShareLinkModal from '../../components/ShareLinkModal'

export default function AdminQuizDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [quiz, setQuiz] = useState(null)
  const [questions, setQuestions] = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editFormData, setEditFormData] = useState({})
  const [savingEdit, setSavingEdit] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchResults = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true)
    try {
      const res = await adminApi.getQuizResults(id)
      setResults(res.data.data || [])
    } catch {
      // silent
    } finally {
      if (showSpinner) setRefreshing(false)
    }
  }, [id])

  useEffect(() => {
    Promise.all([
      adminQuizApi.getById(id),
      questionApi.getForAdmin(id),
      adminApi.getQuizResults(id),
    ]).then(([qr, qsR, rsR]) => {
      const quizData = qr.data.data
      setQuiz(quizData)
      setQuestions(qsR.data.data || [])
      setResults(rsR.data.data || [])
    }).catch(() => {
      Promise.all([adminQuizApi.getById(id), questionApi.getForAdmin(id)])
        .then(([qr, qsR]) => { setQuiz(qr.data.data); setQuestions(qsR.data.data || []) })
    }).finally(() => setLoading(false))

    // Auto-refresh when user returns to tab
    const onVisible = () => { if (!document.hidden) fetchResults() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [id, fetchResults])

  const openShareModal = () => {
    setShowShareModal(true)
  }

  const handleEditClick = () => {
    setEditFormData({
      title: quiz.title,
      description: quiz.description || '',
      durationMinutes: quiz.durationMinutes || quiz.duration || 0,
      passMark: quiz.passMark || 60,
      totalMarks: quiz.totalMarks || 100,
      active: quiz.active,
    })
    setShowEditModal(true)
  }

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setSavingEdit(true)
    try {
      const payload = {
        ...editFormData,
      }
      const res = await adminQuizApi.update(id, payload)
      toast.success('Quiz updated successfully')
      setShowEditModal(false)
      setQuiz(res.data.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update quiz')
    } finally {
      setSavingEdit(false)
    }
  }

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      await adminQuizApi.delete(id)
      toast.success('Quiz deleted successfully')
      navigate('/admin/quizzes')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete quiz')
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  if (loading) return <Layout title="Loading..."><div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div></Layout>
  if (!quiz) return <Layout title="Not Found"><div style={{ textAlign: 'center', padding: 80, color: 'var(--text-sec)' }}>Quiz not found.</div></Layout>

  const submittedResults = results.filter(r => r.status === 'SUBMITTED')
  const avgScore = submittedResults.length > 0
    ? (submittedResults.reduce((a, r) => a + Math.min((r.score || 0) / (r.totalMarks || 1) * 100, 100), 0) / submittedResults.length).toFixed(1)
    : '—'
  const passRate = submittedResults.length > 0
    ? ((submittedResults.filter(r => (r.score / r.totalMarks) >= 0.6).length / submittedResults.length) * 100).toFixed(0)
    : '—'

  return (
    <Layout
      title={quiz.title}
      subtitle="Admin Quiz Overview"
      action={
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button onClick={() => fetchResults(true)} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6 }} disabled={refreshing}>
            <RefreshCw size={15} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} /><span> Refresh</span>
          </button>
          <button onClick={handleEditClick} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Edit3 size={15} /><span> Edit</span>
          </button>
          <Link to={`/admin/quizzes/${id}/questions`} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <HelpCircle size={15} /><span> Questions</span>
          </Link>
          <button onClick={() => setShowDeleteModal(true)} disabled={deleting} style={{ padding: '8px 12px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1, fontWeight: 600 }}>
            {deleting ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
            <span>{deleting ? ' Deleting...' : ' Del'}</span>
          </button>
          <Link to="/admin/quizzes" className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ArrowLeft size={15} /><span> Back</span>
          </Link>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Quiz Info Card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <div style={{ width: 68, height: 68, borderRadius: 18, background: 'linear-gradient(135deg,var(--primary),var(--primary-400))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(37,99,235,0.4)', flexShrink: 0 }}>
              <BookOpen size={30} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-main)' }}>{quiz.title}</h2>
                <span className={`badge ${quiz.active ? 'badge-active' : 'badge-off'}`}>{quiz.active ? 'Active' : 'Draft'}</span>
              </div>
              {quiz.description && <p style={{ fontSize: 14, color: 'var(--text-sec)', lineHeight: 1.6, marginBottom: 20 }}>{quiz.description}</p>}
              <div style={{ display: 'flex', gap: 24, paddingTop: 20, borderTop: '1px solid var(--glass-border)', flexWrap: 'wrap' }}>
                {[
                  { icon: HelpCircle, label: 'Questions', val: questions.length },
                  ...(quiz.passMark ? [{ icon: CheckCircle, label: 'Pass Mark', val: `${quiz.passMark}%` }] : []),
                ].map(({ icon: Icon, label, val }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={16} color="var(--primary-400)" />
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)' }}>{val}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-sec)' }}>{label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>



        {/* Questions List */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-main)' }}>Questions ({questions.length})</h3>
            <Link to={`/admin/quizzes/${id}/questions`} style={{ fontSize: 13, color: 'var(--primary-400)', textDecoration: 'none', fontWeight: 600 }}>Manage →</Link>
          </div>
          {questions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-sec)' }}>
              <HelpCircle size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontSize: 14 }}>No questions yet. Add questions to activate this quiz.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {questions.map((q, i) => (
                <div key={q.id} style={{ display: 'flex', gap: 16, padding: '14px 16px', background: 'var(--glass-bg)', borderRadius: 10, border: '1px solid var(--glass-border)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(37,99,235,0.12)', color: 'var(--primary-400)', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)', marginBottom: 8, lineHeight: 1.4 }}>{q.questionText}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {['A', 'B', 'C', 'D'].map(k => {
                        const val = q[`option${k}`]
                        const isCorrect = q.correctAnswer?.split(',').includes(k)
                        if (!val) return null
                        return (
                          <span key={k} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 6, background: isCorrect ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.04)', color: isCorrect ? '#4ade80' : 'var(--text-sec)', border: `1px solid ${isCorrect ? 'rgba(74,222,128,0.3)' : 'var(--glass-border)'}`, fontWeight: isCorrect ? 700 : 400 }}>
                            {k}: {val} {isCorrect ? '✓' : ''}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-sec)', whiteSpace: 'nowrap', alignSelf: 'center' }}>{q.marks} pts</div>
                </div>
              ))}
            </div>
          )}
        </motion.div>


      </div>
      <ShareLinkModal 
        isOpen={showShareModal} 
        onClose={() => setShowShareModal(false)} 
        examId={id} 
        examType="QUIZ"
        shareToken={quiz?.shareToken}
      />

      <AnimatePresence>
        {showEditModal && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)} style={{ overflowY: 'auto', alignItems: 'flex-start' }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="modal-box" style={{ margin: '40px auto', maxWidth: 500, width: '100%' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-main)' }}>Edit Quiz</h2>
                <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-sec)', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div><label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 8 }}>Title *</label>
                <input required name="title" value={editFormData.title} onChange={handleEditChange} className="input-field" placeholder="Quiz title" /></div>
                <div><label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 8 }}>Description</label>
                <textarea name="description" value={editFormData.description} onChange={handleEditChange} rows={3} className="input-field" style={{ resize: 'none' }} placeholder="Optional description" /></div>

                <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                  <button type="button" onClick={() => setShowEditModal(false)} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} disabled={savingEdit}>Cancel</button>
                  <button type="submit" disabled={savingEdit} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>{savingEdit ? <Loader2 size={16} className="spin" /> : <Check size={16} />} Update</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        {showDeleteModal && (
          <div className="modal-overlay" onClick={() => setShowDeleteModal(false)} style={{ alignItems: 'center' }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="modal-box"
              style={{ margin: 'auto', maxWidth: 400, width: '90%', padding: 24 }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Trash2 size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>Delete Quiz</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-sec)', margin: '4px 0 0' }}>This action cannot be undone.</p>
                </div>
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-main)', marginBottom: 24, lineHeight: 1.5 }}>
                Are you sure you want to permanently delete <strong>{quiz?.title}</strong>? All questions and records associated with it will be removed.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setShowDeleteModal(false)} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} disabled={deleting}>
                  Cancel
                </button>
                <button onClick={confirmDelete} style={{ flex: 1, justifyContent: 'center', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, cursor: deleting ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: deleting ? 0.7 : 1 }} disabled={deleting}>
                  {deleting ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />} 
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  )
}
