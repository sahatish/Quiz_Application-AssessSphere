import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Link as LinkIcon, QrCode, Copy, CheckCircle2, Mail, Users, Key, Loader2, AlertTriangle } from 'lucide-react'
import { examTokenApi } from '../api/axios'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'

export default function ShareLinkModal({ isOpen, onClose, examId, examType, shareToken }) {
  const [activeTab, setActiveTab] = useState('private') // 'private' | 'general'
  const [emails, setEmails] = useState('')
  const [generating, setGenerating] = useState(false)
  const [tokens, setTokens] = useState([])
  const [loading, setLoading] = useState(false)
  const [emailing, setEmailing] = useState(false)
  const [showQrToken, setShowQrToken] = useState(null)
  
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setPage(0)
      setTokens([])
      setHasMore(true)
      fetchTokens(0)
      setActiveTab(shareToken ? 'general' : 'private')
    }
  }, [isOpen, shareToken])

  const fetchTokens = async (pageNum = 0) => {
    if (pageNum === 0) setLoading(true)
    else setLoadingMore(true)
    
    try {
      const res = await examTokenApi.getForExam(examType, examId, pageNum, 20)
      const newTokens = res.data.data.content
      
      if (pageNum === 0) {
        setTokens(newTokens)
      } else {
        setTokens(prev => {
          const existingIds = new Set(prev.map(t => t.token))
          return [...prev, ...newTokens.filter(t => !existingIds.has(t.token))]
        })
      }
      setHasMore(!res.data.data.last)
    } catch (err) {
      toast.error('Failed to load existing links')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const handleScroll = (e) => {
    if (activeTab !== 'private') return
    const { scrollTop, clientHeight, scrollHeight } = e.target
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && hasMore && !loading && !loadingMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchTokens(nextPage)
    }
  }

  const handleGenerate = async () => {
    const lines = emails.split('\n').map(e => e.trim()).filter(Boolean)
    if (!lines.length) return toast.error('Enter at least one line')

    setGenerating(true)
    try {
      const res = await examTokenApi.generate({ examId, examType, emails: lines })
      toast.success(`Generated ${res.data.data.length} unique links`)
      setEmails('')
      setPage(0)
      setHasMore(true)
      fetchTokens(0)
    } catch (err) {
      toast.error('Failed to generate links')
    } finally {
      setGenerating(false)
    }
  }

  const getPrivateLink = (token) => `${window.location.origin}/exam/entry/${token}`
  const getGeneralLink = () => `${window.location.origin}/${examType.toLowerCase()}/${shareToken}`

  // ── Clipboard helper: works on HTTP (local IP) too ──────────────────────
  const copyToClipboard = (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      // HTTPS or localhost — use modern API
      return navigator.clipboard.writeText(text)
    } else {
      // HTTP fallback (local network IP) — use legacy execCommand
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0'
      document.body.appendChild(ta)
      ta.focus()
      ta.select()
      try { document.execCommand('copy') } catch {}
      document.body.removeChild(ta)
      return Promise.resolve()
    }
  }

  const handleCopyLink = (link) => {
    copyToClipboard(link).then(() => toast.success('Link copied!'))
  }

  const handleCopyDetails = (t) => {
    const text = `Hi ${t.studentEmail},\n\nHere is your private link to access the assessment: ${t.examTitle}\n\nLink: ${getPrivateLink(t.token)}\n\nDo not share this link with anyone, it is strictly tied to your email.\nGood luck!`
    copyToClipboard(text).then(() => toast.success('Details copied!'))
  }

  const handleCopyAll = () => {
    const available = tokens.filter(t => !t.isUsed)
    if (!available.length) return toast.error('No available links to copy')
    const text = available.map(t => `${t.studentEmail}: ${getPrivateLink(t.token)}`).join('\n')
    copyToClipboard(text).then(() => toast.success(`Copied ${available.length} links to clipboard!`))
  }

  const handleEmailAll = async () => {
    const available = tokens.filter(t => !t.isUsed)
    if (!available.length) return toast.error('No available links to email')

    setEmailing(true)
    try {
      const baseUrl = window.location.origin
      await examTokenApi.emailAll(examType, examId, baseUrl)
      toast.success('All private access links sent via email!')
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to send emails'
      toast.error(errMsg)
    } finally {
      setEmailing(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
            style={{ background: '#161b22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, width: '100%', maxWidth: 700, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>Share Access Links</h2>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-sec)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}><X size={20} /></button>
            </div>

            {shareToken && (
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0 24px' }}>
                <button
                  onClick={() => setActiveTab('general')}
                  style={{ flex: 1, padding: '16px 0', background: 'none', border: 'none', borderBottom: activeTab === 'general' ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === 'general' ? '#f8fafc' : '#94a3b8', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}
                >
                  <Users size={16} /> General Access Link
                </button>
                <button
                  onClick={() => setActiveTab('private')}
                  style={{ flex: 1, padding: '16px 0', background: 'none', border: 'none', borderBottom: activeTab === 'private' ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === 'private' ? '#f8fafc' : '#94a3b8', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}
                >
                  <Key size={16} /> Private Tokens
                </button>
              </div>
            )}

            <div style={{ padding: 24, overflowY: 'auto', flex: 1 }} onScroll={handleScroll}>
              {activeTab === 'general' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div style={{ background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.2)', padding: 16, borderRadius: 12 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#38bdf8', marginBottom: 8 }}>General Access Link</h3>
                    <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5, marginBottom: 16 }}>
                      Share this single link with all your students. When they click it, they will be asked to enter their Name and Email to enroll and begin the exam. This is the easiest way to share with a large group.
                    </p>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <input 
                        type="text" 
                        readOnly 
                        value={getGeneralLink()} 
                        style={{ flex: 1, minWidth: 0, background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 12px', color: '#e2e8f0', fontSize: 13, cursor: 'text' }}
                        onFocus={e => e.target.select()}
                      />
                      <button 
                        onClick={() => handleCopyLink(getGeneralLink())}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', flexShrink: 0, background: 'var(--primary)', color: '#fff', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer' }}
                      >
                        <Copy size={16} /> Copy
                      </button>
                    </div>
                  </div>


                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 12 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 12 }}>Or scan to open on mobile:</p>
                    <div style={{ background: '#fff', padding: 16, borderRadius: 16 }}>
                      <QRCodeSVG value={getGeneralLink()} size={200} />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 8 }}>Bulk Generate (Enter "Name, Email, Phone" or just "Email")</label>
                    <textarea 
                      value={emails}
                      onChange={e => setEmails(e.target.value)}
                      placeholder="John Doe, john@example.com, 1234567890&#10;alice@test.com"
                      style={{ width: '100%', height: 100, background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 12, color: '#fff', fontSize: 14, resize: 'none', marginBottom: 12 }}
                    />
                    <button onClick={handleGenerate} disabled={generating}
                      style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 8, fontWeight: 600, cursor: generating ? 'not-allowed' : 'pointer', opacity: generating ? 0.7 : 1 }}>
                      {generating ? 'Generating...' : 'Generate Tokens'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ color: 'var(--text-main)', fontSize: 15, fontWeight: 600 }}>Existing Tokens</h3>
                    {tokens.length > 0 && (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button onClick={handleEmailAll} disabled={emailing}
                          style={{ padding: '6px 12px', background: 'rgba(37,99,235,0.1)', color: 'var(--primary-400)', borderRadius: 6, border: '1px solid rgba(37,99,235,0.2)', fontSize: 13, fontWeight: 600, cursor: emailing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: emailing ? 0.7 : 1 }}>
                          <Mail size={14} /> {emailing ? 'Sending...' : 'Email All'}
                        </button>
                        <button onClick={handleCopyAll}
                          style={{ padding: '6px 12px', background: 'rgba(56,189,248,0.1)', color: '#38bdf8', borderRadius: 6, border: '1px solid rgba(56,189,248,0.2)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Copy size={14} /> Copy All Links
                        </button>
                      </div>
                    )}
                  </div>

                  {loading ? (
                    <div style={{ color: 'var(--text-sec)', textAlign: 'center', padding: 40 }}><Loader2 size={24} className="spin" style={{ margin: '0 auto', color: 'var(--primary-400)' }} /></div>
                  ) : tokens.length === 0 ? (
                    <div style={{ color: 'var(--text-sec)', textAlign: 'center', padding: 40, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px dashed rgba(255,255,255,0.05)' }}>No private tokens generated yet.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {tokens.map(t => (
                        <div key={t.token} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
                              <div style={{ color: '#fff', fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={t.studentEmail}>{t.studentEmail}</div>
                              <div style={{ color: t.isUsed ? '#ef4444' : '#4ade80', fontSize: 12, fontWeight: 600, marginTop: 4 }}>{t.isUsed ? 'Already Used' : 'Available'}</div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                              <button onClick={() => handleCopyLink(getPrivateLink(t.token))} disabled={t.isUsed} title="Copy Link"
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 6, color: t.isUsed ? '#64748b' : '#38bdf8', cursor: t.isUsed ? 'not-allowed' : 'pointer' }}>
                                <LinkIcon size={16} />
                              </button>
                              <button onClick={() => setShowQrToken(showQrToken === t.token ? null : t.token)} disabled={t.isUsed} title="Show QR Code"
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 6, color: t.isUsed ? '#64748b' : 'var(--primary-400)', cursor: t.isUsed ? 'not-allowed' : 'pointer' }}>
                                <QrCode size={16} />
                              </button>
                              <button onClick={() => handleCopyDetails(t)} disabled={t.isUsed} title="Copy Email Details"
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 6, color: t.isUsed ? '#64748b' : '#f59e0b', cursor: t.isUsed ? 'not-allowed' : 'pointer' }}>
                                <Copy size={16} />
                              </button>
                            </div>
                          </div>
                          
                          {showQrToken === t.token && !t.isUsed && (
                            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <div style={{ background: '#fff', padding: 16, borderRadius: 12 }}>
                                <QRCodeSVG value={getPrivateLink(t.token)} size={150} />
                              </div>
                              <div style={{ color: 'var(--text-sec)', fontSize: 12, marginTop: 12, fontWeight: 600 }}>Scan to open private token on mobile</div>
                            </div>
                          )}
                        </div>
                      ))}
                      {loadingMore && <div style={{ textAlign: 'center', padding: 10 }}><Loader2 size={20} className="spin" style={{ margin: '0 auto', color: 'var(--primary-400)' }} /></div>}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
