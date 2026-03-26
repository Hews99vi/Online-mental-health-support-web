import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Camera, Mail, MapPin, RefreshCw, Save, ShieldCheck, UserCircle2 } from 'lucide-react';
import { http } from '../../api/http';
import { useAuth } from '../../app/AuthContext';
import { useToast } from '../../app/ToastContext';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { PlaceholderPage } from '../../components/PlaceholderPage';
import type { UserProfile, UserProfilePreferences } from '../../types';
import styles from './ProfilePage.module.css';

interface ProfileResponse {
    data: {
        profile: UserProfile | null;
    };
}

interface SaveProfileResponse {
    data: {
        profile: UserProfile;
    };
    message?: string;
}

interface ProfileFormState {
    displayName: string;
    avatarUrl: string;
    bio: string;
    location: string;
    timeZone: string;
    emailUpdates: boolean;
}

const EMPTY_FORM: ProfileFormState = {
    displayName: '',
    avatarUrl: '',
    bio: '',
    location: '',
    timeZone: '',
    emailUpdates: false,
};

function mapProfileToForm(profile: UserProfile | null, fallbackName: string): ProfileFormState {
    const preferences = profile?.preferences ?? {};
    return {
        displayName: profile?.displayName ?? fallbackName,
        avatarUrl: profile?.avatarUrl ?? '',
        bio: preferences.bio ?? '',
        location: preferences.location ?? '',
        timeZone: preferences.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
        emailUpdates: preferences.emailUpdates ?? false,
    };
}

function buildPreferences(form: ProfileFormState): UserProfilePreferences {
    return {
        bio: form.bio.trim() || undefined,
        location: form.location.trim() || undefined,
        timeZone: form.timeZone.trim() || undefined,
        emailUpdates: form.emailUpdates,
    };
}

export function ProfilePage() {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [form, setForm] = useState<ProfileFormState>(EMPTY_FORM);
    const [initialForm, setInitialForm] = useState<ProfileFormState>(EMPTY_FORM);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ProfileFormState, string>>>({});

    const fallbackName = user?.name ?? 'User';

    const loadProfile = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await http.get<ProfileResponse>('/profile/me');
            const nextProfile = response.data.profile;
            const nextForm = mapProfileToForm(nextProfile, fallbackName);
            setProfile(nextProfile);
            setForm(nextForm);
            setInitialForm(nextForm);
            setFieldErrors({});
        } catch (err: unknown) {
            setError((err as { message?: string }).message ?? 'Failed to load your profile.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadProfile();
    }, [fallbackName]);

    const isDirty = useMemo(
        () => JSON.stringify(form) !== JSON.stringify(initialForm),
        [form, initialForm]
    );

    const avatarPreview = form.avatarUrl.trim() || null;
    const initials = (form.displayName || fallbackName)
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const setField =
        <K extends keyof ProfileFormState>(field: K) =>
            (value: ProfileFormState[K]) => {
                setForm((current) => ({ ...current, [field]: value }));
                setFieldErrors((current) => ({ ...current, [field]: undefined }));
                setSaveMessage(null);
            };

    const validate = () => {
        const nextErrors: Partial<Record<keyof ProfileFormState, string>> = {};
        if (!form.displayName.trim()) {
            nextErrors.displayName = 'Display name is required';
        }
        if (form.avatarUrl.trim()) {
            try {
                new URL(form.avatarUrl.trim());
            } catch {
                nextErrors.avatarUrl = 'Enter a valid URL';
            }
        }
        setFieldErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSaving(true);
        setError(null);
        setSaveMessage(null);

        try {
            const response = await http.put<SaveProfileResponse>('/profile/me', {
                displayName: form.displayName.trim(),
                avatarUrl: form.avatarUrl.trim() || null,
                preferences: buildPreferences(form),
            });

            const savedProfile = response.data.profile;
            const savedForm = mapProfileToForm(savedProfile, fallbackName);

            setProfile(savedProfile);
            setForm(savedForm);
            setInitialForm(savedForm);
            setSaveMessage(response.message ?? 'Profile saved.');
            addToast(response.message ?? 'Profile saved.', 'success');
        } catch (err: unknown) {
            const message = (err as { message?: string }).message ?? 'Failed to save your profile.';
            setError(message);
            addToast(message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <main className={styles.page}>
                <section className={styles.loadingCard} aria-live="polite">
                    <RefreshCw size={20} className={styles.loadingSpinner} aria-hidden="true" />
                    <div>
                        <h1 className={styles.loadingTitle}>Loading your profile</h1>
                        <p className={styles.loadingText}>Fetching your saved settings and personal details.</p>
                    </div>
                </section>
            </main>
        );
    }

    if (!user) {
        return (
            <PlaceholderPage
                icon="👤"
                title="Profile unavailable"
                description="You need to be signed in to view your profile."
            />
        );
    }

    return (
        <main className={styles.page}>
            <section className={styles.hero}>
                <div className={styles.heroText}>
                    <p className={styles.eyebrow}>Account Settings</p>
                    <h1 className={styles.title}>My Profile</h1>
                    <p className={styles.subtitle}>
                        Manage the public-facing details used across your account. Therapist-specific
                        credentials and onboarding details remain in the therapist area.
                    </p>
                </div>
                <div className={styles.heroMeta}>
                    <div className={styles.metaItem}>
                        <Mail size={16} aria-hidden="true" />
                        <span>{user.email}</span>
                    </div>
                    <div className={styles.metaItem}>
                        <ShieldCheck size={16} aria-hidden="true" />
                        <span>{user.role}</span>
                    </div>
                </div>
            </section>

            {error && (
                <div className={styles.errorBanner} role="alert">
                    <AlertTriangle size={16} aria-hidden="true" />
                    <span>{error}</span>
                </div>
            )}

            {saveMessage && (
                <div className={styles.successBanner} role="status">
                    <ShieldCheck size={16} aria-hidden="true" />
                    <span>{saveMessage}</span>
                </div>
            )}

            <div className={styles.layout}>
                <aside className={styles.sidebarCard}>
                    <div className={styles.avatarShell}>
                        {avatarPreview ? (
                            <img src={avatarPreview} alt="" className={styles.avatarImage} />
                        ) : (
                            <span className={styles.avatarFallback}>{initials || 'MB'}</span>
                        )}
                    </div>
                    <div className={styles.sidebarBody}>
                        <h2 className={styles.sidebarName}>{form.displayName || fallbackName}</h2>
                        <p className={styles.sidebarRole}>{user.role} account</p>
                        <p className={styles.sidebarHint}>
                            Your account email and role are read-only here. Use this page for personal profile details.
                        </p>
                    </div>
                    <div className={styles.sidebarDetails}>
                        <div className={styles.detailRow}>
                            <UserCircle2 size={15} aria-hidden="true" />
                            <span>{profile ? 'Profile active' : 'Profile not saved yet'}</span>
                        </div>
                        <div className={styles.detailRow}>
                            <MapPin size={15} aria-hidden="true" />
                            <span>{form.location.trim() || 'Location not set'}</span>
                        </div>
                    </div>
                </aside>

                <section className={styles.formCard}>
                    <form onSubmit={handleSubmit} className={styles.form} noValidate>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>Personal Details</h2>
                            <p className={styles.sectionText}>
                                These details help personalize your experience and appear in your account profile.
                            </p>
                        </div>

                        <div className={styles.grid}>
                            <TextField
                                id="profile-display-name"
                                label="Display name"
                                value={form.displayName}
                                onChange={(e) => setField('displayName')(e.target.value)}
                                errorMessage={fieldErrors.displayName}
                                required
                                startIcon={<UserCircle2 size={16} aria-hidden="true" />}
                            />

                            <TextField
                                id="profile-avatar-url"
                                label="Avatar URL"
                                value={form.avatarUrl}
                                onChange={(e) => setField('avatarUrl')(e.target.value)}
                                errorMessage={fieldErrors.avatarUrl}
                                helperText="Optional. Use a full image URL."
                                startIcon={<Camera size={16} aria-hidden="true" />}
                                placeholder="https://example.com/avatar.jpg"
                            />

                            <TextField
                                id="profile-location"
                                label="Location"
                                value={form.location}
                                onChange={(e) => setField('location')(e.target.value)}
                                helperText="Optional. City or region."
                                startIcon={<MapPin size={16} aria-hidden="true" />}
                                placeholder="Colombo, Sri Lanka"
                            />

                            <TextField
                                id="profile-time-zone"
                                label="Time zone"
                                value={form.timeZone}
                                onChange={(e) => setField('timeZone')(e.target.value)}
                                helperText="Used for reminders and scheduling context."
                                placeholder="Asia/Colombo"
                            />
                        </div>

                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>About You</h2>
                            <p className={styles.sectionText}>
                                A short note for your own profile context. This does not replace therapist verification details.
                            </p>
                        </div>

                        <div className={styles.textareaGroup}>
                            <label htmlFor="profile-bio" className={styles.textareaLabel}>Short bio</label>
                            <textarea
                                id="profile-bio"
                                className={styles.textarea}
                                value={form.bio}
                                onChange={(e) => setField('bio')(e.target.value)}
                                rows={5}
                                maxLength={500}
                                placeholder="Share a short introduction, what matters to you, or how you use MindBridge."
                            />
                            <div className={styles.textareaMeta}>
                                <span>Optional personal context</span>
                                <span>{form.bio.length}/500</span>
                            </div>
                        </div>

                        <div className={styles.preferenceCard}>
                            <div>
                                <h3 className={styles.preferenceTitle}>Email updates</h3>
                                <p className={styles.preferenceText}>
                                    Receive occasional account and well-being updates at {user.email}.
                                </p>
                            </div>
                            <label className={styles.toggle}>
                                <input
                                    type="checkbox"
                                    checked={form.emailUpdates}
                                    onChange={(e) => setField('emailUpdates')(e.target.checked)}
                                />
                                <span className={styles.toggleTrack} aria-hidden="true">
                                    <span className={styles.toggleThumb} />
                                </span>
                                <span className={styles.toggleLabel}>
                                    {form.emailUpdates ? 'Enabled' : 'Disabled'}
                                </span>
                            </label>
                        </div>

                        <div className={styles.actions}>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                    setForm(initialForm);
                                    setFieldErrors({});
                                    setError(null);
                                    setSaveMessage(null);
                                }}
                                disabled={!isDirty || isSaving}
                            >
                                Reset
                            </Button>
                            <Button type="submit" isLoading={isSaving} disabled={!isDirty}>
                                <Save size={15} aria-hidden="true" />
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </section>
            </div>
        </main>
    );
}

export function NotFoundPage() {
    return (
        <PlaceholderPage
            icon="🔍"
            title="404 — Page Not Found"
            description="The page you're looking for doesn't exist. Check the URL or navigate back to the dashboard."
        />
    );
}
