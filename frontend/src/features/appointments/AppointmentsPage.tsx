import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Video, Clock, Stethoscope } from 'lucide-react';
import { http } from '../../api/http';
import type { Appointment, AppointmentStatus } from './types';
import type { AvailabilitySlot } from '../therapists/types';
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

interface TherapistAvailabilityResponse {
    data: {
        items: AvailabilitySlot[];
    };
}

async function fetchAppointments(): Promise<Appointment[]> {
    const response = await http.get<AppointmentsResponse>('/appointments/me');
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

function formatCountdown(ms: number): string {
    if (ms <= 0) return 'Now';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    if (h > 0) return `Starts in ${h}h ${m}m`;
    return `Starts in ${m}m`;
}

function formatSlotOption(slot: AvailabilitySlot): string {
    const date = new Date(slot.start);
    const day = date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });
    const startTime = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const endTime = new Date(slot.end).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return `${day} ${startTime}-${endTime}`;
}

function pickRescheduleSlot(slots: AvailabilitySlot[]): AvailabilitySlot | null {
    const available = slots.filter((slot) => slot.available && new Date(slot.start).getTime() > Date.now());
    if (available.length === 0) return null;

    const preview = available.slice(0, 12);
    const lines = preview.map((slot, idx) => `${idx + 1}. ${formatSlotOption(slot)}`);
    const input = window.prompt(
        `Select a new slot number:\n${lines.join('\n')}\n\nEnter 1-${preview.length}`,
        '1'
    );
    if (!input) return null;
    const choice = Number(input);
    if (!Number.isInteger(choice) || choice < 1 || choice > preview.length) return null;
    return preview[choice - 1];
}

function AppointmentCard({
    appt,
    onJoin,
    onCancel,
    onReschedule,
    isBusy,
}: {
    appt: Appointment;
    onJoin: (id: string) => void;
    onCancel: (id: string) => void;
    onReschedule: (appointment: Appointment) => void;
    isBusy: boolean;
}) {
    const [tick, setTick] = useState(0);

    useEffect(() => {
        const t = setInterval(() => setTick((n) => n + 1), 30000);
        return () => clearInterval(t);
    }, []);

    void tick;

    const ms = msUntil(appt.start);
    const joinable = appt.status === 'confirmed' && canJoin(appt.start, appt.end);
    const upcoming = (appt.status === 'confirmed' || appt.status === 'requested') && ms > 0;
    const startDate = new Date(appt.start).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
    const startTime = new Date(appt.start).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
    });

    return (
        <div className={styles.apptCard}>
            <div className={styles.apptAvatar} aria-hidden="true">
                {appt.therapistAvatarUrl ? (
                    <img src={appt.therapistAvatarUrl} alt="" className={styles.apptAvatarImg} />
                ) : (
                    appt.therapistInitials
                )}
            </div>

            <div className={styles.apptInfo}>
                <h3 className={styles.apptName}>{appt.therapistName}</h3>
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
                        {appt.sessionType}
                    </span>
                    <span className={`${styles.statusBadge} ${STATUS_CLASS[appt.status]}`}>
                        {STATUS_LABELS[appt.status]}
                    </span>
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
                    <button type="button" className={styles.cancelBtn} onClick={() => onCancel(appt.id)} disabled={isBusy}>
                        {isBusy ? 'Cancelling...' : 'Cancel'}
                    </button>
                )}
                {(appt.status === 'confirmed' || appt.status === 'requested') && ms > 0 && (
                    <button type="button" className={styles.cancelBtn} onClick={() => onReschedule(appt)} disabled={isBusy}>
                        {isBusy ? 'Rescheduling...' : 'Reschedule'}
                    </button>
                )}
                {appt.status === 'requested' && ms > 0 && (
                    <button type="button" className={styles.cancelBtn} onClick={() => onCancel(appt.id)} disabled={isBusy}>
                        {isBusy ? 'Cancelling...' : 'Cancel'}
                    </button>
                )}
            </div>
        </div>
    );
}

type TabValue = 'upcoming' | 'past' | 'cancelled';

export function AppointmentsPage() {
    const navigate = useNavigate();
    const [tab, setTab] = useState<TabValue>('upcoming');
    const [appts, setAppts] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);

    const load = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchAppointments();
            setAppts(data);
        } catch (err: unknown) {
            setError((err as { message?: string }).message ?? 'Failed to load appointments.');
            setAppts([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const cancelAppointment = useCallback(async (id: string) => {
        setBusyId(id);
        setError(null);
        setInfo(null);
        try {
            const response = await http.post<AppointmentResponse>(`/appointments/${id}/cancel`);
            const updated = response.data.appointment;
            setAppts((prev) => prev.map((item) => (item.id === id ? updated : item)));
            setInfo('Appointment cancelled.');
        } catch (err: unknown) {
            setError((err as { message?: string }).message ?? 'Failed to cancel appointment.');
        } finally {
            setBusyId(null);
        }
    }, []);

    const rescheduleAppointment = useCallback(async (appointment: Appointment) => {
        setBusyId(appointment.id);
        setError(null);
        setInfo(null);
        try {
            const availability = await http.get<TherapistAvailabilityResponse>(
                `/therapists/${appointment.therapistId}/availability`
            );
            const options = availability.data.items.filter((slot) => slot.id !== appointment.slotId);
            if (options.filter((slot) => slot.available && new Date(slot.start).getTime() > Date.now()).length === 0) {
                setError('No available replacement slots right now.');
                return;
            }
            const nextSlot = pickRescheduleSlot(options);
            if (!nextSlot) {
                return;
            }
            const response = await http.post<AppointmentResponse>(`/appointments/${appointment.id}/reschedule`, {
                slotId: nextSlot.id,
            });
            const updated = response.data.appointment;
            setAppts((prev) => prev.map((item) => (item.id === appointment.id ? updated : item)));
            setInfo('Appointment rescheduled.');
        } catch (err: unknown) {
            setError((err as { message?: string }).message ?? 'Failed to reschedule appointment.');
        } finally {
            setBusyId(null);
        }
    }, []);

    const now = Date.now();

    const filtered = appts.filter((a) => {
        const end = new Date(a.end).getTime();
        if (tab === 'upcoming') return a.status !== 'cancelled' && end > now;
        if (tab === 'past') return a.status === 'completed' || (a.status === 'confirmed' && end <= now);
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
                <button
                    type="button"
                    className={styles.emptyBtn}
                    onClick={() => navigate('/therapists')}
                    style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                >
                    <Stethoscope size={15} aria-hidden="true" style={{ marginRight: '0.375rem', verticalAlign: 'middle' }} />
                    Find a Therapist
                </button>
            </div>

            <div className={styles.tabs} role="tablist" aria-label="Appointment tabs">
                {(['upcoming', 'past', 'cancelled'] as TabValue[]).map((t) => (
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
            {info && (
                <p role="status" className={styles.emptyText} style={{ color: '#166534' }}>
                    {info}
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
                    {filtered.map((a) => (
                        <div key={a.id} role="listitem">
                            <AppointmentCard
                                appt={a}
                                onJoin={(id) => navigate(`/appointments/${id}/join`)}
                                onCancel={(id) => void cancelAppointment(id)}
                                onReschedule={(appointment) => void rescheduleAppointment(appointment)}
                                isBusy={busyId === a.id}
                            />
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}
