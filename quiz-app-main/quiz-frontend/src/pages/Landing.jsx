import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/logo.png'
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion'
import { Zap, BookOpen, Users, Target, Trophy, ArrowRight, Sun, Moon, Star, BarChart3, GraduationCap, Sparkles, Layers, ChevronRight, Mail, MapPin, Globe, Camera, Play, MessageCircle, Share2, Menu, X, FileText } from 'lucide-react'
import ParticleBackground from '../components/ParticleBackground'
import AdminMock from '../components/AdminMock'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.6, delay, ease: [0.25, 0.4, 0.25, 1] },
})

const stagger = (staggerDelay = 0.08) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-30px' },
  transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] },
})

const scaleIn = (delay = 0) => ({
  initial: { opacity: 0, scale: 0.85 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: { once: true },
  transition: { duration: 0.5, delay, ease: [0.25, 0.4, 0.25, 1] },
})

const FEATURES = [
  {
    icon: BookOpen, color: '#2563eb',
    title: 'Exam Builder',
    desc: 'Design secure, timed assessments with mixed question types, scoring rules, and review settings.',
  },
  {
    icon: Users, color: '#60a5fa',
    title: 'Student Management',
    desc: 'Group learners by class, send invites in bulk, and manage who can access each exam.',
  },
  {
    icon: Target, color: '#22c55e',
    title: 'Secure Access',
    desc: 'Use tokenized links, timed windows, and exam passcodes to keep quiz sessions controlled.',
  },
  {
    icon: Trophy, color: '#2563eb',
    title: 'Analytics & Reports',
    desc: 'Visualize student performance across exams, classes, and questions with export-ready reports.',
  },
]

const STATS = [
  { value: '10K+', label: 'Exams Created', icon: FileText, color: '#a855f7', bg: '#f3e8ff' },
  { value: '80K+', label: 'Students', icon: Users, color: '#3b82f6', bg: '#eff6ff' },
  { value: '220K+', label: 'Questions Bank', icon: Layers, color: '#22c55e', bg: '#f0fdf4' },
  { value: '99%', label: 'Teacher Adoption', icon: Trophy, color: '#f59e0b', bg: '#fffbeb' },
]

const STEPS = [
  { icon: GraduationCap, title: 'Register & Configure', desc: 'Create your account and set up classes, subjects, and exam rules.', gradient: 'from-violet-500 to-purple-600' },
  { icon: Layers, title: 'Build Exams Fast', desc: 'Compose MCQs or coding tests, schedule time windows, and review before launch.', gradient: 'from-blue-500 to-cyan-500' },
  { icon: Trophy, title: 'Launch & Review', desc: 'Send secure student links, collect submissions, and analyze results immediately.', gradient: 'from-emerald-500 to-teal-500' },
]

function FloatingIllustration({ theme }) {
  const isLight = theme === 'light'
  const cardBg = isLight ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.06)'
  const cardBorder = isLight ? 'rgba(148,163,184,0.2)' : 'rgba(255,255,255,0.1)'
  const textMuted = isLight ? 'rgba(100,116,139,0.7)' : 'rgba(255,255,255,0.35)'
  const textMain = isLight ? '#1e293b' : '#e2e8f0'
  const barTrack = isLight ? 'rgba(148,163,184,0.2)' : 'rgba(255,255,255,0.08)'
  const statCardBg = isLight ? 'rgba(248,250,252,0.8)' : 'rgba(255,255,255,0.05)'
  const statCardBorder = isLight ? 'rgba(148,163,184,0.15)' : 'rgba(255,255,255,0.06)'
  const dotColor = isLight ? 'rgba(37,99,235,0.3)' : 'rgba(37,99,235,0.4)'
  const dotColor2 = isLight ? 'rgba(96,165,250,0.3)' : 'rgba(96,165,250,0.5)'

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg viewBox="0 0 500 420" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-w-[500px]">
        <defs>
          <linearGradient id="purpleGlow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#2f82e0" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="blueGlow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#2f82e0" stopOpacity="0.08" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Background gradient orbs */}
        <motion.ellipse cx="250" cy="210" rx="220" ry="190" fill="url(#purpleGlow)" animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.05, 1] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.ellipse cx="300" cy="180" rx="160" ry="140" fill="url(#blueGlow)" animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.08, 1] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }} />

        {/* Main dashboard card */}
        <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
          <rect x="60" y="100" width="380" height="260" rx="24" fill={cardBg} stroke={cardBorder} strokeWidth="1" />
          <rect x="60" y="100" width="380" height="260" rx="24" fill="url(#purpleGlow)" />
        </motion.g>

        {/* Card header */}
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.4 }}>
          <rect x="88" y="128" width="100" height="10" rx="5" fill="rgba(37,99,235,0.6)" />
          <rect x="88" y="148" width="60" height="8" rx="4" fill={textMuted} />
          <rect x="370" y="128" width="42" height="24" rx="12" fill="rgba(96,165,250,0.12)" stroke="rgba(96,165,250,0.18)" strokeWidth="0.5" />
        </motion.g>

        {/* Bar chart */}
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.5 }}>
          <rect x="88" y="190" width="120" height="8" rx="4" fill={barTrack} />
          <motion.rect x="88" y="190" width="90" height="8" rx="4" fill="#2563eb" initial={{ width: 0 }} animate={{ width: 90 }} transition={{ duration: 1, delay: 0.8, ease: 'easeOut' }} />
          <rect x="88" y="208" width="120" height="8" rx="4" fill={barTrack} />
          <motion.rect x="88" y="208" width="70" height="8" rx="4" fill="#38bdf8" initial={{ width: 0 }} animate={{ width: 70 }} transition={{ duration: 1, delay: 1, ease: 'easeOut' }} />
          <rect x="88" y="226" width="120" height="8" rx="4" fill={barTrack} />
          <motion.rect x="88" y="226" width="105" height="8" rx="4" fill="#22c55e" initial={{ width: 0 }} animate={{ width: 105 }} transition={{ duration: 1, delay: 1.2, ease: 'easeOut' }} />
          <rect x="88" y="244" width="120" height="8" rx="4" fill={barTrack} />
          <motion.rect x="88" y="244" width="55" height="8" rx="4" fill="#fbbf24" initial={{ width: 0 }} animate={{ width: 55 }} transition={{ duration: 1, delay: 1.4, ease: 'easeOut' }} />
        </motion.g>

        {/* Pie chart on right side */}
        <motion.g initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.7 }}>
          <circle cx="350" cy="230" r="45" fill={isLight ? 'rgba(148,163,184,0.08)' : 'rgba(255,255,255,0.03)'} stroke={isLight ? 'rgba(148,163,184,0.15)' : 'rgba(255,255,255,0.08)'} strokeWidth="1" />
          <motion.circle cx="350" cy="230" r="45" fill="none" stroke="#3aaeed" strokeWidth="10" strokeDasharray="160 123" strokeDashoffset="0" strokeLinecap="round" initial={{ strokeDashoffset: 283 }} animate={{ strokeDashoffset: 123 }} transition={{ duration: 1.2, delay: 1 }} transform="rotate(-90 350 230)" />
          <motion.circle cx="350" cy="230" r="45" fill="none" stroke="#38bdf8" strokeWidth="10" strokeDasharray="80 203" strokeDashoffset="0" strokeLinecap="round" initial={{ strokeDashoffset: 283 }} animate={{ strokeDashoffset: 203 }} transition={{ duration: 1.2, delay: 1.3 }} transform="rotate(100 350 230)" />
        </motion.g>

        {/* Checkmark circle */}
        <motion.g initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 1.5, type: 'spring', stiffness: 200 }}>
          <circle cx="350" cy="230" r="16" fill="rgba(34,197,94,0.15)" stroke="rgba(34,197,94,0.4)" strokeWidth="1" />
          <path d="M343 230l5 5 9-9" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </motion.g>

        {/* Bottom stat cards */}
        <motion.g initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.9 }}>
          <rect x="88" y="280" width="90" height="50" rx="12" fill={statCardBg} stroke={statCardBorder} strokeWidth="0.5" />
          <text x="133" y="302" textAnchor="middle" fill="#429bf5" fontSize="16" fontWeight="bold">82%</text>
          <text x="133" y="318" textAnchor="middle" fill={textMuted} fontSize="10">Avg. Score</text>
        </motion.g>
        <motion.g initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.1 }}>
          <rect x="193" y="280" width="90" height="50" rx="12" fill={statCardBg} stroke={statCardBorder} strokeWidth="0.5" />
          <text x="238" y="302" textAnchor="middle" fill="#38bdf8" fontSize="16" fontWeight="bold">96%</text>
          <text x="238" y="318" textAnchor="middle" fill={textMuted} fontSize="10">Pass Rate</text>
        </motion.g>
        <motion.g initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.3 }}>
          <rect x="298" y="280" width="90" height="50" rx="12" fill={statCardBg} stroke={statCardBorder} strokeWidth="0.5" />
          <text x="343" y="302" textAnchor="middle" fill="#22c55e" fontSize="16" fontWeight="bold">78%</text>
          <text x="343" y="318" textAnchor="middle" fill={textMuted} fontSize="10">Completion</text>
        </motion.g>

        {/* Floating elements */}
        <motion.g animate={{ y: [0, -8, 0], rotate: [0, 3, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
          <circle cx="72" cy="90" r="8" fill={dotColor} filter="url(#glow)" />
          <rect x="66" y="84" width="12" height="12" rx="3" fill="rgba(28, 86, 244, 0.7)" />
        </motion.g>
        <motion.g animate={{ y: [0, -12, 0], x: [0, 6, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}>
          <circle cx="440" cy="80" r="6" fill={dotColor2} filter="url(#glow)" />
        </motion.g>
        <motion.g animate={{ y: [0, -6, 0], rotate: [0, -2, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}>
          <rect x="410" cy="340" y="340" width="16" height="16" rx="4" fill="rgba(251,191,36,0.3)" />
        </motion.g>

        {/* Small floating dots */}
        {[...Array(6)].map((_, i) => (
          <motion.circle
            key={i}
            cx={60 + i * 80}
            cy={90}
            r={2}
            fill={i % 2 === 0 ? dotColor : dotColor2}
            animate={{ y: [0, -6 - i * 2, 0], opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
          />
        ))}
      </svg>
    </div>
  )
}

function Counter({ value, label }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const [count, setCount] = useState(0)
  const num = parseInt(value)

  useEffect(() => {
    if (!isInView) return
    let start = 0
    const duration = 2000
    const step = Math.ceil(num / (duration / 16))
    const timer = setInterval(() => {
      start += step
      if (start >= num) {
        setCount(num)
        clearInterval(timer)
      } else {
        setCount(start)
      }
    }, 16)
    return () => clearInterval(timer)
  }, [isInView, num])

  return (
    <div ref={ref} className="stat-number">
      <span className="stat-value">{value.includes('+') ? `${count}+` : value.includes('%') ? `${count}%` : count}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}

export default function Landing() {
  const [theme, setTheme] = useState(() => localStorage.getItem('quiz_theme') || 'light')
  const [mounted, setMounted] = useState(false)
  const { scrollYProgress } = useScroll()
  // Reduce the fade intensity so the hero doesn't become fully invisible on small scrolls
  // Keep at least 20% opacity when scrolled a bit.
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.2])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('quiz_theme', theme)
    setMounted(true)
  }, [theme])

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))

  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  if (!mounted) return null

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh', color: 'var(--text-main)', overflow: 'hidden' }}>
      <ParticleBackground />

      {/* Navbar */}
      <motion.nav
        className="landing-nav"
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
      >
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <motion.img
            src={logo}
            alt="AssessSphere Logo"
            style={{ width: 38, height: 38, borderRadius: 10, objectFit: 'contain' }}
            whileHover={{ scale: 1.1, rotate: -5 }}
            whileTap={{ scale: 0.95 }}
          />
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }} className="grad">AssessSphere</span>
        </Link>

        {/* Desktop links */}
        <div className="nav-desktop-links" style={{ display: 'flex', alignItems: 'center', gap: 18, marginLeft: 'auto' }}>
          <motion.a href="#features" className="nav-link" whileHover={{ scale: 1.05 }}>Features</motion.a>
          <motion.a href="#how-it-works" className="nav-link" whileHover={{ scale: 1.05 }}>How It Works</motion.a>
          <Link to="/login" className="btn-ghost" style={{ padding: '9px 20px', fontSize: 14 }}>Login</Link>
          <Link to="/register" className="btn-primary" style={{ padding: '9px 22px', fontSize: 14 }}>Sign Up</Link>
        </div>

        {/* Mobile controls */}
        <div className="nav-mobile-controls" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="hamburger-btn" onClick={() => setMobileNavOpen(o => !o)} aria-label="Toggle menu">
            {mobileNavOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileNavOpen && (
          <motion.div
            className="nav-mobile-drawer open"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <a href="#features" className="nav-link" onClick={() => setMobileNavOpen(false)} style={{ color: '#0f172a', fontSize: 15, fontWeight: 600 }}>Features</a>
            <a href="#how-it-works" className="nav-link" onClick={() => setMobileNavOpen(false)} style={{ color: '#0f172a', fontSize: 15, fontWeight: 600 }}>How It Works</a>
            <div style={{ height: 1, background: 'rgba(148,163,184,0.2)' }} />
            <Link to="/login" className="btn-ghost" style={{ width: '100%', textAlign: 'center', justifyContent: 'center', padding: '12px', fontSize: 15 }} onClick={() => setMobileNavOpen(false)}>Login</Link>
            <Link to="/register" className="btn-primary" style={{ width: '100%', textAlign: 'center', justifyContent: 'center', padding: '12px', fontSize: 15 }} onClick={() => setMobileNavOpen(false)}>Sign Up</Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section - Premium */}
      <motion.section className="hero-bg" style={{ opacity: heroOpacity }}>
        <div className="dot-pattern" />
        <div className="hero-wrapper">
          <div className="hero-copy">
            <motion.div className="hero-badge" style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', maxWidth: '620px', padding: '16px 24px', fontSize: '15px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '24px', color: '#1e3a8a', fontWeight: 700 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
              <Sparkles size={18} /> Managed Assessments
            </motion.div>

            <motion.h1 style={{ fontSize: 'clamp(28px, 4.5vw, 52px)', lineHeight: 1.2, fontWeight: 800, letterSpacing: 'normal', wordSpacing: '0.1em', color: '#0f172a' }} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.12 }}>
              <span style={{ whiteSpace: 'nowrap' }}>Recruit top talent</span><br />
              <span style={{ whiteSpace: 'nowrap' }}>through intelligent</span><br />
              <span style={{ whiteSpace: 'nowrap', color: '#7dd3fc' }}>online assessments</span>
            </motion.h1>

            <motion.p style={{ fontSize: '18px', lineHeight: 1.6, color: '#475569', maxWidth: '580px', marginTop: '-8px' }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.22 }}>
              Conduct secure recruitment assessments with instant evaluation and performance insights.
            </motion.p>

            <motion.div className="hero-actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.32 }}>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Link to="/register" className="btn-primary" style={{ fontSize: 16, padding: '16px 42px', borderRadius: '9999px', background: '#3b82f6', color: '#fff', border: 'none', fontWeight: 600, display: 'inline-flex' }}>
                  Create One
                </Link>
              </motion.div>
            </motion.div>

            <motion.div className="hero-trust" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.44 }}>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 32 }} className="trust-stats">
                {STATS.map((s) => (
                  <div key={s.label} className="stat-card-new stat-card-hero" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', minWidth: '140px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', justifyContent: 'center' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <s.icon size={18} color={s.color} />
                      </div>
                      <div className="stat-val" style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>{s.value}</div>
                    </div>
                    <div className="stat-label" style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textAlign: 'center' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <motion.div className="hero-visual" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <div className="hero-visual-card hero-visual-card-large card-lift">
              <AdminMock />
            </div>
          </motion.div>
        </div>
      </motion.section>


      {/* Features Section */}
      <section id="features" className="section">
        <div className="section-container">
          <motion.div {...fadeUp()} style={{ textAlign: 'center', marginBottom: 60 }}>
            <motion.div
              className="section-badge"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <Zap size={14} /> Powerful Features
            </motion.div>
            <h2 className="section-title">Everything you need to manage exams</h2>
            <p className="section-desc">
              Empower your classroom with secure exam delivery, student management, and analytics built for fast, fair assessment.
            </p>
          </motion.div>

          <div className="feature-grid-new">
            {FEATURES.map(({ icon: Icon, color, title, desc }, i) => (
              <motion.div key={title} className="feature-card-new" {...stagger(0.1 + i * 0.08)} whileHover={{ y: -10 }}>
                <motion.div className="feature-icon-wrap" style={{ background: `${color}15`, borderColor: `${color}30` }} whileHover={{ scale: 1.06 }}>
                  <Icon size={26} color={color} />
                </motion.div>
                <h3 className="feature-title">{title}</h3>
                <p className="feature-desc">{desc}</p>
                <div className="feature-link">
                  <span>Learn more</span>
                  <ChevronRight size={14} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="section" style={{ background: 'var(--glass-bg)' }}>
        <div className="section-container">
          <motion.div {...fadeUp()} style={{ textAlign: 'center', marginBottom: 60 }}>
            <motion.div
              className="section-badge"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <BarChart3 size={14} /> How It Works
            </motion.div>
            <h2 className="section-title">Get started in three simple steps</h2>
            <p className="section-desc">
              From setup to results, AssessSphere streamlines the entire exam lifecycle.
            </p>
          </motion.div>

          <div className="steps-grid">
            {STEPS.map(({ icon: Icon, title, desc, gradient }, i) => (
              <motion.div key={title} className="step-card" {...fadeUp(0.15 + i * 0.1)} whileHover={{ y: -8 }}>
                <div className="step-number">{`0${i + 1}`}</div>
                <motion.div className={`step-icon-wrap bg-gradient-to-br ${gradient}`} whileHover={{ scale: 1.06 }}>
                  <Icon size={22} color="#fff" />
                </motion.div>
                <h3 className="step-title">{title}</h3>
                <p className="step-desc">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="cta-section">
        <motion.div
          className="cta-banner-new"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
        >
          <div className="cta-glow" />
          <motion.div
            className="cta-content"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <motion.div
              className="cta-badge"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <Sparkles size={14} /> Get Started Today
            </motion.div>
            <h2 className="cta-title">Ready to launch your first exam?</h2>
            <p className="cta-desc">
              Start building secure assessments, invite students with private links, and review results instantly from a polished teacher dashboard.
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/register" className="btn-primary cta-btn">
                Create Account Now
                <ArrowRight size={20} />
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-grid">
            {/* Brand Column */}
            <div className="footer-col footer-brand-col">
              <motion.div
                className="footer-logo"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <img src={logo} alt="AssessSphere Logo" style={{ width: 42, height: 42, borderRadius: 12, objectFit: 'contain' }} />
                <span className="footer-logo-text grad">AssessSphere</span>
              </motion.div>
              <p className="footer-brand-desc">
                Create, share, and track results easily with a secure online quiz and test maker platform.
              </p>
              <div className="footer-contact">
                <div className="footer-contact-item">
                  <Mail size={14} />
                  <span>support@assesssphere.com</span>
                </div>
                <div className="footer-contact-item">
                  <MapPin size={14} />
                  <span>San Francisco, CA, USA</span>
                </div>
              </div>

            </div>

            {/* Quick Links */}
            <div className="footer-col">
              <h4 className="footer-heading">Quick Links</h4>
              <ul className="footer-list">
                {[
                  { label: 'Home', href: '/' },
                  { label: 'Features', href: '#features' },
                  { label: 'How It Works', href: '#how-it-works' },
                  { label: 'Pricing', href: '#' },
                  { label: 'FAQs', href: '#' },
                ].map((link) => (
                  <li key={link.label}>
                    <motion.a
                      href={link.href}
                      className="footer-link"
                      whileHover={{ x: 4 }}
                    >
                      {link.label}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div className="footer-col">
              <h4 className="footer-heading">Support</h4>
              <ul className="footer-list">
                {[
                  { label: 'Help Center', href: '#' },
                  { label: 'Video Tutorials', href: '#' },
                  { label: 'Blog', href: '#' },
                  { label: 'Contact Us', href: '#' },
                  { label: 'Portal Status', href: '#' },
                ].map((link) => (
                  <li key={link.label}>
                    <motion.a
                      href={link.href}
                      className="footer-link"
                      whileHover={{ x: 4 }}
                    >
                      {link.label}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal & Social */}
            <div className="footer-col">
              <h4 className="footer-heading">Legal</h4>
              <ul className="footer-list">
                {[
                  { label: 'Privacy Policy', href: '#' },
                  { label: 'Terms & Conditions', href: '#' },
                  { label: 'Cookie Policy', href: '#' },
                  { label: 'Refund Policy', href: '#' },
                ].map((link) => (
                  <li key={link.label}>
                    <motion.a
                      href={link.href}
                      className="footer-link"
                      whileHover={{ x: 4 }}
                    >
                      {link.label}
                    </motion.a>
                  </li>
                ))}
              </ul>
              <div className="footer-social-wrap">
                <h4 className="footer-heading" style={{ marginTop: 24 }}>Follow Us</h4>
                <div className="footer-social">
                  {[
                    { icon: Globe, href: '#', color: '#1877F2' },
                    { icon: Camera, href: '#', color: '#E4405F' },
                    { icon: MessageCircle, href: '#', color: '#25D366' },
                    { icon: Share2, href: '#', color: '#0A66C2' },
                    { icon: Play, href: '#', color: '#FF0000' },
                  ].map(({ icon: Icon, href, color }) => (
                    <motion.a
                      key={href}
                      href={href}
                      className="footer-social-icon"
                      style={{ '--social-color': color }}
                      whileHover={{ y: -4, scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Icon size={16} />
                    </motion.a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="footer-bottom">
            <div className="footer-bottom-inner">
              <div className="footer-legal-links">
                <a href="#">Privacy Policy</a>
                <span className="footer-sep">|</span>
                <a href="#">Terms & Conditions</a>
              </div>
                <p className="footer-copy">
                &copy; 2026 AssessSphere. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
