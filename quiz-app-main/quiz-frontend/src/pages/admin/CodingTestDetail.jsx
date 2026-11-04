import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../../components/Layout'
import { codingApi } from '../../api/axios'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Code2, Terminal, Eye, EyeOff, Pencil, Trash2,
  Plus, Check, X, Loader2, Lock, BookOpen, Shield, ChevronDown, ChevronUp
} from 'lucide-react'

const diffColors = {
  EASY:   { color: '#4ade80', background: 'rgba(74,222,128,0.15)',  border: '1px solid rgba(74,222,128,0.3)' },
  MEDIUM: { color: '#fbbf24', background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)' },
  HARD:   { color: '#f87171', background: 'rgba(248,113,113,0.15)',border: '1px solid rgba(248,113,113,0.3)' },
}

/* ── Delete Confirmation ───────────────────────────────── */
function DeleteModal({ title, onClose, onConfirm, loading }) {
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
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-main)', marginBottom: 10 }}>Delete Problem?</h2>
        <p style={{ fontSize: 14, color: 'var(--text-sec)', marginBottom: 8 }}>You are about to permanently delete:</p>
        <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 16px', marginBottom: 28 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#f87171' }}>"{title}"</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onClose} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} disabled={loading}>Cancel</button>
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

/* ── Delete Test Case Confirmation ───────────────────────── */
function DeleteTestCaseModal({ tc, onClose, onConfirm, loading }) {
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
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-main)', marginBottom: 10 }}>Delete Test Case?</h2>
        <p style={{ fontSize: 14, color: 'var(--text-sec)', marginBottom: 16 }}>You are about to delete this test case:</p>
        <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 28, textAlign: 'left' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#f87171', marginBottom: 4, letterSpacing: '0.05em' }}>INPUT:</div>
          <div style={{ fontSize: 13, color: 'var(--text-main)', fontFamily: 'monospace', marginBottom: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{tc?.input || '—'}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#f87171', marginBottom: 4, letterSpacing: '0.05em' }}>EXPECTED OUTPUT:</div>
          <div style={{ fontSize: 13, color: 'var(--text-main)', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{tc?.expectedOutput || '—'}</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onClose} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} disabled={loading}>Cancel</button>
          <button onClick={() => onConfirm(tc)} disabled={loading}
            style={{ flex: 1, padding: '10px 16px', background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading ? <Loader2 size={15} className="spin" /> : <Trash2 size={15} />}
            {loading ? 'Deleting…' : 'Yes, Delete'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

/* ── Edit Modal ───────────────────────────────────────── */
function EditModal({ test, onClose, onSave }) {
  const [form, setForm] = useState({
    title: test.title || '',
    description: test.description || '',
    sampleInput: test.sampleInput || '',
    sampleOutput: test.sampleOutput || '',
    difficulty: test.difficulty || 'EASY',
    testCases: test.testCases || [],
  })
  const [loading, setLoading] = useState(false)
  const [descTab, setDescTab] = useState('edit')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await codingApi.update(test.id, form)
      toast.success('Problem updated!')
      onSave()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving problem')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{ overflowY: 'auto', alignItems: 'flex-start' }}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="modal-box" style={{ margin: '40px auto', maxWidth: 600 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-main)' }}>Edit Problem</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-sec)', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 8 }}>Title *</label>
            <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input-field" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-sec)' }}>Description *</label>
              <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.05)', padding: 2, borderRadius: 6 }}>
                {['edit','preview'].map(t => (
                  <button key={t} type="button" onClick={() => setDescTab(t)}
                    style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, borderRadius: 4, border: 'none', background: descTab === t ? 'var(--primary)' : 'transparent', color: descTab === t ? '#fff' : 'var(--text-sec)', cursor: 'pointer', transition: 'all 0.2s', textTransform: 'capitalize' }}>{t}</button>
                ))}
              </div>
            </div>
            {descTab === 'edit'
              ? <textarea required rows={5} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input-field" style={{ resize: 'vertical', minHeight: 120 }} />
              : <div className="leetcode-description" style={{ minHeight: 120, maxHeight: 250, overflowY: 'auto', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: '12px 16px' }} dangerouslySetInnerHTML={{ __html: form.description || '<span style="color:var(--text-sec);font-style:italic;">No description.</span>' }} />
            }
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div><label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 8 }}>Sample Input</label>
              <textarea rows={2} value={form.sampleInput || ''} onChange={e => setForm(f => ({ ...f, sampleInput: e.target.value }))} className="input-field" style={{ resize: 'none', fontFamily: 'monospace' }} /></div>
            <div><label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 8 }}>Expected Output</label>
              <textarea rows={2} value={form.sampleOutput || ''} onChange={e => setForm(f => ({ ...f, sampleOutput: e.target.value }))} className="input-field" style={{ resize: 'none', fontFamily: 'monospace' }} /></div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 8 }}>Difficulty</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {Object.keys(diffColors).map(d => (
                <button key={d} type="button" onClick={() => setForm(f => ({ ...f, difficulty: d }))}
                  style={{ flex: 1, padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', border: form.difficulty === d ? diffColors[d].border : '1px solid var(--glass-border)', background: form.difficulty === d ? diffColors[d].background : 'var(--glass-bg)', color: form.difficulty === d ? diffColors[d].color : 'var(--text-sec)' }}>{d}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button type="button" onClick={onClose} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
              {loading ? <Loader2 size={16} className="spin" /> : <Check size={16} />} Update
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

/* ── Test Case Card ───────────────────────────────────── */
function TestCaseCard({ tc, index, isInternal, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(true)
  const [isEditing, setIsEditing] = useState(false)

  if (isEditing) {
    return (
      <AddTestCaseForm 
        isInternal={isInternal} 
        initialInput={tc.input} 
        initialOutput={tc.expectedOutput}
        onAdd={(updatedTc) => {
          onUpdate(tc, updatedTc)
          setIsEditing(false)
        }}
        onCancel={() => setIsEditing(false)}
      />
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}
      style={{ background: 'var(--glass-bg)', border: `1px solid ${isInternal ? 'rgba(251,191,36,0.2)' : 'rgba(56,189,248,0.2)'}`, borderRadius: 12, overflow: 'hidden' }}
    >
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', color: 'var(--text-main)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: isInternal ? '#fbbf24' : '#38bdf8', background: isInternal ? 'rgba(251,191,36,0.1)' : 'rgba(56,189,248,0.1)', padding: '3px 10px', borderRadius: 20 }}>
            {isInternal ? '🔒' : '👁️'} Test Case #{index + 1}
          </span>
          <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
            <button onClick={(e) => { e.stopPropagation(); setIsEditing(true) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-sec)', display: 'flex', alignItems: 'center' }} title="Edit Test Case"><Pencil size={14} /></button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(tc) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#ef4444', display: 'flex', alignItems: 'center' }} title="Delete Test Case"><Trash2 size={14} /></button>
          </div>
        </div>
        <button onClick={() => setExpanded(e => !e)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4 }}>
          {expanded ? <ChevronUp size={16} color="var(--text-sec)" /> : <ChevronDown size={16} color="var(--text-sec)" />}
        </button>
      </div>
      {expanded && (
        <div style={{ padding: '0 16px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sec)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Terminal size={12} color="#38bdf8" /> INPUT
            </p>
            <pre style={{ margin: 0, padding: 12, background: '#0a0f1d', borderRadius: 8, fontSize: 12, color: '#f8fafc', fontFamily: 'monospace', overflowX: 'auto', minHeight: 40, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {tc.input || '—'}
            </pre>
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sec)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Terminal size={12} color="#4ade80" /> EXPECTED OUTPUT
            </p>
            <pre style={{ margin: 0, padding: 12, background: '#0a0f1d', borderRadius: 8, fontSize: 12, color: '#f8fafc', fontFamily: 'monospace', overflowX: 'auto', minHeight: 40, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {tc.expectedOutput || '—'}
            </pre>
          </div>
        </div>
      )}
    </motion.div>
  )
}

/* ── Inline Add Test Case Form ───────────────────────── */
function AddTestCaseForm({ isInternal, onAdd, onCancel, initialInput = '', initialOutput = '' }) {
  const [input, setInput] = useState(initialInput)
  const [expectedOutput, setExpectedOutput] = useState(initialOutput)
  const color = isInternal ? '#fbbf24' : '#38bdf8'
  const isEditing = initialInput !== '' || initialOutput !== ''
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      style={{ border: `1px dashed ${color}55`, borderRadius: 12, padding: 16, background: `${isInternal ? 'rgba(251,191,36,' : 'rgba(56,189,248,'}0.04)` }}>
      <p style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 12 }}>
        {isInternal ? '🔒' : '👁️'} {isEditing ? 'Edit Test Case' : 'New Test Case'}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-sec)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Input</label>
          <textarea rows={3} value={input} onChange={e => setInput(e.target.value)}
            placeholder="Enter test case input…"
            className="input-field" style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: 12, padding: 10 }} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-sec)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Expected Output</label>
          <textarea rows={3} value={expectedOutput} onChange={e => setExpectedOutput(e.target.value)}
            placeholder="Enter expected output…"
            className="input-field" style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: 12, padding: 10 }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} className="btn-ghost" style={{ padding: '6px 14px', fontSize: 12 }}>Cancel</button>
        <button
          onClick={() => { if (input.trim() || expectedOutput.trim()) onAdd({ input: input.trim(), expectedOutput: expectedOutput.trim() }) }}
          style={{ padding: '6px 14px', fontSize: 12, fontWeight: 700, background: isInternal ? 'linear-gradient(135deg,#fbbf24,#f59e0b)' : 'linear-gradient(135deg,#38bdf8,#3b82f6)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Check size={13} /> Save Test Case
        </button>
      </div>
    </motion.div>
  )
}

/* ── Main Page ────────────────────────────────────────── */
export default function CodingTestDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [test, setTest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [activeSection, setActiveSection] = useState('public')
  const [addingPublic, setAddingPublic] = useState(false)
  const [addingInternal, setAddingInternal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testCaseToDelete, setTestCaseToDelete] = useState(null)

  const fetchTest = async () => {
    try {
      const res = await codingApi.adminGetById(id)
      setTest(res.data.data)
    } catch {
      toast.error('Failed to load coding problem')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTest() }, [id])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await codingApi.delete(id)
      toast.success('Problem deleted')
      navigate('/admin/coding')
    } catch {
      toast.error('Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  const saveTestCase = async (newTc, section) => {
    setSaving(true)
    try {
      const isInternal = section === 'internal'
      const payload = { 
        testCases: [...(test.testCases || []), { ...newTc, isHidden: isInternal }] 
      }
      
      // Keep sampleInput synced for the first public test case if it's not set
      if (!isInternal && !test.sampleInput) {
        payload.sampleInput = newTc.input
        payload.sampleOutput = newTc.expectedOutput
      }

      await codingApi.update(id, payload)
      toast.success('Test case saved!')
      setAddingPublic(false)
      setAddingInternal(false)
      fetchTest()
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save test case')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const updateTestCase = async (originalTc, updatedTc) => {
    const newTestCases = [...(test.testCases || [])]
    const idx = newTestCases.findIndex(t => 
      t.input === originalTc.input && 
      t.expectedOutput === originalTc.expectedOutput && 
      t.isHidden === originalTc.isHidden
    )
    
    const payload = { testCases: newTestCases }

    if (idx !== -1) {
      newTestCases[idx] = { ...updatedTc, isHidden: originalTc.isHidden }
    } else {
      newTestCases.push({ ...updatedTc, isHidden: originalTc.isHidden })
    }

    if (!originalTc.isHidden && originalTc.input === test.sampleInput) {
      payload.sampleInput = updatedTc.input
      payload.sampleOutput = updatedTc.expectedOutput
    }

    setSaving(true)
    try {
      await codingApi.update(id, payload)
      toast.success('Test case updated')
      fetchTest()
    } catch (err) {
      toast.error('Failed to update test case')
    } finally {
      setSaving(false)
    }
  }

  const deleteTestCase = async (tcToDelete) => {
    
    const newTestCases = (test.testCases || []).filter(t => 
      !(t.input === tcToDelete.input && 
        t.expectedOutput === tcToDelete.expectedOutput && 
        t.isHidden === tcToDelete.isHidden)
    )

    setSaving(true)
    try {
      await codingApi.update(id, { testCases: newTestCases })
      toast.success('Test case deleted')
      setTestCaseToDelete(null)
      fetchTest()
    } catch (err) {
      toast.error('Failed to delete test case')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <Layout title="Loading…">
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>
    </Layout>
  )

  if (!test) return (
    <Layout title="Not Found">
      <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-sec)' }}>Problem not found.</div>
    </Layout>
  )

  const publicTc  = test.testCases?.filter(tc => !tc.isHidden) || 
    (test.sampleInput ? [{ input: test.sampleInput, expectedOutput: test.sampleOutput, isHidden: false }] : [])
  const internalTc = test.testCases?.filter(tc => tc.isHidden !== false) || []

  return (
    <Layout
      title={test.title}
      subtitle={`Coding Problem  ·  ${test.difficulty}`}
      action={
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/admin/coding')} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 13 }}>
            <ArrowLeft size={14} /> Back
          </button>
          <button onClick={() => setShowEdit(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 13 }}>
            <Pencil size={14} /> Edit
          </button>
          <button onClick={() => setShowDelete(true)}
            style={{ padding: '8px 12px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      }
    >
      {/* ── Meta Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Difficulty', value: test.difficulty, icon: <Code2 size={16} color={diffColors[test.difficulty]?.color || '#fff'} />, accent: diffColors[test.difficulty]?.color },
          { label: 'Public Test Cases', value: `${publicTc.length} case`, icon: <Eye size={16} color="#38bdf8" />, accent: '#38bdf8' },
          { label: 'Internal Test Cases', value: `${internalTc.length} case${internalTc.length !== 1 ? 's' : ''}`, icon: <Lock size={16} color="#fbbf24" />, accent: '#fbbf24' },
          { label: 'Total Test Cases', value: publicTc.length + internalTc.length, icon: <Shield size={16} color="#a78bfa" />, accent: '#a78bfa' },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {stat.icon}
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sec)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{stat.label}</span>
            </div>
            <span style={{ fontSize: 22, fontWeight: 800, color: stat.accent || 'var(--text-main)' }}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* ── Main Two-Column Layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        {/* Problem Description */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <BookOpen size={18} color="var(--primary-400)" />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)' }}>Problem Description</h2>
            <span style={{ marginLeft: 'auto', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, ...(diffColors[test.difficulty] || {}) }}>{test.difficulty}</span>
          </div>
          <div
            className="leetcode-description"
            style={{ fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.7, maxHeight: 420, overflowY: 'auto' }}
            dangerouslySetInnerHTML={{ __html: test.description || '<span style="font-style:italic;">No description provided.</span>' }}
          />
        </div>

        {/* Sample I/O */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Terminal size={18} color="#38bdf8" />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)' }}>Sample I/O</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Terminal size={12} /> INPUT
              </p>
              <pre style={{ margin: 0, padding: 14, background: '#0a0f1d', borderRadius: 10, fontSize: 13, color: '#f8fafc', fontFamily: 'monospace', overflowX: 'auto', minHeight: 60, whiteSpace: 'pre-wrap' }}>
                {test.sampleInput || '—'}
              </pre>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Terminal size={12} /> EXPECTED OUTPUT
              </p>
              <pre style={{ margin: 0, padding: 14, background: '#0a0f1d', borderRadius: 10, fontSize: 13, color: '#f8fafc', fontFamily: 'monospace', overflowX: 'auto', minHeight: 60, whiteSpace: 'pre-wrap' }}>
                {test.sampleOutput || '—'}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* ── Test Cases Section ── */}
      <div className="card" style={{ padding: 24 }}>
        {/* Section Toggle Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: 4, width: 'fit-content' }}>
          <button
            onClick={() => setActiveSection('public')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, transition: 'all 0.2s',
              background: activeSection === 'public' ? 'linear-gradient(135deg,#38bdf8,#3b82f6)' : 'transparent',
              color: activeSection === 'public' ? '#fff' : 'var(--text-sec)',
              boxShadow: activeSection === 'public' ? '0 4px 12px rgba(56,189,248,0.3)' : 'none',
            }}
          >
            <Eye size={16} /> Public Test Cases
            <span style={{ background: activeSection === 'public' ? 'rgba(255,255,255,0.25)' : 'var(--glass-bg)', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{publicTc.length}</span>
          </button>
          <button
            onClick={() => setActiveSection('internal')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, transition: 'all 0.2s',
              background: activeSection === 'internal' ? 'linear-gradient(135deg,#fbbf24,#f59e0b)' : 'transparent',
              color: activeSection === 'internal' ? '#fff' : 'var(--text-sec)',
              boxShadow: activeSection === 'internal' ? '0 4px 12px rgba(251,191,36,0.3)' : 'none',
            }}
          >
            <Lock size={16} /> Internal Test Cases
            <span style={{ background: activeSection === 'internal' ? 'rgba(255,255,255,0.25)' : 'var(--glass-bg)', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{internalTc.length}</span>
          </button>
        </div>

        {/* Public Section */}
        {activeSection === 'public' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Eye size={18} color="#38bdf8" />
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', marginBottom: 2 }}>Student-Visible Test Cases</h3>
                <p style={{ fontSize: 12, color: 'var(--text-sec)' }}>These are shown to students in the problem description so they can verify their logic before submitting.</p>
              </div>
              <button
                onClick={() => { setAddingPublic(v => !v); setAddingInternal(false) }}
                style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', fontSize: 12, fontWeight: 700, background: addingPublic ? 'rgba(56,189,248,0.1)' : 'linear-gradient(135deg,#38bdf8,#3b82f6)', color: addingPublic ? '#38bdf8' : '#fff', border: addingPublic ? '1px solid #38bdf8' : 'none', borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s' }}>
                {addingPublic ? <X size={13} /> : <Plus size={13} />} {addingPublic ? 'Cancel' : 'Add Test Case'}
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {publicTc.map((tc, i) => <TestCaseCard key={i} tc={tc} index={i} isInternal={false} onUpdate={updateTestCase} onDelete={(tc) => setTestCaseToDelete(tc)} />)}
              <AnimatePresence>
                {addingPublic && (
                  <AddTestCaseForm isInternal={false}
                    onAdd={tc => saveTestCase(tc, 'public')}
                    onCancel={() => setAddingPublic(false)} />
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Internal Section */}
        {activeSection === 'internal' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Lock size={18} color="#fbbf24" />
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', marginBottom: 2 }}>Internal Evaluation Test Cases</h3>
                <p style={{ fontSize: 12, color: 'var(--text-sec)' }}>These are <strong style={{ color: '#fbbf24' }}>hidden from students</strong> and used by the system to auto-grade submissions.</p>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 8, padding: '6px 12px' }}>
                  <Lock size={13} color="#fbbf24" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24' }}>Hidden from students</span>
                </div>
                <button
                  onClick={() => { setAddingInternal(v => !v); setAddingPublic(false) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', fontSize: 12, fontWeight: 700, background: addingInternal ? 'rgba(251,191,36,0.1)' : 'linear-gradient(135deg,#fbbf24,#f59e0b)', color: addingInternal ? '#fbbf24' : '#fff', border: addingInternal ? '1px solid #fbbf24' : 'none', borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s' }}>
                  {addingInternal ? <X size={13} /> : <Plus size={13} />} {addingInternal ? 'Cancel' : 'Add Test Case'}
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {internalTc.length === 0 && !addingInternal && (
                <div style={{ textAlign: 'center', padding: '40px 24px', background: 'rgba(251,191,36,0.04)', border: '1px dashed rgba(251,191,36,0.2)', borderRadius: 12 }}>
                  <Lock size={32} color="rgba(251,191,36,0.3)" style={{ margin: '0 auto 12px' }} />
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 4 }}>No internal test cases yet</p>
                  <p style={{ fontSize: 13, color: 'var(--text-sec)', opacity: 0.7 }}>Click <strong style={{ color: '#fbbf24' }}>Add Test Case</strong> above to add grading cases.</p>
                </div>
              )}
              {internalTc.map((tc, i) => <TestCaseCard key={i} tc={tc} index={i} isInternal={true} onUpdate={updateTestCase} onDelete={(tc) => setTestCaseToDelete(tc)} />)}
              <AnimatePresence>
                {addingInternal && (
                  <AddTestCaseForm isInternal={true}
                    onAdd={tc => saveTestCase(tc, 'internal')}
                    onCancel={() => setAddingInternal(false)} />
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showEdit && <EditModal test={test} onClose={() => setShowEdit(false)} onSave={() => { setShowEdit(false); fetchTest() }} />}
      </AnimatePresence>
      <AnimatePresence>
        {showDelete && <DeleteModal title={test.title} onClose={() => { if (!deleting) setShowDelete(false) }} onConfirm={handleDelete} loading={deleting} />}
      </AnimatePresence>
      <AnimatePresence>
        {testCaseToDelete && <DeleteTestCaseModal tc={testCaseToDelete} onClose={() => { if (!saving) setTestCaseToDelete(null) }} onConfirm={deleteTestCase} loading={saving} />}
      </AnimatePresence>
    </Layout>
  )
}
