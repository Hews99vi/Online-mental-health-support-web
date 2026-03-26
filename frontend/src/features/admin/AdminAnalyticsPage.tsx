import { useEffect, useMemo, useState } from 'react';
import {
    Users,
    MessageCircle,
    TrendingUp,
    Heart,
    BookOpen,
    Clock,
    Star,
    AlertTriangle,
    UserCheck,
    UserX,
} from 'lucide-react';
import { http } from '../../api/http';
import styles from './Admin.module.css';

function MiniBarChart({
    values,
    labels,
    color = '#7c3aed',
}: {
    values: number[];
    labels: string[];
    color?: string;
}) {
    const max = Math.max(...values, 0);
    const W = 260;
    const H = 90;
    const barW = W / Math.max(values.length, 1) - 6;
    const gap = 6;
    return (
        <svg viewBox={`0 0 ${W} ${H + 20}`} style={{ width: '100%', display: 'block' }} role="img" aria-label="Bar chart">
            {values.map((value, index) => {
                const barH = max === 0 ? 0 : (value / max) * H;
                const x = index * (barW + gap);
                return (
                    <g key={index}>
                        <rect
                            x={x}
                            y={H - barH}
                            width={barW}
                            height={barH}
                            rx={3}
                            fill={color}
                            opacity={0.8}
                        />
                        <text
                            x={x + barW / 2}
                            y={H + 14}
                            textAnchor="middle"
                            fontSize={8}
                            fill="#9ca3af"
                        >
                            {labels[index]}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}

function MiniLineChart({ values, color = '#059669' }: { values: number[]; color?: string }) {
    const max = Math.max(...values, 0);
    const min = Math.min(...values, 0);
    const W = 260;
    const H = 80;
    const pad = 6;
    const xs = values.map((_, index) => pad + (index / Math.max(values.length - 1, 1)) * (W - 2 * pad));
    const ys = values.map((value) => H - pad - ((value - min) / (max - min || 1)) * (H - 2 * pad));
    const d = xs.map((x, index) => `${index === 0 ? 'M' : 'L'}${x},${ys[index]}`).join(' ');
    const area = `${d} L${xs[xs.length - 1]},${H} L${xs[0]},${H} Z`;
    return (
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }} role="img" aria-label="Line chart">
            <defs>
                <linearGradient id={`lg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={area} fill={`url(#lg-${color.replace('#', '')})`} />
            <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
    );
}

interface AdminAnalytics {
    totalUsers: number;
    approvedTherapists: number;
    pendingTherapistApplications: number;
    totalBookings: number;
    cancelledBookings: number;
    totalMoodEntries: number;
    openReports: number;
    libraryItemCount: number;
    trends: {
        labels: string[];
        newUsers: number[];
        bookings: number[];
        cancelledBookings: number[];
        moodEntries: number[];
        reportsOpened: number[];
    };
    grouped: {
        libraryByType: Array<{ type: string; count: number }>;
        therapistApplicationsByStatus: Array<{ status: string; count: number }>;
    };
}

interface AdminAnalyticsResponse {
    data: AdminAnalytics;
}

async function fetchAnalytics(): Promise<AdminAnalytics> {
    const response = await http.get<AdminAnalyticsResponse>('/admin/analytics');
    return response.data;
}

function formatCount(value: number): string {
    return new Intl.NumberFormat('en-US').format(value);
}

export function AdminAnalyticsPage() {
    const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await fetchAnalytics();
                setAnalytics(data);
            } catch (err: unknown) {
                setAnalytics(null);
                setError((err as { message?: string }).message ?? 'Failed to load analytics.');
            } finally {
                setIsLoading(false);
            }
        })();
    }, []);

    const kpiStats = useMemo(() => {
        if (!analytics) return [];
        return [
            { Icon: Users, label: 'Total users', value: formatCount(analytics.totalUsers), color: 'iconPurple' },
            { Icon: Clock, label: 'Approved therapists', value: formatCount(analytics.approvedTherapists), color: 'iconBlue' },
            { Icon: UserCheck, label: 'Pending therapist applications', value: formatCount(analytics.pendingTherapistApplications), color: 'iconAmber' },
            { Icon: MessageCircle, label: 'Total bookings', value: formatCount(analytics.totalBookings), color: 'iconGreen' },
            { Icon: UserX, label: 'Cancelled bookings', value: formatCount(analytics.cancelledBookings), color: 'iconRose' },
            { Icon: Heart, label: 'Total mood entries', value: formatCount(analytics.totalMoodEntries), color: 'iconGreen' },
            { Icon: AlertTriangle, label: 'Open reports', value: formatCount(analytics.openReports), color: 'iconRose' },
            { Icon: BookOpen, label: 'Library items', value: formatCount(analytics.libraryItemCount), color: 'iconPurple' },
        ];
    }, [analytics]);

    const chartSections = useMemo(() => {
        if (!analytics) return [];
        const libraryByType = analytics.grouped.libraryByType.length > 0
            ? analytics.grouped.libraryByType
            : [{ type: 'none', count: 0 }];
        const applicationStatus = analytics.grouped.therapistApplicationsByStatus.length > 0
            ? analytics.grouped.therapistApplicationsByStatus
            : [{ status: 'none', count: 0 }];

        return [
            {
                Icon: Users,
                title: 'New users per day',
                color: '#7c3aed',
                values: analytics.trends.newUsers,
                labels: analytics.trends.labels,
                type: 'bar' as const,
                summary: `${formatCount(analytics.trends.newUsers.reduce((sum, value) => sum + value, 0))} new users in last 7 days`,
            },
            {
                Icon: MessageCircle,
                title: 'Bookings per day',
                color: '#d97706',
                values: analytics.trends.bookings,
                labels: analytics.trends.labels,
                type: 'bar' as const,
                summary: `${formatCount(analytics.trends.bookings.reduce((sum, value) => sum + value, 0))} bookings in last 7 days`,
            },
            {
                Icon: Heart,
                title: 'Mood entries per day',
                color: '#e11d48',
                values: analytics.trends.moodEntries,
                labels: analytics.trends.labels,
                type: 'line' as const,
                summary: `${formatCount(analytics.trends.moodEntries.reduce((sum, value) => sum + value, 0))} mood entries in last 7 days`,
            },
            {
                Icon: AlertTriangle,
                title: 'Reports opened per day',
                color: '#dc2626',
                values: analytics.trends.reportsOpened,
                labels: analytics.trends.labels,
                type: 'line' as const,
                summary: `${formatCount(analytics.trends.reportsOpened.reduce((sum, value) => sum + value, 0))} reports opened in last 7 days`,
            },
            {
                Icon: BookOpen,
                title: 'Library items by type',
                color: '#059669',
                values: libraryByType.map((item) => item.count),
                labels: libraryByType.map((item) => item.type.slice(0, 3).toUpperCase()),
                type: 'bar' as const,
                summary: `${formatCount(analytics.libraryItemCount)} total library items`,
            },
            {
                Icon: Star,
                title: 'Therapist applications by status',
                color: '#0d9488',
                values: applicationStatus.map((item) => item.count),
                labels: applicationStatus.map((item) => item.status.slice(0, 3).toUpperCase()),
                type: 'bar' as const,
                summary: `${formatCount(analytics.pendingTherapistApplications)} currently pending`,
            },
        ];
    }, [analytics]);

    return (
        <main className={styles.page}>
            <div className={styles.header}>
                <div className={styles.headerText}>
                    <h1 className={styles.title}>Platform Analytics</h1>
                    <p className={styles.subtitle}>Week ending {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
            </div>

            {error && (
                <div className={styles.card} style={{ padding: '0.875rem 1rem' }}>
                    <p role="alert" style={{ margin: 0, color: '#b91c1c', fontSize: '0.875rem' }}>{error}</p>
                </div>
            )}

            <div className={styles.statsRow} aria-busy={isLoading}>
                {isLoading ? (
                    Array.from({ length: 8 }).map((_, index) => (
                        <div key={index} className={styles.statCard} style={{ opacity: 0.6 }} />
                    ))
                ) : (
                    kpiStats.map(({ Icon, label, value, color }) => (
                        <div key={label} className={styles.statCard}>
                            <div className={`${styles.statIcon} ${styles[color]}`}>
                                <Icon size={20} aria-hidden="true" />
                            </div>
                            <div className={styles.statBody}>
                                <div className={styles.statValue}>{value}</div>
                                <div className={styles.statLabel}>{label}</div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className={styles.analyticsGrid}>
                {isLoading && (
                    Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className={styles.card} style={{ padding: '1rem', minHeight: '200px', opacity: 0.6 }} />
                    ))
                )}
                {!isLoading && chartSections.map(({ Icon, title, color, values, labels, type, summary }) => (
                    <div key={title} className={styles.card} style={{ padding: 0 }}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>
                                <Icon size={15} style={{ color }} aria-hidden="true" />
                                {title}
                            </h2>
                        </div>
                        <div style={{ padding: '1rem 1.25rem 0' }}>
                            {type === 'bar'
                                ? <MiniBarChart values={values} labels={labels} color={color} />
                                : <MiniLineChart values={values} color={color} />
                            }
                        </div>
                        <p style={{ fontSize: '0.78rem', color: '#6b7280', margin: '0.5rem 1.25rem 1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <TrendingUp size={11} aria-hidden="true" style={{ color }} />
                            {summary}
                        </p>
                    </div>
                ))}
            </div>
        </main>
    );
}
