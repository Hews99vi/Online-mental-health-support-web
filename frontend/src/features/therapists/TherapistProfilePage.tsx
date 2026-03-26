import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, ShieldCheck, Globe, Video, Clock, CheckCircle2 } from 'lucide-react';
import { http } from '../../api/http';
import { BookSessionModal } from '../appointments/BookSessionModal';
import type { Therapist, AvailabilitySlot } from './types';
import styles from './Therapist.module.css';

async function fetchTherapist(id: string): Promise<Therapist> {
    const response = await http.get<{ data: { therapist: Therapist } }>(`/therapists/${id}`);
    return response.data.therapist;
}

async function fetchAvailability(therapistId: string): Promise<AvailabilitySlot[]> {
    const from = new Date().toISOString();
    const to = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
    const response = await http.get<{ data: { items: AvailabilitySlot[] } }>(
        `/therapists/${therapistId}/availability?from=${from}&to=${to}`
    );
    return response.data.items;
}

export function TherapistProfilePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [therapist, setTherapist] = useState<Therapist | null>(null);
    const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [bookOpen, setBookOpen] = useState(false);

    const load = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        setError(null);
        try {
            const [t, s] = await Promise.all([fetchTherapist(id), fetchAvailability(id)]);
            setTherapist(t);
            setSlots(s);
        } catch (err: unknown) {
            setTherapist(null);
            setSlots([]);
            setError((err as { message?: string }).message ?? 'Failed to load therapist profile.');
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        void load();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [load]);

    if (isLoading) {
        return (
            <div className={styles.profilePage}>
                <div
                    className={styles.skeletonCard}
                    style={{ height: '10rem', borderRadius: '1.5rem' }}
                    aria-busy="true"
                    aria-label="Loading therapist profile"
                />
                <div className={styles.section}>
                    {[80, 60, 90, 70].map((w, i) => (
                        <div key={i} className={styles.skeletonLine} style={{ width: `${w}%` }} />
                    ))}
                </div>
            </div>
        );
    }

    if (!therapist) {
        return (
            <div className={styles.profilePage}>
                <button type="button" className={styles.backBtn} onClick={() => navigate(-1)}>
                    <ArrowLeft size={16} aria-hidden="true" /> Back to Directory
                </button>
                <p style={{ color: '#6b7280' }}>{error ?? 'Therapist not found.'}</p>
            </div>
        );
    }

    const rate = `$${(therapist.ratePerHour / 100).toFixed(0)}/hr`;
    const bioParas = therapist.bio.split('\n\n');
    const availableSlots = slots.filter((slot) => slot.available && new Date(slot.start).getTime() > Date.now());
    const hasBookableSlots = availableSlots.length > 0;

    return (
        <div className={styles.profilePage}>
            <button type="button" className={styles.backBtn} onClick={() => navigate(-1)}>
                <ArrowLeft size={16} aria-hidden="true" /> Back to Directory
            </button>

            <div className={styles.profileHero}>
                <div className={styles.profileAvatar} aria-hidden="true">
                    {therapist.avatarUrl ? (
                        <img src={therapist.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        therapist.initials
                    )}
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
                        {therapist.yearsExperience !== undefined && (
                            <span>
                                <Clock size={13} aria-hidden="true" /> {therapist.yearsExperience}+ years exp.
                            </span>
                        )}
                        {therapist.verified && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#059669' }}>
                                <ShieldCheck size={14} aria-hidden="true" /> Verified
                            </span>
                        )}
                        <span style={{ fontWeight: 700, color: '#7c3aed' }}>{rate}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                        {therapist.languages.map((l) => (
                            <span key={l} style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.8125rem', color: '#6b7280' }}>
                                <Globe size={12} aria-hidden="true" /> {l}
                            </span>
                        ))}
                        {therapist.sessionTypes.map((t) => (
                            <span key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.8125rem', color: '#6b7280' }}>
                                <Video size={12} aria-hidden="true" /> {t}
                            </span>
                        ))}
                    </div>
                </div>

                <button
                    type="button"
                    className={styles.bookCta}
                    onClick={() => setBookOpen(true)}
                    disabled={!hasBookableSlots}
                    title={hasBookableSlots ? 'Book a Session' : 'No available slots in the next 30 days'}
                    style={!hasBookableSlots ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
                >
                    {hasBookableSlots ? 'Book a Session' : 'No Slots Available'}
                </button>
            </div>

            <section className={styles.section} aria-labelledby="bio-heading">
                <h2 id="bio-heading" className={styles.sectionTitle}>About</h2>
                {bioParas.map((p, i) => <p key={i} className={styles.bioText}>{p}</p>)}
            </section>

            <section className={styles.section} aria-labelledby="spec-heading">
                <h2 id="spec-heading" className={styles.sectionTitle}>Specialties</h2>
                <div className={styles.chipRow}>
                    {therapist.specialties.map((s) => <span key={s} className={styles.chip}>{s}</span>)}
                </div>
            </section>

            {(therapist.education?.length || therapist.certifications?.length) && (
                <section className={styles.section} aria-labelledby="cred-heading">
                    <h2 id="cred-heading" className={styles.sectionTitle}>Credentials</h2>
                    {therapist.education?.map((e) => (
                        <div key={e} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem', color: '#374151', marginBottom: '0.25rem' }}>
                            <CheckCircle2 size={15} style={{ color: '#7c3aed', flexShrink: 0, marginTop: '0.05rem' }} aria-hidden="true" />
                            {e}
                        </div>
                    ))}
                    {therapist.certifications?.map((c) => (
                        <div key={c} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem', color: '#374151', marginBottom: '0.25rem' }}>
                            <ShieldCheck size={15} style={{ color: '#059669', flexShrink: 0, marginTop: '0.05rem' }} aria-hidden="true" />
                            {c}
                        </div>
                    ))}
                </section>
            )}

            <section className={styles.section} aria-labelledby="avail-heading">
                <h2 id="avail-heading" className={styles.sectionTitle}>Next available slots</h2>
                <div className={styles.slotGrid}>
                    {availableSlots
                        .slice(0, 8)
                        .map((s) => (
                            <button key={s.id} type="button" className={styles.slot} onClick={() => setBookOpen(true)}>
                                {new Date(s.start).toLocaleString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                })}
                            </button>
                        ))}
                    {availableSlots.length === 0 && (
                        <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                            No availability in the next 30 days. Please choose another therapist or check back later.
                        </p>
                    )}
                </div>
            </section>

            <BookSessionModal
                isOpen={bookOpen}
                therapist={therapist}
                slots={slots}
                onClose={() => setBookOpen(false)}
                onBooked={() => {
                    setBookOpen(false);
                    navigate('/bookings');
                }}
            />
        </div>
    );
}
