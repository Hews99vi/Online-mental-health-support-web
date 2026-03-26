import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
    Users,
    Stethoscope,
    Library,
    BarChart2,
    UserCheck,
    FileText,
    LineChart,
    Settings,
    ChevronRight,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
} from 'lucide-react';
import { http } from '../../api/http';
import styles from './Admin.module.css';

interface AdminAnalytics {
    totalUsers: number;
    approvedTherapists: number;
    approvedListeners: number;
    bookingsCount: number;
    moodEntriesCount: number;
    openReports: number;
    libraryItems: number;
}

interface AdminAnalyticsResponse {
    data: AdminAnalytics;
}

const ADMIN_LINKS = [
    { to: '/admin/therapists', Icon: UserCheck, label: 'Therapist Approvals', desc: 'Review pending applications' },
    { to: '/admin/listeners', Icon: Users, label: 'Listener Approvals', desc: 'Approve trained peer listeners' },
    { to: '/admin/content', Icon: FileText, label: 'Content Manager', desc: 'Publish & edit articles' },
    { to: '/admin/analytics', Icon: LineChart, label: 'Analytics', desc: 'Platform-wide charts' },
];

async function fetchAdminAnalytics(): Promise<AdminAnalytics> {
    const response = await http.get<AdminAnalyticsResponse>('/admin/analytics');
    return response.data;
}

function formatCount(value: number): string {
    return new Intl.NumberFormat('en-US').format(value);
}

export function AdminDashboardPage() {
    const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await fetchAdminAnalytics();
                setAnalytics(data);
            } catch (err: unknown) {
                setAnalytics(null);
                setError((err as { message?: string }).message ?? 'Failed to load admin analytics.');
            } finally {
                setIsLoading(false);
            }
        })();
    }, []);

    const stats = useMemo(() => {
        if (!analytics) return [];
        return [
            { Icon: Users, label: 'Total users', value: formatCount(analytics.totalUsers), delta: 'Live database count', up: true, color: 'iconPurple' },
            { Icon: Stethoscope, label: 'Approved therapists', value: formatCount(analytics.approvedTherapists), delta: 'Verified and active', up: true, color: 'iconBlue' },
            { Icon: UserCheck, label: 'Approved listeners', value: formatCount(analytics.approvedListeners), delta: 'Verified and active', up: true, color: 'iconGreen' },
            { Icon: Library, label: 'Published library items', value: formatCount(analytics.libraryItems), delta: 'Content currently visible', up: true, color: 'iconGreen' },
            { Icon: BarChart2, label: 'Bookings count', value: formatCount(analytics.bookingsCount), delta: 'All-time appointments', up: true, color: 'iconAmber' },
            { Icon: AlertTriangle, label: 'Open reports', value: formatCount(analytics.openReports), delta: analytics.openReports > 0 ? 'Needs attention' : 'No active reports', up: analytics.openReports === 0, color: 'iconRose' },
        ];
    }, [analytics]);

    const recentActivity = useMemo(() => {
        if (!analytics) return [];
        return [
            `${formatCount(analytics.totalUsers)} total users registered.`,
            `${formatCount(analytics.approvedTherapists)} therapists approved.`,
            `${formatCount(analytics.approvedListeners)} listeners approved.`,
            `${formatCount(analytics.bookingsCount)} appointments created.`,
            `${formatCount(analytics.moodEntriesCount)} mood entries submitted.`,
            analytics.openReports > 0
                ? `${formatCount(analytics.openReports)} reports currently open.`
                : 'No open reports at the moment.',
        ];
    }, [analytics]);

    return (
        <main className={styles.page}>
            <div className={styles.header}>
                <div className={styles.headerText}>
                    <h1 className={styles.title}>Admin Dashboard</h1>
                    <p className={styles.subtitle}>Platform health overview - MindBridge</p>
                </div>
                <div className={styles.headerActions}>
                    <Link to="/admin/therapists" className={styles.reviewLink}>
                        <UserCheck size={16} aria-hidden="true" />
                        Review requests
                    </Link>
                </div>
            </div>

            {error && (
                <div className={`${styles.card} ${styles.errorCard}`}>
                    <p role="alert" className={styles.errorText}>{error}</p>
                </div>
            )}

            <div className={styles.statsRow} aria-busy={isLoading}>
                {isLoading ? (
                    Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className={`${styles.statCard} ${styles.statCardLoading}`} />
                    ))
                ) : (
                    stats.map(({ Icon, label, value, delta, up, color }) => (
                        <div key={label} className={styles.statCard}>
                            <div className={`${styles.statIcon} ${styles[color]}`}>
                                <Icon size={20} aria-hidden="true" />
                            </div>
                            <div className={styles.statBody}>
                                <div className={styles.statValue}>{value}</div>
                                <div className={styles.statLabel}>{label}</div>
                                <div className={`${styles.statDelta} ${up ? styles.statDeltaUp : styles.statDeltaDown}`}>
                                    {up ? <TrendingUp size={10} aria-hidden="true" /> : <TrendingDown size={10} aria-hidden="true" />}
                                    {delta}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className={styles.dashboardGrid}>
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>
                            <Settings size={16} className={styles.cardTitleIcon} aria-hidden="true" />
                            Admin sections
                        </h2>
                    </div>
                    <div className={styles.adminSectionsList}>
                        {ADMIN_LINKS.map(({ to, Icon, label, desc }) => (
                            <Link
                                key={to}
                                to={to}
                                className={styles.adminSectionLink}
                            >
                                <span className={styles.adminSectionIcon}>
                                    <Icon size={16} aria-hidden="true" />
                                </span>
                                <span className={styles.adminSectionText}>
                                    <div className={styles.adminSectionLabel}>{label}</div>
                                    <div className={styles.adminSectionDesc}>{desc}</div>
                                </span>
                                <ChevronRight size={14} aria-hidden="true" className={styles.adminSectionChevron} />
                            </Link>
                        ))}
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>
                            <BarChart2 size={16} className={styles.cardTitleIcon} aria-hidden="true" />
                            Recent activity
                        </h2>
                    </div>
                    <ul className={styles.activityList}>
                        {(isLoading ? ['Loading activity...'] : recentActivity).map((text, index, list) => (
                            <li key={index} className={`${styles.activityItem} ${index < list.length - 1 ? styles.activityItemBordered : ''}`}>
                                <span className={styles.activityDot} />
                                <span className={styles.activityText}>{text}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </main>
    );
}
