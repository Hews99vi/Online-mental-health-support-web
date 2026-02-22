import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, ShieldCheck, Globe, Video, Clock, CheckCircle2 } from 'lucide-react';
import { http } from '../../api/http';
import { BookSessionModal } from '../appointments/BookSessionModal';
import type { Therapist, AvailabilitySlot } from './types';
import styles from './Therapist.module.css';

// ── Stub data ─────────────────────────────────────────────────────────────────

const STUB_MAP: Record<string, Therapist> = {
    t1: { id: 't1', name: 'Dr. Priya Sharma', initials: 'PS', title: 'Licensed Clinical Psychologist', bio: 'Specialising in anxiety, depression and trauma recovery using evidence-based CBT and DBT approaches. I create a safe, non-judgmental space where clients feel empowered to explore their inner world and build lasting resilience.\n\nWith 12 years of clinical experience, I have worked with individuals from diverse backgrounds dealing with acute crises as well as long-term mental health management.', specialties: ['Anxiety', 'Depression', 'Trauma & PTSD', 'CBT', 'Mindfulness'], languages: ['English', 'Hindi'], sessionTypes: ['video', 'audio'], ratePerHour: 8000, currency: 'USD', verified: true, rating: 4.9, reviewCount: 124, yearsExperience: 12, education: ['PhD Clinical Psychology, University of Edinburgh', 'MSc Cognitive Behavioural Therapy, King\'s College London'], certifications: ['BABCP Accredited CBT Therapist', 'EMDR Practitioner'], nextAvailable: new Date(Date.now() + 2 * 3600 * 1000).toISOString() },
};

const DEFAULT_THERAPIST: Therapist = {
    id: 'default', name: 'Dr. Sarah Chen', initials: 'SC', title: 'Licensed Counselling Psychologist',
    bio: 'Licensed psychologist with a warm, person-centred approach. Specialising in anxiety, depression and life transitions.', specialties: ['Anxiety', 'Depression', 'Stress'], languages: ['English'], sessionTypes: ['video', 'audio'], ratePerHour: 7500, currency: 'USD', verified: true, rating: 4.8, reviewCount: 88, yearsExperience: 10, nextAvailable: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
};

async function fetchTherapist(id: string): Promise<Therapist> {
    try { return await http.get<Therapist>(`/therapists/${id}`); }
    catch { return STUB_MAP[id] ?? DEFAULT_THERAPIST; }
}

async function fetchAvailability(therapistId: string): Promise<AvailabilitySlot[]> {
    try {
        const from = new Date().toISOString();
        const to = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
        return await http.get<AvailabilitySlot[]>(`/therapists/${therapistId}/availability?from=${from}&to=${to}`);
    } catch {
        // Generate stub slots spread over the next 7 days
        const slots: AvailabilitySlot[] = [];
        const now = new Date();
        for (let day = 0; day < 7; day++) {
            for (const hour of [9, 11, 14, 16]) {
                const start = new Date(now);
                start.setDate(start.getDate() + day);
                start.setHours(hour, 0, 0, 0);
                if (start <= now) continue;
                const end = new Date(start.getTime() + 60 * 60 * 1000);
                slots.push({ id: `slot-${day}-${hour}`, start: start.toISOString(), end: end.toISOString(), available: Math.random() > 0.35 });
            }
        }
        return slots;
    }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TherapistProfilePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [therapist, setTherapist] = useState<Therapist | null>(null);
    const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [bookOpen, setBookOpen] = useState(false);

    const load = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        const [t, s] = await Promise.all([fetchTherapist(id), fetchAvailability(id)]);
        setTherapist(t);
        setSlots(s);
        setIsLoading(false);
    }, [id]);

    useEffect(() => { load(); window.scrollTo({ top: 0, behavior: 'smooth' }); }, [load]);

    if (isLoading) return (
        <div className={styles.profilePage}>
            <div className={styles.skeletonCard} style={{ height: '10rem', borderRadius: '1.5rem' }} aria-busy="true" aria-label="Loading therapist profile" />
            <div className={styles.section}>
                {[80, 60, 90, 70].map((w, i) => <div key={i} className={styles.skeletonLine} style={{ width: `${w}%` }} />)}
            </div>
        </div>
    );

    if (!therapist) return (
        <div className={styles.profilePage}>
            <button type="button" className={styles.backBtn} onClick={() => navigate(-1)}>
                <ArrowLeft size={16} aria-hidden="true" /> Back to Directory
            </button>
            <p style={{ color: '#6b7280' }}>Therapist not found.</p>
        </div>
    );

    const rate = `$${(therapist.ratePerHour / 100).toFixed(0)}/hr`;
    const bioParas = therapist.bio.split('\n\n');

    return (
        <div className={styles.profilePage}>
            {/* Back */}
            <button type="button" className={styles.backBtn} onClick={() => navigate(-1)}>
                <ArrowLeft size={16} aria-hidden="true" /> Back to Directory
            </button>

            {/* Hero */}
            <div className={styles.profileHero}>
                <div className={styles.profileAvatar} aria-hidden="true">
                    {therapist.avatarUrl ? <img src={therapist.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : therapist.initials}
                </div>

                <div className={styles.profileInfo}>
                    <h1 className={styles.profileName}>{therapist.name}</h1>
                    <p className={styles.profileTitle}>{therapist.title}</p>
                    <div className={styles.profileStats}>
                        {therapist.rating !== undefined && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <Star size={14} style={{ color: '#f59e0b' }} aria-hidden="true" />
                                <strong>{therapist.rating.toFixed(1)}</strong>
                                {therapist.reviewCount !== undefined && <span>({therapist.reviewCount} reviews)</span>}
                            </span>
                        )}
                        {therapist.yearsExperience !== undefined && <span><Clock size={13} aria-hidden="true" /> {therapist.yearsExperience}+ years exp.</span>}
                        {therapist.verified && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#059669' }}>
                                <ShieldCheck size={14} aria-hidden="true" /> Verified
                            </span>
                        )}
                        <span style={{ fontWeight: 700, color: '#7c3aed' }}>{rate}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                        {therapist.languages.map(l => (
                            <span key={l} style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.8125rem', color: '#6b7280' }}>
                                <Globe size={12} aria-hidden="true" /> {l}
                            </span>
                        ))}
                        {therapist.sessionTypes.map(t => (
                            <span key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.8125rem', color: '#6b7280' }}>
                                <Video size={12} aria-hidden="true" /> {t}
                            </span>
                        ))}
                    </div>
                </div>

                <button type="button" className={styles.bookCta} onClick={() => setBookOpen(true)}>
                    Book a Session
                </button>
            </div>

            {/* Bio */}
            <section className={styles.section} aria-labelledby="bio-heading">
                <h2 id="bio-heading" className={styles.sectionTitle}>About</h2>
                {bioParas.map((p, i) => <p key={i} className={styles.bioText}>{p}</p>)}
            </section>

            {/* Specialties */}
            <section className={styles.section} aria-labelledby="spec-heading">
                <h2 id="spec-heading" className={styles.sectionTitle}>Specialties</h2>
                <div className={styles.chipRow}>
                    {therapist.specialties.map(s => <span key={s} className={styles.chip}>{s}</span>)}
                </div>
            </section>

            {/* Education + certifications */}
            {(therapist.education?.length || therapist.certifications?.length) && (
                <section className={styles.section} aria-labelledby="cred-heading">
                    <h2 id="cred-heading" className={styles.sectionTitle}>Credentials</h2>
                    {therapist.education?.map(e => (
                        <div key={e} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem', color: '#374151', marginBottom: '0.25rem' }}>
                            <CheckCircle2 size={15} style={{ color: '#7c3aed', flexShrink: 0, marginTop: '0.05rem' }} aria-hidden="true" />
                            {e}
                        </div>
                    ))}
                    {therapist.certifications?.map(c => (
                        <div key={c} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem', color: '#374151', marginBottom: '0.25rem' }}>
                            <ShieldCheck size={15} style={{ color: '#059669', flexShrink: 0, marginTop: '0.05rem' }} aria-hidden="true" />
                            {c}
                        </div>
                    ))}
                </section>
            )}

            {/* Availability preview */}
            <section className={styles.section} aria-labelledby="avail-heading">
                <h2 id="avail-heading" className={styles.sectionTitle}>Next available slots</h2>
                <div className={styles.slotGrid}>
                    {slots.filter(s => s.available).slice(0, 8).map(s => (
                        <button
                            key={s.id}
                            type="button"
                            className={styles.slot}
                            onClick={() => setBookOpen(true)}
                        >
                            {new Date(s.start).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </button>
                    ))}
                    {slots.filter(s => s.available).length === 0 && (
                        <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>No availability in the next 7 days.</p>
                    )}
                </div>
            </section>

            {/* Book modal */}
            {therapist && (
                <BookSessionModal
                    isOpen={bookOpen}
                    therapist={therapist}
                    slots={slots}
                    onClose={() => setBookOpen(false)}
                    onBooked={() => { setBookOpen(false); navigate('/bookings'); }}
                />
            )}
        </div>
    );
}
