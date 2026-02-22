import { useState, useEffect, useRef } from 'react';
import { mockGetConsent, mockUpdateConsent } from '../../mocks/consentApi';
import type { ConsentItem } from '../../types';
import { Modal } from '../../components/ui/Modal';
import styles from './ConsentCenterPage.module.css';

export function ConsentCenterPage() {
    const [items, setItems] = useState<ConsentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [revokeTarget, setRevokeTarget] = useState<ConsentItem | null>(null);
    const [pendingChanges, setPendingChanges] = useState<Map<string, boolean>>(new Map());
    const savedToastRef = useRef(false);

    useEffect(() => {
        mockGetConsent().then(({ items }) => {
            setItems(items);
            setLoading(false);
        });
    }, []);

    const handleToggle = (item: ConsentItem, newValue: boolean) => {
        // Required consents can't be revoked without confirmation
        if (item.required && !newValue) {
            setRevokeTarget(item);
            return;
        }
        applyChange(item.id, newValue);
    };

    const applyChange = (id: string, enabled: boolean) => {
        setItems((prev) => prev.map((c) => (c.id === id ? { ...c, enabled } : c)));
        setPendingChanges((prev) => new Map(prev).set(id, enabled));
    };

    const handleSave = async () => {
        setSaving(true);
        const updates = Array.from(pendingChanges.entries()).map(([id, enabled]) => ({ id, enabled }));
        const { items: updated } = await mockUpdateConsent(updates);
        setItems(updated);
        setPendingChanges(new Map());
        setSaving(false);
        savedToastRef.current = true;
        setTimeout(() => { savedToastRef.current = false; }, 3000);
    };

    const confirmRevoke = () => {
        if (revokeTarget) {
            applyChange(revokeTarget.id, false);
        }
        setRevokeTarget(null);
    };

    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.loading} aria-live="polite">Loading your consent preferences…</div>
            </div>
        );
    }

    const hasPending = pendingChanges.size > 0;

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Consent Centre</h1>
                    <p className={styles.subtitle}>
                        Control how MindBridge uses your data. Required consents are needed to use the
                        platform. Optional consents can be changed at any time.
                    </p>
                    <div className={styles.boundaryNote} role="note">
                        <strong>Note:</strong> Revoking all optional consents does not delete your
                        account or historical data. To delete your data, visit your{' '}
                        <a href="/profile">Profile settings</a>.
                    </div>
                </div>

                <div className={styles.list} role="list">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className={`${styles.item} ${item.required ? styles.itemRequired : ''}`}
                            role="listitem"
                        >
                            <div className={styles.itemBody}>
                                <div className={styles.itemMeta}>
                                    <span className={styles.itemLabel}>{item.label}</span>
                                    {item.required ? (
                                        <span className={styles.badge}>Required</span>
                                    ) : (
                                        <span className={styles.badgeOptional}>Optional</span>
                                    )}
                                </div>
                                <p className={styles.itemDesc}>{item.description}</p>
                                <p className={styles.itemDate}>
                                    Last updated: {new Date(item.updatedAt).toLocaleDateString()}
                                </p>
                            </div>

                            {/* Toggle */}
                            <label
                                className={styles.toggle}
                                aria-label={`${item.label} — ${item.enabled ? 'enabled' : 'disabled'}`}
                            >
                                <input
                                    type="checkbox"
                                    checked={item.enabled}
                                    onChange={(e) => handleToggle(item, e.target.checked)}
                                    className={styles.toggleInput}
                                />
                                <span className={styles.toggleTrack} aria-hidden="true">
                                    <span className={styles.toggleThumb} />
                                </span>
                                <span className={styles.toggleLabel}>
                                    {item.enabled ? 'On' : 'Off'}
                                </span>
                            </label>
                        </div>
                    ))}
                </div>

                {/* Save / status bar */}
                <div className={styles.footer}>
                    {savedToastRef.current && (
                        <span className={styles.savedNote} role="status">✅ Preferences saved.</span>
                    )}
                    <button
                        className={styles.saveBtn}
                        disabled={!hasPending || saving}
                        onClick={handleSave}
                    >
                        {saving ? 'Saving…' : hasPending ? `Save ${pendingChanges.size} change${pendingChanges.size > 1 ? 's' : ''}` : 'No changes'}
                    </button>
                </div>
            </div>

            {/* ── Revoke confirmation modal ── */}
            <Modal
                isOpen={revokeTarget !== null}
                onClose={() => setRevokeTarget(null)}
                title={`Revoke "${revokeTarget?.label}"?`}
                disableBackdropClose={false}
            >
                <div className={styles.revokeBody}>
                    <p>
                        <strong>{revokeTarget?.label}</strong> is required to use MindBridge. Revoking
                        it will sign you out and may restrict your access until you re-accept.
                    </p>
                    <p>Are you sure you want to revoke this consent?</p>
                    <div className={styles.revokeActions}>
                        <button
                            className={styles.revokeCancelBtn}
                            onClick={() => setRevokeTarget(null)}
                        >
                            Keep it on
                        </button>
                        <button
                            className={styles.revokeConfirmBtn}
                            onClick={confirmRevoke}
                        >
                            Yes, revoke
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
