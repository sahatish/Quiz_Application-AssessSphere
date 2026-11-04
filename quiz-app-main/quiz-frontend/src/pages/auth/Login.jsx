import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { authApi } from '../../api/axios'
import logo from '../../assets/logo.png'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { Zap, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, ShieldCheck, GraduationCap } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  // Forgot password states
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotStep, setForgotStep] = useState(1) // 1: enter email, 2: enter otp & new pw
  const [forgotEmail, setForgotEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)

  const handleRequestOtp = async (e) => {
    e.preventDefault()
    setForgotLoading(true)
    try {
      await authApi.forgotPasswordRequest({ email: forgotEmail })
      toast.success('Verification code sent to your email!')
      setForgotStep(2)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send verification code. Please check the email.')
    } finally {
      setForgotLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setForgotLoading(true)
    try {
      await authApi.forgotPasswordReset({
        email: forgotEmail,
        otp: otpCode,
        newPassword: newPassword
      })
      toast.success('Password reset successfully! You can now log in.')
      setShowForgotModal(false)
      // Reset state
      setForgotStep(1)
      setForgotEmail('')
      setOtpCode('')
      setNewPassword('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password. Please check the details.')
    } finally {
      setForgotLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await authApi.login(form)
      const data = res.data.data
      login(data)
      toast.success(`Welcome back, ${data.name}!`)
      // If a shareable quiz link was saved, redirect there (students only)
      const savedRedirect = localStorage.getItem('quiz_redirect')
      if (savedRedirect && data.role === 'STUDENT') {
        localStorage.removeItem('quiz_redirect')
        navigate(savedRedirect, { replace: true })
      } else {
        navigate(data.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard', { replace: true })
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell auth-layout" style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <div className="auth-card" style={{ display: 'flex', borderRadius: 28, overflow: 'hidden', boxShadow: '0 30px 80px rgba(13,20,48,0.12)', width: 'calc(100% - 48px)', maxWidth: 1120 }}>
        <div className="auth-panel" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 56, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '6%', left: '8%', width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', filter: 'blur(36px)' }} />
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} style={{ maxWidth: 520, zIndex: 2 }}>
          <img src={logo} alt="AssessSphere" style={{ width: 96, height: 96, borderRadius: 20, boxShadow: '0 30px 70px rgba(37,99,235,0.12)', marginBottom: 18 }} />
          <h2 style={{ fontSize: 36, fontWeight: 900, color: '#fff', marginBottom: 12 }}>Manage assessments with confidence</h2>
          <p style={{ color: 'rgba(255,255,255,0.88)', fontSize: 16, lineHeight: 1.8, marginBottom: 20 }}>Organize exams, monitor student progress, and review results from one modern platform.</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14, marginTop: 8 }}>
            <div className="auth-feature-card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <ShieldCheck size={20} color="#fff" />
              <div>
                <div style={{ fontWeight: 800, color: '#fff' }}>Secure access control</div>
                <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>Role-based access and protected exam links.</div>
              </div>
            </div>
            <div className="auth-feature-card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Zap size={20} color="#fff" />
              <div>
                <div style={{ fontWeight: 800, color: '#fff' }}>Real-time monitoring</div>
                <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>Live analytics & fast grading pipelines.</div>
              </div>
            </div>
            <div className="auth-feature-card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <GraduationCap size={20} color="#fff" />
              <div>
                <div style={{ fontWeight: 800, color: '#fff' }}>Advanced reporting</div>
                <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>Exportable reports and performance trends.</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

        <div className="auth-form-panel" style={{ width: 540, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ width: '100%', maxWidth: 420 }}>
          {/* Mobile brand header — hidden on desktop via CSS */}
          <div className="auth-mobile-brand">
            <img src={logo} alt="AssessSphere" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'contain' }} />
            <span style={{ fontWeight: 800, fontSize: 17, background: 'linear-gradient(135deg,#2563eb,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AssessSphere</span>
          </div>
          <div style={{ marginBottom: 8 }}>
            <Link to="/" className="auth-back-link">← Back to homepage</Link>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-main)', marginTop: 10 }}>Welcome back</h1>
            <p style={{ color: 'var(--text-sec)', marginTop: 6 }}>Sign in to your AssessSphere account</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 18 }}>
            <div className="auth-input-wrap">
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Email address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#64748b" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input className="input-field auth-input" type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@school.edu" style={{ paddingLeft: 46 }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 700 }}>Password</label>
                <button type="button" onClick={() => { setShowForgotModal(true); setForgotStep(1); }} className="auth-secondary-link">Forgot password?</button>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#64748b" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input className="input-field auth-input" type={showPw ? 'text' : 'password'} required value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Enter your password" style={{ paddingLeft: 46, paddingRight: 48 }} />
                <button type="button" onClick={() => setShowPw(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </div>

            <div className="auth-remember-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type="checkbox" /> Remember me</label>
              <div style={{ color: 'var(--text-sec)', fontSize: 12 }}>Protected with enterprise-grade encryption</div>
            </div>

            <button type="submit" className="auth-primary-btn" disabled={loading} style={{ padding: '14px', fontWeight: 800 }}>
              {loading ? <><Loader2 size={16} className="spin" /> Signing in…</> : <>Sign In</>}
            </button>
          </form>

          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <p style={{ color: 'var(--text-sec)' }}>Don't have an account? <Link to="/register" className="auth-secondary-link">Create one free →</Link></p>
          </div>
        </motion.div>
        </div>
      </div>

      {/* ── Forgot Password Modal (unchanged) ── */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="modal-overlay" style={{
            position: 'fixed', inset: 0, background: 'rgba(6,8,24,0.88)', backdropFilter: 'blur(8px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
          }} onClick={() => setShowForgotModal(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }}
              style={{
                background: '#161b22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '40px 48px', maxWidth: 460, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.6)'
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{ marginBottom: 28, textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid rgba(37,99,235,0.2)' }}>
                  <Lock size={24} color="var(--primary-400)" />
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
                  {forgotStep === 1 ? 'Reset Password' : 'Verify Code'}
                </h2>
                <p style={{ fontSize: 13.5, color: 'var(--text-sec)', lineHeight: 1.5 }}>
                  {forgotStep === 1 
                    ? 'Enter your email address and we will send you a 6-digit OTP code to verify your identity.' 
                    : `Enter the 6-digit code sent to ${forgotEmail} and choose your new password.`}
                </p>
              </div>

              {forgotStep === 1 ? (
                <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: 'var(--text-main)', marginBottom: 8 }}>Email address</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={15} color="#6b7280" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                      <input
                        type="email" required value={forgotEmail}
                        onChange={e => setForgotEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="input-field"
                        style={{ paddingLeft: 46, fontSize: 14.5, height: 48 }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                    <button type="button" onClick={() => setShowForgotModal(false)}
                      style={{ flex: 1, padding: '12px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-sec)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                      Cancel
                    </button>
                    <button type="submit" disabled={forgotLoading}
                      style={{ flex: 1, padding: '12px', borderRadius: 10, background: 'linear-gradient(135deg,var(--primary),var(--primary-400))', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: forgotLoading ? 'not-allowed' : 'pointer', opacity: forgotLoading ? 0.7 : 1 }}>
                      {forgotLoading ? 'Sending...' : 'Send OTP'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* OTP Code */}
                  <div>
                    <label style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: 'var(--text-main)', marginBottom: 8 }}>Verification Code</label>
                    <input
                      type="text" required maxLength={6} pattern="\d{6}" value={otpCode}
                      onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 6-digit OTP"
                      className="input-field"
                      style={{ fontSize: 16, textAlign: 'center', letterSpacing: '0.2em', height: 48, fontWeight: 700 }}
                    />
                  </div>

                  {/* New Password */}
                  <div>
                    <label style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: 'var(--text-main)', marginBottom: 8 }}>New Password</label>
                    <input
                      type="password" required value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="input-field"
                      style={{ fontSize: 14.5, height: 48 }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                    <button type="button" onClick={() => setForgotStep(1)}
                      style={{ flex: 1, padding: '12px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-sec)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                      Back
                    </button>
                    <button type="submit" disabled={forgotLoading}
                      style={{ flex: 1, padding: '12px', borderRadius: 10, background: 'linear-gradient(135deg,var(--primary),var(--primary-400))', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: forgotLoading ? 'not-allowed' : 'pointer', opacity: forgotLoading ? 0.7 : 1 }}>
                      {forgotLoading ? 'Resetting...' : 'Reset Password'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
