import { useState, useEffect, useCallback } from 'react';
import { CalendarDays, Video, Clock, User } from 'lucide-react';
import { http } from '../../api/http';
import type { Appointment, AppointmentStatus } from './types';
import styles from './Appointments.module.css';

interface AppointmentsResponse {
    data: {
        items: Appointment[];
    };
}

interface AppointmentResponse {
    data: {
        appointment: Appointment;
    };
}

async function fetchTherapistAppointments(): Promise<Appointment[]> {
    const response = await http.get<AppointmentsResponse>('/appointments/therapist');
    return response.data.items;
}

const STATUS_LABELS: Record<AppointmentStatus, string> = {
    requested: 'Requested',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
    completed: 'Completed',
};

const STATUS_CLASS: Record<AppointmentStatus, string> = {
    requested: styles.statusPending,
    confirmed: styles.statusConfirmed,
    cancelled: styles.statusCancelled,
    completed: styles.statusCompleted,
};

function msUntil(start: string) {
    return new Date(start).getTime() - Date.now();
}

function canJoin(start: string, end: string) {
    const ms = msUntil(start);
    const endMs = new Date(end).getTime() - Date.now();
    return ms <= 10 * 60 * 1000 && endMs > 0;
}

type TabValue = 'upcoming' | 'past';

export function TherapistAppointmentsPage() {
    const [tab, setTab] = useState<TabValue>('upcoming');
    const [appts, setAppts] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);

    const load = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchTherapistAppointments();
            setAppts(data);
        } catch (err: unknown) {
            setError((err as { message?: string }).message ?? 'Failed to load therapist appointments.');
            setAppts([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    async function confirmAppointment(id: string) {
        setBusyId(id);
        setError(null);
        try {
            const response = await http.post<AppointmentResponse>(`/appointments/${id}/confirm`);
            const updated = response.data.appointment;
            setAppts((prev) => prev.map((item) => (item.id === id ? updated : item)));
        } catch (err: unknown) {
            setError((err as { message?: string }).message ?? 'Failed to confirm appointment.');
        } finally {
            setBusyId(null);
        }
    }

    async function cancelAppointment(id: string) {
        setBusyId(id);
        setError(null);
        try {
            const response = await http.post<AppointmentResponse>(`/appointments/${id}/cancel`);
            const updated = response.data.appointment;
            setAppts((prev) => prev.map((item) => (item.id === id ? updated : item)));
        } catch (err: unknown) {
            setError((err as { message?: string }).message ?? 'Failed to cancel appointment.');
        } finally {
            setBusyId(null);
        }
    }

    const now = Date.now();
    const filtered = appts.filter((a) => {
        const end = new Date(a.end).getTime();
        if (tab === 'upcoming') return (a.status === 'confirmed' || a.status === 'requested') && end > now;
        return a.status === 'completed' || (a.status === 'confirmed' && end <= now);
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
                {(['upcoming', 'past'] as TabValue[]).map((t) => (
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

            {error && (
                <p role="alert" className={styles.emptyText} style={{ color: '#dc2626' }}>
                    {error}
                </p>
            )}

            {isLoading ? (
                <div className={styles.list} aria-busy="true">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className={styles.apptCard} style={{ opacity: 0.5 }}>
                            <div className={styles.apptAvatar} style={{ background: '#e5e7eb' }} aria-hidden="true" />
                            <div className={styles.apptInfo}>
                                <div
                                    style={{
                                        height: '1rem',
                                        width: '40%',
                                        background: '#f3f4f6',
                                        borderRadius: '0.25rem',
                                        marginBottom: '0.5rem',
                                    }}
                                />
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
                    {filtered.map((a) => {
                        const startDate = new Date(a.start).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                        });
                        const startTime = new Date(a.start).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                        });
                        const joinable = a.status === 'confirmed' && canJoin(a.start, a.end);
                        const isBusy = busyId === a.id;

                        return (
                            <div key={a.id} role="listitem" className={styles.apptCard}>
                                <div
                                    className={styles.apptAvatar}
                                    style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}
                                    aria-hidden="true"
                                >
                                    <User size={20} aria-hidden="true" />
                                </div>

                                <div className={styles.apptInfo}>
                                    <h3 className={styles.apptName}>Client #{a.userId.slice(-4)}</h3>
                                    <div className={styles.apptMeta}>
                                        <span className={styles.apptMetaItem}>
                                            <CalendarDays size={13} aria-hidden="true" />
                                            {startDate}
                                        </span>
                                        <span className={styles.apptMetaItem}>
                                            <Clock size={13} aria-hidden="true" />
                                            {startTime}
                                        </span>
                                        <span className={styles.apptMetaItem}>
                                            <Video size={13} aria-hidden="true" />
                                            {a.sessionType}
                                        </span>
                                        <span className={`${styles.statusBadge} ${STATUS_CLASS[a.status]}`}>
                                            {STATUS_LABELS[a.status]}
                                        </span>
                                    </div>
                                    {a.userNotes && <p className={styles.apptNotes}>Client note: "{a.userNotes}"</p>}
                                </div>

                                <div className={styles.apptActions}>
                                    {a.status === 'requested' && (
                                        <>
                                            <button
                                                type="button"
                                                className={styles.joinBtn}
                                                onClick={() => void confirmAppointment(a.id)}
                                                disabled={isBusy}
                                            >
                                                {isBusy ? 'Processing...' : 'Confirm'}
                                            </button>
                                            <button
                                                type="button"
                                                className={styles.cancelBtn}
                                                onClick={() => void cancelAppointment(a.id)}
                                                disabled={isBusy}
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    )}
                                    {a.status === 'confirmed' && (
                                        <>
                                            {joinable && (
                                                <button
                                                    type="button"
                                                    className={styles.joinBtn}
                                                    onClick={() => {
                                                        window.location.href = `/appointments/${a.id}/join`;
                                                    }}
                                                >
                                                    Start Session
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                className={styles.cancelBtn}
                                                onClick={() => void cancelAppointment(a.id)}
                                                disabled={isBusy}
                                            >
                                                {isBusy ? 'Processing...' : 'Cancel'}
                                            </button>
                                        </>
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
