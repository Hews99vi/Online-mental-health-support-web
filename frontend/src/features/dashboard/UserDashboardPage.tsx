import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
    BarChart2,
    CalendarDays,
    MessageCircle,
    BookOpen,
    Heart,
    Smile,
    TrendingUp,
    ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../app/AuthContext';
import { http } from '../../api/http';
import styles from './Dashboard.module.css';

interface UserSummaryResponse {
    data: {
        summary: {
            role: 'user';
            stats: {
                avgMoodWeek: number;
                avgMoodDeltaPct: number;
                upcomingSessions: number;
                journalsThisMonth: number;
            };
            moodSeries: Array<{ value: number; at: string }>;
            upcoming: Array<{
                id: string;
                therapistName: string;
                start: string | null;
                end: string | null;
                status: 'requested' | 'confirmed' | 'cancelled' | 'completed';
            }>;
            verifiedTherapists: Array<{
                id: string;
                name: string;
                specialty: string;
            }>;
            verifiedListeners: Array<{
                id: string;
                name: string;
                bio: string;
            }>;
        };
    };
}

function MoodSparkline({ values }: { values: number[] }) {
    if (values.length === 0) {
        return <div className={styles.empty}>No mood entries this week yet.</div>;
    }

    const max = 5;
    const w = 240;
    const h = 100;
    const pad = 8;
    const xs = values.map((_, i) => pad + (i / Math.max(values.length - 1, 1)) * (w - 2 * pad));
    const ys = values.map((v) => h - pad - ((v / max) * (h - 2 * pad)));
    const d = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x},${ys[i]}`).join(' ');
    const area = `${d} L${xs[xs.length - 1]},${h} L${xs[0]},${h} Z`;

    return (
        <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', maxWidth: w, height: 'auto', display: 'block' }}>
            <defs>
                <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1C3D30" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#1C3D30" stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={area} fill="url(#moodGrad)" />
            <path d={d} fill="none" stroke="#1C3D30" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            {xs.map((x, i) => (
                <circle key={i} cx={x} cy={ys[i]} r="3.5" fill="#1C3D30" />
            ))}
        </svg>
    );
}

const QUICK_ACTIONS = [
    { to: '/mood', Icon: Smile, title: "Log today's mood", desc: 'Takes 30 seconds' },
    { to: '/journal', Icon: BookOpen, title: 'Write in your journal', desc: 'Private and encrypted' },
    { to: '/chat', Icon: MessageCircle, title: 'Talk to a listener', desc: 'Someone is ready now' },
    { to: '/therapists', Icon: Heart, title: 'Find a therapist', desc: 'Browse verified professionals' },
    { to: '/listener/apply', Icon: MessageCircle, title: 'Apply as listener', desc: 'Request listener verification' },
    { to: '/therapists/apply', Icon: Heart, title: 'Apply as therapist', desc: 'Submit your license for review' },
];

export function UserDashboardPage() {
    const { user } = useAuth();
    const firstName = user?.name?.split(' ')[0] ?? 'there';
    const [summary, setSummary] = useState<UserSummaryResponse['data']['summary'] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const controller = new AbortController();
        void http
            .get<UserSummaryResponse>('/dashboard/me', { signal: controller.signal })
            .then((response) => setSummary(response.data.summary))
            .catch((err: unknown) => {
                if ((err as { name?: string }).name === 'AbortError') return;
                setError((err as { message?: string }).message ?? 'Failed to load dashboard summary.');
            })
            .finally(() => setLoading(false));
        return () => controller.abort();
    }, []);

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const moodValues = useMemo(() => summary?.moodSeries.map((point) => point.value) ?? [], [summary]);

    return (
        <main className={styles.page}>
            <div className={styles.header}>
                <div className={styles.headerText}>
                    <h1 className={styles.greeting}>{greeting}, {firstName}</h1>
                    <p className={styles.subGreeting}>Here's your wellness summary for today.</p>
                </div>
                <div className={styles.headerActions}>
                    <Link
                        to="/bookings"
                        className={styles.actionItem}
                        style={{ padding: '0.5rem 1rem', gap: '0.375rem', borderRadius: '0.625rem', fontSize: '0.875rem', fontWeight: 500 }}
                    >
                        <CalendarDays size={15} aria-hidden="true" />
                        My Bookings
                    </Link>
                </div>
            </div>

            {error && <div className={styles.empty} role="alert">{error}</div>}

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.statIconPurple}`}>
                        <Smile size={20} aria-hidden="true" />
                    </div>
                    <div className={styles.statBody}>
                        <span className={styles.statValue}>{loading ? '-' : (summary?.stats.avgMoodWeek ?? 0).toFixed(1)}</span>
                        <span className={styles.statLabel}>Avg mood this week</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
                        <TrendingUp size={20} aria-hidden="true" />
                    </div>
                    <div className={styles.statBody}>
                        <span className={styles.statValue}>{loading ? '-' : `${summary?.stats.avgMoodDeltaPct ?? 0}%`}</span>
                        <span className={styles.statLabel}>vs last week</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
                        <CalendarDays size={20} aria-hidden="true" />
                    </div>
                    <div className={styles.statBody}>
                        <span className={styles.statValue}>{loading ? '-' : (summary?.stats.upcomingSessions ?? 0)}</span>
                        <span className={styles.statLabel}>Upcoming sessions</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.statIconAmber}`}>
                        <BookOpen size={20} aria-hidden="true" />
                    </div>
                    <div className={styles.statBody}>
                        <span className={styles.statValue}>{loading ? '-' : (summary?.stats.journalsThisMonth ?? 0)}</span>
                        <span className={styles.statLabel}>Journals this month</span>
                    </div>
                </div>
            </div>

            <div className={styles.twoCol}>
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>
                            <BarChart2 size={16} className={styles.cardTitleIcon} aria-hidden="true" />
                            Mood this week
                        </h2>
                        <Link to="/mood" style={{ fontSize: '0.8125rem', color: 'var(--color-primary, #1C3D30)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            View all <ChevronRight size={13} aria-hidden="true" />
                        </Link>
                    </div>
                    <div className={styles.cardBody}>
                        <MoodSparkline values={moodValues} />
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>
                            <CalendarDays size={16} className={styles.cardTitleIcon} aria-hidden="true" />
                            Upcoming sessions
                        </h2>
                        <Link to="/bookings" style={{ fontSize: '0.8125rem', color: 'var(--color-primary, #1C3D30)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            All <ChevronRight size={13} aria-hidden="true" />
                        </Link>
                    </div>
                    <div className={styles.cardBody}>
                        <div className={styles.sessionList}>
                            {(summary?.upcoming ?? []).slice(0, 4).map((item) => (
                                <div key={item.id} className={styles.sessionRow}>
                                    <div className={styles.avatar}>{item.therapistName.slice(0, 2).toUpperCase()}</div>
                                    <div className={styles.sessionInfo}>
                                        <div className={styles.sessionName}>{item.therapistName}</div>
                                        <div className={styles.sessionMeta}>
                                            {item.start ? new Date(item.start).toLocaleString() : 'TBD'} · {item.status}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {!loading && (summary?.upcoming?.length ?? 0) === 0 && (
                                <div className={styles.empty}>No upcoming sessions.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>Quick actions</h2>
                </div>
                <div className={styles.cardBody}>
                    <ul className={styles.actionList}>
                        {QUICK_ACTIONS.map(({ to, Icon, title, desc }) => (
                            <li key={to}>
                                <Link to={to} className={styles.actionItem}>
                                    <span className={styles.actionItemIcon}>
                                        <Icon size={16} aria-hidden="true" />
                                    </span>
                                    <span className={styles.actionItemText}>
                                        <div className={styles.actionItemTitle}>{title}</div>
                                        <div className={styles.actionItemDesc}>{desc}</div>
                                    </span>
                                    <ChevronRight size={14} aria-hidden="true" style={{ color: 'var(--color-placeholder, #9C9C99)', flexShrink: 0 }} />
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className={styles.twoCol}>
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>Verified Therapists</h2>
                        <Link to="/therapists" style={{ fontSize: '0.8125rem', color: 'var(--color-primary, #1C3D30)', textDecoration: 'none' }}>
                            Browse all
                        </Link>
                    </div>
                    <div className={styles.cardBody}>
                        <div className={styles.sessionList}>
                            {(summary?.verifiedTherapists ?? []).slice(0, 4).map((item) => (
                                <Link key={item.id} to={`/therapists/${item.id}`} className={styles.actionItem}>
                                    <span className={styles.actionItemIcon}>
                                        <Heart size={16} aria-hidden="true" />
                                    </span>
                                    <span className={styles.actionItemText}>
                                        <div className={styles.actionItemTitle}>{item.name}</div>
                                        <div className={styles.actionItemDesc}>{item.specialty}</div>
                                    </span>
                                </Link>
                            ))}
                            {!loading && (summary?.verifiedTherapists?.length ?? 0) === 0 && (
                                <div className={styles.empty}>No verified therapists available right now.</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>Verified Peer Listeners</h2>
                        <Link to="/chat" style={{ fontSize: '0.8125rem', color: 'var(--color-primary, #1C3D30)', textDecoration: 'none' }}>
                            Start chat
                        </Link>
                    </div>
                    <div className={styles.cardBody}>
                        <div className={styles.sessionList}>
                            {(summary?.verifiedListeners ?? []).slice(0, 4).map((item) => (
                                <div key={item.id} className={styles.sessionRow}>
                                    <div className={styles.avatar}>{item.name.slice(0, 2).toUpperCase()}</div>
                                    <div className={styles.sessionInfo}>
                                        <div className={styles.sessionName}>{item.name}</div>
                                        <div className={styles.sessionMeta}>{item.bio || 'Verified peer listener'}</div>
                                    </div>
                                </div>
                            ))}
                            {!loading && (summary?.verifiedListeners?.length ?? 0) === 0 && (
                                <div className={styles.empty}>No verified listeners available right now.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
