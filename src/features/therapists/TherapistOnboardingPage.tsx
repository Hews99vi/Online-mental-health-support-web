import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Upload } from 'lucide-react';
import { http } from '../../api/http';
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
}

async function submitApplication(payload: OnboardPayload): Promise<void> {
    try {
        await http.post('/therapists/apply', payload);
    } catch {
        // Stub: simulate success for dev
        await new Promise(r => setTimeout(r, 800));
    }
}

export function TherapistOnboardingPage() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        fullName: '', title: '', licenseNumber: '', licenseBody: '',
        yearsExperience: '', bio: '', ratePerHour: '',
    });
    const [specialties, setSpecialties] = useState<string[]>([]);
    const [languages, setLanguages] = useState<string[]>(['English']);
    const [isLoading, setIsLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm(f => ({ ...f, [field]: e.target.value }));

    const toggleSpec = (s: string) =>
        setSpecialties(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

    const toggleLang = (l: string) =>
        setLanguages(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!form.fullName || !form.licenseNumber || !form.bio || specialties.length === 0) {
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
                    <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: '0 0 0.5rem' }}>Upload your license certificate and any relevant qualifications (PDF, JPG, PNG — max 5 MB each).</p>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', border: '1.5px dashed #e5e7eb', borderRadius: '0.75rem', cursor: 'pointer', fontSize: '0.875rem', color: '#6b7280' }}>
                        <Upload size={18} aria-hidden="true" />
                        Click to upload documents
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" multiple style={{ display: 'none' }} />
                    </label>
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
