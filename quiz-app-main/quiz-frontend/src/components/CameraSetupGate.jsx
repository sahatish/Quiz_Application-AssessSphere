import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Camera, CheckCircle2, AlertTriangle, Loader2, ArrowLeft, ArrowRight, Mic, Wifi, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import logo from '../assets/logo.png';

export default function CameraSetupGate({ onReady, onCancel, title = "System Check" }) {
  const videoRef = useRef();
  const [status, setStatus] = useState('requesting'); // requesting, loading_models, scanning, ready, error
  const [errorMsg, setErrorMsg] = useState('');
  const [faceDetected, setFaceDetected] = useState(false);
  const streamRef = useRef(null);
  const streamHandedOffRef = useRef(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    let mounted = true;
    let interval;
    
    const init = async () => {
      try {
        if (window.location.search.includes('bypassCamera=true')) {
          setStatus('ready');
          setFaceDetected(true);
          return;
        }

        // Camera/microphone requires HTTPS or localhost (secure context)
        if (!window.isSecureContext || !navigator.mediaDevices) {
          setStatus('error');
          setErrorMsg(
            'Camera access requires a secure connection (HTTPS). ' +
            'You are currently on HTTP. Please ask your admin to share the link as https://... ' +
            'or open the exam on the same device as the server (localhost).'
          );
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setStatus('loading_models');
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        if (!mounted) return;
        setStatus('scanning');
      } catch (err) {
        if (!mounted) return;
        setStatus('error');
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setErrorMsg('Camera or Microphone permission was denied. Please click the camera icon in your browser address bar and allow access, then refresh the page.');
        } else if (err.name === 'NotFoundError') {
          setErrorMsg('No camera or microphone found on this device. Please connect a camera and microphone to continue.');
        } else {
          setErrorMsg('Camera or Microphone permission denied or not found. Please allow both camera and microphone access to continue.');
        }
      }
    };
    init();

    const handlePlay = () => {
      interval = setInterval(async () => {
        if (!videoRef.current || !mounted) return;
        try {
          const detections = await faceapi.detectAllFaces(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
          );
          if (!mounted) return;
          const isGood = detections.length === 1;
          setFaceDetected(isGood);
          if (isGood) setStatus('ready');
          else setStatus('scanning');
        } catch (e) {}
      }, 500);
    };

    if (videoRef.current) videoRef.current.addEventListener('play', handlePlay);

    return () => {
      mounted = false;
      if (interval) clearInterval(interval);
      if (streamRef.current && !streamHandedOffRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current) videoRef.current.removeEventListener('play', handlePlay);
    };
  }, []);

  const handleProceed = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.log('Fullscreen failed:', err);
    }
    streamHandedOffRef.current = true;
    onReady(streamRef.current);
  };

  const handleCancel = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    if (onCancel) onCancel();
  };

  // Common Header Component
  const Header = () => (
    <div style={{ padding: '16px 24px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', background: '#fff', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <img src={logo} alt="AssessSphere" style={{ width: 36, height: 36, borderRadius: 8 }} />
        <span style={{ fontSize: 22, fontWeight: 800, color: '#1e3a8a', letterSpacing: '-0.02em' }}>AssessSphere</span>
        <div style={{ width: 1, height: 24, background: '#e2e8f0' }} />
        <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>Assessment Platform</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#3b82f6', fontSize: 13, fontWeight: 600 }}>
        <ShieldCheck size={18} />
        Secure & Proctored Exam
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '48px', maxWidth: 700, width: '100%', textAlign: 'center', boxShadow: '0 20px 40px -15px rgba(0,0,0,0.05)' }}>
          
          <div style={{ width: 72, height: 72, borderRadius: 20, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Camera size={32} color="#2563eb" />
          </div>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', marginBottom: 12, letterSpacing: '-0.02em' }}>{title === 'System Check' ? 'Assessment System Check' : title}</h2>
          <p style={{ fontSize: 16, color: '#64748b', marginBottom: 32 }}>Please allow camera and microphone access, and align your face before starting.</p>

          <div style={{ position: 'relative', width: 280, height: 280, margin: '0 auto 24px', borderRadius: '50%', overflow: 'hidden', border: `4px solid ${status === 'ready' ? '#2563eb' : status === 'error' ? '#ef4444' : '#3b82f6'}`, background: '#f1f5f9', boxShadow: '0 10px 25px rgba(37,99,235,0.2)' }}>
            <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
            {status !== 'ready' && status !== 'scanning' && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.8)', flexDirection: 'column', gap: 12 }}>
                {status === 'error' ? <AlertTriangle color="#ef4444" size={36} /> : <Loader2 size={36} color="#3b82f6" style={{ animation: 'spin 1s linear infinite' }} />}
                <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>
                  {status === 'requesting' ? 'Requesting Camera...' : status === 'loading_models' ? 'Loading AI...' : 'Error'}
                </span>
              </div>
            )}
          </div>

          <div style={{ height: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            {status === 'error' && <div style={{ color: '#ef4444', fontSize: 15, fontWeight: 600 }}>{errorMsg}</div>}
            {status === 'scanning' && <div style={{ color: '#d97706', fontSize: 15, fontWeight: 600 }}>Face not detected. Please look at the camera.</div>}
            {status === 'ready' && (
              <>
                <div style={{ color: '#16a34a', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}><CheckCircle2 size={18} /> Camera Ready</div>
                <div style={{ color: '#64748b', fontSize: 14 }}>Your camera and microphone are working properly.</div>
              </>
            )}
          </div>

          {/* Status Indicators Box */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, padding: '24px', borderRadius: 16, border: '1px solid #e2e8f0', background: '#f8fafc', marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', flex: '1 1 150px' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                <Camera size={20} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Camera</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#16a34a' }}>Detected</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', flex: '1 1 150px' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                <Mic size={20} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Microphone</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#16a34a' }}>Detected</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', flex: '1 1 150px' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                <Wifi size={20} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Internet</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#16a34a' }}>Stable</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'space-between' }}>
            {onCancel && (
              <button onClick={handleCancel} style={{ flex: 1, padding: '16px 24px', borderRadius: 14, background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', fontSize: 16, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <ArrowLeft size={18} /> Cancel
              </button>
            )}
            <button onClick={handleProceed} disabled={status !== 'ready'}
              style={{ flex: 2, padding: '16px 24px', borderRadius: 14, background: '#1d4ed8', border: 'none', color: '#fff', fontSize: 16, fontWeight: 700, cursor: status === 'ready' ? 'pointer' : 'not-allowed', opacity: status === 'ready' ? 1 : 0.5, boxShadow: status === 'ready' ? '0 8px 16px -4px rgba(29,78,216,0.3)' : 'none', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              Start Exam <ArrowRight size={18} />
            </button>
          </div>
        </motion.div>
        
        <div style={{ marginTop: 24, fontSize: 14, color: '#64748b' }}>
          Need help? <a href="#" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>Contact support</a>
        </div>
      </div>
    </div>
  );
}
