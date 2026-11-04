import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { examTokenApi } from '../../api/axios'
import { AlertTriangle, Clock, ArrowRight, XCircle, FileText, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import logo from '../../assets/logo.png'

export default function ExamEntry() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [examData, setExamData] = useState(null)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    window.scrollTo(0, 0)
    verifyToken()
  }, [token])

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const verifyToken = async () => {
    try {
      const res = await examTokenApi.verify(token)
      setExamData(res.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired token')
    } finally {
      setLoading(false)
    }
  }

  const handleEnterExamClick = () => {
    navigate(`/assessment/${examData.shareToken || examData.examId}?token=${token}&studentId=${examData.studentId}`, { state: { requestFullscreen: true } })
  }

  // Common Header Component
  const Header = () => (
    <div style={{ padding: '16px 24px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16, borderBottom: '1px solid #f1f5f9', background: '#fff', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <img src={logo} alt="AssessSphere" style={{ width: 32, height: 32, borderRadius: 8 }} />
        <span style={{ fontSize: 20, fontWeight: 800, color: '#1e3a8a', letterSpacing: '-0.02em' }}>AssessSphere</span>
        <div style={{ width: 1, height: 20, background: '#e2e8f0' }} />
        <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Assessment Platform</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#3b82f6', fontSize: 13, fontWeight: 600 }}>
        <ShieldCheck size={18} />
        Secure & Proctored Exam
      </div>
    </div>
  )

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ borderColor: '#e2e8f0', borderTopColor: '#3b82f6' }} />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            style={{ background: '#fff', border: '1px solid #fee2e2', borderRadius: 20, padding: 40, maxWidth: 460, width: '100%', textAlign: 'center', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
            <XCircle size={48} color="#ef4444" style={{ margin: '0 auto 20px' }} />
            <h2 style={{ color: '#0f172a', fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Access Denied</h2>
            <p style={{ color: '#64748b', fontSize: 15 }}>{error}</p>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '48px', maxWidth: 640, width: '100%', boxShadow: '0 20px 40px -15px rgba(0,0,0,0.05)' }}>
          
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ display: 'inline-block', padding: '8px 20px', background: '#eff6ff', color: '#2563eb', borderRadius: 20, fontSize: 13, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 20 }}>
              {examData.examType === 'ASSESSMENT' ? 'FULL ASSESSMENT' : examData.examType === 'QUIZ' ? 'ASSESSMENT QUIZ' : 'CODING CHALLENGE'}
            </div>
            <h1 style={{ fontSize: 36, color: '#0f172a', fontWeight: 800, marginBottom: 12, letterSpacing: '-0.02em' }}>{examData.examTitle}</h1>
            <p style={{ color: '#64748b', fontSize: 16 }}>Welcome, <strong style={{ color: '#2563eb' }}>{examData.studentName || examData.studentEmail}</strong></p>
          </div>

          <div style={{ border: '1px solid #e2e8f0', borderRadius: 16, padding: '32px', marginBottom: 32, background: '#fff' }}>
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#2563eb', fontWeight: 700, fontSize: 14, letterSpacing: '0.05em', marginBottom: 20 }}>
                <FileText size={20} />
                INSTRUCTIONS
              </div>
              
              <ul style={{ color: '#334155', fontSize: 14.5, lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: 14, paddingLeft: 20, margin: 0, listStyle: 'disc' }}>
                <li style={{ paddingLeft: 8 }}>Please ensure you have a stable internet connection and your camera is working.</li>
                <li style={{ paddingLeft: 8 }}>The assessment requires you to stay in fullscreen mode.</li>
                <li style={{ paddingLeft: 8 }}>Switching tabs or exiting fullscreen may flag a violation.</li>
                <li style={{ paddingLeft: 8 }}>Use recommended browser such as Chrome, Edge, Brave, Opera, or Safari when opening the Test link. Avoid using instant-click browsers as they may impair your usability.</li>
                <li style={{ paddingLeft: 8 }}>If you do not complete the test within the given time, it will automatically submit with the number of answers you attempted.</li>
                <li style={{ paddingLeft: 8 }}>Some questions may contain images. If you find them difficult to read, simply click on the image to zoom in for a better view.</li>
                <li style={{ paddingLeft: 8 }}>If you experience any technical issues during the test, please use the live chat option for assistance.</li>
              </ul>
            </div>
            
            {(examData.durationMinutes || examData.difficulty || examData.totalMarks) && (
              <>
                <div style={{ height: 1, background: '#e2e8f0', marginBottom: 24 }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 24 }}>
                  {examData.durationMinutes && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#2563eb', fontWeight: 700, fontSize: 13, letterSpacing: '0.05em', marginBottom: 8 }}>
                        <Clock size={18} />
                        DURATION
                      </div>
                      <div style={{ color: '#0f172a', fontWeight: 600, fontSize: 16, paddingLeft: 28 }}>{examData.durationMinutes} minutes</div>
                    </div>
                  )}
                  {examData.totalMarks && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#2563eb', fontWeight: 700, fontSize: 13, letterSpacing: '0.05em', marginBottom: 8 }}>
                        <Trophy size={18} />
                        TOTAL MARKS
                      </div>
                      <div style={{ color: '#0f172a', fontWeight: 600, fontSize: 16, paddingLeft: 28 }}>{examData.totalMarks}</div>
                    </div>
                  )}
                  {examData.difficulty && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#2563eb', fontWeight: 700, fontSize: 13, letterSpacing: '0.05em', marginBottom: 8 }}>
                        <AlertTriangle size={18} />
                        DIFFICULTY
                      </div>
                      <div style={{ color: '#0f172a', fontWeight: 600, fontSize: 16, paddingLeft: 28 }}>{examData.difficulty}</div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {(() => {
            let hasNotStarted = false
            let hasEnded = false
            if (examData.scheduledFor && new Date(examData.scheduledFor) > now) {
              hasNotStarted = true
            }
            if (examData.validUntil && new Date(examData.validUntil) < now) {
              hasEnded = true
            }

            if (hasEnded) {
              return (
                <div style={{ textAlign: 'center', padding: 20, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, color: '#dc2626' }}>
                  <AlertTriangle size={24} style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontWeight: 700, fontSize: 16 }}>Exam Concluded</div>
                  <div style={{ fontSize: 14, marginTop: 4 }}>This exam ended on {new Date(examData.validUntil).toLocaleString()}</div>
                </div>
              )
            }

            if (hasNotStarted) {
              return (
                <div style={{ textAlign: 'center', padding: 20, background: '#fefce8', border: '1px solid #fef08a', borderRadius: 12, color: '#b45309' }}>
                  <Clock size={24} style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontWeight: 700, fontSize: 16 }}>Exam Not Yet Started</div>
                  <div style={{ fontSize: 14, marginTop: 4 }}>This exam will start on {new Date(examData.scheduledFor).toLocaleString()}</div>
                </div>
              )
            }

            return (
              <button onClick={handleEnterExamClick} style={{ width: '100%', padding: '16px 24px', borderRadius: 14, background: '#1d4ed8', color: '#fff', fontSize: 18, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, boxShadow: '0 8px 16px -4px rgba(29,78,216,0.3)', transition: 'all 0.2s', letterSpacing: '0.02em' }}>
                Enter Exam <ArrowRight size={20} />
              </button>
            )
          })()}
        </motion.div>
      </div>
    </div>
  )
}
