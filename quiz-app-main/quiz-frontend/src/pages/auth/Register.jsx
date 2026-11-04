import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { authApi } from '../../api/axios'
import logo from '../../assets/logo.png'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { Zap, Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2, GraduationCap, ShieldCheck, BarChart3 } from 'lucide-react'

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'STUDENT' })
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [confirmPw, setConfirmPw] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  const passwordStrength = (pw) => {
    if (!pw) return 0
    let score = 0
    if (pw.length >= 8) score++
    if (/[A-Z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[^A-Za-z0-9]/.test(pw)) score++
    return Math.min(score, 4)
  }

  const strength = passwordStrength(form.password)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    if (form.password !== confirmPw) {
      toast.error('Passwords do not match')
      setLoading(false)
      return
    }
    if (!acceptedTerms) {
      toast.error('Please accept terms and conditions')
      setLoading(false)
      return
    }
    try {
      const res = await authApi.register(form)
      const data = res.data.data
      login(data)
      toast.success(`Welcome to AssessSphere, ${data.name}!`)
      navigate(data.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard', { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell auth-layout" style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <div className="auth-card" style={{ display: 'flex', borderRadius: 28, overflow: 'hidden', boxShadow: '0 30px 80px rgba(13,20,48,0.12)', width: 'calc(100% - 48px)', maxWidth: 1120 }}>
        <div className="auth-panel" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 56, position: 'relative', overflow: 'hidden' }}>
          <motion.div initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} style={{ maxWidth: 520 }}>
          <img src={logo} alt="AssessSphere" style={{ width: 84, height: 84, borderRadius: 18, boxShadow: '0 26px 64px rgba(37,99,235,0.12)', marginBottom: 10 }} />
          <h2 style={{ fontSize: 32, fontWeight: 900, color: '#fff', marginBottom: 8 }}>Start building modern assessments</h2>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16, lineHeight: 1.8, marginBottom: 18 }}>Create quizzes, coding challenges, and track performance with a smooth classroom workflow.</p>

          <div style={{ display: 'grid', gap: 12 }}>
            <div className="auth-feature-card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <GraduationCap size={18} color="#fff" />
              <div>
                <div style={{ fontWeight: 800, color: '#fff' }}>Achievement badges</div>
                <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>Recognize student progress and milestones.</div>
              </div>
            </div>
            <div className="auth-feature-card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <BarChart3 size={18} color="#fff" />
              <div>
                <div style={{ fontWeight: 800, color: '#fff' }}>Educator analytics</div>
                <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>Preview student trends and classroom performance.</div>
              </div>
            </div>
          </div>
        </motion.div>
        </div>

        <div className="auth-form-panel" style={{ width: 560, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ width: '100%', maxWidth: 460 }}>
          {/* Mobile brand header — hidden on desktop via CSS */}
          <div className="auth-mobile-brand">
            <img src={logo} alt="AssessSphere" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'contain' }} />
            <span style={{ fontWeight: 800, fontSize: 17, background: 'linear-gradient(135deg,#2563eb,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AssessSphere</span>
          </div>
          <div style={{ marginBottom: 8 }}>
            <Link to="/" className="auth-back-link">← Back to homepage</Link>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-main)', marginTop: 10 }}>Create account</h1>
            <p style={{ color: 'var(--text-sec)', marginTop: 6 }}>Free forever. No credit card required.</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 18 }}>

            {/* ── Role Selector ── */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 10 }}>I am registering as</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {/* Student card */}
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, role: 'STUDENT' }))}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    padding: '14px 10px', borderRadius: 14, cursor: 'pointer',
                    border: form.role === 'STUDENT'
                      ? '2px solid #2563eb'
                      : '2px solid var(--glass-border)',
                    background: form.role === 'STUDENT'
                      ? 'rgba(37,99,235,0.1)'
                      : 'var(--glass-bg)',
                    transition: 'all 200ms',
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: form.role === 'STUDENT' ? 'rgba(37,99,235,0.2)' : 'rgba(100,116,139,0.12)',
                  }}>
                    <GraduationCap size={20} color={form.role === 'STUDENT' ? '#60a5fa' : '#64748b'} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: form.role === 'STUDENT' ? 'var(--text-main)' : 'var(--text-sec)' }}>Student</div>
                    <div style={{ fontSize: 11, color: 'var(--text-sec)', marginTop: 2 }}>Take quizzes & tests</div>
                  </div>
                  {form.role === 'STUDENT' && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563eb' }} />
                  )}
                </button>

                {/* Admin card */}
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, role: 'ADMIN' }))}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    padding: '14px 10px', borderRadius: 14, cursor: 'pointer',
                    border: form.role === 'ADMIN'
                      ? '2px solid #7c3aed'
                      : '2px solid var(--glass-border)',
                    background: form.role === 'ADMIN'
                      ? 'rgba(124,58,237,0.1)'
                      : 'var(--glass-bg)',
                    transition: 'all 200ms',
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: form.role === 'ADMIN' ? 'rgba(124,58,237,0.2)' : 'rgba(100,116,139,0.12)',
                  }}>
                    <ShieldCheck size={20} color={form.role === 'ADMIN' ? '#a78bfa' : '#64748b'} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: form.role === 'ADMIN' ? 'var(--text-main)' : 'var(--text-sec)' }}>Admin</div>
                    <div style={{ fontSize: 11, color: 'var(--text-sec)', marginTop: 2 }}>Manage & create exams</div>
                  </div>
                  {form.role === 'ADMIN' && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#7c3aed' }} />
                  )}
                </button>
              </div>
            </div>

            {/* ── Full Name ── */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={15} color="#64748b" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input className="input-field auth-input" type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="John Doe" style={{ paddingLeft: 44 }} />
              </div>
            </div>

            {/* ── Email ── */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Email address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} color="#64748b" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input className="input-field auth-input" type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" style={{ paddingLeft: 44 }} />
              </div>
            </div>

            {/* ── Passwords ── */}
            <div className="auth-pw-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} color="#64748b" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                    <input className="input-field auth-input" type={showPw ? 'text' : 'password'} required minLength={6} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 6 characters" style={{ paddingLeft: 44, paddingRight: 48 }} />
                    <button type="button" onClick={() => setShowPw(s => !s)} aria-label={showPw ? 'Hide password' : 'Show password'} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} color="#64748b" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                  <input className="input-field auth-input" type={showPw ? 'text' : 'password'} required minLength={6} value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Repeat password" style={{ paddingLeft: 44, paddingRight: 48 }} />
                  <button type="button" onClick={() => setShowPw(s => !s)} aria-label={showPw ? 'Hide password' : 'Show password'} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* ── Password strength bar ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ height: 8, background: 'var(--glass-border)', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ width: `${(strength / 4) * 100}%`, height: '100%', background: 'linear-gradient(90deg,#f97316,#60a5fa)', transition: 'width 200ms' }} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-sec)', marginTop: 6 }}>{['Very weak','Weak','Okay','Strong','Excellent'][strength]}</div>
              </div>
              <div style={{ width: 160, textAlign: 'right', color: 'var(--text-sec)', fontSize: 12 }}>Use 8+ characters, mix letters, numbers &amp; symbols</div>
            </div>

            {/* ── Terms ── */}
            <label style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} />
              <span style={{ fontSize: 13 }}>I agree to the <a href="#" className="auth-secondary-link">Terms &amp; Conditions</a> and <a href="#" className="auth-secondary-link">Privacy Policy</a></span>
            </label>

            <button type="submit" className="auth-primary-btn" disabled={loading} style={{ padding: '14px', fontWeight: 800, background: form.role === 'ADMIN' ? 'linear-gradient(135deg,#7c3aed,#a78bfa)' : 'linear-gradient(135deg,#2563eb,#60a5fa)' }}>
              {loading ? <><Loader2 size={16} className="spin" /> Creating account…</> : <>Create {form.role === 'ADMIN' ? 'Admin' : 'Student'} Account</>}
            </button>
          </form>

          <p style={{ marginTop: 18, textAlign: 'center', color: 'var(--text-sec)' }}>Already have an account? <Link to="/login" className="auth-secondary-link">Sign in →</Link></p>
        </motion.div>
        </div>
      </div>
    </div>
  )
}
