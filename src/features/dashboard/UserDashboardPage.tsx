import { Link } from 'react-router-dom';
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
import styles from './Dashboard.module.css';

// ── stub data ─────────────────────────────────────────────────────────────────

const MOOD_VALS = [3, 5, 4, 6, 5, 7, 6]; // 1-10
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function MoodSparkline() {
    const max = 10;
    const w = 240, h = 100, pad = 8;
    const xs = MOOD_VALS.map((_, i) => pad + (i / (MOOD_VALS.length - 1)) * (w - 2 * pad));
    const ys = MOOD_VALS.map(v => h - pad - ((v / max) * (h - 2 * pad)));
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
    { to: '/mood', Icon: Smile, title: 'Log today\'s mood', desc: 'Takes 30 seconds' },
    { to: '/journal', Icon: BookOpen, title: 'Write in your journal', desc: 'Private and encrypted' },
    { to: '/chat', Icon: MessageCircle, title: 'Talk to a listener', desc: 'Someone is ready now' },
    { to: '/therapists', Icon: Heart, title: 'Find a therapist', desc: 'Browse verified professionals' },
];

const UPCOMING = [
    { initials: 'DT', name: 'Dr. Sarah Thompson', time: 'Tomorrow, 10:00 AM', type: '50-min session' },
    { initials: 'MK', name: 'Marcus K. (Listener)', time: 'Fri 14 Feb, 4:30 PM', type: 'Chat session' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function UserDashboardPage() {
    const { user } = useAuth();
    const firstName = user?.name?.split(' ')[0] ?? 'there';

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    return (
        <main className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerText}>
                    <h1 className={styles.greeting}>{greeting}, {firstName} 👋</h1>
                    <p className={styles.subGreeting}>Here's your wellness summary for today.</p>
                </div>
                <div className={styles.headerActions}>
                    <Link to="/bookings" className={styles.actionItem} style={{ padding: '0.5rem 1rem', gap: '0.375rem', borderRadius: '0.625rem', fontSize: '0.875rem', fontWeight: 500, background: 'var(--color-primary-light, #EEF4F1)', color: 'var(--color-primary, #1C3D30)', border: '1px solid rgba(28,61,48,0.2)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                        <CalendarDays size={15} aria-hidden="true" />
                        My Bookings
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.statIconPurple}`}>
                        <Smile size={20} aria-hidden="true" />
                    </div>
                    <div className={styles.statBody}>
                        <span className={styles.statValue}>6.2</span>
                        <span className={styles.statLabel}>Avg mood this week</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
                        <TrendingUp size={20} aria-hidden="true" />
                    </div>
                    <div className={styles.statBody}>
                        <span className={styles.statValue}>+12%</span>
                        <span className={styles.statLabel}>vs last week</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
                        <CalendarDays size={20} aria-hidden="true" />
                    </div>
                    <div className={styles.statBody}>
                        <span className={styles.statValue}>2</span>
                        <span className={styles.statLabel}>Upcoming sessions</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.statIconAmber}`}>
                        <BookOpen size={20} aria-hidden="true" />
                    </div>
                    <div className={styles.statBody}>
                        <span className={styles.statValue}>5</span>
                        <span className={styles.statLabel}>Journals this month</span>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className={styles.twoCol}>
                {/* Mood chart */}
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
                        <MoodSparkline />
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.375rem' }}>
                            {DAYS.map((d, i) => (
                                <span key={i} style={{ fontSize: '0.6875rem', color: '#9ca3af', width: '14.28%', textAlign: 'center' }}>{d}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Upcoming sessions */}
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
                            {UPCOMING.map(({ initials, name, time, type }) => (
                                <div key={name} className={styles.sessionRow}>
                                    <div className={styles.avatar}>{initials}</div>
                                    <div className={styles.sessionInfo}>
                                        <div className={styles.sessionName}>{name}</div>
                                        <div className={styles.sessionMeta}>{time} · {type}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick actions */}
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
        </main>
    );
}
