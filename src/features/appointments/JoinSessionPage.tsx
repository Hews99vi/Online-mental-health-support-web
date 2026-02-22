import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, AlertTriangle, ArrowLeft } from 'lucide-react';
import { http } from '../../api/http';
import type { Appointment, JoinInfo } from './types';
import styles from './Appointments.module.css';

// ── Constants ─────────────────────────────────────────────────────────────────

/** Join button enabled within 10 minutes of session start */
const JOIN_WINDOW_MS = 10 * 60 * 1000;

/** Poll interval when waiting for joinUrl availability */
const POLL_INTERVAL_MS = 30_000;

// ── API stubs ─────────────────────────────────────────────────────────────────

async function fetchAppointment(id: string): Promise<Appointment> {
    try { return await http.get<Appointment>(`/appointments/${id}`); }
    catch {
        return {
            id, therapistId: 't1', therapistName: 'Dr. Priya Sharma', therapistInitials: 'PS',
            userId: 'u1', slotId: 's1',
            start: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
            end: new Date(Date.now() + 65 * 60 * 1000).toISOString(),
            status: 'confirmed', sessionType: 'video',
        };
    }
}

/**
 * IMPORTANT: joinUrl MUST NOT be rendered until backend confirms `availableAt` has passed.
 * The JoinInfo.availableAt field gates this — we never show the URL early.
 */
async function fetchJoinInfo(id: string): Promise<JoinInfo> {
    try { return await http.get<JoinInfo>(`/appointments/${id}/join`); }
    catch {
        // Stub: URL becomes available 2 minutes before session
        const appt = await fetchAppointment(id);
        const availableAt = new Date(new Date(appt.start).getTime() - 2 * 60 * 1000).toISOString();
        return {
            appointmentId: id,
            joinUrl: 'https://video.mindbridge.example/room/demo-session',
            provider: 'daily',
            availableAt,
        };
    }
}

// ── Countdown hook ────────────────────────────────────────────────────────────

function useCountdown(targetIso: string | null) {
    const [ms, setMs] = useState<number>(() =>
        targetIso ? new Date(targetIso).getTime() - Date.now() : Infinity
    );

    useEffect(() => {
        if (!targetIso) return;
        const tick = () => setMs(new Date(targetIso).getTime() - Date.now());
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [targetIso]);

    return ms;
}

function formatHMS(ms: number): string {
    if (ms <= 0) return '00:00';
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const mm = String(m).padStart(2, '0');
    const ss = String(s).padStart(2, '0');
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function JoinSessionPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [appt, setAppt] = useState<Appointment | null>(null);
    const [joinInfo, setJoinInfo] = useState<JoinInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const [a, j] = await Promise.all([fetchAppointment(id), fetchJoinInfo(id)]);
            setAppt(a);
            setJoinInfo(j);
        } catch {
            setError('Failed to load session information. Please refresh.');
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => { void load(); }, [load]);

    // Poll for joinInfo every 30s (backend may not make URL available immediately)
    useEffect(() => {
        if (!id) return;
        const poll = setInterval(async () => {
            try {
                const j = await fetchJoinInfo(id);
                setJoinInfo(j);
            } catch { /* silent */ }
        }, POLL_INTERVAL_MS);
        return () => clearInterval(poll);
    }, [id]);

    // Countdown to session start
    const msToStart = useCountdown(appt?.start ?? null);
    const msToAvail = useCountdown(joinInfo?.availableAt ?? null);

    // --- join policy ---
    // 1. Backend must confirm availableAt has passed (joinUrl gate)
    // 2. We must be within JOIN_WINDOW_MS before start OR session has started
    const joinUrlReady = joinInfo !== null && msToAvail <= 0;
    const withinWindow = appt !== null && msToStart <= JOIN_WINDOW_MS;
    const sessionEnded = appt !== null && new Date(appt.end).getTime() < Date.now();
    const canJoinNow = joinUrlReady && withinWindow && !sessionEnded;

    const handleJoin = () => {
        if (!joinInfo || !canJoinNow) return;
        // Open in new tab — never expose joinUrl in the DOM before this point
        window.open(joinInfo.joinUrl, '_blank', 'noopener,noreferrer');
    };

    // ── Render ──────────────────────────────────────────────────────────────

    if (isLoading) {
        return (
            <div className={styles.joinPage} aria-busy="true" aria-label="Loading session">
                <div className={styles.joinCard}>
                    <div className={styles.joinAvatar} style={{ background: '#e5e7eb' }} aria-hidden="true" />
                    <div style={{ width: '60%', height: '1.25rem', background: '#f3f4f6', borderRadius: '0.25rem' }} />
                    <div style={{ width: '40%', height: '0.875rem', background: '#f3f4f6', borderRadius: '0.25rem' }} />
                    <div style={{ width: '100%', height: '3rem', background: '#f3f4f6', borderRadius: '0.875rem' }} />
                </div>
            </div>
        );
    }

    if (error || !appt) {
        return (
            <div className={styles.joinPage}>
                <div className={styles.joinCard}>
                    <AlertTriangle size={40} style={{ color: '#f59e0b' }} aria-hidden="true" />
                    <p style={{ fontSize: '0.9375rem', color: '#374151' }}>{error ?? 'Session not found.'}</p>
                    <button type="button" style={{ padding: '0.5rem 1rem', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '0.625rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem' }} onClick={() => navigate('/bookings')}>
                        Back to Appointments
                    </button>
                </div>
            </div>
        );
    }

    const startTime = new Date(appt.start).toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });

    return (
        <div className={styles.joinPage}>
            {/* Back */}
            <button type="button" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', color: '#6b7280', fontFamily: 'inherit', alignSelf: 'flex-start' }} onClick={() => navigate(-1)}>
                <ArrowLeft size={16} aria-hidden="true" /> Back
            </button>

            <div className={styles.joinCard}>
                <div className={styles.joinAvatar} aria-hidden="true">{appt.therapistInitials}</div>
                <h1 className={styles.joinTherapistName}>{appt.therapistName}</h1>
                <p className={styles.joinDateTime}>
                    <Video size={14} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                    {startTime}
                </p>

                {sessionEnded ? (
                    <div className={styles.joinWaiting}>
                        <p>This session has ended.</p>
                        <button type="button" style={{ padding: '0.5rem 1rem', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '0.625rem', cursor: 'pointer', fontFamily: 'inherit', marginTop: '0.5rem', fontSize: '0.875rem' }} onClick={() => navigate('/bookings')}>
                            View appointments
                        </button>
                    </div>
                ) : canJoinNow ? (
                    <button type="button" className={styles.joinBtnLarge} onClick={handleJoin}>
                        <Video size={18} aria-hidden="true" />
                        Join Session
                    </button>
                ) : (
                    <div className={styles.joinWaiting}>
                        <div className={styles.waitDot} aria-hidden="true" />
                        {withinWindow && !joinUrlReady ? (
                            <p>Setting up the session room…</p>
                        ) : (
                            <>
                                <p>Your session starts in</p>
                                <span className={styles.joinCountdown} aria-live="polite" aria-atomic="true">
                                    {formatHMS(msToStart)}
                                </span>
                                <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                                    The "Join Session" button will appear 10 minutes before the start.
                                </p>
                            </>
                        )}
                    </div>
                )}

                {/* Security note — only shown when join is possible */}
                {canJoinNow && (
                    <p style={{ fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center', margin: 0, lineHeight: 1.6 }}>
                        Your session is encrypted. Never share this link with anyone.
                    </p>
                )}
            </div>
        </div>
    );
}
