import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { ScanFace, ArrowLeft, ArrowRight, CheckCircle, X, Check, Camera, WifiOff, AlertTriangle } from "lucide-react";

/**
 * FaceEnrollment Component - v2 (Python Service Integration)
 *
 * No longer uses face-api.js. Instead:
 * 1. Captures raw images from the camera
 * 2. Sends them directly to the backend (which calls the Python dlib service)
 * 3. Supports multi-capture enrollment (3 photos: front, left, right) for cross-device robustness
 */
const CAPTURE_STEPS = [
  { label: 'Look straight at the camera', hint: 'Center your face in the oval', icon: ScanFace },
  { label: 'Turn slightly to the left', hint: 'Just a small turn — keep face inside oval', icon: ArrowLeft },
  { label: 'Turn slightly to the right', hint: 'Last one! Small turn to the right', icon: ArrowRight },
];

const FaceEnrollment = ({ email, onFaceEnrolled, onClose }) => {
  const [stream, setStream] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [serviceOffline, setServiceOffline] = useState(false);
  const [captureStep, setCaptureStep] = useState(0);
  const [capturedCount, setCapturedCount] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const videoRef = useRef(null);

  // Start webcam
  useEffect(() => {
    const startWebcam = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        setError('Camera access denied. Please enable camera permissions and try again.');
      }
    };
    startWebcam();
  }, []);

  // Attach stream to video element when it becomes available
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Stop webcam on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const captureAndUpload = async () => {
    if (!stream || !videoRef.current) {
      setError('Camera is not ready yet. Please wait a moment.');
      return;
    }
    if (videoRef.current.readyState < 2) {
      setError('Video is still loading. Please wait a second and try again.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const video = videoRef.current;

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);

      const blob = await new Promise(resolve =>
        canvas.toBlob(resolve, 'image/jpeg', 0.92)
      );

      if (!blob) throw new Error('Failed to capture image from camera');

      const ua = navigator.userAgent;
      let deviceType = 'web';
      if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) deviceType = 'tablet';
      else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry/i.test(ua)) deviceType = 'mobile';

      const stepLabels = ['front', 'left', 'right'];
      const label = stepLabels[captureStep] || 'front';

      const formData = new FormData();
      formData.append('face_image', blob, 'face.jpg');
      formData.append('device_type', deviceType);
      formData.append('label', label);
      if (email) formData.append('email', email);

      const response = await api.post('/auth/enroll-face', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      });

      const data = response.data;
      const nextStep = captureStep + 1;
      setCapturedCount(prev => prev + 1);

      if (nextStep < CAPTURE_STEPS.length) {
        setCaptureStep(nextStep);
        setError('');
      } else {
        setIsDone(true);
        if (stream) stream.getTracks().forEach(track => track.stop());
        setTimeout(() => { onFaceEnrolled(data); }, 1500);
      }

    } catch (err) {
      // ── Face service offline (503) — show dedicated screen ──
      if (err.response?.status === 503) {
        setServiceOffline(true);
        if (stream) stream.getTracks().forEach(track => track.stop());
        return;
      }

      const errMsg = err.response?.data?.error === 'no_face_detected'
        ? 'No face detected. Move to better lighting, remove obstructions, and look directly at the camera.'
        : err.response?.data?.message || err.message || 'Failed to enroll face. Please try again.';
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const currentStep = CAPTURE_STEPS[captureStep] || CAPTURE_STEPS[0];
  const progress = (capturedCount / CAPTURE_STEPS.length) * 100;

  // ── Service Offline Screen ──
  if (serviceOffline) {
    return (
      <div
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(14px)', padding: '20px' }}
        onClick={onClose}
      >
        <div
          style={{ width: '100%', maxWidth: '480px', background: '#fff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 30px 100px rgba(0,0,0,0.55)', padding: '40px', textAlign: 'center' }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#fef2f2', border: '3px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <WifiOff style={{ width: '36px', height: '36px', color: '#dc2626' }} />
          </div>
          <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>Face Service Offline</h3>
          <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.6', marginBottom: '8px' }}>
            The face recognition service is currently unavailable on the server.
          </p>
          <p style={{ fontSize: '13px', color: '#9ca3af', lineHeight: '1.6', marginBottom: '28px' }}>
            Face enrollment requires the Python face recognition microservice. Please contact your system administrator.
          </p>
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '28px', textAlign: 'left' }}>
            <AlertTriangle style={{ width: '18px', height: '18px', color: '#d97706', flexShrink: 0, marginTop: '1px' }} />
            <p style={{ fontSize: '12px', color: '#92400e', margin: 0, lineHeight: '1.5' }}>
              <strong>Admin:</strong> Ensure <code>FACE_SERVICE_URL</code> is set and the Python service is running.
            </p>
          </div>
          <button onClick={onClose} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(14px)', padding: '20px' }}
      onClick={onClose}
    >
      <div
        style={{ width: '100%', maxWidth: '560px', background: 'linear-gradient(145deg, #fff, #f8faff)', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 30px 100px rgba(0,0,0,0.55)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                Enroll Face — Step {captureStep + 1} of {CAPTURE_STEPS.length}
              </h3>
              {email && <p style={{ margin: '3px 0 0', fontSize: '12px', opacity: 0.85 }}>{email}</p>}
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.18)', border: 'none', borderRadius: '8px', color: 'white', fontSize: '22px', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <div style={{ marginTop: '12px', height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px' }}>
            <div style={{ height: '100%', borderRadius: '4px', background: 'rgba(255,255,255,0.9)', width: `${progress}%`, transition: 'width 0.4s ease' }} />
          </div>
        </div>

        {/* Instruction Banner */}
        <div style={{ padding: '14px 24px', background: '#f0f4ff', borderBottom: '1px solid #e0e7ff', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isDone ? <CheckCircle className="w-8 h-8 text-emerald-500" /> : <currentStep.icon className="w-8 h-8 text-indigo-500" />}
          <div>
            <div style={{ fontWeight: 700, color: '#1e1b4b', fontSize: '15px' }}>
              {isDone ? 'Enrollment Complete!' : currentStep.label}
            </div>
            <div style={{ fontSize: '13px', color: '#6366f1' }}>
              {isDone ? `${CAPTURE_STEPS.length} face samples saved — works on all devices!` : currentStep.hint}
            </div>
          </div>
        </div>

        {/* Video Feed */}
        <div style={{ position: 'relative', background: '#000', lineHeight: 0 }}>
          <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', maxHeight: '340px', objectFit: 'cover', display: isDone ? 'none' : 'block', transform: 'scaleX(-1)' }} />
          {isDone && (
            <div style={{ width: '100%', height: '200px', background: 'linear-gradient(135deg, #4ade80, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}>
              <CheckCircle className="w-16 h-16 text-white" />
              <div style={{ color: 'white', fontWeight: 700, fontSize: '18px' }}>Face Enrolled Successfully!</div>
            </div>
          )}
          {!isDone && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '200px', height: '260px', border: '3px solid rgba(139, 92, 246, 0.9)', borderRadius: '50%', pointerEvents: 'none', boxShadow: '0 0 0 9999px rgba(0,0,0,0.35), inset 0 0 20px rgba(139,92,246,0.1)' }} />
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '18px 24px', background: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
          {error && (
            <div style={{ marginBottom: '12px', padding: '11px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '13px' }}>
              {error}
            </div>
          )}

          {/* Step indicators */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', justifyContent: 'center' }}>
            {CAPTURE_STEPS.map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: i < capturedCount ? '#dcfce7' : i === captureStep ? '#ede9fe' : '#f3f4f6', color: i < capturedCount ? '#16a34a' : i === captureStep ? '#7c3aed' : '#9ca3af' }}>
                {i < capturedCount ? <Check className="w-3 h-3" /> : i + 1} {step.label.split(' ')[0]}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={captureAndUpload}
              disabled={isLoading || isDone}
              style={{ flex: 1, padding: '13px', borderRadius: '10px', border: 'none', background: isLoading || isDone ? 'linear-gradient(135deg, #9ca3af, #9ca3af)' : 'linear-gradient(135deg, #7c3aed, #5b21b6)', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: isLoading || isDone ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease' }}
            >
              {isLoading ? 'Uploading...' : isDone ? 'Done!' : captureStep === 0
                ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}><Camera className="w-5 h-5" /> Capture Face</span>
                : <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}><Camera className="w-5 h-5" /> Capture ({captureStep + 1}/{CAPTURE_STEPS.length})</span>}
            </button>
            <button onClick={onClose} style={{ padding: '13px 20px', borderRadius: '10px', border: '1px solid #d1d5db', background: '#fff', color: '#374151', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>

          <p style={{ margin: '10px 0 0', fontSize: '11px', color: '#9ca3af', textAlign: 'center' }}>
            3 photos are required for cross-device accuracy (mobile ↔ webcam)
          </p>
        </div>
      </div>
    </div>
  );
};

export default FaceEnrollment;
