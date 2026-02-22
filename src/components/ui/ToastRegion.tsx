import { useToast } from '../../app/ToastContext';
import styles from './ToastRegion.module.css';

const ICONS: Record<string, string> = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '🚨',
};

export function ToastRegion() {
    const { toasts, removeToast } = useToast();

    if (toasts.length === 0) return null;

    return (
        <div
            role="region"
            aria-label="Notifications"
            aria-live="polite"
            aria-atomic="false"
            className={styles.region}
        >
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={[styles.toast, styles[toast.variant]].join(' ')}
                    role="status"
                >
                    <span className={styles.icon} aria-hidden="true">
                        {ICONS[toast.variant]}
                    </span>
                    <p className={styles.message}>{toast.message}</p>
                    <button
                        type="button"
                        className={styles.dismiss}
                        onClick={() => removeToast(toast.id)}
                        aria-label="Dismiss notification"
                    >
                        ✕
                    </button>
                </div>
            ))}
        </div>
    );
}
