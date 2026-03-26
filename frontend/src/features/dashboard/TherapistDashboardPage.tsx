import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
    CalendarDays,
    Users,
    Clock,
    FileText,
    ChevronRight,
    TrendingUp,
    MessageCircle,
    BarChart2,
} from 'lucide-react';
import { useAuth } from '../../app/AuthContext';
import { http } from '../../api/http';
import styles from './Dashboard.module.css';

interface TherapistSummaryResponse {
    data: {
        summary: {
            role: 'therapist';
            profileStatus: 'pending' | 'approved' | 'rejected' | null;
            stats: {
                activeClients: number;
                sessionsToday: number;
                confirmedThisMonth: number;
                pendingNotes: number;
            };
            todaySessions: Array<{
                id: string;
                userId: string;
                start: string | null;
                end: string | null;
                status: 'requested' | 'confirmed' | 'cancelled' | 'completed';
            }>;
            pendingNotes: Array<{
                id: string;
                userId: string;
                at: string | null;
            }>;
        };
    };
}

export function TherapistDashboardPage() {
    const { user } = useAuth();
    const firstName = user?.name?.split(' ')[0] ?? 'Therapist';
    const [summary, setSummary] = useState<TherapistSummaryResponse['data']['summary'] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        void http
            .get<TherapistSummaryResponse>('/dashboard/me', { signal: controller.signal })
            .then((response) => setSummary(response.data.summary))
            .catch((err: unknown) => {
                if ((err as { name?: string }).name === 'AbortError') return;
                setError((err as { message?: string }).message ?? 'Failed to load therapist summary.');
            })
            .finally(() => setLoading(false));
        return () => controller.abort();
    }, []);

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    return (
        <main className={styles.page}>
            <div className={styles.header}>
                <div className={styles.headerText}>
                    <h1 className={styles.greeting}>{greeting}, {firstName}</h1>
                    <p className={styles.subGreeting}>
                        {summary?.profileStatus === 'approved'
                            ? 'Your clinical overview for today.'
                            : 'Complete approval to unlock full therapist capabilities.'}
                    </p>
                </div>
                <div className={styles.headerActions}>
                    <Link
                        to="/bookings/therapist"
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                            padding: '0.5rem 1.125rem', borderRadius: '0.625rem',
                            background: 'linear-gradient(135deg,#7c3aed,#2563eb)',
                            color: '#fff', fontWeight: 600, fontSize: '0.875rem',
                            textDecoration: 'none', boxShadow: '0 2px 8px rgba(124,58,237,0.35)',
                        }}
                    >
                        <CalendarDays size={16} aria-hidden="true" />
                        My Schedule
                    </Link>
                </div>
            </div>

            {error && <div className={styles.empty} role="alert">{error}</div>}

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
                        <Users size={20} aria-hidden="true" />
                    </div>
                    <div className={styles.statBody}>
                        <span className={styles.statValue}>{loading ? '-' : (summary?.stats.activeClients ?? 0)}</span>
                        <span className={styles.statLabel}>Active clients</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.statIconPurple}`}>
                        <CalendarDays size={20} aria-hidden="true" />
                    </div>
                    <div className={styles.statBody}>
                        <span className={styles.statValue}>{loading ? '-' : (summary?.stats.sessionsToday ?? 0)}</span>
                        <span className={styles.statLabel}>Sessions today</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.statIconAmber}`}>
                        <TrendingUp size={20} aria-hidden="true" />
                    </div>
                    <div className={styles.statBody}>
                        <span className={styles.statValue}>{loading ? '-' : (summary?.stats.confirmedThisMonth ?? 0)}</span>
                        <span className={styles.statLabel}>Confirmed this month</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
                        <Clock size={20} aria-hidden="true" />
                    </div>
                    <div className={styles.statBody}>
                        <span className={styles.statValue}>{loading ? '-' : (summary?.stats.pendingNotes ?? 0)}</span>
                        <span className={styles.statLabel}>Pending notes</span>
                    </div>
                </div>
            </div>

            <div className={styles.twoCol}>
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>
                            <CalendarDays size={16} className={styles.cardTitleIcon} aria-hidden="true" />
                            Today's sessions
                        </h2>
                        <Link to="/bookings/therapist" style={{ fontSize: '0.8125rem', color: '#7c3aed', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            Full schedule <ChevronRight size={13} aria-hidden="true" />
                        </Link>
                    </div>
                    <div className={styles.cardBody}>
                        <div className={styles.sessionList}>
                            {(summary?.todaySessions ?? []).map((session) => (
                                <div key={session.id} className={styles.sessionRow}>
                                    <div className={styles.avatar}>{session.userId.slice(-2).toUpperCase()}</div>
                                    <div className={styles.sessionInfo}>
                                        <div className={styles.sessionName}>Client {session.userId.slice(-6)}</div>
                                        <div className={styles.sessionMeta}>
                                            {session.start ? new Date(session.start).toLocaleTimeString() : 'TBD'} · {session.status}
                                        </div>
                                    </div>
                                    <span className={styles.badgeBlue}>{session.status}</span>
                                </div>
                            ))}
                            {!loading && (summary?.todaySessions?.length ?? 0) === 0 && (
                                <div className={styles.empty}>No sessions for today.</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>
                            <FileText size={16} className={styles.cardTitleIcon} aria-hidden="true" />
                            Pending session notes
                        </h2>
                    </div>
                    <div className={styles.cardBody}>
                        <div className={styles.sessionList}>
                            {(summary?.pendingNotes ?? []).map((item) => (
                                <div key={item.id} className={styles.sessionRow}>
                                    <div className={styles.avatar}>{item.userId.slice(-2).toUpperCase()}</div>
                                    <div className={styles.sessionInfo}>
                                        <div className={styles.sessionName}>Session {item.id.slice(0, 6)}</div>
                                        <div className={styles.sessionMeta}>{item.at ? new Date(item.at).toLocaleString() : 'Unknown time'}</div>
                                    </div>
                                    <Link to="/therapist/notes" className={styles.badgeAmber}>Write note</Link>
                                </div>
                            ))}
                            {!loading && (summary?.pendingNotes?.length ?? 0) === 0 && (
                                <div className={styles.empty}>All notes are up to date.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>Clinical tools</h2>
                </div>
                <div className={styles.cardBody}>
                    <ul className={styles.actionList}>
                        <li>
                            <Link to="/therapist/messages" className={styles.actionItem}>
                                <span className={styles.actionItemIcon}><MessageCircle size={16} aria-hidden="true" /></span>
                                <span className={styles.actionItemText}>
                                    <div className={styles.actionItemTitle}>Secure client messaging</div>
                                    <div className={styles.actionItemDesc}>Session communication</div>
                                </span>
                                <ChevronRight size={14} aria-hidden="true" style={{ color: '#9ca3af', flexShrink: 0 }} />
                            </Link>
                        </li>
                        <li>
                            <Link to="/therapist/mood-insights" className={styles.actionItem}>
                                <span className={styles.actionItemIcon}><BarChart2 size={16} aria-hidden="true" /></span>
                                <span className={styles.actionItemText}>
                                    <div className={styles.actionItemTitle}>Client mood insights</div>
                                    <div className={styles.actionItemDesc}>Track outcomes over time</div>
                                </span>
                                <ChevronRight size={14} aria-hidden="true" style={{ color: '#9ca3af', flexShrink: 0 }} />
                            </Link>
                        </li>
                        <li>
                            <Link to="/therapist/resources" className={styles.actionItem}>
                                <span className={styles.actionItemIcon}><TrendingUp size={16} aria-hidden="true" /></span>
                                <span className={styles.actionItemText}>
                                    <div className={styles.actionItemTitle}>Assign library resources</div>
                                    <div className={styles.actionItemDesc}>Homework and self-help tools</div>
                                </span>
                                <ChevronRight size={14} aria-hidden="true" style={{ color: '#9ca3af', flexShrink: 0 }} />
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>
        </main>
    );
}
