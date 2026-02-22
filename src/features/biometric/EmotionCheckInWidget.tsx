/**
 * EmotionCheckInWidget.tsx
 *
 * Security / privacy rules:
 *  1. Widget is fully DISABLED until biometric consent is accepted.
 *  2. Camera access is requested lazily (only when user clicks "Use Camera").
 *  3. Image is captured → base64 → sent ONLY to backend proxy /api/ai/emotion-detect.
 *     The raw base64 string is NEVER written to the DOM or localStorage.
 *  4. If getUserMedia is unavailable the widget silently falls back to file upload.
 *  5. If the AI endpoint fails we show a fallback message (no crash, no empty state).
 *  6. Results include the mandatory disclaimer from the backend response.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, Eye, AlertTriangle } from 'lucide-react';
import { BiometricOptInModal } from './BiometricOptInModal';
import { http } from '../../api/http';
import type { EmotionDetectResponse } from '../mood/types';
import styles from './Biometric.module.css';

// ── Consent helpers ───────────────────────────────────────────────────────────

function hasBiometricConsent(): boolean {
    try {
        const prefs = JSON.parse(localStorage.getItem('consent_prefs') ?? '{}') as Record<string, boolean>;
        return prefs['biometric_emotion'] === true;
    } catch { return false; }
}

// ── API ────────────────────────────────────────────────────────────────────────

const FALLBACK_RESULT: EmotionDetectResponse = {
    dominantEmotion: 'Unavailable',
    emotions: [
        { label: 'Neutral', confidence: 0.5 },
        { label: 'Calm', confidence: 0.3 },
        { label: 'Uncertain', confidence: 0.2 },
    ],
    disclaimer:
        'AI emotion detection is unavailable right now. The above values are placeholder only. ' +
        'This feature is for general self-awareness and is NOT medical advice.',
};

async function detectEmotion(imageBase64: string, context: string): Promise<EmotionDetectResponse> {
    try {
        // Note: base64 payload is sent server-to-AI; our backend strips it before logging
        return await http.post<EmotionDetectResponse>('/ai/emotion-detect', { imageBase64, context });
    } catch {
        return FALLBACK_RESULT;
    }
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
    /** Optional context string forwarded to the backend for better accuracy */
    context?: string;
}

export function EmotionCheckInWidget({ context = 'mood check-in' }: Props) {
    const navigate = useNavigate();

    const [consented, setConsented] = useState(hasBiometricConsent());
    const [showModal, setShowModal] = useState(false);

    const [hasCamera, setHasCamera] = useState<boolean | null>(null);   // null = not yet checked
    const [streaming, setStreaming] = useState(false);
    const [captured, setCaptured] = useState<string | null>(null);    // data URL for preview only
    const [capturedBase64, setCapturedBase64] = useState<string | null>(null); // raw base64 (never in DOM)

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<EmotionDetectResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    // Detect camera availability once
    useEffect(() => {
        if (!consented) return;
        const supported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        setHasCamera(supported);
        return () => { stopCamera(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [consented]);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        setStreaming(false);
    }, []);

    const startCamera = useCallback(async () => {
        setError(null);
        setCaptured(null);
        setCapturedBase64(null);
        setResult(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
            setStreaming(true);
        } catch {
            setHasCamera(false);   // fall back to file upload silently
        }
    }, []);

    const captureFrame = useCallback(() => {
        if (!videoRef.current) return;
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        // data URL = "data:image/jpeg;base64,<BASE64>"
        const base64 = dataUrl.split(',')[1] ?? '';
        setCaptured(dataUrl);        // for preview img src
        setCapturedBase64(base64);   // only ever used at analysis time
        stopCamera();
    }, [stopCamera]);

    const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setError(null);
        setCaptured(null);
        setCapturedBase64(null);
        setResult(null);
        const reader = new FileReader();
        reader.onload = ev => {
            const dataUrl = ev.target?.result as string;
            const base64 = dataUrl.split(',')[1] ?? '';
            setCaptured(dataUrl);
            setCapturedBase64(base64);
        };
        reader.readAsDataURL(file);
        // Reset input so the same file can be re-selected
        e.target.value = '';
    }, []);

    const analyze = useCallback(async () => {
        if (!capturedBase64) return;
        setIsAnalyzing(true);
        setError(null);
        setResult(null);
        // base64 payload is consumed here and discarded after the request; never stored
        const res = await detectEmotion(capturedBase64, context);
        setCapturedBase64(null);   // discard immediately after send
        setResult(res);
        setIsAnalyzing(false);
    }, [capturedBase64, context]);

    const reset = () => {
        stopCamera();
        setCaptured(null);
        setCapturedBase64(null);
        setResult(null);
        setError(null);
    };

    // ── Consent gate ───────────────────────────────────────────────────────────

    if (!consented) {
        return (
            <>
                <BiometricOptInModal
                    isOpen={showModal}
                    onAccept={() => { setShowModal(false); setConsented(true); }}
                    onDecline={() => setShowModal(false)}
                />
                <div className={styles.widget}>
                    <div className={styles.widgetHeader}>
                        <h2 className={styles.widgetTitle}>
                            Emotion Check-In
                            <span className={styles.betaBadge}>Beta</span>
                        </h2>
                    </div>
                    <div className={styles.consentRequired}>
                        <Eye size={36} style={{ color: '#c4b5fd' }} aria-hidden="true" />
                        <p style={{ margin: 0 }}>
                            Enable <strong>Biometric Consent</strong> to use AI-powered emotion detection
                            via your camera.
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>
                            No images are stored. You can withdraw consent at any time.
                        </p>
                        <button
                            type="button"
                            className={styles.consentBtn}
                            onClick={() => setShowModal(true)}
                        >
                            Enable Emotion Check-In
                        </button>
                        <button
                            type="button"
                            style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '0.8125rem', cursor: 'pointer', fontFamily: 'inherit' }}
                            onClick={() => navigate('/consent')}
                        >
                            Manage Privacy Settings
                        </button>
                    </div>
                </div>
            </>
        );
    }

    // ── Main widget ────────────────────────────────────────────────────────────

    return (
        <div className={styles.widget}>
            <div className={styles.widgetHeader}>
                <h2 className={styles.widgetTitle}>
                    Emotion Check-In
                    <span className={styles.betaBadge}>Beta</span>
                </h2>
                <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit' }}
                    onClick={reset}
                    aria-label="Reset emotion check-in"
                >
                    Reset
                </button>
            </div>

            {/* Capture area */}
            {!result && (
                <div className={styles.captureArea} aria-label="Camera or image preview">
                    {streaming && (
                        /* eslint-disable-next-line jsx-a11y/media-has-caption */
                        <video
                            ref={videoRef}
                            className={styles.videoEl}
                            playsInline
                            muted
                            aria-label="Camera preview"
                        />
                    )}
                    {captured && !streaming && (
                        <img
                            src={captured}
                            alt="Captured frame for emotion analysis"
                            className={styles.imagePrev}
                        />
                    )}
                    {!streaming && !captured && (
                        <div className={styles.cameraPlaceholder}>
                            <Camera size={40} aria-hidden="true" />
                            <span>Use camera or upload a photo</span>
                        </div>
                    )}
                </div>
            )}

            {/* Result */}
            {result && (
                <div className={styles.resultCard} role="region" aria-label="Emotion detection result">
                    <p className={styles.dominantEmotion}>
                        Detected: <strong>{result.dominantEmotion}</strong>
                    </p>
                    <div className={styles.emotionBars} aria-label="Emotion confidence scores">
                        {result.emotions.slice(0, 6).map(e => (
                            <div key={e.label} className={styles.emotionBar}>
                                <span className={styles.barLabel}>{e.label}</span>
                                <div className={styles.barTrack} role="progressbar" aria-valuenow={Math.round(e.confidence * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={e.label}>
                                    <div className={styles.barFill} style={{ width: `${Math.round(e.confidence * 100)}%` }} />
                                </div>
                                <span className={styles.barPct}>{Math.round(e.confidence * 100)}%</span>
                            </div>
                        ))}
                    </div>
                    <p className={styles.resultDisclaimer} role="note">
                        <AlertTriangle size={12} style={{ display: 'inline', marginRight: '0.25rem', verticalAlign: 'text-bottom' }} aria-hidden="true" />
                        {result.disclaimer}
                    </p>
                </div>
            )}

            {/* Controls */}
            {!result && (
                <div className={styles.controls}>
                    {/* Camera */}
                    {hasCamera !== false && !streaming && !captured && (
                        <button
                            type="button"
                            className={styles.captureBtn}
                            onClick={startCamera}
                            aria-label="Start camera"
                        >
                            <Camera size={15} aria-hidden="true" />
                            Use Camera
                        </button>
                    )}
                    {streaming && (
                        <button
                            type="button"
                            className={styles.captureBtn}
                            onClick={captureFrame}
                            aria-label="Take snapshot"
                        >
                            <Camera size={15} aria-hidden="true" />
                            Snap
                        </button>
                    )}

                    {/* File upload fallback */}
                    <label className={styles.uploadLabel} htmlFor="emotion-file-upload">
                        <Upload size={14} aria-hidden="true" />
                        Upload Photo
                        <input
                            id="emotion-file-upload"
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleFileUpload}
                            aria-label="Upload a photo for emotion detection"
                        />
                    </label>

                    {/* Analyze */}
                    <button
                        type="button"
                        className={styles.analyzeBtn}
                        disabled={!captured || isAnalyzing}
                        onClick={analyze}
                        aria-label="Analyse captured image for emotions"
                    >
                        {isAnalyzing
                            ? <><span className={styles.spinner} aria-hidden="true" /> Analysing…</>
                            : <><Eye size={14} aria-hidden="true" /> Analyse</>
                        }
                    </button>
                </div>
            )}

            {result && (
                <button
                    type="button"
                    className={styles.captureBtn}
                    onClick={reset}
                    style={{ alignSelf: 'flex-start' }}
                >
                    Try Again
                </button>
            )}

            {error && <p className={styles.errorMsg} role="alert">{error}</p>}

            {/* Crisis link — always visible */}
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0, lineHeight: 1.6 }}>
                <AlertTriangle size={11} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '0.25rem' }} aria-hidden="true" />
                AI emotion results are <strong>not medical advice</strong>. If you are in distress,{' '}
                <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: '#9a3412', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', padding: 0 }}
                    onClick={() => navigate('/crisis')}
                >
                    get help now
                </button>.
            </p>
        </div>
    );
}
