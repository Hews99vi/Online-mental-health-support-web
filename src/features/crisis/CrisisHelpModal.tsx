import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { mockGetCrisisResources } from '../../mocks/crisisApi';
import type { CrisisResources } from '../../types';
import styles from './CrisisHelpModal.module.css';

interface CrisisHelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CrisisHelpModal({ isOpen, onClose }: CrisisHelpModalProps) {
    const [data, setData] = useState<CrisisResources | null>(null);
    const dialogRef = useRef<HTMLDivElement>(null);
    const closeRef = useRef<HTMLButtonElement>(null);

    // Load crisis resources when first opened
    useEffect(() => {
        if (isOpen && !data) {
            mockGetCrisisResources().then(setData);
        }
    }, [isOpen, data]);

    // Focus the close button when the modal opens
    useEffect(() => {
        if (isOpen) {
            closeRef.current?.focus();
        }
    }, [isOpen]);

    // Focus trap + ESC close
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
            } else {
                if (document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

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
                {/* ── Header ── */}
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <span className={styles.headerIcon} aria-hidden="true">🆘</span>
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
                        ✕
                    </button>
                </div>

                {/* ── Primary CTA — 1926 ── */}
                <div className={styles.primary1926}>
                    <p id="crisis-modal-desc" className={styles.primaryLabel}>
                        Sri Lanka National Mental Health Helpline
                    </p>
                    <a href="tel:1926" className={styles.primaryNumber} aria-label="Call 1926">
                        📞 1926
                    </a>
                    <p className={styles.primaryMeta}>Free · Confidential · 24/7 · Sinhala, Tamil, English</p>
                </div>

                {/* ── Hotlines list ── */}
                <div className={styles.body}>
                    {!data ? (
                        <p className={styles.loading} aria-live="polite">Loading resources…</p>
                    ) : (
                        <>
                            <h3 className={styles.sectionTitle}>All crisis contacts</h3>
                            <ul className={styles.hotlines} role="list">
                                {data.hotlines.map((h) => (
                                    <li key={h.name} className={styles.hotline} role="listitem">
                                        <div className={styles.hotlineInfo}>
                                            <span className={styles.hotlineName}>{h.name}</span>
                                            <span className={styles.hotlineAvail}>{h.available}</span>
                                        </div>
                                        {h.number.startsWith('+') || /^\d+$/.test(h.number.replace(/\s/g, '')) ? (
                                            <a
                                                href={`tel:${h.number.replace(/\s/g, '')}`}
                                                className={styles.hotlineNumber}
                                                aria-label={`Call ${h.name}: ${h.number}`}
                                            >
                                                {h.number}
                                            </a>
                                        ) : (
                                            <span className={styles.hotlineNumberPlain}>{h.number}</span>
                                        )}
                                        <p className={styles.hotlineDesc}>{h.description}</p>
                                    </li>
                                ))}
                            </ul>

                            <div className={styles.guidance}>
                                {data.guidanceText.split('\n\n').map((para, i) => (
                                    <p key={i}>{para.trim()}</p>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* ── Footer ── */}
                <div className={styles.footer}>
                    <p className={styles.footerNote}>
                        In immediate physical danger? Call emergency services:{' '}
                        <a href="tel:119" className={styles.emergencyLink}>119</a> (Sri Lanka)
                    </p>
                    <Link
                        to="/crisis"
                        className={styles.fullPageLink}
                        onClick={onClose}
                    >
                        View full crisis page →
                    </Link>
                </div>
            </div>
        </div>,
        document.body
    );
}
