import { useState, useEffect, useCallback } from 'react';
import { CalendarDays, Video, Clock, User } from 'lucide-react';
import { http } from '../../api/http';
import type { Appointment, AppointmentStatus } from './types';
import styles from './Appointments.module.css';

// ── Stub data (therapist's perspective) ──────────────────────────────────────

const NOW = Date.now();

const STUB: Appointment[] = [
    { id: 'ta1', therapistId: 't1', therapistName: 'You', therapistInitials: 'T', userId: 'u10', slotId: 's10', start: new Date(NOW + 1 * 3600 * 1000).toISOString(), end: new Date(NOW + 2 * 3600 * 1000).toISOString(), status: 'confirmed', sessionType: 'video', userNotes: 'First session. Dealing with social anxiety.' },
    { id: 'ta2', therapistId: 't1', therapistName: 'You', therapistInitials: 'T', userId: 'u11', slotId: 's11', start: new Date(NOW + 3 * 3600 * 1000).toISOString(), end: new Date(NOW + 4 * 3600 * 1000).toISOString(), status: 'confirmed', sessionType: 'video' },
    { id: 'ta3', therapistId: 't1', therapistName: 'You', therapistInitials: 'T', userId: 'u12', slotId: 's12', start: new Date(NOW + 26 * 3600 * 1000).toISOString(), end: new Date(NOW + 27 * 3600 * 1000).toISOString(), status: 'pending', sessionType: 'audio' },
    { id: 'ta4', therapistId: 't1', therapistName: 'You', therapistInitials: 'T', userId: 'u13', slotId: 's13', start: new Date(NOW - 3 * 24 * 3600 * 1000).toISOString(), end: new Date(NOW - 3 * 24 * 3600 * 1000 + 3600 * 1000).toISOString(), status: 'completed', sessionType: 'video' },
];

async function fetchTherapistAppointments(): Promise<Appointment[]> {
    try { return await http.get<Appointment[]>('/appointments/therapist'); }
    catch { return STUB; }
}

// ── Helpers (shared with AppointmentsPage) ────────────────────────────────────

const STATUS_LABELS: Record<AppointmentStatus, string> = {
    pending: 'Pending', confirmed: 'Confirmed', cancelled: 'Cancelled',
    completed: 'Completed', no_show: 'No-show',
};

const STATUS_CLASS: Record<AppointmentStatus, string> = {
    pending: styles.statusPending, confirmed: styles.statusConfirmed,
    cancelled: styles.statusCancelled, completed: styles.statusCompleted,
    no_show: styles.statusNoShow,
};

function msUntil(start: string) { return new Date(start).getTime() - Date.now(); }
function canJoin(start: string, end: string) {
    const ms = msUntil(start);
    const endMs = new Date(end).getTime() - Date.now();
    return ms <= 10 * 60 * 1000 && endMs > 0;
}

// ── Component ─────────────────────────────────────────────────────────────────

type TabValue = 'upcoming' | 'past';

export function TherapistAppointmentsPage() {
    const [tab, setTab] = useState<TabValue>('upcoming');
    const [appts, setAppts] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const load = useCallback(async () => {
        setIsLoading(true);
        const data = await fetchTherapistAppointments();
        setAppts(data);
        setIsLoading(false);
    }, []);

    useEffect(() => { void load(); }, [load]);

    const now = Date.now();
    const filtered = appts.filter(a => {
        const end = new Date(a.end).getTime();
        if (tab === 'upcoming') return (a.status === 'confirmed' || a.status === 'pending') && end > now;
        return a.status === 'completed' || a.status === 'no_show' || (a.status === 'confirmed' && end <= now);
    });

    return (
        <main className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>My Schedule</h1>
                    <p className={styles.subtitle}>Your client sessions, upcoming and completed.</p>
                </div>
            </div>

            <div className={styles.tabs} role="tablist" aria-label="Schedule tabs">
                {(['upcoming', 'past'] as TabValue[]).map(t => (
                    <button
                        key={t}
                        role="tab"
                        type="button"
                        className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
                        aria-selected={tab === t}
                        onClick={() => setTab(t)}
                    >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className={styles.list} aria-busy="true">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className={styles.apptCard} style={{ opacity: 0.5 }}>
                            <div className={styles.apptAvatar} style={{ background: '#e5e7eb' }} aria-hidden="true" />
                            <div className={styles.apptInfo}>
                                <div style={{ height: '1rem', width: '40%', background: '#f3f4f6', borderRadius: '0.25rem', marginBottom: '0.5rem' }} />
                                <div style={{ height: '0.75rem', width: '70%', background: '#f3f4f6', borderRadius: '0.25rem' }} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className={styles.empty}>
                    <CalendarDays size={48} style={{ color: '#d1d5db' }} aria-hidden="true" />
                    <p className={styles.emptyTitle}>No {tab} sessions</p>
                </div>
            ) : (
                <div className={styles.list} role="list" aria-label={`${tab} sessions`}>
                    {filtered.map(a => {
                        const startDate = new Date(a.start).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                        const startTime = new Date(a.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                        const joinable = canJoin(a.start, a.end);

                        return (
                            <div key={a.id} role="listitem" className={styles.apptCard}>
                                {/* Client avatar placeholder */}
                                <div className={styles.apptAvatar} style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }} aria-hidden="true">
                                    <User size={20} aria-hidden="true" />
                                </div>

                                <div className={styles.apptInfo}>
                                    <h3 className={styles.apptName}>Client #{a.userId.slice(-4)}</h3>
                                    <div className={styles.apptMeta}>
                                        <span className={styles.apptMetaItem}><CalendarDays size={13} aria-hidden="true" />{startDate}</span>
                                        <span className={styles.apptMetaItem}><Clock size={13} aria-hidden="true" />{startTime}</span>
                                        <span className={styles.apptMetaItem}><Video size={13} aria-hidden="true" />{a.sessionType}</span>
                                        <span className={`${styles.statusBadge} ${STATUS_CLASS[a.status]}`}>{STATUS_LABELS[a.status]}</span>
                                    </div>
                                    {a.userNotes && <p className={styles.apptNotes}>Client note: "{a.userNotes}"</p>}
                                </div>

                                <div className={styles.apptActions}>
                                    {joinable && (
                                        <button
                                            type="button"
                                            className={styles.joinBtn}
                                            onClick={() => window.location.href = `/appointments/${a.id}/join`}
                                        >
                                            Start Session
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </main>
    );
}
