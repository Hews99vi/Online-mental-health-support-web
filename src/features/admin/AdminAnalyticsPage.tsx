import {
    Users,
    MessageCircle,
    TrendingUp,
    BarChart2,
    Heart,
    BookOpen,
    Clock,
    Star,
} from 'lucide-react';
import styles from './Admin.module.css';

// ── Stub chart data ───────────────────────────────────────────────────────────

/** Mini bar chart rendered as pure SVG — replace with Recharts / Chart.js later */
function MiniBarChart({
    values,
    labels,
    color = '#7c3aed',
}: {
    values: number[];
    labels: string[];
    color?: string;
}) {
    const max = Math.max(...values);
    const W = 260, H = 90, barW = W / values.length - 6, gap = 6;
    return (
        <svg viewBox={`0 0 ${W} ${H + 20}`} style={{ width: '100%', display: 'block' }} role="img" aria-label="Bar chart">
            {values.map((v, i) => {
                const barH = max === 0 ? 0 : (v / max) * H;
                const x = i * (barW + gap);
                return (
                    <g key={i}>
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
                            {labels[i]}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}

function MiniLineChart({ values, color = '#059669' }: { values: number[]; color?: string }) {
    const max = Math.max(...values);
    const min = Math.min(...values);
    const W = 260, H = 80, pad = 6;
    const xs = values.map((_, i) => pad + (i / (values.length - 1)) * (W - 2 * pad));
    const ys = values.map(v => H - pad - ((v - min) / (max - min || 1)) * (H - 2 * pad));
    const d = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x},${ys[i]}`).join(' ');
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

// ── Chart configs ──────────────────────────────────────────────────────────────

const CHART_SECTIONS = [
    {
        Icon: Users,
        title: 'New users per day',
        color: '#7c3aed',
        values: [42, 55, 38, 70, 61, 88, 74],
        labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
        type: 'bar' as const,
        summary: '428 new users this week (+18%)',
    },
    {
        Icon: MessageCircle,
        title: 'Chat sessions per day',
        color: '#2563eb',
        values: [120, 98, 140, 160, 135, 80, 55],
        labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
        type: 'bar' as const,
        summary: '788 sessions this week',
    },
    {
        Icon: BookOpen,
        title: 'Library engagement',
        color: '#059669',
        values: [320, 410, 380, 520, 490, 600, 570],
        labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
        type: 'line' as const,
        summary: '3,290 article views this week (+24%)',
    },
    {
        Icon: Heart,
        title: 'Avg platform mood score',
        color: '#e11d48',
        values: [5.8, 6.1, 5.9, 6.4, 6.2, 6.7, 6.5],
        labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
        type: 'line' as const,
        summary: 'Overall improving trend +0.7 pts',
    },
    {
        Icon: TrendingUp,
        title: 'Therapy bookings per day',
        color: '#d97706',
        values: [14, 22, 18, 30, 26, 10, 4],
        labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
        type: 'bar' as const,
        summary: '124 bookings this week',
    },
    {
        Icon: Star,
        title: 'Session satisfaction ratings',
        color: '#0d9488',
        values: [4.6, 4.7, 4.8, 4.7, 4.9, 4.8, 5.0],
        labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
        type: 'line' as const,
        summary: 'Avg 4.8 / 5.0 this week',
    },
];

const KPI_STATS = [
    { Icon: Users, label: 'Total users', value: '4,812', color: 'iconPurple' },
    { Icon: Clock, label: 'Avg session length', value: '42 min', color: 'iconBlue' },
    { Icon: BarChart2, label: 'Retention (30d)', value: '71%', color: 'iconGreen' },
    { Icon: Star, label: 'Platform rating', value: '4.8★', color: 'iconAmber' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function AdminAnalyticsPage() {
    return (
        <main className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerText}>
                    <h1 className={styles.title}>Platform Analytics</h1>
                    <p className={styles.subtitle}>Week ending {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
            </div>

            {/* KPI strip */}
            <div className={styles.statsRow}>
                {KPI_STATS.map(({ Icon, label, value, color }) => (
                    <div key={label} className={styles.statCard}>
                        <div className={`${styles.statIcon} ${styles[color]}`}>
                            <Icon size={20} aria-hidden="true" />
                        </div>
                        <div className={styles.statBody}>
                            <div className={styles.statValue}>{value}</div>
                            <div className={styles.statLabel}>{label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Chart grid */}
            <div className={styles.analyticsGrid}>
                {CHART_SECTIONS.map(({ Icon, title, color, values, labels, type, summary }) => (
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
