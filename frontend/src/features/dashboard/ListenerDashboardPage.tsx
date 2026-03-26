import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
    MessageCircle,
    Clock,
    Users,
    ChevronRight,
    HeadphonesIcon,
    BookOpen,
    TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../app/AuthContext';
import { http } from '../../api/http';
import styles from './Dashboard.module.css';

interface ListenerSummaryResponse {
    data: {
        summary: {
            role: 'listener';
            stats: {
                totalSessions: number;
                sessionsThisWeek: number;
                currentlyActive: number;
                queueCount: number;
            };
            recentSessions: Array<{
                id: string;
                userId: string | null;
                createdAt: string;
                closedAt: string | null;
            }>;
        };
    };
}

export function ListenerDashboardPage() {
    const { user } = useAuth();
    const firstName = user?.name?.split(' ')[0] ?? 'there';
    const [summary, setSummary] = useState<ListenerSummaryResponse['data']['summary'] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        void http
            .get<ListenerSummaryResponse>('/dashboard/me', { signal: controller.signal })
            .then((response) => setSummary(response.data.summary))
            .catch((err: unknown) => {
                if ((err as { name?: string }).name === 'AbortError') return;
                setError((err as { message?: string }).message ?? 'Failed to load listener summary.');
            })
            .finally(() => setLoading(false));
        return () => controller.abort();
    }, []);

    return (
        <main className={styles.page}>
            <div className={styles.header}>
                <div className={styles.headerText}>
                    <h1 className={styles.greeting}>Welcome back, {firstName}</h1>
                    <p className={styles.subGreeting}>Your live queue and session summary.</p>
                </div>
                <div className={styles.headerActions}>
                    <Link
                        to="/chat"
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                            padding: '0.5rem 1.125rem', borderRadius: '0.625rem',
                            background: 'linear-gradient(135deg,#7c3aed,#2563eb)',
                            color: '#fff', fontWeight: 600, fontSize: '0.875rem',
                            textDecoration: 'none', boxShadow: '0 2px 8px rgba(124,58,237,0.35)',
                        }}
                    >
                        <HeadphonesIcon size={16} aria-hidden="true" />
                        Go Online
                    </Link>
                </div>
            </div>

            {error && <div className={styles.empty} role="alert">{error}</div>}

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.statIconPurple}`}>
                        <MessageCircle size={20} aria-hidden="true" />
                    </div>
                    <div className={styles.statBody}>
                        <span className={styles.statValue}>{loading ? '-' : (summary?.stats.totalSessions ?? 0)}</span>
                        <span className={styles.statLabel}>Total sessions</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
                        <Clock size={20} aria-hidden="true" />
                    </div>
                    <div className={styles.statBody}>
                        <span className={styles.statValue}>{loading ? '-' : (summary?.stats.sessionsThisWeek ?? 0)}</span>
                        <span className={styles.statLabel}>Sessions this week</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
                        <Users size={20} aria-hidden="true" />
                    </div>
                    <div className={styles.statBody}>
                        <span className={styles.statValue}>{loading ? '-' : (summary?.stats.currentlyActive ?? 0)}</span>
                        <span className={styles.statLabel}>Active now</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.statIconAmber}`}>
                        <Users size={20} aria-hidden="true" />
                    </div>
                    <div className={styles.statBody}>
                        <span className={styles.statValue}>{loading ? '-' : (summary?.stats.queueCount ?? 0)}</span>
                        <span className={styles.statLabel}>In queue now</span>
                    </div>
                </div>
            </div>

            <div className={styles.twoCol}>
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>
                            <Users size={16} className={styles.cardTitleIcon} aria-hidden="true" />
                            Users waiting
                        </h2>
                        <span className={styles.badgeGreen}>{summary?.stats.queueCount ?? 0} waiting</span>
                    </div>
                    <div className={styles.cardBody}>
                        <div className={styles.empty}>
                            Queue matching is available from Chat. Click "Go Online" to pick the next queued session.
                        </div>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>Recent sessions</h2>
                    </div>
                    <div className={styles.cardBody}>
                        <div className={styles.sessionList}>
                            {(summary?.recentSessions ?? []).map((session) => (
                                <div key={session.id} className={styles.sessionRow}>
                                    <div className={styles.avatar}>{(session.userId ?? 'AN').slice(-2).toUpperCase()}</div>
                                    <div className={styles.sessionInfo}>
                                        <div className={styles.sessionName}>Session {session.id.slice(0, 6)}</div>
                                        <div className={styles.sessionMeta}>
                                            {new Date(session.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {!loading && (summary?.recentSessions?.length ?? 0) === 0 && (
                                <div className={styles.empty}>No recent sessions yet.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>
                        <BookOpen size={16} className={styles.cardTitleIcon} aria-hidden="true" />
                        Listener resources
                    </h2>
                    <Link to="/library" style={{ fontSize: '0.8125rem', color: '#7c3aed', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        All resources <ChevronRight size={13} aria-hidden="true" />
                    </Link>
                </div>
                <div className={styles.cardBody}>
                    <ul className={styles.actionList}>
                        <li>
                            <Link to="/library" className={styles.actionItem}>
                                <span className={styles.actionItemIcon}><TrendingUp size={16} aria-hidden="true" /></span>
                                <span className={styles.actionItemText}>
                                    <div className={styles.actionItemTitle}>Active listening techniques</div>
                                    <div className={styles.actionItemDesc}>Improve your support quality</div>
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
