import { Link } from 'react-router-dom';
import {
    MessageCircle,
    Heart,
    Clock,
    Users,
    Star,
    ChevronRight,
    HeadphonesIcon,
    BookOpen,
    TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../app/AuthContext';
import styles from './Dashboard.module.css';

// ── stub queue data ────────────────────────────────────────────────────────────
const QUEUE = [
    { initials: 'AK', name: 'Anonymous User', topic: 'Anxiety & stress', wait: '3 min' },
    { initials: 'JD', name: 'Jamie D.', topic: 'Relationship issues', wait: '7 min' },
    { initials: 'PR', name: 'Anonymous User', topic: 'Loneliness', wait: '12 min' },
];

const RECENT = [
    { initials: 'MN', name: 'User #mN4j', duration: '42 min', rating: 5, date: 'Today' },
    { initials: 'LK', name: 'User #lK9q', duration: '28 min', rating: 4, date: 'Yesterday' },
    { initials: 'OP', name: 'User #oP2r', duration: '55 min', rating: 5, date: 'Mon' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function ListenerDashboardPage() {
    const { user } = useAuth();
    const firstName = user?.name?.split(' ')[0] ?? 'there';

    return (
        <main className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerText}>
                    <h1 className={styles.greeting}>Welcome back, {firstName} 🎧</h1>
                    <p className={styles.subGreeting}>
                        You're making a real difference. Here's your listener summary.
                    </p>
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

            {/* Stats */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.statIconPurple}`}>
                        <MessageCircle size={20} aria-hidden="true" />
                    </div>
                    <div className={styles.statBody}>
                        <span className={styles.statValue}>127</span>
                        <span className={styles.statLabel}>Total sessions</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
                        <Clock size={20} aria-hidden="true" />
                    </div>
                    <div className={styles.statBody}>
                        <span className={styles.statValue}>89h</span>
                        <span className={styles.statLabel}>Hours supported</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.statIconAmber}`}>
                        <Star size={20} aria-hidden="true" />
                    </div>
                    <div className={styles.statBody}>
                        <span className={styles.statValue}>4.9</span>
                        <span className={styles.statLabel}>Avg rating</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
                        <Users size={20} aria-hidden="true" />
                    </div>
                    <div className={styles.statBody}>
                        <span className={styles.statValue}>{QUEUE.length}</span>
                        <span className={styles.statLabel}>In queue now</span>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className={styles.twoCol}>
                {/* Live queue */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>
                            <Users size={16} className={styles.cardTitleIcon} aria-hidden="true" />
                            Users waiting
                        </h2>
                        <span className={styles.badgeGreen}>{QUEUE.length} waiting</span>
                    </div>
                    <div className={styles.cardBody}>
                        <div className={styles.sessionList}>
                            {QUEUE.map(({ initials, name, topic, wait }) => (
                                <div key={initials + topic} className={styles.sessionRow}>
                                    <div className={styles.avatar}>{initials}</div>
                                    <div className={styles.sessionInfo}>
                                        <div className={styles.sessionName}>{name}</div>
                                        <div className={styles.sessionMeta}>{topic} · waiting {wait}</div>
                                    </div>
                                    <Link
                                        to="/chat"
                                        style={{ fontSize: '0.8rem', color: '#7c3aed', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem', whiteSpace: 'nowrap' }}
                                    >
                                        Accept <ChevronRight size={13} aria-hidden="true" />
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent sessions */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>
                            <Heart size={16} className={styles.cardTitleIcon} aria-hidden="true" />
                            Recent sessions
                        </h2>
                    </div>
                    <div className={styles.cardBody}>
                        <div className={styles.sessionList}>
                            {RECENT.map(({ initials, name, duration, rating, date }) => (
                                <div key={initials} className={styles.sessionRow}>
                                    <div className={styles.avatar}>{initials}</div>
                                    <div className={styles.sessionInfo}>
                                        <div className={styles.sessionName}>{name}</div>
                                        <div className={styles.sessionMeta}>{date} · {duration}</div>
                                    </div>
                                    <span className={styles.badgeAmber}>
                                        <Star size={10} aria-hidden="true" />
                                        {rating}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Resources */}
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
                            <div className={styles.actionItem}>
                                <span className={styles.actionItemIcon}><TrendingUp size={16} aria-hidden="true" /></span>
                                <span className={styles.actionItemText}>
                                    <div className={styles.actionItemTitle}>Active listening techniques</div>
                                    <div className={styles.actionItemDesc}>Improve your support quality</div>
                                </span>
                            </div>
                        </li>
                        <li>
                            <div className={styles.actionItem}>
                                <span className={styles.actionItemIcon}><Heart size={16} aria-hidden="true" /></span>
                                <span className={styles.actionItemText}>
                                    <div className={styles.actionItemTitle}>Listener self-care guide</div>
                                    <div className={styles.actionItemDesc}>Prevent compassion fatigue</div>
                                </span>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </main>
    );
}
