import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import { adminApi } from '../../api/axios'
import Pagination from '../../components/Pagination'
import toast from 'react-hot-toast'
import { Users, Search, Mail, ChevronRight, BarChart2, Trash2, Loader2, AlertTriangle } from 'lucide-react'

export default function Students() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState(null)
  const navigate = useNavigate()

  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  const fetchStudents = (pageNum = 0) => {
    setLoading(true)
    adminApi.getStudents(pageNum, 10, search)
      .then(r => {
        const pageData = r.data.data
        setStudents(pageData.content || [])
        setTotalPages(pageData.totalPages || 0)
        setTotalElements(pageData.totalElements || 0)
      })
      .finally(() => setLoading(false))
  }

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(0)
      fetchStudents(0)
    }, 300)
    return () => clearTimeout(handler)
  }, [search])

  useEffect(() => { 
    fetchStudents(page) 
  }, [page])

  const [studentToDelete, setStudentToDelete] = useState(null)

  const confirmDelete = (e, student) => {
    e.stopPropagation()
    setStudentToDelete(student)
  }

  const executeDelete = async () => {
    if (!studentToDelete) return
    setDeleting(studentToDelete.id)
    try {
      await adminApi.deleteStudent(studentToDelete.id)
      toast.success('Student deleted')
      setStudents(prev => prev.filter(s => s.id !== studentToDelete.id))
      setStudentToDelete(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete student')
    } finally {
      setDeleting(null)
    }
  }


  return (
    <Layout title="Students" subtitle={`${totalElements} registered accounts`}>
      <div className="admin-search" style={{ position: 'relative', width: 300, marginBottom: 24 }}>
        <Search size={15} color="#64748b" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email..." className="input-field" style={{ paddingLeft: 40, width: '100%' }} />
      </div>

      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>
      : (
        <>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                {['#', 'Name', 'Email', 'Phone', 'Role', 'Actions'].map(h => (
                  <th key={h} className={['Phone','Role'].includes(h) ? 'col-hide-mobile' : ''}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/admin/students/${s.id}`)}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(37,99,235,0.04)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ color: 'var(--text-sec)' }}>{i + 1 + page * 10}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,var(--primary),var(--primary-400))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                        {s.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                        <div className="col-show-mobile" style={{ fontSize: 12, color: 'var(--text-sec)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="col-hide-mobile"><div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-sec)' }}><Mail size={14} /> {s.email}</div></td>
                  <td className="col-hide-mobile" style={{ color: 'var(--text-sec)', fontSize: 13 }}>{s.phone || '—'}</td>
                  <td className="col-hide-mobile"><span className={`badge ${s.role === 'ADMIN' ? 'badge-admin' : 'badge-student'}`}>{s.role}</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={e => e.stopPropagation()}>
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/admin/students/${s.id}`) }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', color: '#38bdf8', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                      >
                        <BarChart2 size={13} /> View <ChevronRight size={13} />
                      </button>
                      <button
                        onClick={e => confirmDelete(e, s)}
                        disabled={deleting === s.id}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                      >
                        {deleting === s.id ? <Loader2 size={13} className="spin" /> : <Trash2 size={13} />}
                        {deleting === s.id ? '' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {students.length === 0 && <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-sec)' }}><Users size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} /><p>No students found</p></div>}
        </div>
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </>
      )}

      <AnimatePresence>
        {studentToDelete && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="card" style={{ padding: 24, width: 400, maxWidth: '90%' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ padding: 10, background: 'rgba(239,68,68,0.1)', borderRadius: '50%', color: '#ef4444' }}>
                  <AlertTriangle size={24} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)' }}>Delete Student</h3>
              </div>
              <p style={{ color: 'var(--text-sec)', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
                Are you sure you want to delete <strong>{studentToDelete.name}</strong>? This will permanently erase their account and all associated attempts. This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setStudentToDelete(null)} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} disabled={deleting}>Cancel</button>
                <button onClick={executeDelete} className="btn-primary" style={{ flex: 1, justifyContent: 'center', background: '#ef4444', color: '#fff', border: 'none' }} disabled={deleting}>
                  {deleting ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />} Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  )
}
