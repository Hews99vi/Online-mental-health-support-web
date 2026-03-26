import { useEffect, useMemo, useState } from 'react';
import { http } from '../../api/http';
import { useAuth } from '../../app/AuthContext';
import type { ConsentItem, ConsentPreferences } from '../../types';
import { Modal } from '../../components/ui/Modal';
import styles from './ConsentCenterPage.module.css';

interface ConsentResponse {
    data: {
        consent: ConsentPreferences;
    };
    message?: string;
}

const CONSENT_ITEMS: Array<{
    id: ConsentItem['id'];
    field: keyof Omit<ConsentPreferences, 'updatedAt'>;
    label: string;
    description: string;
    required: boolean;
}> = [
    {
        id: 'terms',
        field: 'termsAccepted',
        label: 'Terms of Service',
        description: 'You agree to use MindBridge only for personal well-being purposes and accept our terms of use.',
        required: true,
    },
    {
        id: 'privacy',
        field: 'privacyAccepted',
        label: 'Privacy Policy',
        description: 'You consent to the processing of your personal data as described in our Privacy Policy.',
        required: true,
    },
    {
        id: 'biometric',
        field: 'biometricConsent',
        label: 'Biometric Data',
        description: 'Optional: allow mood pattern analysis using biometric input (heart-rate from wearables, if supported).',
        required: false,
    },
    {
        id: 'ai',
        field: 'aiConsent',
        label: 'AI Personalisation',
        description: 'Allow AI to analyse your journal and mood history to generate personalised weekly insights.',
        required: false,
    },
    {
        id: 'analytics',
        field: 'analyticsConsent',
        label: 'Anonymous Analytics',
        description: 'Help us improve the platform by sharing anonymised usage data. No personally identifiable information is shared.',
        required: false,
    },
];

function mapConsentToItems(consent: ConsentPreferences): ConsentItem[] {
    return CONSENT_ITEMS.map((item) => ({
        id: item.id,
        label: item.label,
        description: item.description,
        required: item.required,
        enabled: consent[item.field],
        updatedAt: consent.updatedAt,
    }));
}

function mergePendingChanges(
    consent: ConsentPreferences,
    pendingChanges: Map<string, boolean>
): ConsentPreferences {
    const next = { ...consent };
    for (const item of CONSENT_ITEMS) {
        const pending = pendingChanges.get(item.id);
        if (pending !== undefined) {
            next[item.field] = pending;
        }
    }
    return next;
}

export function ConsentCenterPage() {
    const { logout } = useAuth();
    const [consent, setConsent] = useState<ConsentPreferences | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [revokeTarget, setRevokeTarget] = useState<ConsentItem | null>(null);
    const [pendingChanges, setPendingChanges] = useState<Map<string, boolean>>(new Map());
    const [savedMessage, setSavedMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const loadConsent = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await http.get<ConsentResponse>('/consent/me');
            setConsent(response.data.consent);
        } catch (err: unknown) {
            setError((err as { message?: string }).message ?? 'Failed to load your consent preferences.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadConsent();
    }, []);

    const items = useMemo(() => {
        if (!consent) return [];
        return mapConsentToItems(mergePendingChanges(consent, pendingChanges));
    }, [consent, pendingChanges]);

    const handleToggle = (item: ConsentItem, newValue: boolean) => {
        if (item.required && !newValue) {
            setRevokeTarget(item);
            return;
        }
        applyChange(item.id, newValue);
    };

    const applyChange = (id: string, enabled: boolean) => {
        setPendingChanges((prev) => new Map(prev).set(id, enabled));
        setSavedMessage(null);
        setError(null);
    };

    const handleSave = async () => {
        if (!consent || pendingChanges.size === 0) return;

        setSaving(true);
        setError(null);

        try {
            const nextConsent = mergePendingChanges(consent, pendingChanges);
            const response = await http.put<ConsentResponse>('/consent/me', {
                termsAccepted: nextConsent.termsAccepted,
                privacyAccepted: nextConsent.privacyAccepted,
                biometricConsent: nextConsent.biometricConsent,
                aiConsent: nextConsent.aiConsent,
                analyticsConsent: nextConsent.analyticsConsent,
            });

            setConsent(response.data.consent);
            setPendingChanges(new Map());
            setSavedMessage(response.message ?? 'Preferences saved.');

            const requiredRevoked =
                response.data.consent.termsAccepted === false ||
                response.data.consent.privacyAccepted === false;
            if (requiredRevoked) {
                logout();
                window.location.assign('/login?reason=consent_required');
            }
        } catch (err: unknown) {
            setError((err as { message?: string }).message ?? 'Failed to save your consent preferences.');
        } finally {
            setSaving(false);
        }
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
                <div className={styles.loading} aria-live="polite">Loading your consent preferences...</div>
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

                {error && (
                    <div className={styles.errorNote} role="alert">
                        {error}
                    </div>
                )}

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

                            <label
                                className={styles.toggle}
                                aria-label={`${item.label} - ${item.enabled ? 'enabled' : 'disabled'}`}
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

                <div className={styles.footer}>
                    {savedMessage && (
                        <span className={styles.savedNote} role="status">OK {savedMessage}</span>
                    )}
                    <button
                        className={styles.saveBtn}
                        disabled={!hasPending || saving}
                        onClick={handleSave}
                    >
                        {saving ? 'Saving...' : hasPending ? `Save ${pendingChanges.size} change${pendingChanges.size > 1 ? 's' : ''}` : 'No changes'}
                    </button>
                </div>
            </div>

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
