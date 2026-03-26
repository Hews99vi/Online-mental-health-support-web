import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';
import { Button } from './Button';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: ModalSize;
    /** Prevent closing when clicking the backdrop */
    disableBackdropClose?: boolean;
}

export function Modal({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = 'md',
    disableBackdropClose = false,
}: ModalProps) {
    const dialogRef = useRef<HTMLDivElement>(null);

    // Trap focus and handle Escape key
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();

            // Basic focus trap
            if (e.key === 'Tab' && dialogRef.current) {
                const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
                    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
                );
                const first = focusable[0];
                const last = focusable[focusable.length - 1];

                if (e.shiftKey) {
                    if (document.activeElement === first) {
                        e.preventDefault();
                        last?.focus();
                    }
                } else {
                    if (document.activeElement === last) {
                        e.preventDefault();
                        first?.focus();
                    }
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        // Move focus into dialog
        dialogRef.current?.focus();
        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizeClass = size !== 'md' ? styles[size] : '';

    return createPortal(
        <div
            className={[styles.overlay, sizeClass].filter(Boolean).join(' ')}
            role="presentation"
            onClick={disableBackdropClose ? undefined : onClose}
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? 'modal-title' : undefined}
                className={styles.dialog}
                tabIndex={-1}
                onClick={(e) => e.stopPropagation()}
            >
                {(title !== undefined) && (
                    <header className={styles.header}>
                        <h2 id="modal-title" className={styles.title}>
                            {title}
                        </h2>
                        <button
                            type="button"
                            className={styles.closeBtn}
                            onClick={onClose}
                            aria-label="Close dialog"
                        >
                            ✕
                        </button>
                    </header>
                )}

                <div className={styles.body}>{children}</div>

                {footer && <footer className={styles.footer}>{footer}</footer>}
            </div>
        </div>,
        document.body
    );
}

/** Convenience pre-built footer with Cancel + Confirm */
interface ModalConfirmFooterProps {
    onCancel: () => void;
    onConfirm: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    isLoading?: boolean;
    isDanger?: boolean;
    disableConfirm?: boolean;
}

export function ModalConfirmFooter({
    onCancel,
    onConfirm,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    isLoading = false,
    isDanger = false,
    disableConfirm = false,
}: ModalConfirmFooterProps) {
    return (
        <>
            <Button variant="ghost" onClick={onCancel}>
                {cancelLabel}
            </Button>
            <Button
                variant={isDanger ? 'danger' : 'primary'}
                onClick={onConfirm}
                isLoading={isLoading}
                disabled={disableConfirm}
            >
                {confirmLabel}
            </Button>
        </>
    );
}
