import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Video, Clock, Stethoscope } from 'lucide-react';
import { http } from '../../api/http';
import type { Appointment, AppointmentStatus } from './types';
import styles from './Appointments.module.css';

// ── Stub data ─────────────────────────────────────────────────────────────────

const NOW = Date.now();

const STUB: Appointment[] = [
    { id: 'a1', therapistId: 't1', therapistName: 'Dr. Priya Sharma', therapistInitials: 'PS', userId: 'u1', slotId: 's1', start: new Date(NOW + 2 * 3600 * 1000).toISOString(), end: new Date(NOW + 3 * 3600 * 1000).toISOString(), status: 'confirmed', sessionType: 'video', userNotes: 'Dealing with work-related anxiety.' },
    { id: 'a2', therapistId: 't2', therapistName: 'Dr. Marcus Lee', therapistInitials: 'ML', userId: 'u1', slotId: 's2', start: new Date(NOW + 25 * 3600 * 1000).toISOString(), end: new Date(NOW + 26 * 3600 * 1000).toISOString(), status: 'confirmed', sessionType: 'video' },
    { id: 'a3', therapistId: 't3', therapistName: 'Dr. Emma Wilson', therapistInitials: 'EW', userId: 'u1', slotId: 's3', start: new Date(NOW - 7 * 24 * 3600 * 1000).toISOString(), end: new Date(NOW - 7 * 24 * 3600 * 1000 + 3600 * 1000).toISOString(), status: 'completed', sessionType: 'video' },
    { id: 'a4', therapistId: 't4', therapistName: 'Dr. Amara Osei', therapistInitials: 'AO', userId: 'u1', slotId: 's4', start: new Date(NOW - 14 * 24 * 3600 * 1000).toISOString(), end: new Date(NOW - 14 * 24 * 3600 * 1000 + 3600 * 1000).toISOString(), status: 'cancelled', sessionType: 'audio' },
];

async function fetchAppointments(): Promise<Appointment[]> {
    try { return await http.get<Appointment[]>('/appointments'); }
    catch { return STUB; }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<AppointmentStatus, string> = {
    pending: 'Pending', confirmed: 'Confirmed', cancelled: 'Cancelled',
    completed: 'Completed', no_show: 'No-show',
};

const STATUS_CLASS: Record<AppointmentStatus, string> = {
    pending: styles.statusPending, confirmed: styles.statusConfirmed,
    cancelled: styles.statusCancelled, completed: styles.statusCompleted,
    no_show: styles.statusNoShow,
};

/** Returns ms until session start; negative if started */
function msUntil(start: string) { return new Date(start).getTime() - Date.now(); }

/** Join button is enabled within 10 min before start and until 90min after start  */
function canJoin(start: string, end: string) {
    const ms = msUntil(start);
    const endMs = new Date(end).getTime() - Date.now();
    return ms <= 10 * 60 * 1000 && endMs > 0;
}

function formatCountdown(ms: number): string {
    if (ms <= 0) return 'Now';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    if (h > 0) return `Starts in ${h}h ${m}m`;
    return `Starts in ${m}m`;
}

// ── Appointment card ──────────────────────────────────────────────────────────

function AppointmentCard({ appt, onJoin }: { appt: Appointment; onJoin: (id: string) => void }) {
    const navigate = useNavigate();
    const [tick, setTick] = useState(0);

    // Refresh every 30 s to update countdowns
    useEffect(() => {
        const t = setInterval(() => setTick(n => n + 1), 30_000);
        return () => clearInterval(t);
    }, []);

    void tick; // consumed by re-render

    const ms = msUntil(appt.start);
    const joinable = appt.status === 'confirmed' && canJoin(appt.start, appt.end);
    const upcoming = appt.status === 'confirmed' && ms > 0;
    const startDate = new Date(appt.start).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    const startTime = new Date(appt.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    return (
        <div className={styles.apptCard}>
            <div className={styles.apptAvatar} aria-hidden="true">
                {appt.therapistAvatarUrl
                    ? <img src={appt.therapistAvatarUrl} alt="" className={styles.apptAvatarImg} />
                    : appt.therapistInitials}
            </div>

            <div className={styles.apptInfo}>
                <h3 className={styles.apptName}>{appt.therapistName}</h3>
                <div className={styles.apptMeta}>
                    <span className={styles.apptMetaItem}><CalendarDays size={13} aria-hidden="true" />{startDate}</span>
                    <span className={styles.apptMetaItem}><Clock size={13} aria-hidden="true" />{startTime}</span>
                    <span className={styles.apptMetaItem}><Video size={13} aria-hidden="true" />{appt.sessionType}</span>
                    <span className={`${styles.statusBadge} ${STATUS_CLASS[appt.status]}`}>{STATUS_LABELS[appt.status]}</span>
                </div>
                {appt.userNotes && <p className={styles.apptNotes}>"{appt.userNotes}"</p>}
            </div>

            <div className={styles.apptActions}>
                {joinable && (
                    <button type="button" className={styles.joinBtn} onClick={() => onJoin(appt.id)}>
                        Join Session
                    </button>
                )}
                {upcoming && !joinable && (
                    <span className={`${styles.countdown} ${ms < 30 * 60 * 1000 ? styles.countdownSoon : ''}`}>
                        {formatCountdown(ms)}
                    </span>
                )}
                {appt.status === 'confirmed' && ms > 0 && (
                    <button
                        type="button"
                        className={styles.cancelBtn}
                        onClick={() => navigate(`/bookings`)}
                        title="Manage booking"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

type TabValue = 'upcoming' | 'past' | 'cancelled';

export function AppointmentsPage() {
    const navigate = useNavigate();
    const [tab, setTab] = useState<TabValue>('upcoming');
    const [appts, setAppts] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const load = useCallback(async () => {
        setIsLoading(true);
        const data = await fetchAppointments();
        setAppts(data);
        setIsLoading(false);
    }, []);

    useEffect(() => { void load(); }, [load]);

    const now = Date.now();

    const filtered = appts.filter(a => {
        const end = new Date(a.end).getTime();
        if (tab === 'upcoming') return a.status !== 'cancelled' && end > now;
        if (tab === 'past') return a.status === 'completed' || (a.status === 'confirmed' && end <= now) || a.status === 'no_show';
        if (tab === 'cancelled') return a.status === 'cancelled';
        return true;
    });

    return (
        <main className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>My Appointments</h1>
                    <p className={styles.subtitle}>Manage your upcoming and past therapy sessions.</p>
                </div>
                <button type="button" className={styles.emptyBtn} onClick={() => navigate('/therapists')} style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                    <Stethoscope size={15} aria-hidden="true" style={{ marginRight: '0.375rem', verticalAlign: 'middle' }} />
                    Find a Therapist
                </button>
            </div>

            <div className={styles.tabs} role="tablist" aria-label="Appointment tabs">
                {(['upcoming', 'past', 'cancelled'] as TabValue[]).map(t => (
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
                    <p className={styles.emptyTitle}>No {tab} appointments</p>
                    {tab === 'upcoming' && (
                        <>
                            <p className={styles.emptyText}>Browse therapists and book your first session.</p>
                            <button type="button" className={styles.emptyBtn} onClick={() => navigate('/therapists')}>
                                Find a Therapist
                            </button>
                        </>
                    )}
                </div>
            ) : (
                <div className={styles.list} role="list" aria-label={`${tab} appointments`}>
                    {filtered.map(a => (
                        <div key={a.id} role="listitem">
                            <AppointmentCard
                                appt={a}
                                onJoin={id => navigate(`/appointments/${id}/join`)}
                            />
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}
