import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import { codingApi } from '../../api/axios'
import toast from 'react-hot-toast'
import {
  Plus, Pencil, Trash2, Code2, X, Loader2, Check,
  Share2, Eye, Calendar, Clock, Terminal, ChevronRight, LayoutGrid, List
} from 'lucide-react'


const diffColors = {
  EASY: { color: '#4ade80', background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)' },
  MEDIUM: { color: '#fbbf24', background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)' },
  HARD: { color: '#f87171', background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)' }
}

function DeleteConfirmModal({ test, onClose, onConfirm, loading }) {
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
          <span style={{ fontSize: 15, fontWeight: 700, color: '#f87171' }}>"{test?.title}"</span>
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

function CodingTestDetailModal({ test, onClose, onEdit, onDelete, onShare }) {
  const formatDate = (dt) => dt ? new Date(dt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'

  return (
    <div className="modal-overlay" onClick={onClose} style={{ overflowY: 'auto', alignItems: 'flex-start' }}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="modal-box" style={{ margin: '40px auto', maxWidth: 640, width: '95%' }} onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#38bdf8,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Code2 size={18} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-main)' }}>{test.title}</h2>
              <span style={{ 
                marginTop: 4, display: 'inline-block', padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                ...(diffColors[test.difficulty] || {})
              }}>{test.difficulty}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-sec)', cursor: 'pointer', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Description */}
          <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', marginBottom: 8 }}>Problem Description</h3>
            <div
              className="leetcode-description"
              style={{ fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.6, overflowY: 'auto', maxHeight: 200 }}
              dangerouslySetInnerHTML={{ __html: test.description || '<span style="font-style:italic;">No description provided.</span>' }}
            />
          </div>

          {/* Code Sample Inputs/Outputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: 16 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Terminal size={14} color="#38bdf8" /> Sample Input
              </h4>
              <pre style={{ margin: 0, padding: 10, background: '#0a0f1d', borderRadius: 8, fontSize: 12, color: '#f8fafc', fontFamily: 'monospace', overflowX: 'auto', minHeight: 48 }}>
                {test.sampleInput || '—'}
              </pre>
            </div>
            <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: 16 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Terminal size={14} color="#4ade80" /> Expected Output
              </h4>
              <pre style={{ margin: 0, padding: 10, background: '#0a0f1d', borderRadius: 8, fontSize: 12, color: '#f8fafc', fontFamily: 'monospace', overflowX: 'auto', minHeight: 48 }}>
                {test.sampleOutput || '—'}
              </pre>
            </div>
          </div>



          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 12, marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--glass-border)' }}>
            <button onClick={onDelete} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', marginLeft: 'auto' }}>
              <Trash2 size={14} /> Delete
            </button>
            <button onClick={onEdit} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Pencil size={14} /> Edit Problem
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function CodingModal({ test, onClose, onSave }) {
  const [form, setForm] = useState({
    title: test?.title || '', description: test?.description || '',
    sampleInput: test?.sampleInput || '', sampleOutput: test?.sampleOutput || '',
    difficulty: test?.difficulty || 'EASY',
    publicTestCases: test?.testCases?.filter(tc => !tc.isHidden) || 
      (test?.sampleInput ? [{ input: test.sampleInput, expectedOutput: test.sampleOutput, isHidden: false }] : []),
    testCases: test?.testCases?.filter(tc => tc.isHidden !== false) || [],
  })
  const [loading, setLoading] = useState(false)
  const [importQuery, setImportQuery] = useState('')
  const [importing, setImporting] = useState(false)
  const [tcTab, setTcTab] = useState('public')

  const handleImport = async () => {
    if (!importQuery.trim()) { toast.error('Please enter a LeetCode URL or Slug'); return }
    setImporting(true)
    try {
      const res = await codingApi.importLeetCode(importQuery)
      const data = res.data.data
      setForm(f => ({
        ...f,
        title: data.title || f.title,
        description: data.description || f.description,
        difficulty: data.difficulty || f.difficulty,
        sampleInput: data.publicTestCases?.[0]?.input || f.sampleInput,
        sampleOutput: data.publicTestCases?.[0]?.expectedOutput || f.sampleOutput,
        publicTestCases: (data.publicTestCases || []).map(tc => ({ input: tc.input || '', expectedOutput: tc.expectedOutput || '', isHidden: false })),
        testCases: (data.internalTestCases || []).map(tc => ({ input: tc.input || '', expectedOutput: tc.expectedOutput || '', isHidden: true })),
      }))
      toast.success(`Imported! ${(data.publicTestCases||[]).length} public · ${(data.internalTestCases||[]).length} internal test cases`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to import question')
    } finally { setImporting(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        title: form.title, description: form.description,
        sampleInput: form.sampleInput, sampleOutput: form.sampleOutput,
        difficulty: form.difficulty, 
        testCases: [
          ...(form.publicTestCases || []).map(tc => ({ ...tc, isHidden: false })),
          ...(form.testCases || []).map(tc => ({ ...tc, isHidden: true }))
        ],
      }
      if (test?.id) { await codingApi.update(test.id, payload); toast.success('Problem updated!') }
      else { await codingApi.create(payload); toast.success('Problem created!') }
      onSave()
    } catch (err) { toast.error(err.response?.data?.message || 'Error saving problem') }
    finally { setLoading(false) }
  }

  const addTc = (key) => setForm(f => ({ ...f, [key]: [...(f[key] || []), { input: '', expectedOutput: '' }] }))
  const removeTc = (key, idx) => setForm(f => ({ ...f, [key]: f[key].filter((_, i) => i !== idx) }))
  const updateTc = (key, idx, field, val) => setForm(f => {
    const arr = [...(f[key] || [])]
    arr[idx] = { ...arr[idx], [field]: val }
    return { ...f, [key]: arr }
  })

  const tcConfig = {
    public:   { key: 'publicTestCases', label: 'Public Test Cases',   icon: '👁️', color: '#38bdf8', desc: 'Visible to students — example inputs/outputs shown in the problem.' },
    internal: { key: 'testCases',       label: 'Internal Test Cases', icon: '🔒', color: '#fbbf24', desc: 'Hidden from students — used for auto-grading submissions.' },
  }
  const activeTc = tcConfig[tcTab]

  return (
    <div className="modal-overlay" onClick={onClose} style={{ overflowY: 'auto', alignItems: 'flex-start' }}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="modal-box" style={{ margin: '40px auto', maxWidth: 660 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-main)' }}>{test?.id ? 'Edit Problem' : 'Create Problem'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-sec)', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* LeetCode Import */}
          {!test?.id && (
            <div style={{ background: 'rgba(56,189,248,0.04)', border: '1px dashed rgba(56,189,248,0.25)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8' }}>Import from LeetCode</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input placeholder="e.g., https://leetcode.com/problems/two-sum/ or two-sum"
                  value={importQuery} onChange={e => setImportQuery(e.target.value)}
                  className="input-field" style={{ flex: 1, height: 40 }} />
                <button type="button" onClick={handleImport} disabled={importing} className="btn-primary"
                  style={{ height: 40, padding: '0 16px', background: 'linear-gradient(135deg, #38bdf8, #3b82f6)', border: 'none', minWidth: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {importing ? <Loader2 size={16} className="spin" /> : 'Import'}
                </button>
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-sec)' }}>Auto-fills title, description, difficulty, and test cases from LeetCode.</span>
            </div>
          )}

          {/* Title */}
          <div><label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 8 }}>Title *</label>
            <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input-field" /></div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 8 }}>Description *</label>
            <textarea
              required
              rows={6}
              placeholder="Type your problem description here, or import from LeetCode above…"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="input-field"
              style={{ resize: 'vertical', minHeight: 120, fontFamily: 'inherit', lineHeight: 1.6 }}
            />
          </div>

          {/* Sample I/O */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div><label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 8 }}>Sample Input</label>
              <textarea rows={2} value={form.sampleInput || ''} onChange={e => setForm(f => ({ ...f, sampleInput: e.target.value }))} className="input-field" style={{ resize: 'none', fontFamily: 'monospace' }} /></div>
            <div><label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 8 }}>Expected Output</label>
              <textarea rows={2} value={form.sampleOutput || ''} onChange={e => setForm(f => ({ ...f, sampleOutput: e.target.value }))} className="input-field" style={{ resize: 'none', fontFamily: 'monospace' }} /></div>
          </div>

          {/* Difficulty */}
          <div><label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 8 }}>Difficulty</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {Object.keys(diffColors).map(d => (
                <button key={d} type="button" onClick={() => setForm(f => ({ ...f, difficulty: d }))}
                  style={{ flex: 1, padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', border: form.difficulty === d ? diffColors[d].border : '1px solid var(--glass-border)', background: form.difficulty === d ? diffColors[d].background : 'var(--glass-bg)', color: form.difficulty === d ? diffColors[d].color : 'var(--text-sec)' }}>{d}</button>
              ))}
            </div>
          </div>

          {/* Test Cases — two tabs */}
          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 16 }}>
            {/* Tab bar */}
            <div style={{ display: 'flex', gap: 0, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 10, padding: 4, width: 'fit-content', marginBottom: 16 }}>
              {Object.entries(tcConfig).map(([key, cfg]) => (
                <button key={key} type="button" onClick={() => setTcTab(key)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 7, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12, transition: 'all 0.2s',
                  background: tcTab === key ? (key === 'public' ? 'linear-gradient(135deg,#38bdf8,#3b82f6)' : 'linear-gradient(135deg,#fbbf24,#f59e0b)') : 'transparent',
                  color: tcTab === key ? '#fff' : 'var(--text-sec)',
                }}>
                  {cfg.icon} {cfg.label}
                  <span style={{ background: 'rgba(255,255,255,0.25)', padding: '1px 7px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>
                    {(form[cfg.key] || []).length}
                  </span>
                </button>
              ))}
            </div>

            {/* Tab description */}
            <p style={{ fontSize: 12, color: 'var(--text-sec)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: activeTc.color }}>{activeTc.icon}</span> {activeTc.desc}
            </p>

            {/* Add button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
              <button type="button" onClick={() => addTc(activeTc.key)}
                style={{ background: 'var(--glass-bg)', border: `1px solid ${activeTc.color}33`, borderRadius: 6, padding: '4px 10px', fontSize: 11, color: activeTc.color, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Plus size={12} /> Add Test Case
              </button>
            </div>

            {/* Test case list */}
            {(form[activeTc.key] || []).length === 0 ? (
              <div style={{ padding: 16, textAlign: 'center', background: 'var(--glass-bg)', borderRadius: 8, fontSize: 12, color: 'var(--text-sec)', border: `1px dashed ${activeTc.color}44` }}>
                {tcTab === 'public' ? 'No public test cases. Import from LeetCode or add manually.' : 'No internal test cases. Import from LeetCode or add manually.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 280, overflowY: 'auto' }}>
                {(form[activeTc.key] || []).map((tc, idx) => (
                  <div key={idx} style={{ background: 'var(--glass-bg)', border: `1px solid ${activeTc.color}33`, borderRadius: 8, padding: 12, position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 10, right: 10 }}>
                      <button type="button" onClick={() => removeTc(activeTc.key, idx)}
                        style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: 'none', borderRadius: 4, padding: 4, cursor: 'pointer', display: 'flex' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: activeTc.color, display: 'block', marginBottom: 8 }}>
                      {activeTc.icon} Test Case #{idx + 1}
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label style={{ fontSize: 11, color: 'var(--text-sec)', marginBottom: 4, display: 'block' }}>Input</label>
                        <textarea rows={2} value={tc.input || ''} onChange={e => updateTc(activeTc.key, idx, 'input', e.target.value)}
                          className="input-field" style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: 11, padding: 8 }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: 'var(--text-sec)', marginBottom: 4, display: 'block' }}>Expected Output</label>
                        <textarea rows={2} value={tc.expectedOutput || ''} onChange={e => updateTc(activeTc.key, idx, 'expectedOutput', e.target.value)}
                          className="input-field" style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: 11, padding: 8 }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button type="button" onClick={onClose} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
              {loading ? <Loader2 size={16} className="spin" /> : <Check size={16} />} {test?.id ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default function AdminCodingTests() {

  const navigate = useNavigate()
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [viewMode, setViewMode] = useState('grid')

  const fetchTests = () => codingApi.getAll().then(r => setTests(r.data.data || [])).finally(() => setLoading(false))
  useEffect(() => { fetchTests() }, [])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await codingApi.delete(deleteTarget.id)
      toast.success('Problem deleted')
      setDeleteTarget(null)
      fetchTests()
    } catch {
      toast.error('Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Layout title="Coding Tests" subtitle="Manage programming challenges"
      action={
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: 4 }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{ padding: '6px 12px', background: viewMode === 'grid' ? 'var(--primary)' : 'transparent', color: viewMode === 'grid' ? '#fff' : 'var(--text-sec)', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{ padding: '6px 12px', background: viewMode === 'list' ? 'var(--primary)' : 'transparent', color: viewMode === 'list' ? '#fff' : 'var(--text-sec)', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}
              title="List View"
            >
              <List size={16} />
            </button>
          </div>
          <button onClick={() => setModal({})} className="btn-primary"><Plus size={16} /><span> New Problem</span></button>
        </div>
      }>
      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>
      : viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 20 }}>
          {tests.map((test, i) => (
            <motion.div key={test.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="card"
              style={{ padding: 24, display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
              onClick={() => navigate(`/admin/coding/${test.id}`)}
              onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(56,189,248,0.4)'}
              onMouseOut={e => e.currentTarget.style.borderColor = ''}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#38bdf8,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(56,189,248,0.3)', flexShrink: 0 }}>
                  <Code2 size={20} color="#fff" />
                </div>
                <span style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, flexShrink: 0,
                  ...(diffColors[test.difficulty] || {})
                }}>{test.difficulty}</span>
              </div>
              <h3 style={{ fontSize: 25, fontWeight: 800, color: 'var(--text-main)', marginBottom: 8 }}>{test.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.6, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {test.description ? test.description.replace(/<[^>]*>/g, '') : ''}
              </p>

            </motion.div>
          ))}
          {tests.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 80, color: 'var(--text-sec)' }}><Code2 size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} /><p>No problems yet</p></div>}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tests.map((test, i) => (
            <motion.div key={test.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="card"
              style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: 16 }}
              onClick={() => navigate(`/admin/coding/${test.id}`)}
              onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(56,189,248,0.4)'}
              onMouseOut={e => e.currentTarget.style.borderColor = ''}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#38bdf8,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Code2 size={18} color="#fff" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{test.title}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-sec)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {test.description ? test.description.replace(/<[^>]*>/g, '') : 'No description provided'}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexShrink: 0 }}>
                <span style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, flexShrink: 0,
                  ...(diffColors[test.difficulty] || {})
                }}>{test.difficulty}</span>
                <ChevronRight size={18} color="var(--text-sec)" style={{ flexShrink: 0 }} />
              </div>
            </motion.div>
          ))}
          {tests.length === 0 && <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-sec)' }}><Code2 size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} /><p>No problems yet</p></div>}
        </div>
      )}

      <AnimatePresence>{modal !== null && <CodingModal test={modal?.id ? modal : null} onClose={() => setModal(null)} onSave={() => { setModal(null); fetchTests() }} />}</AnimatePresence>
      <AnimatePresence>
        {deleteTarget && (
          <DeleteConfirmModal
            test={deleteTarget}
            onClose={() => { if (!deleting) setDeleteTarget(null) }}
            onConfirm={handleDelete}
            loading={deleting}
          />
        )}
      </AnimatePresence>
    </Layout>
  )
}
