import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Upload } from 'lucide-react';
import { http } from '../../api/http';
import { useAuth } from '../../app/AuthContext';
import styles from './Therapist.module.css';
import { SPECIALTIES, LANGUAGES } from './types';

interface OnboardPayload {
    fullName: string;
    title: string;
    licenseNumber: string;
    licenseBody: string;
    yearsExperience: number;
    specialties: string[];
    languages: string[];
    bio: string;
    ratePerHour: number;
    documents: DocumentMetadata[];
}

interface DocumentMetadata {
    name: string;
    mimeType: string;
    size: number;
    lastModified: number;
    source: 'metadata';
}

const MAX_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_DOCUMENT_MIME_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);
const ALLOWED_DOCUMENT_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

async function submitApplication(payload: OnboardPayload): Promise<void> {
    await http.post('/therapists/apply', {
        fullName: payload.fullName,
        title: payload.title,
        licenseNo: payload.licenseNumber,
        licenseBody: payload.licenseBody,
        specialization: payload.specialties,
        languages: payload.languages,
        bio: payload.bio,
        yearsExperience: payload.yearsExperience,
        ratePerHour: payload.ratePerHour,
        currency: 'USD',
        documents: payload.documents,
    });
}

type VerificationStatus = 'pending' | 'approved' | 'rejected';

interface TherapistProfile {
    verificationStatus: VerificationStatus;
    rejectedReason?: string | null;
}

interface TherapistMeResponse {
    data: {
        profile: TherapistProfile | null;
    };
}

export function TherapistOnboardingPage() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [form, setForm] = useState({
        fullName: '', title: '', licenseNumber: '', licenseBody: '',
        yearsExperience: '', bio: '', ratePerHour: '',
    });
    const [specialties, setSpecialties] = useState<string[]>([]);
    const [languages, setLanguages] = useState<string[]>(['English']);
    const [isLoading, setIsLoading] = useState(false);
    const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const [existingStatus, setExistingStatus] = useState<VerificationStatus | null>(null);
    const [rejectedReason, setRejectedReason] = useState<string | null>(null);
    const [isCheckingStatus, setIsCheckingStatus] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const hasAllowedExtension = (name: string) =>
        ALLOWED_DOCUMENT_EXTENSIONS.some((ext) => name.toLowerCase().endsWith(ext));

    const isValidDocumentMetadata = (file: File) => {
        const hasAllowedMime = file.type ? ALLOWED_DOCUMENT_MIME_TYPES.has(file.type.toLowerCase()) : false;
        const hasAllowedExt = hasAllowedExtension(file.name);
        const hasAllowedSize = file.size > 0 && file.size <= MAX_DOCUMENT_SIZE_BYTES;
        return (hasAllowedMime || hasAllowedExt) && hasAllowedSize;
    };

    useEffect(() => {
        const controller = new AbortController();
        void http
            .get<TherapistMeResponse>('/therapist/me', { signal: controller.signal })
            .then((response) => {
                const profile = response.data.profile;
                if (profile) {
                    setExistingStatus(profile.verificationStatus);
                    setRejectedReason(profile.rejectedReason ?? null);
                }
            })
            .catch((err: unknown) => {
                if ((err as { name?: string }).name === 'AbortError') return;
                setError((err as { message?: string }).message ?? 'Failed to load therapist verification status.');
            })
            .finally(() => setIsCheckingStatus(false));

        return () => controller.abort();
    }, []);

    const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm(f => ({ ...f, [field]: e.target.value }));

    const toggleSpec = (s: string) =>
        setSpecialties(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

    const toggleLang = (l: string) =>
        setLanguages(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (user?.role !== 'user') {
            setError('Only support-seeker accounts can submit therapist applications.');
            return;
        }
        if (!form.fullName || !form.title || !form.licenseNumber || !form.bio || specialties.length === 0) {
            setError('Please fill in all required fields and select at least one specialty.');
            return;
        }
        setIsLoading(true);
        try {
            await submitApplication({
                fullName: form.fullName,
                title: form.title,
                licenseNumber: form.licenseNumber,
                licenseBody: form.licenseBody,
                yearsExperience: Number(form.yearsExperience),
                specialties,
                languages,
                bio: form.bio,
                ratePerHour: Math.round(Number(form.ratePerHour) * 100),
                documents,
            });
            setSubmitted(true);
        } catch {
            setError('Submission failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className={styles.onboardPage}>
                <div className={styles.successCard}>
                    <CheckCircle2 size={48} style={{ color: '#059669' }} aria-hidden="true" />
                    <h1 className={styles.title} style={{ fontSize: '1.25rem' }}>Application Submitted!</h1>
                    <p style={{ fontSize: '0.9375rem', color: '#374151', margin: 0, lineHeight: 1.7 }}>
                        Thank you for applying to join MindBridge as a verified therapist.
                        Our clinical team will review your credentials and contact you within <strong>3–5 business days</strong>.
                    </p>
                    <button type="button" className={styles.submitBtn} onClick={() => navigate('/dashboard')}>
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (isCheckingStatus) {
        return (
            <main className={styles.onboardPage}>
                <div className={styles.successCard}>
                    <h1 className={styles.title} style={{ fontSize: '1.25rem' }}>Loading application status...</h1>
                </div>
            </main>
        );
    }

    if (existingStatus) {
        return (
            <main className={styles.onboardPage}>
                <div className={styles.successCard}>
                    <h1 className={styles.title} style={{ fontSize: '1.25rem' }}>
                        Therapist Application: {existingStatus}
                    </h1>
                    <p style={{ fontSize: '0.9375rem', color: '#374151', margin: 0, lineHeight: 1.7 }}>
                        {existingStatus === 'pending' && 'Your therapist application is under admin review.'}
                        {existingStatus === 'approved' && 'Your therapist verification has been approved.'}
                        {existingStatus === 'rejected' && 'Your therapist application was rejected.'}
                    </p>
                    {existingStatus === 'rejected' && rejectedReason && (
                        <p style={{ fontSize: '0.875rem', color: '#b91c1c', marginTop: '0.75rem' }}>
                            Reason: {rejectedReason}
                        </p>
                    )}
                    <button type="button" className={styles.submitBtn} onClick={() => navigate('/dashboard')}>
                        Return to Dashboard
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className={styles.onboardPage}>
            <div className={styles.header}>
                <h1 className={styles.title}>Apply for Therapist Verification</h1>
                <p className={styles.subtitle}>
                    Complete the form below to have your credentials reviewed by our clinical team.
                    All fields marked <span style={{ color: '#dc2626' }}>*</span> are required.
                </p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Personal Information</h2>
                    <div className={styles.formGrid}>
                        <div className={styles.formField}>
                            <label className={styles.label} htmlFor="ob-name">Full legal name <span style={{ color: '#dc2626' }}>*</span></label>
                            <input id="ob-name" className={styles.input} value={form.fullName} onChange={set('fullName')} required placeholder="Dr. Jane Smith" />
                        </div>
                        <div className={styles.formField}>
                            <label className={styles.label} htmlFor="ob-title">Professional title <span style={{ color: '#dc2626' }}>*</span></label>
                            <input id="ob-title" className={styles.input} value={form.title} onChange={set('title')} required placeholder="Licensed Psychologist" />
                        </div>
                        <div className={styles.formField}>
                            <label className={styles.label} htmlFor="ob-license">License / registration number <span style={{ color: '#dc2626' }}>*</span></label>
                            <input id="ob-license" className={styles.input} value={form.licenseNumber} onChange={set('licenseNumber')} required placeholder="e.g. HCPC12345" />
                        </div>
                        <div className={styles.formField}>
                            <label className={styles.label} htmlFor="ob-body">Licensing body</label>
                            <input id="ob-body" className={styles.input} value={form.licenseBody} onChange={set('licenseBody')} placeholder="e.g. HCPC, BPS, APA" />
                        </div>
                        <div className={styles.formField}>
                            <label className={styles.label} htmlFor="ob-exp">Years of experience</label>
                            <input id="ob-exp" className={styles.input} type="number" min="0" max="60" value={form.yearsExperience} onChange={set('yearsExperience')} placeholder="10" />
                        </div>
                        <div className={styles.formField}>
                            <label className={styles.label} htmlFor="ob-rate">Hourly rate (USD)</label>
                            <input id="ob-rate" className={styles.input} type="number" min="0" value={form.ratePerHour} onChange={set('ratePerHour')} placeholder="75" />
                        </div>
                        <div className={`${styles.formField} ${styles.fullWidth}`}>
                            <label className={styles.label} htmlFor="ob-bio">Professional bio <span style={{ color: '#dc2626' }}>*</span></label>
                            <textarea id="ob-bio" className={`${styles.input} ${styles.textarea}`} value={form.bio} onChange={set('bio')} required placeholder="Describe your approach, experience, and what clients can expect from sessions with you…" />
                        </div>
                    </div>
                </div>

                {/* Specialties */}
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Specialties <span style={{ color: '#dc2626' }}>*</span></h2>
                    <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: '0 0 0.75rem' }}>Select all areas you are qualified to treat.</p>
                    <div className={styles.chipRow} role="group" aria-label="Select specialties">
                        {SPECIALTIES.map(s => (
                            <button
                                key={s}
                                type="button"
                                className={`${styles.chip} ${specialties.includes(s) ? styles.chipActive : ''}`}
                                aria-pressed={specialties.includes(s)}
                                onClick={() => toggleSpec(s)}
                                style={{ cursor: 'pointer', border: '1.5px solid', borderColor: specialties.includes(s) ? '#7c3aed' : '#e5e7eb', background: specialties.includes(s) ? '#ede9fe' : '#f9fafb', color: specialties.includes(s) ? '#6d28d9' : '#374151' }}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Languages */}
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Languages spoken</h2>
                    <div className={styles.chipRow} role="group" aria-label="Select languages">
                        {LANGUAGES.map(l => (
                            <button
                                key={l}
                                type="button"
                                className={`${styles.chip}`}
                                aria-pressed={languages.includes(l)}
                                onClick={() => toggleLang(l)}
                                style={{ cursor: 'pointer', border: '1.5px solid', borderColor: languages.includes(l) ? '#2563eb' : '#e5e7eb', background: languages.includes(l) ? '#dbeafe' : '#f9fafb', color: languages.includes(l) ? '#1d4ed8' : '#374151' }}
                            >
                                {l}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Documents */}
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Supporting documents</h2>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.5rem' }}>
                        Note: this MVP stores document metadata only for admin review. File contents are not uploaded.
                    </p>
                    <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: '0 0 0.5rem' }}>Upload your license certificate and any relevant qualifications (PDF, JPG, PNG — max 5 MB each).</p>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', border: '1.5px dashed #e5e7eb', borderRadius: '0.75rem', cursor: 'pointer', fontSize: '0.875rem', color: '#6b7280' }}>
                        <Upload size={18} aria-hidden="true" />
                        Select document files (metadata only)
                        <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            multiple
                            style={{ display: 'none' }}
                            onChange={(event) => {
                                const files = Array.from(event.target.files ?? []);
                                const invalid = files.filter((file) => !isValidDocumentMetadata(file));
                                if (invalid.length > 0) {
                                    setError('Some files were invalid. Use PDF/JPG/PNG files up to 5 MB each.');
                                }
                                setDocuments(
                                    files
                                        .filter((file) => isValidDocumentMetadata(file))
                                        .map((file) => ({
                                        name: file.name,
                                        mimeType: file.type || '',
                                        size: file.size,
                                        lastModified: file.lastModified,
                                        source: 'metadata',
                                    }))
                                );
                            }}
                        />
                    </label>
                    {documents.length > 0 && (
                        <p style={{ fontSize: '0.8125rem', color: '#374151', margin: '0.5rem 0 0' }}>
                            {documents.length} document{documents.length > 1 ? 's' : ''} selected. Metadata is stored for review.
                        </p>
                    )}
                </div>

                {error && (
                    <p role="alert" style={{ fontSize: '0.875rem', color: '#dc2626', background: '#fef2f2', borderRadius: '0.75rem', padding: '0.75rem 1rem', margin: 0 }}>
                        {error}
                    </p>
                )}

                <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                    {isLoading ? 'Submitting…' : 'Submit Application'}
                </button>
            </form>
        </main>
    );
}
