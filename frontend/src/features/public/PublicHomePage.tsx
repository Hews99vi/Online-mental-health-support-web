import { Link } from 'react-router-dom';
import styles from './Public.module.css';

const FEATURES = [
    {
        icon: '💬',
        title: 'Anonymous Chat',
        desc: 'Talk to a trained peer listener in a safe, moderated space — no real name, no judgment, no pressure.',
        color: '#818cf8',
        colorDim: '#eef2ff',
    },
    {
        icon: '🩺',
        title: 'Licensed Therapists',
        desc: 'Browse verified, licensed professionals and book private online sessions at your convenience.',
        color: '#38bdf8',
        colorDim: '#e0f2fe',
    },
    {
        icon: '📊',
        title: 'Mood & Journal',
        desc: 'Log your mood daily, spot patterns over time, and reflect privately with optional AI-powered insights.',
        color: '#34d399',
        colorDim: '#d1fae5',
    },
    {
        icon: '📚',
        title: 'Self-Help Library',
        desc: 'Curated articles, videos, and guided exercises on anxiety, stress, sleep, relationships and more.',
        color: '#fb923c',
        colorDim: '#fff7ed',
    },
    {
        icon: '🤖',
        title: 'AI Well-being Tips',
        desc: 'Personalised weekly check-in summaries powered by Gemini — always private, never diagnostic.',
        color: '#a78bfa',
        colorDim: '#f5f3ff',
    },
    {
        icon: '🆘',
        title: 'Crisis Support',
        desc: 'One-tap access to the 1926 National Mental Health Helpline and local emergency resources.',
        color: '#f87171',
        colorDim: '#fef2f2',
    },
];

const STATS = [
    { value: '1,400+', label: 'Active users' },
    { value: '98%', label: 'Private & anonymous' },
    { value: '24/7', label: 'Support available' },
    { value: 'Free', label: 'Always' },
];

const STEPS = [
    { number: '01', title: 'Create an account', desc: 'Sign up in under a minute — no personal details required to start.' },
    { number: '02', title: 'Choose your support', desc: 'Chat with a peer, book a therapist, or explore self-help resources.' },
    { number: '03', title: 'Feel better, together', desc: 'Track your progress, reflect in your journal, and build resilience.' },
];

export function PublicHomePage() {
    return (
        <div className={styles.page}>

            {/* ══════════════════════════════════════════════════
                HERO — dark gradient, large headline
            ══════════════════════════════════════════════════ */}
            <section
                className={styles.heroV2}
                aria-labelledby="hero-heading"
                style={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e0a3c 60%, #0c1a3a 100%)',
                    padding: 'clamp(4rem, 10vw, 7rem) 1.5rem clamp(3rem, 8vw, 6rem)',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Ambient glow blobs */}
                <div aria-hidden="true" style={{ position: 'absolute', top: '-10rem', left: '50%', transform: 'translateX(-50%)', width: '60rem', height: '30rem', background: 'radial-gradient(ellipse, rgba(124,58,237,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <div aria-hidden="true" style={{ position: 'absolute', bottom: '-8rem', right: '-5rem', width: '35rem', height: '35rem', background: 'radial-gradient(ellipse, rgba(14,165,233,0.15) 0%, transparent 65%)', pointerEvents: 'none' }} />

                <div style={{ position: 'relative', zIndex: 1, maxWidth: '54rem', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                    {/* Badge */}
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.875rem', borderRadius: '999px', border: '1px solid rgba(167,139,250,0.4)', background: 'rgba(124,58,237,0.15)', color: '#c4b5fd', fontSize: '0.8125rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        🇱🇰 &nbsp;Built for Sri Lanka
                    </span>

                    {/* Headline */}
                    <h1 id="hero-heading" style={{ fontFamily: "'Outfit', 'Inter', sans-serif", fontSize: 'clamp(2.5rem, 7vw, 4.5rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.04em', color: '#f8fafc', margin: 0 }}>
                        Your mind matters.{' '}
                        <br />
                        <span style={{ background: 'linear-gradient(135deg, #a78bfa, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                            We're here to listen.
                        </span>
                    </h1>

                    {/* Subtitle */}
                    <p style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: '#94a3b8', maxWidth: '38rem', lineHeight: 1.65, margin: 0 }}>
                        MindBridge connects you with peer support, licensed therapists, and evidence-based self-help resources — privately and safely.
                    </p>

                    {/* CTA row */}
                    <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
                        <Link
                            to="/register"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.8rem 2rem', borderRadius: '0.875rem', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff', fontWeight: 700, fontSize: '1.0625rem', textDecoration: 'none', boxShadow: '0 6px 32px rgba(124,58,237,0.45)', transition: 'transform 0.15s, box-shadow 0.15s' }}
                            onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                            onMouseOut={(e) => (e.currentTarget.style.transform = '')}
                        >
                            Start for free →
                        </Link>
                        <Link
                            to="/about"
                            style={{ display: 'inline-flex', alignItems: 'center', padding: '0.8rem 1.75rem', borderRadius: '0.875rem', border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.07)', color: '#e2e8f0', fontWeight: 600, fontSize: '1.0625rem', textDecoration: 'none', backdropFilter: 'blur(4px)', transition: 'background 0.15s' }}
                        >
                            Learn more
                        </Link>
                    </div>

                    {/* Disclaimer chip */}
                    <p style={{ fontSize: '0.8125rem', color: '#6b7280', background: 'rgba(245,243,255,0.06)', border: '1px solid rgba(252,211,77,0.25)', borderRadius: '0.5rem', padding: '0.5rem 0.875rem', margin: 0, lineHeight: 1.5 }}>
                        ⚠️ MindBridge supports well-being. It is <strong style={{ color: '#fcd34d' }}>not</strong> a substitute for professional diagnosis or emergency services. In crisis, call{' '}
                        <a href="tel:1926" style={{ color: '#fca5a5', fontWeight: 800, textDecoration: 'none' }}>1926</a>.
                    </p>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════
                STATS STRIP
            ══════════════════════════════════════════════════ */}
            <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '2rem 1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1.5rem 2rem', textAlign: 'center' }}>
                    {STATS.map(({ value, label }) => (
                        <div key={label}>
                            <div style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: 900, fontFamily: "'Outfit', sans-serif", background: 'linear-gradient(135deg, #7c3aed, #0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1.1 }}>
                                {value}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem', fontWeight: 500 }}>
                                {label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ══════════════════════════════════════════════════
                FEATURES GRID
            ══════════════════════════════════════════════════ */}
            <section
                aria-label="Platform features"
                style={{ padding: 'clamp(3.5rem, 8vw, 5.5rem) 1.5rem', background: 'linear-gradient(180deg, #f8f9fc 0%, #fff 100%)' }}
            >
                <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <h2 style={{ fontFamily: "'Outfit', 'Inter', sans-serif", fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, color: '#111827', letterSpacing: '-0.03em', margin: '0 0 0.75rem' }}>
                            Everything you need in one place
                        </h2>
                        <p style={{ color: '#6b7280', fontSize: '1.0625rem', maxWidth: '36rem', margin: '0 auto', lineHeight: 1.6 }}>
                            Comprehensive mental health support — from peer conversations to licensed therapy — all in one private platform.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(17rem, 1fr))', gap: '1.25rem' }}>
                        {FEATURES.map((f) => (
                            <div
                                key={f.title}
                                style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: '1.125rem', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'box-shadow 0.2s, transform 0.18s', cursor: 'default' }}
                                onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 36px rgba(0,0,0,0.1)`; (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; }}
                                onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; (e.currentTarget as HTMLElement).style.transform = ''; }}
                            >
                                <div style={{ width: '3rem', height: '3rem', borderRadius: '0.75rem', background: f.colorDim, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                                    {f.icon}
                                </div>
                                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '1.0625rem', color: '#111827', margin: 0 }}>
                                    {f.title}
                                </h3>
                                <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: 0, lineHeight: 1.6 }}>
                                    {f.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════
                HOW IT WORKS — 3 steps
            ══════════════════════════════════════════════════ */}
            <section
                aria-label="How MindBridge works"
                style={{ padding: 'clamp(3.5rem, 8vw, 5.5rem) 1.5rem', background: '#fff' }}
            >
                <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
                    <h2 style={{ textAlign: 'center', fontFamily: "'Outfit', 'Inter', sans-serif", fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, color: '#111827', letterSpacing: '-0.03em', margin: '0 0 3rem' }}>
                        Get support in 3 minutes
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))', gap: '2rem' }}>
                        {STEPS.map((step) => (
                            <div key={step.number} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                                <div style={{ width: '3rem', height: '3rem', borderRadius: '0.75rem', background: 'linear-gradient(135deg, #6d28d9, #7c3aed)', color: '#fff', fontWeight: 900, fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.04em', boxShadow: '0 4px 16px rgba(109,40,217,0.3)' }}>
                                    {step.number}
                                </div>
                                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '1.125rem', color: '#111827', margin: 0 }}>
                                    {step.title}
                                </h3>
                                <p style={{ fontSize: '0.9375rem', color: '#6b7280', margin: 0, lineHeight: 1.6 }}>
                                    {step.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════
                TRUST STRIP — privacy callout
            ══════════════════════════════════════════════════ */}
            <section
                aria-label="Privacy commitment"
                style={{ background: '#f5f3ff', borderTop: '1px solid #ede9fe', borderBottom: '1px solid #ede9fe', padding: '2.5rem 1.5rem' }}
            >
                <div style={{ maxWidth: '64rem', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '2rem 3rem', textAlign: 'center' }}>
                    {[
                        { icon: '🔒', label: 'End-to-end encrypted', sub: 'All conversations are private' },
                        { icon: '🙈', label: 'No real name required', sub: 'Stay fully anonymous' },
                        { icon: '🇱🇰', label: 'Built for Sri Lanka', sub: 'Local context & hotlines' },
                        { icon: '🤝', label: 'Never sold to third parties', sub: 'Your data stays yours' },
                    ].map(({ icon, label, sub }) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>{icon}</span>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#4c1d95' }}>{label}</div>
                                <div style={{ fontSize: '0.8125rem', color: '#7c3aed' }}>{sub}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ══════════════════════════════════════════════════
                CRISIS BANNER
            ══════════════════════════════════════════════════ */}
            <section
                className={styles.crisisBanner}
                aria-labelledby="crisis-cta"
            >
                <div className={styles.crisisBannerInner}>
                    <span className={styles.crisisBannerIcon} aria-hidden="true">🆘</span>
                    <div>
                        <h2 id="crisis-cta" className={styles.crisisBannerTitle}>Need immediate help?</h2>
                        <p className={styles.crisisBannerText}>
                            Sri Lanka National Mental Health Helpline:{' '}
                            <a href="tel:1926" className={styles.crisisBannerNumber}>1926</a>
                            {' — '}Free, confidential, 24/7.
                        </p>
                    </div>
                    <Link to="/crisis" className={styles.crisisBannerBtn}>
                        View all resources
                    </Link>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════
                FINAL CTA
            ══════════════════════════════════════════════════ */}
            <section
                style={{ padding: 'clamp(4rem, 10vw, 7rem) 1.5rem', textAlign: 'center', background: 'linear-gradient(135deg, #0f172a, #1e0a3c)', position: 'relative', overflow: 'hidden' }}
                aria-labelledby="final-cta"
            >
                <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.25) 0%, transparent 60%)', pointerEvents: 'none' }} />
                <div style={{ position: 'relative', zIndex: 1, maxWidth: '44rem', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
                    <h2 id="final-cta" style={{ fontFamily: "'Outfit', 'Inter', sans-serif", fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.04em', margin: 0, lineHeight: 1.15 }}>
                        Ready to start your journey?
                    </h2>
                    <p style={{ fontSize: '1.0625rem', color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
                        It's free, private, and takes less than a minute to get started.
                    </p>
                    <Link
                        to="/register"
                        style={{ marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.9rem 2.25rem', borderRadius: '0.875rem', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff', fontWeight: 700, fontSize: '1.0625rem', textDecoration: 'none', boxShadow: '0 8px 36px rgba(124,58,237,0.5)', transition: 'transform 0.15s, box-shadow 0.15s' }}
                        onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                        onMouseOut={(e) => (e.currentTarget.style.transform = '')}
                    >
                        Create your free account →
                    </Link>
                    <p style={{ fontSize: '0.8125rem', color: '#475569', margin: 0 }}>
                        No credit card required · Cancel any time · 100% private
                    </p>
                </div>
            </section>

        </div>
    );
}
