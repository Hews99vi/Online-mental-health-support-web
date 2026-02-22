import { Link } from 'react-router-dom';
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
import styles from './Admin.module.css';

// ── stub data ─────────────────────────────────────────────────────────────────

const STATS = [
    { Icon: Users, label: 'Total users', value: '4,812', delta: '+142 this week', up: true, color: 'iconPurple' },
    { Icon: Stethoscope, label: 'Active therapists', value: '38', delta: '3 pending review', up: false, color: 'iconBlue' },
    { Icon: Library, label: 'Library articles', value: '126', delta: '+8 this month', up: true, color: 'iconGreen' },
    { Icon: BarChart2, label: 'Sessions this month', value: '1,280', delta: '+18%', up: true, color: 'iconAmber' },
    { Icon: AlertTriangle, label: 'Open flags', value: '5', delta: 'Needs attention', up: false, color: 'iconRose' },
];

const RECENT_ACTIVITY = [
    { text: 'Therapist Dr. Emma Wilson submitted verification documents.', time: '10 min ago' },
    { text: 'New moderator flag on community post #4421.', time: '32 min ago' },
    { text: 'Library article "CBT Basics" published.', time: '1 h ago' },
    { text: 'Admin approved therapist Dr. James Park.', time: '3 h ago' },
    { text: 'System: Monthly analytics report generated.', time: '6 h ago' },
];

const ADMIN_LINKS = [
    { to: '/admin/therapists', Icon: UserCheck, label: 'Therapist Approvals', desc: 'Review pending applications' },
    { to: '/admin/content', Icon: FileText, label: 'Content Manager', desc: 'Publish & edit articles' },
    { to: '/admin/analytics', Icon: LineChart, label: 'Analytics', desc: 'Platform-wide charts' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function AdminDashboardPage() {
    return (
        <main className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerText}>
                    <h1 className={styles.title}>Admin Dashboard</h1>
                    <p className={styles.subtitle}>Platform health overview — MindBridge</p>
                </div>
                <div className={styles.headerActions}>
                    <Link to="/admin/therapists"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1.125rem', borderRadius: '0.625rem', background: 'linear-gradient(135deg,#7c3aed,#2563eb)', color: '#fff', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none', boxShadow: '0 2px 8px rgba(124,58,237,0.35)' }}
                    >
                        <UserCheck size={16} aria-hidden="true" />
                        Review requests
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className={styles.statsRow}>
                {STATS.map(({ Icon, label, value, delta, up, color }) => (
                    <div key={label} className={styles.statCard}>
                        <div className={`${styles.statIcon} ${styles[color]}`}>
                            <Icon size={20} aria-hidden="true" />
                        </div>
                        <div className={styles.statBody}>
                            <div className={styles.statValue}>{value}</div>
                            <div className={styles.statLabel}>{label}</div>
                            <div style={{ fontSize: '0.72rem', color: up ? '#059669' : '#dc2626', display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.15rem' }}>
                                {up ? <TrendingUp size={10} aria-hidden="true" /> : <TrendingDown size={10} aria-hidden="true" />}
                                {delta}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Nav cards + activity */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Admin section shortcuts */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>
                            <Settings size={16} className={styles.cardTitleIcon} aria-hidden="true" />
                            Admin sections
                        </h2>
                    </div>
                    <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                        {ADMIN_LINKS.map(({ to, Icon, label, desc }) => (
                            <Link
                                key={to}
                                to={to}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.75rem 0.875rem', borderRadius: '0.75rem', background: '#f9fafb', border: '1px solid transparent', textDecoration: 'none', transition: 'background 0.15s, border-color 0.15s' }}
                                onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = '#ede9fe'; (e.currentTarget as HTMLElement).style.borderColor = '#c4b5fd'; }}
                                onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = '#f9fafb'; (e.currentTarget as HTMLElement).style.borderColor = 'transparent'; }}
                            >
                                <span style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', background: '#ede9fe', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Icon size={16} aria-hidden="true" />
                                </span>
                                <span style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>{label}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.1rem' }}>{desc}</div>
                                </span>
                                <ChevronRight size={14} aria-hidden="true" style={{ color: '#9ca3af', flexShrink: 0 }} />
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Recent activity feed */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>
                            <BarChart2 size={16} className={styles.cardTitleIcon} aria-hidden="true" />
                            Recent activity
                        </h2>
                    </div>
                    <ul style={{ listStyle: 'none', margin: 0, padding: '0.5rem 0' }}>
                        {RECENT_ACTIVITY.map(({ text, time }, i) => (
                            <li key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.625rem 1.375rem', borderBottom: i < RECENT_ACTIVITY.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c3aed', flexShrink: 0, marginTop: '0.375rem' }} />
                                <span style={{ flex: 1, fontSize: '0.8125rem', color: '#374151', lineHeight: 1.5 }}>{text}</span>
                                <span style={{ fontSize: '0.72rem', color: '#9ca3af', whiteSpace: 'nowrap', marginTop: '0.1rem' }}>{time}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </main>
    );
}
