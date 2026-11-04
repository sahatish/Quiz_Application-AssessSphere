import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Layout from '../../components/Layout'
import { adminApi } from '../../api/axios'
import Pagination from '../../components/Pagination'
import { BarChart2, Search, CheckCircle2, XCircle, Trophy, Filter } from 'lucide-react'

export default function Results() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('ALL')
  const [selectedQuiz, setSelectedQuiz] = useState('ALL')
  const [minScore, setMinScore] = useState('')
  const [maxScore, setMaxScore] = useState('')

  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  const fetchResults = (pageNum = 0) => {
    setLoading(true)
    adminApi.getResults(pageNum, 10)
      .then(r => {
        const pageData = r.data.data
        const d = (pageData.content || []).map(x => {
          const rawPct = x.totalMarks > 0 ? ((x.score || 0) / x.totalMarks) * 100 : 0;
          const percentage = Math.min(rawPct, 100);
          return { ...x, percentage, passed: percentage >= 60 };
        });
        setResults(d);
        setTotalPages(pageData.totalPages || 0)
        setTotalElements(pageData.totalElements || 0)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchResults(page) }, [page])

  const uniqueQuizzes = Array.from(new Set(results.map(r => r.quizTitle))).filter(Boolean).sort()

  const filtered = results.filter(r => {
    const sMatch = r.studentName?.toLowerCase().includes(search.toLowerCase()) || r.quizTitle?.toLowerCase().includes(search.toLowerCase())
    const fMatch = filter === 'ALL' || (filter === 'PASSED' ? r.passed : !r.passed)
    const qMatch = selectedQuiz === 'ALL' || r.quizTitle === selectedQuiz
    const minMatch = minScore === '' || r.percentage >= Number(minScore)
    const maxMatch = maxScore === '' || r.percentage <= Number(maxScore)
    return sMatch && fMatch && qMatch && minMatch && maxMatch
  }).sort((a, b) => {
    const titleA = a.quizTitle || '';
    const titleB = b.quizTitle || '';
    const titleComp = titleA.localeCompare(titleB);
    if (titleComp !== 0) return titleComp;
    return (b.percentage || 0) - (a.percentage || 0);
  })

  const avg = results.length > 0 ? (results.reduce((a, r) => a + (r.percentage || 0), 0) / results.length).toFixed(1) : '—'
  const passRate = results.length > 0 ? ((results.filter(r => r.passed).length / results.length) * 100).toFixed(0) : '—'

  return (
    <Layout title="All Results" subtitle={`Detailed student performance overview (${totalElements} total)`}>
      {/* Summary Stats */}
      <div className="results-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Attempts', val: totalElements, icon: BarChart2, color: '#2563eb', bg: '#eff6ff' },
          { label: 'Avg Score', val: avg !== '—' ? `${avg}%` : '—', icon: Trophy, color: '#38bdf8', bg: '#e0f2fe' },
          { label: 'Pass Rate', val: passRate !== '—' ? `${passRate}%` : '—', icon: CheckCircle2, color: '#16a34a', bg: '#dcfce7' },
        ].map(({ label, val, icon: Icon, color, bg }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={20} color={color} /></div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>{val}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, fontWeight: 500 }}>{label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          
          {/* Search */}
          <div className="admin-search" style={{ position: 'relative', flex: '1 1 200px' }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student or assessment..." className="input-field" style={{ paddingLeft: 40, width: '100%', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px 10px 40px', background: '#f8fafc', color: '#0f172a', fontSize: 14, outline: 'none' }} />
          </div>
          
          {/* Assessment Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={16} color="#64748b" />
            <select value={selectedQuiz} onChange={e => setSelectedQuiz(e.target.value)} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', background: '#f8fafc', color: '#0f172a', fontSize: 14, outline: 'none', cursor: 'pointer', minWidth: 160 }}>
              <option value="ALL">All Assessments</option>
              {uniqueQuizzes.map(q => <option key={q} value={q}>{q}</option>)}
            </select>
          </div>

          {/* Marks Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '4px 8px' }}>
            <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500, paddingLeft: 6 }}>Marks %:</span>
            <input type="number" placeholder="Min" value={minScore} onChange={e => setMinScore(e.target.value)} style={{ width: 60, border: 'none', background: 'transparent', padding: '6px 4px', fontSize: 14, color: '#0f172a', outline: 'none', textAlign: 'center' }} />
            <span style={{ color: '#cbd5e1' }}>-</span>
            <input type="number" placeholder="Max" value={maxScore} onChange={e => setMaxScore(e.target.value)} style={{ width: 60, border: 'none', background: 'transparent', padding: '6px 4px', fontSize: 14, color: '#0f172a', outline: 'none', textAlign: 'center' }} />
          </div>

          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: 4, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 4 }}>
            {['ALL', 'PASSED', 'FAILED'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700, border: 'none', background: filter === f ? '#fff' : 'transparent', color: filter === f ? '#2563eb' : '#64748b', boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', transition: 'all 0.2s' }}>{f}</button>
            ))}
          </div>
          
        </div>
      </div>

      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" style={{ borderColor: '#e2e8f0', borderTopColor: '#3b82f6' }} /></div>
      : (
        <div className="table-wrap" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Student', 'Email', 'Phone', 'Assessment', 'Score', '%', 'Correct', 'Status'].map(h => <th key={h} style={{ padding: '16px 20px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <motion.tr key={r.attemptId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eff6ff', color: '#2563eb', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{r.studentName?.[0]?.toUpperCase()}</div>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{r.studentName}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', color: '#64748b', fontSize: 14 }}>{r.studentEmail}</td>
                  <td style={{ padding: '16px 20px', color: '#64748b', fontSize: 14 }}>{r.studentPhone || '—'}</td>
                  <td style={{ padding: '16px 20px', color: '#64748b', fontSize: 14, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.quizTitle}</td>
                  <td style={{ padding: '16px 20px', fontFamily: 'monospace', color: '#0f172a', fontWeight: 600, fontSize: 14 }}>{r.score}/{r.totalMarks}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress-track" style={{ width: 60, height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                        <div className="progress-fill" style={{ width: `${r.percentage || 0}%`, height: '100%', background: r.passed ? '#10b981' : '#ef4444', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 13, color: r.passed ? '#10b981' : '#ef4444' }}>{r.percentage?.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', color: '#64748b', fontSize: 14 }}>
                    <span style={{ color: '#3b82f6', fontWeight: 700 }}>{r.correctAnswers != null ? r.correctAnswers : '—'}</span>
                    {r.totalQuestions != null ? <span style={{ color: '#94a3b8' }}>/{r.totalQuestions}</span> : ''}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    {r.passed 
                      ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#dcfce7', color: '#16a34a', borderRadius: 20, fontSize: 12, fontWeight: 700 }}><CheckCircle2 size={12} /> Passed</span> 
                      : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#fee2e2', color: '#ef4444', borderRadius: 20, fontSize: 12, fontWeight: 700 }}><XCircle size={12} /> Failed</span>}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div style={{ textAlign: 'center', padding: '80px 0', color: '#64748b' }}><p style={{ fontSize: 15, fontWeight: 500 }}>No results found matching your filters</p></div>}
        </div>
      )}
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </Layout>
  )
}
