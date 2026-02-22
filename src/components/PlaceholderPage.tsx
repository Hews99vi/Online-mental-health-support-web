// ─── Feature placeholder pages ───────────────────────────────────────────────
// Each page renders a minimal skeleton so that routes load without errors.
// Features will be implemented in subsequent tasks.

import styles from './PlaceholderPage.module.css';

interface PlaceholderPageProps {
    title: string;
    description?: string;
    icon?: string;
}

export function PlaceholderPage({ title, description, icon = '🔧' }: PlaceholderPageProps) {
    return (
        <div className={styles.page}>
            <span className={styles.icon} aria-hidden="true">{icon}</span>
            <h1 className={styles.title}>{title}</h1>
            {description && <p className={styles.description}>{description}</p>}
            <p className={styles.badge}>Coming soon</p>
        </div>
    );
}
