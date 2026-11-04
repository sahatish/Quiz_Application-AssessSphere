import { useEffect, useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import Layout from '../../components/Layout'
import { adminApi } from '../../api/axios'
import { BookOpen, Users, HelpCircle, Activity, TrendingUp, Trophy, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'

const CHART_STYLE = { background: 'var(--bg-main)', border: '1px solid rgba(37,99,235,0.25)', borderRadius: 10, color: 'var(--text-main)', fontSize: 12, padding: '8px 12px' }
const BAR_COLORS = [
  { base: 'var(--primary)', light: 'var(--primary-400)' },
  { base: '#06b6d4', light: '#67e8f9' },
  { base: '#f59e0b', light: '#fcd34d' },
  { base: '#ef4444', light: '#fca5a5' },
  { base: '#10b981', light: '#6ee7b7' },
  { base: '#f97316', light: '#fdba74' },
  { base: '#3b82f6', light: '#93c5fd' },
]

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const pollingRef = useRef(null)

  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true)
    try {
      const [s, r] = await Promise.all([adminApi.getStats(), adminApi.getResults()])
      setStats(s.data.data)
      setResults(r.data.data?.content || [])
      setLastUpdated(new Date())
    } catch {
      // silent on background poll
    } finally {
      if (isManual) setRefreshing(false)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    // Poll every 15 seconds automatically
    pollingRef.current = setInterval(() => fetchData(), 15000)
    // Refresh when user switches back to this tab
    const onVisible = () => { if (!document.hidden) fetchData() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(pollingRef.current)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [fetchData])

  const statCards = stats ? [
    { label: 'Assessments',  val: stats.totalAssessments, icon: BookOpen,   color: 'var(--primary)', bg: 'rgba(37,99,235,0.1)',  border: 'rgba(37,99,235,0.2)'  },
    { label: 'Students',     val: stats.totalStudents,    icon: Users,      color: '#38bdf8', bg: 'rgba(56,189,248,0.1)',   border: 'rgba(56,189,248,0.2)'  },
    { label: 'Questions',    val: stats.totalQuestions,   icon: HelpCircle, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.2)'  },
    { label: 'Attempts',     val: stats.totalAttempts,    icon: Activity,   color: '#4ade80', bg: 'rgba(74,222,128,0.1)', border: 'rgba(74,222,128,0.2)'  },
  ] : []

  const processedResults = results.map(r => {
    const rawPct = r.totalMarks > 0 ? ((r.score || 0) / r.totalMarks) * 100 : 0;
    const percentage = Math.min(rawPct, 100);
    return { ...r, percentage, passed: percentage >= 60 };
  });

  const barData = processedResults.reduce((acc, r) => {
    const k = r.quizTitle?.slice(0, 14) || 'Quiz'
    const e = acc.find(a => a.name === k)
    if (e) { e.sum += r.percentage; e.cnt++ } else acc.push({ name: k, sum: r.percentage, cnt: 1 })
    return acc
  }, []).map(a => ({ name: a.name, avg: Math.round(a.sum / a.cnt) })).slice(0, 7)

  const passedCount = processedResults.filter(r => r.passed).length
  const failedCount = processedResults.length - passedCount
  const pieData = [{ name: 'Passed', value: passedCount }, { name: 'Failed', value: failedCount }].filter(d => d.value > 0)

  if (loading) return <Layout title="Dashboard"><div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div></Layout>

  return (
    <Layout title="Admin Dashboard" subtitle="Platform-wide analytics & overview">
      {/* Stat cards */}
      <div className="dash-stat-grid">
        {statCards.map(({ label, val, icon: Icon, color, bg, border }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            style={{ background: bg, border: `1px solid ${border}`, borderRadius: 16, padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={19} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--text-main)' }}>{val}</div>
              <div style={{ fontSize: 13.5, color: 'var(--text-sec)', marginTop: 2 }}>{label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="dash-chart-grid">
        {/* Bar Chart */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
          style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: '24px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(37,99,235,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={16} color="var(--primary-400)" />
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-main)' }}>Average Score by Quiz</div>
              <div style={{ fontSize: 13, color: 'var(--text-sec)', marginTop: 2 }}>Based on all recorded attempts</div>
            </div>
          </div>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barData} barSize={28} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                <defs>
                  {barData.map((_, i) => {
                    const c = BAR_COLORS[i % BAR_COLORS.length]
                    return (
                      <linearGradient key={i} id={`bar-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={c.light} stopOpacity={1} />
                        <stop offset="100%" stopColor={c.base} stopOpacity={0.9} />
                      </linearGradient>
                    )
                  })}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-sec)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-sec)', fontSize: 11 }} domain={[0, 100]} unit="%" axisLine={false} tickLine={false} />
                <Tooltip contentStyle={CHART_STYLE} formatter={v => [`${v}%`, 'Avg Score']} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="avg" radius={[8, 8, 0, 0]}>
                  {barData.map((_, i) => (
                    <Cell key={i} fill={`url(#bar-grad-${i})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240, color: 'var(--text-sec)', fontSize: 13 }}>No data yet</div>}
          {/* Color legend */}
          {barData.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginTop: 16 }}>
              {barData.map((d, i) => {
                const c = BAR_COLORS[i % BAR_COLORS.length]
                return (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: c.base, flexShrink: 0 }} />
                    <span style={{ fontSize: 11.5, color: 'var(--text-sec)' }}>{d.name}</span>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* Pie Chart */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: '24px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(56,189,248,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trophy size={16} color="#38bdf8" />
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-main)' }}>Pass / Fail Rate</div>
              <div style={{ fontSize: 13, color: 'var(--text-sec)', marginTop: 2 }}>All attempts</div>
            </div>
          </div>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={70} dataKey="value" strokeWidth={0} paddingAngle={3}>
                    {pieData.map((_, i) => <Cell key={i} fill={i === 0 ? '#4ade80' : '#f87171'} />)}
                  </Pie>
                  <Tooltip contentStyle={CHART_STYLE} formatter={(v, n) => [v, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                {pieData.map((d, i) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: i === 0 ? '#4ade80' : '#f87171' }} />
                      <span style={{ color: 'var(--text-sec)' }}>{d.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{d.value}</span>
                      <span style={{ color: 'var(--text-sec)', fontSize: 11 }}>({Math.round(d.value / pieData.reduce((s,x) => s+x.value, 0) * 100)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-sec)', fontSize: 13 }}>No results yet</div>}
        </motion.div>
      </div>

      {/* Recent results table */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="table-wrap">
        <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>Recent Attempts</span>
            <span style={{ fontSize: 12, color: 'var(--text-sec)', background: 'var(--glass-bg)', padding: '3px 10px', borderRadius: 20, border: '1px solid var(--glass-border)' }}>
              {results.length} total
            </span>
            {refreshing && (
              <span style={{ fontSize: 11, color: 'var(--primary-400)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <RefreshCw size={11} style={{ animation: 'spin 0.8s linear infinite' }} /> Updating…
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {lastUpdated && (
              <span style={{ fontSize: 11, color: 'var(--text-sec)' }}>
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.25)', color: 'var(--primary-400)', fontSize: 12, fontWeight: 600, cursor: refreshing ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: refreshing ? 0.6 : 1 }}
            >
              <RefreshCw size={13} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
              Refresh
            </button>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>{['Student', 'Phone', 'Quiz', 'Score', '%', 'Status'].map(h => <th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {processedResults.slice(0, 8).map(r => (
              <tr key={r.attemptId}>
                <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,var(--primary),var(--primary-400))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {r.studentName?.[0]?.toUpperCase()}
                  </div>
                  <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{r.studentName}</span>
                </div></td>
                <td style={{ color: 'var(--text-sec)', fontSize: 13 }}>{r.studentPhone || '—'}</td>
                <td style={{ color: 'var(--text-sec)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.quizTitle}</td>
                <td style={{ fontFamily: 'monospace', color: 'var(--text-sec)' }}>{r.score || 0}/{r.totalMarks}</td>
                <td><span style={{ fontWeight: 700 }} className="grad">{r.percentage?.toFixed(1)}%</span></td>
                <td>{r.passed
                  ? <span className="badge badge-easy"><CheckCircle2 size={10} style={{ marginRight: 4 }} />Passed</span>
                  : <span className="badge badge-hard"><XCircle size={10} style={{ marginRight: 4 }} />Failed</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {processedResults.length === 0 && <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-sec)', fontSize: 13 }}>No attempts recorded yet</div>}
      </motion.div>
    </Layout>
  )
}
