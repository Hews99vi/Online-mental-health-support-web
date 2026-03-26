import { useEffect, useMemo, useState } from 'react';
import { http } from '../../api/http';
import type { CrisisResources, Hotline } from '../../types';
import styles from './CrisisPage.module.css';

interface CrisisResponse {
    data: {
        resources: CrisisResources;
    };
}

function isCallableNumber(value: string): boolean {
    const trimmed = value.trim();
    return /^\d/.test(trimmed) || trimmed.startsWith('+');
}

function telHref(value: string): string {
    return `tel:${value.replace(/\s/g, '')}`;
}

export function CrisisPage() {
    const [data, setData] = useState<CrisisResources | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        http
            .get<CrisisResponse>('/crisis/resources')
            .then((response) => {
                setData(response.data.resources);
                setError(null);
            })
            .catch((err: unknown) => {
                setError((err as { message?: string }).message ?? 'Failed to load crisis resources.');
            });
    }, []);

    const primaryHotline = data?.emergencyHotline ?? {
        name: 'Sri Lanka National Mental Health Helpline',
        number: '1926',
        available: '24/7',
        description: 'Free, confidential crisis support in Sinhala, Tamil, and English.',
        actionLabel: 'Call 1926 now',
    };

    const localResources = useMemo<Hotline[]>(
        () => data?.localResources ?? [primaryHotline],
        [data, primaryHotline]
    );

    return (
        <div className={styles.page}>
            <section className={styles.banner} role="alert">
                <span aria-hidden="true">!</span>
                <div>
                    <h2 className={styles.bannerTitle}>Immediate safety comes first</h2>
                    <p className={styles.bannerSubtitle}>
                        If you are in immediate physical danger, call <a href="tel:119" className={styles.resourceLink}>119</a> or go to your nearest Emergency Room.
                    </p>
                </div>
            </section>

            <section className={styles.primaryHotline} aria-labelledby="primary-heading">
                <p className={styles.hotlineLabel}>{primaryHotline.name}</p>
                <h1 id="primary-heading" className="sr-only">Crisis Support</h1>
                <a href="tel:1926" className={styles.hotlineNumber} aria-label="Call 1926">
                    1926
                </a>
                <p className={styles.hotlineNote}>
                    {primaryHotline.available} · {primaryHotline.description}
                </p>
            </section>

            <section className={styles.resources} aria-labelledby="support-text-heading">
                <h2 id="support-text-heading" className={styles.sectionTitle}>You are not alone</h2>
                {error ? (
                    <div className={styles.resourceCard} role="alert">
                        <p className={styles.resourceDesc}>{error}</p>
                    </div>
                ) : !data ? (
                    <div className={styles.resourceCard}>
                        <p className={styles.resourceDesc} aria-live="polite">Loading crisis resources...</p>
                    </div>
                ) : (
                    data.supportText.split('\n\n').map((para, index) => (
                        <div key={index} className={styles.resourceCard}>
                            <p className={styles.resourceDesc}>{para.trim()}</p>
                        </div>
                    ))
                )}
            </section>

            <section className={styles.resources} aria-labelledby="contacts-heading">
                <h2 id="contacts-heading" className={styles.sectionTitle}>All crisis contacts</h2>
                <ul className={styles.resourceList} role="list">
                    {localResources.map((resource) => (
                        <li key={`${resource.name}-${resource.number}`} className={styles.resourceCard} role="listitem">
                            <strong className={styles.resourceName}>{resource.name}</strong>
                            <p className={styles.resourceDesc}>{resource.available}</p>
                            <p className={styles.resourceDesc}>{resource.description}</p>
                            {isCallableNumber(resource.number) ? (
                                <a
                                    href={telHref(resource.number)}
                                    className={styles.resourceLink}
                                    aria-label={`Call ${resource.name}: ${resource.number}`}
                                >
                                    {resource.actionLabel ?? `Call ${resource.number}`}
                                </a>
                            ) : (
                                <a
                                    href={resource.number}
                                    className={styles.resourceLink}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    {resource.actionLabel ?? 'Open resource'}
                                </a>
                            )}
                        </li>
                    ))}
                </ul>
            </section>

            <section className={styles.safetyPlan} aria-labelledby="safety-heading">
                <h2 id="safety-heading" className={styles.sectionTitle}>Immediate safety steps</h2>
                <ol className={styles.steps}>
                    <li>Call <a href="tel:1926" className={styles.resourceLink}>1926</a> to speak to a trained counsellor right now.</li>
                    <li>Move to a safer, calmer place if you can.</li>
                    <li>Contact someone you trust and tell them you need support now.</li>
                    <li>If you are in immediate physical danger, call <a href="tel:119" className={styles.resourceLink}>119</a>.</li>
                    {data?.quickActionLabels?.slice(1, 3).map((label) => (
                        <li key={label}>{label}</li>
                    ))}
                </ol>
            </section>

            <section className={styles.resourceCard} role="note">
                <strong className={styles.resourceName}>Important</strong>
                <p className={styles.resourceDesc}>
                    MindBridge is a peer support and well-being platform. It is not an emergency service or a substitute for professional medical or psychiatric care.
                </p>
            </section>
        </div>
    );
}
