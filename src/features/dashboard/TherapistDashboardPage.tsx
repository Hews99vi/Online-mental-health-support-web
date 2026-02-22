import { Link } from 'react-router-dom';
import {
    CalendarDays,
    Users,
    Clock,
    Star,
    FileText,
    ChevronRight,
    TrendingUp,
    MessageCircle,
    BarChart2,
} from 'lucide-react';
import { useAuth } from '../../app/AuthContext';
import styles from './Dashboard.module.css';

// ── stub data ─────────────────────────────────────────────────────────────────
const TODAY_SESSIONS = [
    { initials: 'AJ', name: 'Alex J.', time: '09:00 AM', duration: '50 min', type: 'CBT', status: 'upcoming' },
    { initials: 'SK', name: 'Sara K.', time: '11:30 AM', duration: '50 min', type: 'Assessment', status: 'upcoming' },
    { initials: 'MR', name: 'Mike R.', time: '02:00 PM', duration: '50 min', type: 'CBT', status: 'upcoming' },
];

const PENDING_NOTES = [
    { initials: 'LP', name: 'Laura P.', date: 'Yesterday' },
    { initials: 'TN', name: 'Tom N.', date: '3 days ago' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function TherapistDashboardPage() {
    const { user } = useAuth();
    const firstName = user?.name?.split(' ')[0] ?? 'Doctor';

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    return (
        <main className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerText}>
                    <h1 className={styles.greeting}>{greeting}, Dr. {firstName} 🩺</h1>
                    <p className={styles.subGreeting}>
                        You have {TODAY_SESSIONS.length} sessions today. Here's your clinical overview.
                    </p>
                </div>
                <div className={styles.headerActions}>
                    <Link
                        to="/bookings"
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

            {/* Stats */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
                        <Users size={20} aria-hidden="true" />
                    </div>
                    <div className={styles.statBody}>
                        <span className={styles.statValue}>24</span>
                        <span className={styles.statLabel}>Active clients</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.statIconPurple}`}>
                        <CalendarDays size={20} aria-hidden="true" />
                    </div>
                    <div className={styles.statBody}>
                        <span className={styles.statValue}>{TODAY_SESSIONS.length}</span>
                        <span className={styles.statLabel}>Sessions today</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.statIconAmber}`}>
                        <Star size={20} aria-hidden="true" />
                    </div>
                    <div className={styles.statBody}>
                        <span className={styles.statValue}>4.8</span>
                        <span className={styles.statLabel}>Client rating</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
                        <Clock size={20} aria-hidden="true" />
                    </div>
                    <div className={styles.statBody}>
                        <span className={styles.statValue}>148h</span>
                        <span className={styles.statLabel}>Hours this month</span>
                    </div>
                </div>
            </div>

            {/* Main */}
            <div className={styles.twoCol}>
                {/* Today's schedule */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>
                            <CalendarDays size={16} className={styles.cardTitleIcon} aria-hidden="true" />
                            Today's sessions
                        </h2>
                        <Link to="/bookings" style={{ fontSize: '0.8125rem', color: '#7c3aed', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            Full schedule <ChevronRight size={13} aria-hidden="true" />
                        </Link>
                    </div>
                    <div className={styles.cardBody}>
                        <div className={styles.sessionList}>
                            {TODAY_SESSIONS.map(({ initials, name, time, duration, type }) => (
                                <div key={name} className={styles.sessionRow}>
                                    <div className={styles.avatar}>{initials}</div>
                                    <div className={styles.sessionInfo}>
                                        <div className={styles.sessionName}>{name}</div>
                                        <div className={styles.sessionMeta}>{time} · {duration} · {type}</div>
                                    </div>
                                    <span className={styles.badgeBlue}>Upcoming</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Pending notes */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>
                            <FileText size={16} className={styles.cardTitleIcon} aria-hidden="true" />
                            Pending session notes
                        </h2>
                    </div>
                    <div className={styles.cardBody}>
                        {PENDING_NOTES.length === 0 ? (
                            <div className={styles.empty}>All notes are up to date ✓</div>
                        ) : (
                            <div className={styles.sessionList}>
                                {PENDING_NOTES.map(({ initials, name, date }) => (
                                    <div key={name} className={styles.sessionRow}>
                                        <div className={styles.avatar}>{initials}</div>
                                        <div className={styles.sessionInfo}>
                                            <div className={styles.sessionName}>{name}</div>
                                            <div className={styles.sessionMeta}>Session from {date}</div>
                                        </div>
                                        <button
                                            type="button"
                                            style={{ fontSize: '0.8rem', color: '#d97706', fontWeight: 600, background: '#fef3c7', border: 'none', borderRadius: '0.375rem', padding: '0.2rem 0.6rem', cursor: 'pointer' }}
                                        >
                                            Write note
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick actions */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>Clinical tools</h2>
                </div>
                <div className={styles.cardBody}>
                    <ul className={styles.actionList}>
                        <li>
                            <Link to="/chat" className={styles.actionItem}>
                                <span className={styles.actionItemIcon}><MessageCircle size={16} aria-hidden="true" /></span>
                                <span className={styles.actionItemText}>
                                    <div className={styles.actionItemTitle}>Secure client messaging</div>
                                    <div className={styles.actionItemDesc}>End-to-end encrypted</div>
                                </span>
                                <ChevronRight size={14} aria-hidden="true" style={{ color: '#9ca3af', flexShrink: 0 }} />
                            </Link>
                        </li>
                        <li>
                            <Link to="/mood" className={styles.actionItem}>
                                <span className={styles.actionItemIcon}><BarChart2 size={16} aria-hidden="true" /></span>
                                <span className={styles.actionItemText}>
                                    <div className={styles.actionItemTitle}>Client mood insights</div>
                                    <div className={styles.actionItemDesc}>Track outcomes over time</div>
                                </span>
                                <ChevronRight size={14} aria-hidden="true" style={{ color: '#9ca3af', flexShrink: 0 }} />
                            </Link>
                        </li>
                        <li>
                            <Link to="/library" className={styles.actionItem}>
                                <span className={styles.actionItemIcon}><TrendingUp size={16} aria-hidden="true" /></span>
                                <span className={styles.actionItemText}>
                                    <div className={styles.actionItemTitle}>Assign library resources</div>
                                    <div className={styles.actionItemDesc}>Homework & self-help tools</div>
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
