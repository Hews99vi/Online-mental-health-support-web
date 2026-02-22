import { useState, useEffect } from 'react';
import { mockGetCrisisResources } from '../../mocks/crisisApi';
import type { CrisisResources } from '../../types';
import styles from './CrisisPage.module.css';

export function CrisisPage() {
    const [data, setData] = useState<CrisisResources | null>(null);

    useEffect(() => {
        mockGetCrisisResources().then(setData);
    }, []);

    return (
        <div className={styles.page}>
            {/* ── Emergency header ── */}
            <div className={styles.alertBanner} role="alert">
                <span aria-hidden="true">⚠️</span>
                If you are in immediate physical danger, call emergency services:{' '}
                <a href="tel:119" className={styles.emergencyNum}>119</a> or go to your nearest Emergency Room.
            </div>

            <div className={styles.container}>
                {/* ── Primary hotline ── */}
                <section className={styles.primary} aria-labelledby="primary-heading">
                    <span className={styles.primaryIcon} aria-hidden="true">🆘</span>
                    <h1 id="primary-heading" className={styles.primaryTitle}>
                        Crisis Support
                    </h1>
                    <p className={styles.primarySub}>Sri Lanka National Mental Health Helpline</p>
                    <a href="tel:1926" className={styles.bigNumber} aria-label="Call 1926">
                        1926
                    </a>
                    <p className={styles.primaryMeta}>Free · Confidential · Available 24/7</p>
                    <p className={styles.primaryLangs}>Sinhala · Tamil · English</p>
                </section>

                {/* ── Guidance text ── */}
                {data && (
                    <section className={styles.guidance} aria-labelledby="guidance-heading">
                        <h2 id="guidance-heading" className={styles.sectionHeading}>You are not alone</h2>
                        {data.guidanceText.split('\n\n').map((para, i) => (
                            <p key={i}>{para.trim()}</p>
                        ))}
                    </section>
                )}

                {/* ── All hotlines ── */}
                <section aria-labelledby="hotlines-heading">
                    <h2 id="hotlines-heading" className={styles.sectionHeading}>All crisis contacts</h2>
                    {!data ? (
                        <p className={styles.loading} aria-live="polite">Loading…</p>
                    ) : (
                        <ul className={styles.hotlines} role="list">
                            {data.hotlines.map((h) => (
                                <li key={h.name} className={styles.hotlineCard} role="listitem">
                                    <div className={styles.hotlineHeader}>
                                        <span className={styles.hotlineName}>{h.name}</span>
                                        <span className={styles.hotlineAvail}>{h.available}</span>
                                    </div>
                                    {/^\d/.test(h.number.trim()) || h.number.startsWith('+') ? (
                                        <a
                                            href={`tel:${h.number.replace(/\s/g, '')}`}
                                            className={styles.hotlineNumber}
                                            aria-label={`Call ${h.name}: ${h.number}`}
                                        >
                                            📞 {h.number}
                                        </a>
                                    ) : (
                                        <span className={styles.hotlineNumberText}>{h.number}</span>
                                    )}
                                    <p className={styles.hotlineDesc}>{h.description}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                {/* ── Safety steps ── */}
                <section className={styles.safety} aria-labelledby="safety-heading">
                    <h2 id="safety-heading" className={styles.sectionHeading}>Immediate safety steps</h2>
                    <ol className={styles.safetyList}>
                        <li>Call <a href="tel:1926" className={styles.inlineNum}>1926</a> — trained counsellors are available now.</li>
                        <li>Move to a safe, calm environment if possible.</li>
                        <li>Reach out to someone you trust — a friend, family member, or colleague.</li>
                        <li>If you've harmed yourself or feel you might, call <a href="tel:119">119</a> or go to an Emergency Room.</li>
                        <li>Remember: this feeling is temporary. Help is available.</li>
                    </ol>
                </section>

                {/* ── Boundary disclaimer ── */}
                <div className={styles.disclaimer} role="note">
                    <strong>Important:</strong> MindBridge is a peer support and well-being platform.
                    It is <em>not</em> an emergency service or a substitute for professional
                    medical or psychiatric care. The hotlines above connect you to trained
                    human counsellors.
                </div>
            </div>
        </div>
    );
}
