import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'

export default function Layout({ children, title, subtitle, action }) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768)
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) return false;
    const saved = localStorage.getItem('quiz_sidebar')
    return saved === null ? true : saved === 'true'
  })

  const toggleSidebar = () => setIsSidebarOpen(prev => {
    const next = !prev
    localStorage.setItem('quiz_sidebar', String(next))
    return next
  })

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth <= 768
      setIsMobile(mobile)
      if (mobile) setIsSidebarOpen(false)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <div className="page-bg" style={{ minHeight: '100vh' }}>
      <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar} />
      {/* Overlay: only show on mobile when sidebar is open */}
      {isSidebarOpen && isMobile && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}
      <div className={`main-content ${isSidebarOpen ? '' : 'sidebar-closed'}`}>
        {/* Header */}
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Show hamburger always on mobile, or on desktop when sidebar is closed */}
              {(!isSidebarOpen || isMobile) && (
                <button onClick={toggleSidebar} className="btn-ghost" style={{ padding: 6, minWidth: 34, minHeight: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                </button>
              )}
              <div style={{ minWidth: 0 }}>
                {title && <h1 style={{ fontSize: 'clamp(20px, 4vw, 32px)', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.025em', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</h1>}
                {subtitle && <p style={{ fontSize: 14, color: 'var(--text-sec)', marginTop: 3, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subtitle}</p>}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              {action && <div>{action}</div>}
            </div>
          </div>
        </div>
        {/* Body */}
        <motion.div
          className="layout-body"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  )
}
