import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { http } from '../../api/http';
import type { CrisisResources } from '../../types';
import styles from './CrisisHelpModal.module.css';

interface CrisisHelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface CrisisResponse {
    data: {
        resources: CrisisResources;
    };
}

function isCallableNumber(value: string): boolean {
    const trimmed = value.trim();
    return /^\d/.test(trimmed) || trimmed.startsWith('+');
}

export function CrisisHelpModal({ isOpen, onClose }: CrisisHelpModalProps) {
    const [data, setData] = useState<CrisisResources | null>(null);
    const [error, setError] = useState<string | null>(null);
    const dialogRef = useRef<HTMLDivElement>(null);
    const closeRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (isOpen && !data && !error) {
            http
                .get<CrisisResponse>('/crisis/resources')
                .then((response) => setData(response.data.resources))
                .catch((err: unknown) => {
                    setError((err as { message?: string }).message ?? 'Failed to load crisis resources.');
                });
        }
    }, [isOpen, data, error]);

    useEffect(() => {
        if (isOpen) {
            closeRef.current?.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
                return;
            }
            if (e.key !== 'Tab') return;

            const el = dialogRef.current;
            if (!el) return;
            const focusable = Array.from(
                el.querySelectorAll<HTMLElement>(
                    'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
                )
            );
            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
            } else if (document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const primary = data?.emergencyHotline ?? {
        name: 'Sri Lanka National Mental Health Helpline',
        number: '1926',
        available: '24/7',
        description: 'Free, confidential support in Sinhala, Tamil, and English.',
    };

    return createPortal(
        <div
            className={styles.backdrop}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
            aria-hidden="false"
        >
            <div
                ref={dialogRef}
                className={styles.dialog}
                role="dialog"
                aria-modal="true"
                aria-labelledby="crisis-modal-title"
                aria-describedby="crisis-modal-desc"
            >
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <span className={styles.headerIcon} aria-hidden="true">SOS</span>
                        <h2 id="crisis-modal-title" className={styles.headerTitle}>
                            Crisis Support
                        </h2>
                    </div>
                    <button
                        ref={closeRef}
                        className={styles.closeBtn}
                        onClick={onClose}
                        aria-label="Close crisis help modal"
                    >
                        X
                    </button>
                </div>

                <div className={styles.primary1926}>
                    <p id="crisis-modal-desc" className={styles.primaryLabel}>
                        {primary.name}
                    </p>
                    <a href="tel:1926" className={styles.primaryNumber} aria-label="Call 1926">
                        1926
                    </a>
                    <p className={styles.primaryMeta}>{primary.available} · {primary.description}</p>
                </div>

                <div className={styles.body}>
                    {error ? (
                        <p className={styles.loading} role="alert">{error}</p>
                    ) : !data ? (
                        <p className={styles.loading} aria-live="polite">Loading resources...</p>
                    ) : (
                        <>
                            <h3 className={styles.sectionTitle}>All crisis contacts</h3>
                            <ul className={styles.hotlines} role="list">
                                {data.localResources.map((resource) => (
                                    <li key={`${resource.name}-${resource.number}`} className={styles.hotline} role="listitem">
                                        <div className={styles.hotlineInfo}>
                                            <span className={styles.hotlineName}>{resource.name}</span>
                                            <span className={styles.hotlineAvail}>{resource.available}</span>
                                        </div>
                                        {isCallableNumber(resource.number) ? (
                                            <a
                                                href={`tel:${resource.number.replace(/\s/g, '')}`}
                                                className={styles.hotlineNumber}
                                                aria-label={`Call ${resource.name}: ${resource.number}`}
                                            >
                                                {resource.number}
                                            </a>
                                        ) : (
                                            <a
                                                href={resource.number}
                                                className={styles.hotlineNumber}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                Open
                                            </a>
                                        )}
                                        <p className={styles.hotlineDesc}>{resource.description}</p>
                                    </li>
                                ))}
                            </ul>

                            <div className={styles.guidance}>
                                {data.supportText.split('\n\n').map((para, i) => (
                                    <p key={i}>{para.trim()}</p>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className={styles.footer}>
                    <p className={styles.footerNote}>
                        In immediate physical danger? Call emergency services:{' '}
                        <a href="tel:119" className={styles.emergencyLink}>119</a>
                    </p>
                    <Link
                        to="/crisis"
                        className={styles.fullPageLink}
                        onClick={onClose}
                    >
                        View full crisis page -
                    </Link>
                </div>
            </div>
        </div>,
        document.body
    );
}
