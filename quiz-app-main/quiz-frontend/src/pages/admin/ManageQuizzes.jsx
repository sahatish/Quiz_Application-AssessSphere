import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../../components/Layout'
import { adminQuizApi } from '../../api/axios'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, BookOpen, HelpCircle, X, Loader2, Check, AlertTriangle, Share2 } from 'lucide-react'

function DeleteConfirmModal({ quiz, onClose, onConfirm, loading }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="modal-box" onClick={e => e.stopPropagation()}
        style={{ textAlign: 'center', maxWidth: 400 }}
      >
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Trash2 size={28} color="#f87171" />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-main)', marginBottom: 10 }}>Delete Quiz?</h2>
        <p style={{ fontSize: 14, color: 'var(--text-sec)', lineHeight: 1.65, marginBottom: 8 }}>
          You are about to permanently delete:
        </p>
        <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 16px', marginBottom: 28 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#f87171' }}>"{quiz?.title}"</span>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(248,113,113,0.7)', marginBottom: 28 }}>
          This will also delete all questions and student results for this quiz. This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onClose} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} disabled={loading}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            style={{ flex: 1, padding: '10px 16px', background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading ? <Loader2 size={15} className="spin" /> : <Trash2 size={15} />}
            {loading ? 'Deleting…' : 'Yes, Delete'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function QuizModal({ quiz, onClose, onSave }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    active: true,
    ...quiz
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        title: form.title,
        description: form.description || '',
        durationMinutes: quiz?.durationMinutes || 120,
        totalMarks: quiz?.totalMarks || 100,
        active: form.active,
      }
      if (quiz?.id) { await adminQuizApi.update(quiz.id, payload); toast.success('Quiz updated!'); }
      else { await adminQuizApi.create(payload); toast.success('Quiz created!'); }
      onSave()
    } catch (err) { toast.error(err.response?.data?.message || 'Error saving quiz') }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{ overflowY: 'auto', alignItems: 'flex-start' }}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="modal-box" style={{ margin: '40px auto', maxWidth: 500, width: '100%' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-main)' }}>{quiz?.id ? 'Edit Quiz' : 'Create Quiz'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-sec)', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div><label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 8 }}>Title *</label>
          <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input-field" placeholder="Quiz title" /></div>
          <div><label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 8 }}>Description</label>
          <textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="input-field" style={{ resize: 'none' }} placeholder="Optional description" /></div>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button type="button" onClick={onClose} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>{loading ? <Loader2 size={16} className="spin" /> : <Check size={16} />} {quiz?.id ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default function ManageQuizzes() {
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)   // quiz to delete
  const [deleting, setDeleting] = useState(false)

  const fetchQuizzes = () => adminQuizApi.getAll().then(r => setQuizzes(r.data.data || [])).finally(() => setLoading(false))
  useEffect(() => { fetchQuizzes() }, [])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await adminQuizApi.delete(deleteTarget.id)
      toast.success('Quiz deleted')
      setDeleteTarget(null)
      fetchQuizzes()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Layout title="Manage Quizzes" subtitle="Create, edit and manage all quizzes"
      action={<button onClick={() => setModal({})} className="btn-primary"><Plus size={16} /><span> New Quiz</span></button>}>
      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>
      : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 22 }}>
          {quizzes.map((quiz, i) => (
            <motion.div key={quiz.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookOpen size={24} color="var(--primary-400)" />
                </div>
                <span className={`badge ${quiz.active ? 'badge-active' : 'badge-off'}`}>{quiz.active ? 'Active' : 'Draft'}</span>
              </div>
              <Link to={`/admin/quizzes/${quiz.id}`} style={{ textDecoration: 'none' }}>
                <h3 style={{ fontSize: 25, fontWeight: 800, color: 'var(--text-main)', marginBottom: 8, cursor: 'pointer', transition: 'color 0.15s' }}
                  onMouseOver={e => e.currentTarget.style.color = 'var(--primary-400)'}
                  onMouseOut={e => e.currentTarget.style.color = 'var(--text-main)'}>{quiz.title}</h3>
              </Link>
              {quiz.description && <p style={{ fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{quiz.description}</p>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <Link to={`/admin/quizzes/${quiz.id}`} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#38bdf8', textDecoration: 'none' }}>
                  <Pencil size={14} /> Open Quiz Editor
                </Link>
              </div>
            </motion.div>
          ))}
          {quizzes.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 80, color: 'var(--text-sec)' }}><BookOpen size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} /><p>No quizzes yet</p></div>}
        </div>
      )}

      {/* Quiz create/edit modal */}
      <AnimatePresence>{modal !== null && <QuizModal quiz={modal?.id ? modal : null} onClose={() => setModal(null)} onSave={() => { setModal(null); fetchQuizzes() }} />}</AnimatePresence>

      {/* Delete confirm modal */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteConfirmModal
            quiz={deleteTarget}
            onClose={() => { if (!deleting) setDeleteTarget(null) }}
            onConfirm={handleDelete}
            loading={deleting}
          />
        )}
      </AnimatePresence>
    </Layout>
  )
}
