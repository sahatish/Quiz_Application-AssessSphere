import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Layout from '../../components/Layout'
import { codingApi } from '../../api/axios'
import { Code2, Search, ChevronRight } from 'lucide-react'

const diffClass = { EASY: 'badge-easy', MEDIUM: 'badge-medium', HARD: 'badge-hard' }

export default function CodingTests() {
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    codingApi.getAll().then(r => setTests(r.data.data || [])).finally(() => setLoading(false))
  }, [])

  const filtered = tests.filter(t => {
    const sMatch = t.title?.toLowerCase().includes(search.toLowerCase())
    const fMatch = filter === 'ALL' || t.difficulty === filter
    return sMatch && fMatch
  })

  return (
    <Layout title="Coding Challenges" subtitle="Sharpen your programming skills with real-world problems">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, marginBottom: 32, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: 280 }}>
          <Search size={15} color="#64748b" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search challenges..." className="input-field" style={{ paddingLeft: 40 }} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['ALL', 'EASY', 'MEDIUM', 'HARD'].map(d => (
            <button key={d} onClick={() => setFilter(d)}
              style={{ padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: `1px solid ${filter === d ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`, background: filter === d ? 'rgba(37,99,235,0.15)' : 'rgba(255,255,255,0.03)', color: filter === d ? 'var(--primary-400)' : '#94a3b8', cursor: 'pointer', transition: 'all 0.2s' }}>
              {d}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>
      : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-sec)' }}>
          <Code2 size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p>No coding challenges found.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 20 }}>
          {filtered.map((test, i) => (
            <motion.div key={test.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link to={`/student/coding/${test.id}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
                <div className="card card-lift" style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#38bdf8,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(56,189,248,0.3)' }}>
                      <Code2 size={20} color="#fff" />
                    </div>
                    <span className={`badge ${diffClass[test.difficulty] || 'badge-off'}`}>{test.difficulty}</span>
                  </div>
                  <h3 style={{ fontSize: 25, fontWeight: 800, color: 'var(--text-main)', marginBottom: 8 }}>{test.title}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.6, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{test.description}</p>
                  <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-sec)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monaco IDE</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: '#38bdf8' }}>Solve <ChevronRight size={14} /></span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </Layout>
  )
}
