import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Layout from '../../components/Layout'
import { adminApi, adminApi as api } from '../../api/axios'
import { adminApi as adminApiObj } from '../../api/axios'
import { ArrowLeft, Mail, Trophy, CheckCircle2, XCircle, Clock, BarChart2, Award, Phone } from 'lucide-react'
import { adminApi as aApi } from '../../api/axios'

export default function AdminStudentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [student, setStudent] = useState(null)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      adminApiObj.getStudents(),
      adminApiObj.getStudentResults(id)
    ]).then(([studentsRes, resultsRes]) => {
      const all = studentsRes.data.data || []
      setStudent(all.find(s => String(s.id) === String(id)) || null)
      setResults(resultsRes.data.data || [])
    }).finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <Layout title="Student Detail" subtitle="">
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>
    </Layout>
  )

  if (!student) return (
    <Layout title="Student Detail" subtitle="">
      <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-sec)' }}>Student not found.</div>
    </Layout>
  )

  const submitted = results.filter(r => r.status === 'SUBMITTED')
  const avgScore = submitted.length > 0
    ? Math.round(submitted.reduce((s, r) => s + (r.totalMarks > 0 ? (r.score / r.totalMarks) * 100 : 0), 0) / submitted.length)
    : 0
  const passed = submitted.filter(r => r.totalMarks > 0 && (r.score / r.totalMarks) >= 0.5).length

  return (
    <Layout
      title={student.name}
      subtitle={`Student profile & quiz history`}
      action={
        <button onClick={() => navigate('/admin/students')} className="btn-ghost">
          <ArrowLeft size={16} /> Back to Students
        </button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: 28, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,var(--primary),var(--primary-400))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 28, fontWeight: 800, flexShrink: 0 }}>
            {student.name?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-main)', marginBottom: 4 }}>{student.name}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-sec)', fontSize: 14 }}>
                <Mail size={14} /> {student.email}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-sec)', fontSize: 14 }}>
                <Phone size={14} /> {student.phone || 'No phone'}
              </div>
            </div>
          </div>
          <span className="badge badge-student" style={{ fontSize: 13, padding: '6px 14px' }}>{student.role}</span>
        </motion.div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 16 }}>
          {[
            { label: 'Total Attempts', val: results.length, icon: BarChart2, color: 'var(--primary)' },
            { label: 'Completed', val: submitted.length, icon: CheckCircle2, color: '#4ade80' },
            { label: 'Avg Score', val: `${avgScore}%`, icon: Trophy, color: '#f59e0b' },
            { label: 'Passed', val: passed, icon: Award, color: '#38bdf8' },
          ].map(({ label, val, icon: Icon, color }) => (
            <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: '20px 24px', textAlign: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Icon size={22} color={color} />
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-main)' }}>{val}</div>
              <div style={{ fontSize: 12, color: 'var(--text-sec)', marginTop: 4 }}>{label}</div>
            </motion.div>
          ))}
        </div>

        {/* Attempt History */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)', marginBottom: 20 }}>Quiz Attempt History</h2>
          {results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-sec)' }}>
              <BarChart2 size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p>No attempts yet</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    {['#', 'Quiz', 'Score', 'Percentage', 'Status', 'Submitted At'].map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => {
                    const pct = r.totalMarks > 0 ? Math.round((r.score / r.totalMarks) * 100) : 0
                    const passed = pct >= 50
                    return (
                      <motion.tr key={r.attemptId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                        <td style={{ color: 'var(--text-sec)' }}>{i + 1}</td>
                        <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{r.quizTitle}</td>
                        <td>
                          <span style={{ fontWeight: 700, color: 'var(--primary-400)' }}>{r.score ?? '—'}</span>
                          <span style={{ color: 'var(--text-sec)', fontSize: 12 }}> / {r.totalMarks}</span>
                        </td>
                        <td>
                          {r.status === 'SUBMITTED' ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ flex: 1, height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.08)', maxWidth: 80 }}>
                                <div style={{ height: '100%', borderRadius: 4, width: `${pct}%`, background: pct >= 70 ? '#4ade80' : pct >= 50 ? '#f59e0b' : '#f87171' }} />
                              </div>
                              <span style={{ fontSize: 13, fontWeight: 700, color: pct >= 70 ? '#4ade80' : pct >= 50 ? '#f59e0b' : '#f87171' }}>{pct}%</span>
                            </div>
                          ) : '—'}
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                            background: r.status === 'SUBMITTED' ? (passed ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)') : 'rgba(251,191,36,0.12)',
                            color: r.status === 'SUBMITTED' ? (passed ? '#4ade80' : '#f87171') : '#fbbf24',
                          }}>
                            {r.status === 'SUBMITTED'
                              ? (passed ? <><CheckCircle2 size={11} /> Passed</> : <><XCircle size={11} /> Failed</>)
                              : <><Clock size={11} /> In Progress</>}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-sec)', fontSize: 13 }}>
                          {r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '—'}
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  )
}
