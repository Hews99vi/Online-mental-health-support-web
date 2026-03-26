import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { http } from '../../api/http';
import { useAuth } from '../../app/AuthContext';
import styles from './ListenerApplicationPage.module.css';

type ListenerStatus = 'pending' | 'approved' | 'rejected';

interface ListenerProfile {
    id: string;
    name: string;
    bio: string;
    languages: string[];
    status: ListenerStatus;
}

interface ListenerProfileResponse {
    data: {
        profile: ListenerProfile | null;
    };
}

const LANGUAGES = ['English', 'Sinhala', 'Tamil'];

export function ListenerApplicationPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [fullName, setFullName] = useState('');
    const [bio, setBio] = useState('');
    const [languages, setLanguages] = useState<string[]>(['English']);
    const [existingProfile, setExistingProfile] = useState<ListenerProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        setFullName(user.name || '');
    }, [user]);

    useEffect(() => {
        const controller = new AbortController();
        void http
            .get<ListenerProfileResponse>('/listener/me', { signal: controller.signal })
            .then((response) => {
                setExistingProfile(response.data.profile);
                if (response.data.profile) {
                    setFullName(response.data.profile.name || user?.name || '');
                    setBio(response.data.profile.bio || '');
                    setLanguages(response.data.profile.languages?.length ? response.data.profile.languages : ['English']);
                }
            })
            .catch((err: unknown) => {
                if ((err as { name?: string }).name === 'AbortError') return;
                setError((err as { message?: string }).message ?? 'Failed to load listener application status.');
            })
            .finally(() => setIsLoading(false));
        return () => controller.abort();
    }, [user]);

    const toggleLanguage = (value: string) => {
        setLanguages((current) =>
            current.includes(value) ? current.filter((language) => language !== value) : [...current, value]
        );
    };

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);

        if (user?.role !== 'user') {
            setError('Only support-seeker accounts can submit listener applications.');
            return;
        }
        if (!fullName.trim()) {
            setError('Full name is required.');
            return;
        }

        setIsSubmitting(true);
        try {
            await http.post('/listener/apply', {
                fullName: fullName.trim(),
                bio: bio.trim(),
                languages,
            });
            navigate('/dashboard/home');
        } catch (err: unknown) {
            setError((err as { message?: string }).message ?? 'Failed to submit listener application.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const statusClass =
        existingProfile?.status === 'approved'
            ? styles.statusApproved
            : existingProfile?.status === 'rejected'
                ? styles.statusRejected
                : styles.statusPending;

    return (
        <main className={styles.page}>
            <section className={styles.card}>
                <h1 className={styles.title}>Apply as a Trained Peer Listener</h1>
                <p className={styles.subtitle}>
                    Submit your listener application. An admin must approve it before listener dashboard access is enabled.
                </p>

                {isLoading ? (
                    <p className={`${styles.subtitle} ${styles.subtitleSpacing}`}>Loading your application status...</p>
                ) : existingProfile ? (
                    <div className={`${styles.status} ${statusClass}`} role="status">
                        Current status: <strong>{existingProfile.status}</strong>.
                        {existingProfile.status === 'pending' && ' Your application is under review.'}
                        {existingProfile.status === 'approved' && ' You can now use listener features.'}
                        {existingProfile.status === 'rejected' && ' Contact admin support if you need to re-apply.'}
                    </div>
                ) : (
                    <form className={styles.form} onSubmit={submit} noValidate>
                        <div>
                            <label className={styles.label} htmlFor="listener-full-name">Full name</label>
                            <input
                                id="listener-full-name"
                                className={styles.input}
                                value={fullName}
                                onChange={(event) => setFullName(event.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className={styles.label} htmlFor="listener-bio">Short bio</label>
                            <textarea
                                id="listener-bio"
                                className={styles.textarea}
                                value={bio}
                                onChange={(event) => setBio(event.target.value)}
                                placeholder="Share relevant experience and why you want to help."
                                rows={5}
                            />
                        </div>

                        <div>
                            <span className={styles.label}>Languages</span>
                            <div className={styles.chips}>
                                {LANGUAGES.map((language) => (
                                    <button
                                        key={language}
                                        type="button"
                                        className={`${styles.chip} ${languages.includes(language) ? styles.chipActive : ''}`}
                                        aria-pressed={languages.includes(language)}
                                        onClick={() => toggleLanguage(language)}
                                    >
                                        {language}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <p className={styles.error} role="alert">{error}</p>
                        )}

                        <div className={styles.actions}>
                            <Button type="button" variant="ghost" onClick={() => navigate('/dashboard/home')}>
                                Cancel
                            </Button>
                            <Button type="submit" isLoading={isSubmitting}>
                                Submit Listener Application
                            </Button>
                        </div>
                    </form>
                )}
            </section>
        </main>
    );
}
