import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, BookOpen, Code2, Users, BarChart2,
  LogOut, Zap, ChevronRight, User, Sparkles
} from 'lucide-react'

import logo from '../assets/logo.png'

const studentLinks = []
const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/assessments', label: 'Assessments', icon: Sparkles },
  { to: '/admin/quizzes', label: 'Manage Quizzes', icon: BookOpen },
  { to: '/admin/coding', label: 'Coding Tests', icon: Code2 },
  { to: '/admin/students', label: 'Students', icon: Users },
  { to: '/admin/results', label: 'Results', icon: BarChart2 },
]

export default function Sidebar({ isOpen, toggle }) {
  const { user, logout, isAdmin } = useAuth()
  const { pathname } = useLocation()
  const links = isAdmin ? adminLinks : studentLinks

  return (
    <div className="sidebar blue" style={{ transform: isOpen ? 'translateX(0)' : 'translateX(-100%)' }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src={logo} alt="AssessSphere Logo" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'contain' }} />
          <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.03em' }} className="grad">AssessSphere</span>
        </Link>
        {/* Close Button */}
        <button onClick={toggle} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', transition: 'background 0.2s' }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseOut={e => e.currentTarget.style.background = 'none'}>
           <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} />
        </button>
      </div>

      {/* Nav — NO "NAVIGATION" label */}
      <nav style={{ flex: 1, padding: '16px 14px', overflowY: 'auto' }}>
        {links.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || (to !== '/student/dashboard' && to !== '/admin/dashboard' && pathname.startsWith(to))
          return (
            <Link key={to} to={to} className={`nav-link ${active ? 'active' : ''}`}>
              <Icon size={17} />
              <span style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>{label}</span>
              {active && <ChevronRight size={13} color="var(--primary)" />}
            </Link>
          )
        })}
      </nav>

      {/* User chip — clickable → profile */}
      <Link to="/profile" style={{ textDecoration: 'none', margin: '10px 14px', display: 'block', padding: '12px', background: 'rgba(255,255,255,0.08)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', transition: 'background 0.2s' }}
        onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
        onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'linear-gradient(135deg, #fff, #e2e8f0)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 800, fontSize: 13, flexShrink: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.01em' }}>{user?.name || 'User'}</div>
            <span style={{ display: 'inline-block', marginTop: 3, fontSize: 10, padding: '2px 8px', borderRadius: '4px', background: isAdmin ? 'rgba(59,130,246,0.3)' : 'rgba(16,185,129,0.3)', color: '#fff', fontWeight: 600, border: '1px solid rgba(255,255,255,0.2)' }}>
              {user?.role}
            </span>
          </div>
          <User size={16} color="rgba(255,255,255,0.8)" />
        </div>
      </Link>

      {/* Logout */}
      <div style={{ padding: '0 14px 14px' }}>
        <button onClick={logout}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', color: '#ffffff', fontSize: 14, fontWeight: 700, transition: 'all 0.2s', letterSpacing: '-0.01em' }}
          onMouseOver={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(239,68,68,0.3)'; }}
          onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}>
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  )
}
