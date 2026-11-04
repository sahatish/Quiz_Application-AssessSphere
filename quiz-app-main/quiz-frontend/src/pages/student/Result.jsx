import { motion } from 'framer-motion'
import { Check, Info, ShieldCheck } from 'lucide-react'
import logo from '../../assets/logo.png'

export default function Result() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative' }}>
      
      {/* Logo Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <img src={logo} alt="AssessSphere" style={{ width: 40, height: 40, borderRadius: 12, objectFit: 'contain', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }} />
        <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.5px' }}>AssessSphere</span>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 24, padding: '40px', maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}
      >
        {/* Success Icon */}
        <div style={{ position: 'relative', width: 96, height: 96, margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'var(--primary)', opacity: 0.1, borderRadius: '50%', animation: 'pulse 2s infinite' }}></div>
          <div style={{ position: 'relative', zIndex: 10, width: 64, height: 64, background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(37,99,235,0.2)' }}>
            <Check size={32} color="#fff" strokeWidth={3} />
          </div>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-main)', marginBottom: 12, letterSpacing: '-0.5px' }}>
          Submitted Successfully!
        </h1>

        <p style={{ color: 'var(--text-sec)', fontSize: 15, lineHeight: 1.6, marginBottom: 32, padding: '0 16px' }}>
          Your exam has been recorded. Thank you for completing the assessment.
        </p>

        {/* Info Box */}
        <div style={{ background: 'var(--primary)', borderRadius: 16, padding: '20px', textAlign: 'left', color: '#fff', boxShadow: '0 8px 16px rgba(37,99,235,0.15)', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 16, transition: 'transform 0.2s', cursor: 'default' }}>
          <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '50%', padding: 6, flexShrink: 0 }}>
            <Info size={24} color="#fff" strokeWidth={2.5} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 4px', letterSpacing: '0.2px' }}>Results will be declared soon</h3>
            <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, margin: 0 }}>You may now safely close this window.</p>
          </div>
        </div>

        {/* Divider with Shield */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '100%', borderTop: '1px solid var(--glass-border)' }}></div>
          </div>
          <div style={{ position: 'relative', background: 'var(--glass-bg)', padding: '0 16px', color: 'var(--primary)' }}>
            <ShieldCheck size={20} />
          </div>
        </div>

      </motion.div>
    </div>
  )
}
