/**
 * src/features/public/LandingPage.tsx
 *
 * Design direction: calm · premium · clinical · trustworthy
 * Palette: deep forest green / warm parchment / near-black
 * No gradients · No neon · No startup flash
 */

import { Link } from 'react-router-dom';
import s from './LandingPage.module.css';

// ── Data ──────────────────────────────────────────────────────────────────────

const FEATURES = [
    {
        icon: '💬',
        title: 'Anonymous Peer Support',
        desc: 'Talk to a trained peer listener — no real name, verified safe moderation, always confidential.',
    },
    {
        icon: '🩺',
        title: 'Licensed Therapist Booking',
        desc: 'Browse profiles of verified, licensed professionals and book private video sessions online.',
    },
    {
        icon: '📊',
        title: 'Mood Tracking & Journal',
        desc: 'Log how you feel daily, identify patterns, and reflect privately. Optional AI insights, never diagnostic.',
    },
    {
        icon: '📚',
        title: 'Self-Help Library',
        desc: 'Evidence-based articles, guided exercises, and resources on anxiety, sleep, grief, and relationships.',
    },
    {
        icon: '⚡',
        title: 'Instant Crisis Access',
        desc: 'One tap to reach the 1926 Sri Lanka National Mental Health Helpline and local emergency services.',
    },
    {
        icon: '🔒',
        title: 'End-to-End Privacy',
        desc: 'All conversations are encrypted. No personal data sold. You choose what to share — and when to stop.',
    },
];

const STATS = [
    { value: '1,400+', label: 'Active members' },
    { value: '98%', label: 'Report feeling heard' },
    { value: '< 3 min', label: 'To get matched' },
    { value: '0', label: 'Data sold to third parties' },
];

const TRUST_ITEMS = [
    'No credit card required',
    'Anonymous by default',
    'Built for Sri Lanka',
    'Clinically reviewed guidelines',
];

const PRIVACY_POINTS = [
    'All sessions are end-to-end encrypted.',
    'No real names are required to create an account.',
    'Conversation data is never sold or shared with advertisers.',
    'You can permanently delete your account and all data at any time.',
    'Peer listeners follow a strict clinical safety protocol.',
];

// ── Component ──────────────────────────────────────────────────────────────────

export function LandingPage() {
    return (
        <div className={s.page}>

            {/* ══════════════════════════════════════
                NAVBAR
            ══════════════════════════════════════ */}
            <header className={s.nav}>
                <div className={s.navInner}>
                    {/* Logo */}
                    <Link to="/" className={s.navLogo} aria-label="MindBridge home">
                        <div className={s.navLogoMark}>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                                <path d="M7 1.5C7 1.5 2 4.5 2 8C2 10.5 4.5 12.5 7 12.5C9.5 12.5 12 10.5 12 8C12 4.5 7 1.5 7 1.5Z" fill="white" fillOpacity="0.9" />
                            </svg>
                        </div>
                        <span className={s.navLogoText}>MindBridge</span>
                    </Link>

                    {/* Nav links */}
                    <nav aria-label="Main navigation">
                        <ul className={s.navLinks}>
                            <li><Link to="/about" className={s.navLink}>About</Link></li>
                            <li><Link to="/privacy" className={s.navLink}>Privacy</Link></li>
                            <li><Link to="/terms" className={s.navLink}>Terms</Link></li>
                        </ul>
                    </nav>

                    <div className={s.navSpacer} />

                    {/* Actions */}
                    <div className={s.navActions}>
                        <a href="tel:1926" className={s.navCrisis} aria-label="Crisis helpline 1926">
                            <span aria-hidden="true">⬤</span> 1926
                        </a>
                        <Link to="/login" className={s.navSignIn}>Sign in</Link>
                        <Link to="/register" className={s.btnPrimary}>Get started</Link>
                    </div>
                </div>
            </header>


            {/* ══════════════════════════════════════
                HERO — split layout
            ══════════════════════════════════════ */}
            <main>
                <section className={s.heroWrap} aria-labelledby="hero-heading">
                    {/* subtle background depth */}
                    <div className={s.heroBg} aria-hidden="true" />

                    <div className={s.heroGrid}>
                        {/* ── Left: text content ── */}
                        <div className={s.heroLeft}>
                            <div className={s.heroEyebrow}>
                                Mental health support · Sri Lanka
                            </div>

                            <h1 id="hero-heading" className={s.heroHeadline}>
                                Support that meets you{' '}
                                <span className={s.heroHeadlineAccent}>where you are.</span>
                            </h1>

                            <p className={s.heroBody}>
                                MindBridge connects you with peer listeners, licensed therapists,
                                and evidence-based self-help tools — privately, safely, and at your own pace.
                            </p>

                            <div className={s.heroActions}>
                                <Link to="/register" className={s.heroBtnPrimary}>
                                    Start for free &rarr;
                                </Link>
                                <Link to="/about" className={s.heroBtnSecondary}>
                                    How it works
                                </Link>
                            </div>

                            <p className={s.heroDisclaimer}>
                                <span aria-hidden="true">⚠</span>
                                <span>
                                    MindBridge is a support platform, not a medical service. It is{' '}
                                    <strong>not</strong> a substitute for emergency care or clinical diagnosis.
                                    In crisis, call{' '}
                                    <a href="tel:1926">1926</a> — free, confidential, 24/7.
                                </span>
                            </p>
                        </div>

                        {/* ── Right: product UI mockup ── */}
                        <div className={s.heroRight} aria-hidden="true">
                            <div className={s.mockupFrame}>
                                {/* Browser chrome top bar */}
                                <div className={s.mockupChrome}>
                                    <span className={s.mockupDot} style={{ background: '#ef4444' }} />
                                    <span className={s.mockupDot} style={{ background: '#f59e0b' }} />
                                    <span className={s.mockupDot} style={{ background: '#22c55e' }} />
                                    <div className={s.mockupUrl}>app.mindbridge.lk</div>
                                </div>

                                {/* App body */}
                                <div className={s.mockupBody}>
                                    {/* Sidebar */}
                                    <div className={s.mockupSidebar}>
                                        <div className={s.mockupSidebarLogo}>
                                            <div className={s.mockupSidebarLogoMark} />
                                            <span className={s.mockupSidebarLogoText}>MindBridge</span>
                                        </div>
                                        <div className={s.mockupSidebarBadge}>My Space</div>
                                        {[
                                            { icon: '⊞', label: 'Dashboard', active: true },
                                            { icon: '💬', label: 'Chat', active: false },
                                            { icon: '📊', label: 'Mood', active: false },
                                            { icon: '📝', label: 'Journal', active: false },
                                            { icon: '📚', label: 'Library', active: false },
                                        ].map(({ icon, label, active }) => (
                                            <div
                                                key={label}
                                                className={s.mockupNavItem}
                                                style={active ? {
                                                    background: 'rgba(28,61,48,0.12)',
                                                    color: '#1C3D30',
                                                    fontWeight: 600,
                                                    borderLeft: '3px solid #1C3D30',
                                                } : undefined}
                                            >
                                                <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>{icon}</span>
                                                {label}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Main content */}
                                    <div className={s.mockupMain}>
                                        {/* Greeting row */}
                                        <div className={s.mockupGreeting}>
                                            <div>
                                                <div className={s.mockupGreetingTitle}>Good morning, Asel</div>
                                                <div className={s.mockupGreetingSubtitle}>Here&rsquo;s your well-being overview</div>
                                            </div>
                                            <div className={s.mockupAvatar}>A</div>
                                        </div>

                                        {/* Mood card */}
                                        <div className={s.mockupCard}>
                                            <div className={s.mockupCardLabel}>Today&rsquo;s Mood</div>
                                            <div className={s.mockupMoodRow}>
                                                {['😔', '😐', '🙂', '😊', '😄'].map((e, i) => (
                                                    <div
                                                        key={i}
                                                        className={s.mockupMoodEmoji}
                                                        style={i === 3 ? {
                                                            background: '#EEF4F1',
                                                            border: '2px solid #1C3D30',
                                                            borderRadius: '0.375rem',
                                                            transform: 'scale(1.15)',
                                                        } : undefined}
                                                    >
                                                        {e}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className={s.mockupMoodBar}>
                                                <div className={s.mockupMoodBarFill} style={{ width: '72%' }} />
                                            </div>
                                            <div className={s.mockupMoodLabel}>Feeling good · 7-day streak 🔥</div>
                                        </div>

                                        {/* Two mini-cards */}
                                        <div className={s.mockupMiniRow}>
                                            <div className={s.mockupMiniCard}>
                                                <div className={s.mockupMiniCardLabel}>Next session</div>
                                                <div className={s.mockupMiniCardValue}>Dr. Perera</div>
                                                <div className={s.mockupMiniCardSub}>Tomorrow · 10:00 AM</div>
                                                <div className={s.mockupMiniCardChip} style={{ background: '#EEF4F1', color: '#1C3D30' }}>Confirmed</div>
                                            </div>
                                            <div className={s.mockupMiniCard}>
                                                <div className={s.mockupMiniCardLabel}>Journal</div>
                                                <div className={s.mockupMiniCardValue}>Last entry</div>
                                                <div className={s.mockupMiniCardSub}>Yesterday · 2 min</div>
                                                <div className={s.mockupMiniCardChip} style={{ background: '#f5f4f1', color: '#6b7a6b' }}>Private</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>


                {/* ══════════════════════════════════════
                    TRUST BAR
                ══════════════════════════════════════ */}
                <div className={s.trustBar} aria-label="Trust indicators">
                    <div className={s.trustBarInner}>
                        {TRUST_ITEMS.map((item) => (
                            <div key={item} className={s.trustItem}>
                                <svg className={s.trustIcon} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                {item}
                            </div>
                        ))}
                    </div>
                </div>


                {/* ══════════════════════════════════════
                    STATS
                ══════════════════════════════════════ */}
                <section aria-label="Platform statistics">
                    <div className={s.section}>
                        <div className={s.statsRow}>
                            {STATS.map(({ value, label }) => (
                                <div key={label} className={s.statCell}>
                                    <span className={s.statValue}>{value}</span>
                                    <div className={s.statLabel}>{label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>


                {/* ══════════════════════════════════════
                    FEATURES
                ══════════════════════════════════════ */}
                <section aria-labelledby="features-heading">
                    <div className={s.section} style={{ paddingTop: 0 }}>
                        <div className={s.sectionHeader}>
                            <p className={s.sectionLabel}>What we offer</p>
                            <h2 id="features-heading" className={s.sectionTitle}>
                                Everything you need to feel better.
                            </h2>
                            <p className={s.sectionBody}>
                                A complete toolkit for mental well-being — from immediate peer connection
                                to long-term professional support.
                            </p>
                        </div>

                        <div className={s.featureGrid}>
                            {FEATURES.map((f) => (
                                <div key={f.title} className={s.featureCard}>
                                    <div className={s.featureIcon} aria-hidden="true">
                                        {f.icon}
                                    </div>
                                    <h3 className={s.featureTitle}>{f.title}</h3>
                                    <p className={s.featureDesc}>{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>


                {/* ══════════════════════════════════════
                    PRIVACY & SAFETY
                ══════════════════════════════════════ */}
                <section className={s.privacySection} aria-labelledby="privacy-heading">
                    <div className={s.privacyInner}>
                        <div className={s.privacyContent}>
                            <p className={s.sectionLabel}>Privacy & safety</p>
                            <h2 id="privacy-heading" className={s.sectionTitle}>
                                Your privacy is not a feature. It&rsquo;s the foundation.
                            </h2>
                            <ul className={s.privacyPoints} role="list">
                                {PRIVACY_POINTS.map((pt) => (
                                    <li key={pt} className={s.privacyPoint}>
                                        <span className={s.privacyPointDot} aria-hidden="true">✓</span>
                                        {pt}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className={s.privacyPanel} aria-hidden="true">
                            <p className={s.privacyPanelTitle}>
                                Built with clinical integrity at every layer.
                            </p>
                            <div className={s.privacyPanelStat}>
                                <span className={s.privacyPanelNum}>100%</span>
                                <span className={s.privacyPanelCaption}>of peer listeners complete safety training before going live</span>
                            </div>
                            <div className={s.privacyPanelStat}>
                                <span className={s.privacyPanelNum}>0</span>
                                <span className={s.privacyPanelCaption}>third parties receive your personal conversation data</span>
                            </div>
                            <div className={s.privacyPanelStat}>
                                <span className={s.privacyPanelNum}>24/7</span>
                                <span className={s.privacyPanelCaption}>crisis escalation path available through the platform</span>
                            </div>
                        </div>
                    </div>
                </section>


                {/* ══════════════════════════════════════
                    CRISIS BANNER
                ══════════════════════════════════════ */}
                <div className={s.crisisBanner} role="complementary" aria-label="Crisis support">
                    <div className={s.crisisBannerInner}>
                        <span className={s.crisisLabel}>SOS</span>
                        <p className={s.crisisText}>
                            Need immediate help? Sri Lanka National Mental Health Helpline:{' '}
                            <strong>1926</strong> — Free, confidential, 24 hours a day.
                        </p>
                        <a href="tel:1926" className={s.crisisLink}>Call 1926</a>
                        <Link to="/crisis" className={s.crisisLink} style={{ background: 'transparent', border: '1px solid #8B1A1A', color: '#8B1A1A' }}>
                            All resources
                        </Link>
                    </div>
                </div>


                {/* ══════════════════════════════════════
                    FINAL CTA
                ══════════════════════════════════════ */}
                <section className={s.ctaSection} aria-labelledby="cta-heading">
                    <div className={s.ctaInner}>
                        <p className={s.ctaEyebrow}>Get started today</p>
                        <h2 id="cta-heading" className={s.ctaHeadline}>
                            You don&rsquo;t have to figure it out alone.
                        </h2>
                        <p className={s.ctaBody}>
                            Join thousands of people in Sri Lanka who have taken the first step.
                            Free, private, no commitment required.
                        </p>
                        <div className={s.ctaActions}>
                            <Link to="/register" className={s.ctaBtnPrimary}>
                                Create your free account &rarr;
                            </Link>
                            <Link to="/login" className={s.ctaBtnSecondary}>
                                Sign in
                            </Link>
                        </div>
                        <p className={s.ctaNote}>
                            No credit card · No personal data required · Delete anytime
                        </p>
                    </div>
                </section>
            </main>


            {/* ══════════════════════════════════════
                FOOTER
            ══════════════════════════════════════ */}
            <footer className={s.footer}>
                <div className={s.footerInner}>
                    <Link to="/" className={s.footerBrand} aria-label="MindBridge">
                        <div className={s.footerBrandMark} aria-hidden="true" />
                        <span className={s.footerBrandName}>MindBridge</span>
                    </Link>

                    <span className={s.footerCopy}>
                        © {new Date().getFullYear()} MindBridge. All rights reserved.
                    </span>

                    <nav aria-label="Footer links">
                        <ul className={s.footerLinks}>
                            <li><Link to="/about" className={s.footerLink}>About</Link></li>
                            <li><Link to="/privacy" className={s.footerLink}>Privacy</Link></li>
                            <li><Link to="/terms" className={s.footerLink}>Terms</Link></li>
                            <li><Link to="/consent" className={s.footerLink}>Consent</Link></li>
                        </ul>
                    </nav>
                </div>
            </footer>

        </div>
    );
}
