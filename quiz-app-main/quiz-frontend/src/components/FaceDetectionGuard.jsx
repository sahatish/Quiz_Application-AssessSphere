import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

const SCAN_MS = 350;
const MULTI_FACE_TICKS = 5;
const NO_FACE_TICKS = 8;
const PERSON_WARN_TICKS = 3;
const PERSON_SCAN_EVERY = 2;
const WARN_DISPLAY_MS = 5000;

const FACE_OPTS = new faceapi.TinyFaceDetectorOptions({
  inputSize: 320,
  scoreThreshold: 0.45,
});

export default function FaceDetectionGuard({ onViolation, sharedStream = null, isPaused = false }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [faceModelReady, setFaceModelReady] = useState(false);
  const [backgroundWarning, setBackgroundWarning] = useState(null);
  const violationCountRef = useRef({ noFace: 0, multiFace: 0, personBg: 0 });
  const isViolatingRef = useRef(false);
  const personModelRef = useRef(null);
  const scanCycleRef = useRef(0);
  const warnTimeoutRef = useRef(null);
  const scanTimerRef = useRef(null);

  const onViolationRef = useRef(onViolation);
  const isPausedRef = useRef(isPaused);
  useEffect(() => {
    onViolationRef.current = onViolation;
  }, [onViolation]);

  useEffect(() => {
    isPausedRef.current = isPaused;
    if (isPaused) {
      violationCountRef.current = { noFace: 0, multiFace: 0, personBg: 0 };
    }
  }, [isPaused]);

  const showBackgroundWarning = (message) => {
    setBackgroundWarning(message);
    if (warnTimeoutRef.current) clearTimeout(warnTimeoutRef.current);
    warnTimeoutRef.current = setTimeout(() => setBackgroundWarning(null), WARN_DISPLAY_MS);
  };

  // Load AI models — face model first (camera must not wait for COCO-SSD)
  useEffect(() => {
    let cancelled = false;

    const loadFaceModel = async () => {
      try {
        if (!faceapi.nets.tinyFaceDetector.isLoaded) {
          await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        }
        if (!cancelled) setFaceModelReady(true);
      } catch (err) {
        console.error('Failed to load face detector:', err);
      }
    };

    const loadPersonModel = async () => {
      try {
        const model = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
        if (!cancelled) personModelRef.current = model;
      } catch (err) {
        console.warn('Person detection unavailable:', err);
      }
    };

    loadFaceModel();
    loadPersonModel();

    return () => {
      cancelled = true;
      if (warnTimeoutRef.current) clearTimeout(warnTimeoutRef.current);
    };
  }, []);

  // Start camera immediately on mount (reuse setup stream when provided)
  useEffect(() => {
    if (window.location.search.includes('bypassCamera=true')) {
      setCameraReady(true);
      return;
    }
    let mounted = true;

    const attachStream = async (stream) => {
      const video = videoRef.current;
      if (!video) return false;

      streamRef.current = stream;
      video.srcObject = stream;
      video.muted = true;
      try {
        await video.play();
      } catch {
        await new Promise((r) => setTimeout(r, 300));
        await video.play().catch(() => {});
      }
      if (mounted) setCameraReady(true);
      return true;
    };

    const startCamera = async (retries = 0) => {
      try {
        let stream = sharedStream;
        const streamAlive = stream?.getVideoTracks?.().some((t) => t.readyState === 'live');

        if (!streamAlive) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
            audio: true,
          });
        }

        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        const attached = await attachStream(stream);
        if (!attached && retries < 5 && mounted) {
          setTimeout(() => startCamera(retries + 1), 100);
        }
      } catch (err) {
        if (!mounted) return;
        console.error('Error accessing webcam:', err);
        onViolationRef.current('Webcam access denied. Camera is required for this exam.');
      }
    };

    startCamera();

    return () => {
      mounted = false;
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [sharedStream]);

  // Face/person scanning once camera + face model are ready
  useEffect(() => {
    if (window.location.search.includes('bypassCamera=true')) return;
    if (!cameraReady || !faceModelReady) return;

    let mounted = true;

    const runPersonScan = async (video) => {
      const model = personModelRef.current;
      if (!model) return;

      const predictions = await model.detect(video);
      const persons = predictions.filter(
        (p) => p.class === 'person' && p.score >= 0.55
      );

      if (persons.length > 1) {
        violationCountRef.current.personBg += 1;
        if (violationCountRef.current.personBg >= PERSON_WARN_TICKS) {
          showBackgroundWarning(
            'Another person detected in the background. Please ensure you are alone.'
          );
          violationCountRef.current.personBg = 0;
        }
      } else {
        violationCountRef.current.personBg = 0;
      }
    };

    const runScan = async () => {
      if (!mounted || !videoRef.current) return;

      if (!isViolatingRef.current && !isPausedRef.current) {
        scanCycleRef.current += 1;

        try {
          const video = videoRef.current;
          const detections = await faceapi.detectAllFaces(video, FACE_OPTS);

          if (detections.length === 0) {
            violationCountRef.current.noFace += 1;
            violationCountRef.current.multiFace = 0;

            if (violationCountRef.current.noFace >= NO_FACE_TICKS) {
              isViolatingRef.current = true;
              onViolationRef.current('No face detected or looking away from camera');
              violationCountRef.current.noFace = 0;
              setTimeout(() => {
                isViolatingRef.current = false;
              }, 4000);
            }
          } else if (detections.length > 1) {
            violationCountRef.current.multiFace += 1;
            violationCountRef.current.noFace = 0;

            if (violationCountRef.current.multiFace >= MULTI_FACE_TICKS) {
              isViolatingRef.current = true;
              onViolationRef.current('Multiple faces detected in camera');
              violationCountRef.current.multiFace = 0;
              setTimeout(() => {
                isViolatingRef.current = false;
              }, 4000);
            }
          } else {
            violationCountRef.current.noFace = 0;
            violationCountRef.current.multiFace = 0;
          }

          if (
            scanCycleRef.current % PERSON_SCAN_EVERY === 0 &&
            personModelRef.current
          ) {
            await runPersonScan(video);
          }
        } catch (error) {
          console.error('Face detection error:', error);
        }
      }

      if (mounted) {
        scanTimerRef.current = setTimeout(runScan, SCAN_MS);
      }
    };

    runScan();

    return () => {
      mounted = false;
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    };
  }, [cameraReady, faceModelReady]);

  // Voice/Audio activity detection
  useEffect(() => {
    if (window.location.search.includes('bypassCamera=true')) return;
    if (!cameraReady || !streamRef.current) return;

    let audioContext;
    let analyser;
    let source;
    let checkInterval;

    try {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (!audioTrack) {
        console.warn("No audio track found in proctoring stream.");
        return;
      }

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioContext = new AudioContextClass();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;

      source = audioContext.createMediaStreamSource(streamRef.current);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let consecutiveVoiceTicks = 0;
      checkInterval = setInterval(() => {
        if (isViolatingRef.current || isPausedRef.current) {
          consecutiveVoiceTicks = 0;
          return;
        }

        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const averageVolume = sum / bufferLength;

        // Threshold for speaking/noise level. Typically background hum is 1-10, speaking is 25+
        if (averageVolume > 25) {
          consecutiveVoiceTicks += 1;
          if (consecutiveVoiceTicks >= 5) { // ~1.7s of consecutive noise/speaking
            onViolationRef.current('Voice / talking detected in background');
            showBackgroundWarning('Voice/speaking detected. Please remain silent.');
            consecutiveVoiceTicks = 0;
          }
        } else {
          if (consecutiveVoiceTicks > 0) consecutiveVoiceTicks -= 1;
        }
      }, 350);

      // Attempt to resume audio context if suspended (common browser autoplay policy behavior)
      if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {});
      }
    } catch (err) {
      console.warn("Voice detection setup failed:", err);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (source) source.disconnect();
      if (audioContext) audioContext.close().catch(() => {});
    };
  }, [cameraReady]);

  const showLoadingOverlay = !cameraReady;

  return (
    <div style={{
      position: 'fixed',
      bottom: '30px',
      right: '30px',
      width: '180px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '8px',
    }}>
      {backgroundWarning && (
        <div
          style={{
            maxWidth: 260,
            padding: '10px 12px',
            borderRadius: 12,
            background: 'rgba(120, 53, 15, 0.95)',
            border: '1px solid rgba(251, 191, 36, 0.5)',
            color: '#fde68a',
            fontSize: 11,
            fontWeight: 600,
            lineHeight: 1.4,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}
        >
          ⚠️ {backgroundWarning}
        </div>
      )}
      <div style={{
        width: '180px',
        height: '135px',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
        border: backgroundWarning
          ? '2px solid rgba(251, 191, 36, 0.6)'
          : '2px solid rgba(37,99,235,0.3)',
        background: '#0d1117',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}>
        <div style={{
          padding: '6px',
          background: 'rgba(0,0,0,0.8)',
          fontSize: '10px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: backgroundWarning ? '#fbbf24' : '#4ade80',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
        }}>
          <div style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: backgroundWarning ? '#fbbf24' : '#4ade80',
            animation: 'pulse 2s infinite',
          }} />
          Proctoring Active
        </div>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)',
            visibility: cameraReady ? 'visible' : 'hidden',
          }}
        />
        {showLoadingOverlay && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.8)',
            color: 'var(--primary-400)',
            fontSize: '12px',
            fontWeight: 'bold',
            textAlign: 'center',
            padding: '8px',
          }}>
            {faceModelReady ? 'Starting camera...' : 'Loading Camera...'}
          </div>
        )}
      </div>
    </div>
  );
}
