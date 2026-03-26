import { useState } from 'react';
import { X, ShieldCheck, AlertTriangle } from 'lucide-react';
import styles from './Biometric.module.css';

interface Props {
    isOpen: boolean;
    onAccept: () => void;
    onDecline: () => void;
    isSubmitting?: boolean;
}

export function BiometricOptInModal({
    isOpen,
    onAccept,
    onDecline,
    isSubmitting = false,
}: Props) {
    const [checkedDataUse, setCheckedDataUse] = useState(false);
    const [checkedDisclaim, setCheckedDisclaim] = useState(false);

    if (!isOpen) return null;

    const canAccept = checkedDataUse && checkedDisclaim && !isSubmitting;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="biometric-modal-title"
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9000,
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
            }}
        >
            <div
                style={{
                    background: '#fff',
                    borderRadius: '1.5rem',
                    maxWidth: '480px',
                    width: '100%',
                    padding: '1.75rem',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <div
                            style={{
                                width: '2.5rem',
                                height: '2.5rem',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg,#7c3aed,#5b21b6)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                color: '#fff',
                            }}
                        >
                            <ShieldCheck size={18} aria-hidden="true" />
                        </div>
                        <div>
                            <h2
                                id="biometric-modal-title"
                                style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 700, color: '#111827' }}
                            >
                                Emotion Detection Consent
                            </h2>
                            <p style={{ margin: 0, fontSize: '0.8125rem', color: '#6b7280' }}>
                                Biometric data processing
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onDecline}
                        aria-label="Close, decline consent"
                        disabled={isSubmitting}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            color: '#9ca3af',
                            padding: '0.25rem',
                            borderRadius: '50%',
                        }}
                    >
                        <X size={20} aria-hidden="true" />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    <div className={styles.consentSection}>
                        <h3 className={styles.consentTitle}>What this feature does</h3>
                        <p className={styles.consentText}>
                            The Emotion Check-In widget uses your device camera or an uploaded image to estimate
                            your current emotional state. This helps provide more contextual wellbeing insights.
                        </p>
                        <ul className={styles.bulletList}>
                            <li>
                                A snapshot is captured and sent <strong>directly to our backend</strong>; no third-party
                                receives raw images.
                            </li>
                            <li>The image is analysed by an AI model running on our servers.</li>
                            <li>Results (emotion labels and confidence scores) are returned and displayed to you only.</li>
                            <li>Images are <strong>deleted immediately</strong> after analysis and are never stored.</li>
                        </ul>
                    </div>

                    <div className={styles.dataNotice}>
                        <strong>Your data rights:</strong> You can revoke this consent at any time in Privacy Settings
                        (Consent Centre). Revoking consent disables the widget immediately.
                    </div>

                    <div className={styles.warningNotice}>
                        <AlertTriangle
                            size={14}
                            style={{ display: 'inline', marginRight: '0.375rem', verticalAlign: 'text-bottom' }}
                            aria-hidden="true"
                        />
                        <strong>Not medical advice.</strong> Emotion detection is an experimental AI feature
                        for general self-awareness only. It cannot diagnose any medical or mental health condition.
                        If you are in distress, please seek professional help.
                    </div>

                    <label className={styles.checkRow}>
                        <input
                            type="checkbox"
                            checked={checkedDataUse}
                            onChange={(e) => setCheckedDataUse(e.target.checked)}
                            aria-required="true"
                            disabled={isSubmitting}
                        />
                        I understand that a photo will be sent to the server for AI analysis, and deleted immediately after.
                    </label>

                    <label className={styles.checkRow}>
                        <input
                            type="checkbox"
                            checked={checkedDisclaim}
                            onChange={(e) => setCheckedDisclaim(e.target.checked)}
                            aria-required="true"
                            disabled={isSubmitting}
                        />
                        I understand this is not medical advice and I can withdraw consent at any time.
                    </label>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button
                        type="button"
                        onClick={onDecline}
                        disabled={isSubmitting}
                        style={{
                            padding: '0.65rem 1.125rem',
                            borderRadius: '0.75rem',
                            border: '1.5px solid #e5e7eb',
                            background: '#fff',
                            color: '#374151',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            fontFamily: 'inherit',
                        }}
                    >
                        Decline
                    </button>
                    <button
                        type="button"
                        className={styles.consentBtn}
                        disabled={!canAccept}
                        onClick={onAccept}
                        style={!canAccept ? { background: '#c4b5fd', cursor: 'not-allowed' } : undefined}
                    >
                        {isSubmitting ? 'Saving...' : 'Accept & Enable'}
                    </button>
                </div>
            </div>
        </div>
    );
}
