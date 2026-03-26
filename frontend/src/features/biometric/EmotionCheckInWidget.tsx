import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, Eye, AlertTriangle } from 'lucide-react';
import { BiometricOptInModal } from './BiometricOptInModal';
import { http } from '../../api/http';
import type { EmotionDetectResponse } from '../mood/types';
import styles from './Biometric.module.css';

interface ConsentResponse {
    data: {
        consent: {
            biometricConsent: boolean;
        };
    };
}

async function detectEmotion(imageBase64: string, context: string): Promise<EmotionDetectResponse> {
    const response = await http.post<{ data: EmotionDetectResponse } | EmotionDetectResponse>(
        '/ai/emotion-detect',
        { imageBase64, context }
    );

    if (response && typeof response === 'object' && 'data' in response) {
        return response.data;
    }
    return response;
}

interface Props {
    context?: string;
}

export function EmotionCheckInWidget({ context = 'mood check-in' }: Props) {
    const navigate = useNavigate();

    const [consented, setConsented] = useState(false);
    const [loadingConsent, setLoadingConsent] = useState(true);
    const [consentError, setConsentError] = useState<string | null>(null);
    const [savingConsent, setSavingConsent] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const [hasCamera, setHasCamera] = useState<boolean | null>(null);
    const [streaming, setStreaming] = useState(false);
    const [captured, setCaptured] = useState<string | null>(null);
    const [capturedBase64, setCapturedBase64] = useState<string | null>(null);

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<EmotionDetectResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        setStreaming(false);
    }, []);

    const loadConsent = useCallback(async () => {
        setLoadingConsent(true);
        setConsentError(null);
        try {
            const response = await http.get<ConsentResponse>('/consent/me');
            setConsented(Boolean(response.data.consent.biometricConsent));
        } catch (err) {
            setConsentError((err as { message?: string }).message ?? 'Failed to load consent settings.');
            setConsented(false);
        } finally {
            setLoadingConsent(false);
        }
    }, []);

    useEffect(() => {
        void loadConsent();
    }, [loadConsent]);

    useEffect(() => {
        if (!consented) return;
        const supported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        setHasCamera(supported);
        return () => {
            stopCamera();
        };
    }, [consented, stopCamera]);

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
            setHasCamera(false);
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
        const base64 = dataUrl.split(',')[1] ?? '';
        setCaptured(dataUrl);
        setCapturedBase64(base64);
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
        reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string;
            const base64 = dataUrl.split(',')[1] ?? '';
            setCaptured(dataUrl);
            setCapturedBase64(base64);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    }, []);

    const analyze = useCallback(async () => {
        if (!capturedBase64) return;
        setIsAnalyzing(true);
        setError(null);
        setResult(null);
        try {
            const res = await detectEmotion(capturedBase64, context);
            setCapturedBase64(null);
            setResult(res);
        } catch (err) {
            const apiError = err as {
                message?: string;
                status?: number;
                code?: string;
                details?: { requiredConsent?: string };
            };
            const isBiometricConsentError =
                apiError.status === 403 &&
                (apiError.code === 'CONSENT_REQUIRED' || apiError.details?.requiredConsent === 'biometricConsent');

            if (isBiometricConsentError) {
                setConsented(false);
                setConsentError('Biometric consent is required to use emotion detection.');
                return;
            }

            setError(apiError.message ?? 'Failed to analyse emotion right now. Please try again.');
        } finally {
            setIsAnalyzing(false);
        }
    }, [capturedBase64, context]);

    const handleEnableConsent = useCallback(async () => {
        setSavingConsent(true);
        setConsentError(null);
        try {
            await http.put('/consent/me', { biometricConsent: true });
            setConsented(true);
            setShowModal(false);
        } catch (err) {
            setConsentError((err as { message?: string }).message ?? 'Failed to enable biometric consent.');
        } finally {
            setSavingConsent(false);
        }
    }, []);

    const reset = useCallback(() => {
        stopCamera();
        setCaptured(null);
        setCapturedBase64(null);
        setResult(null);
        setError(null);
    }, [stopCamera]);

    if (loadingConsent) {
        return (
            <div className={styles.widget}>
                <div className={styles.consentRequired}>
                    <p style={{ margin: 0 }}>Loading consent settings...</p>
                </div>
            </div>
        );
    }

    if (!consented) {
        return (
            <>
                <BiometricOptInModal
                    isOpen={showModal}
                    onAccept={handleEnableConsent}
                    onDecline={() => setShowModal(false)}
                    isSubmitting={savingConsent}
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
                        {consentError && (
                            <p className={styles.errorMsg} role="alert">
                                {consentError}
                            </p>
                        )}
                        <button
                            type="button"
                            className={styles.consentBtn}
                            onClick={() => setShowModal(true)}
                        >
                            Enable Emotion Check-In
                        </button>
                        <button
                            type="button"
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#9ca3af',
                                fontSize: '0.8125rem',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                            }}
                            onClick={() => navigate('/consent')}
                        >
                            Manage Privacy Settings
                        </button>
                    </div>
                </div>
            </>
        );
    }

    return (
        <div className={styles.widget}>
            <div className={styles.widgetHeader}>
                <h2 className={styles.widgetTitle}>
                    Emotion Check-In
                    <span className={styles.betaBadge}>Beta</span>
                </h2>
                <button
                    type="button"
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#9ca3af',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                    }}
                    onClick={reset}
                    aria-label="Reset emotion check-in"
                >
                    Reset
                </button>
            </div>

            {!result && (
                <div className={styles.captureArea} aria-label="Camera or image preview">
                    {streaming && (
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

            {result && (
                <div className={styles.resultCard} role="region" aria-label="Emotion detection result">
                    <p className={styles.dominantEmotion}>
                        Detected: <strong>{result.dominantEmotion}</strong>
                    </p>
                    <div className={styles.emotionBars} aria-label="Emotion confidence scores">
                        {result.emotions.slice(0, 6).map((emotion) => (
                            <div key={emotion.label} className={styles.emotionBar}>
                                <span className={styles.barLabel}>{emotion.label}</span>
                                <div
                                    className={styles.barTrack}
                                    role="progressbar"
                                    aria-valuenow={Math.round(emotion.confidence * 100)}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-label={emotion.label}
                                >
                                    <div
                                        className={styles.barFill}
                                        style={{ width: `${Math.round(emotion.confidence * 100)}%` }}
                                    />
                                </div>
                                <span className={styles.barPct}>{Math.round(emotion.confidence * 100)}%</span>
                            </div>
                        ))}
                    </div>
                    <p className={styles.resultDisclaimer} role="note">
                        <AlertTriangle
                            size={12}
                            style={{ display: 'inline', marginRight: '0.25rem', verticalAlign: 'text-bottom' }}
                            aria-hidden="true"
                        />
                        {result.disclaimer}
                    </p>
                </div>
            )}

            {!result && (
                <div className={styles.controls}>
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

                    <button
                        type="button"
                        className={styles.analyzeBtn}
                        disabled={!captured || isAnalyzing}
                        onClick={analyze}
                        aria-label="Analyse captured image for emotions"
                    >
                        {isAnalyzing ? (
                            <>
                                <span className={styles.spinner} aria-hidden="true" /> Analysing...
                            </>
                        ) : (
                            <>
                                <Eye size={14} aria-hidden="true" /> Analyse
                            </>
                        )}
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

            {error && (
                <p className={styles.errorMsg} role="alert">
                    {error}
                </p>
            )}

            <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0, lineHeight: 1.6 }}>
                <AlertTriangle
                    size={11}
                    style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '0.25rem' }}
                    aria-hidden="true"
                />
                AI emotion results are <strong>not medical advice</strong>. If you are in distress,{' '}
                <button
                    type="button"
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#9a3412',
                        fontWeight: 600,
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontSize: 'inherit',
                        padding: 0,
                    }}
                    onClick={() => navigate('/crisis')}
                >
                    get help now
                </button>
                .
            </p>
        </div>
    );
}
