import { Star, ShieldCheck, Clock, Globe, Video } from 'lucide-react';
import styles from '../Therapist.module.css';
import type { Therapist } from '../types';

interface Props {
    therapist: Therapist;
    onClick: (t: Therapist) => void;
}

function StarRating({ rating }: { rating: number }) {
    return (
        <span className={styles.ratingRow} aria-label={`${rating.toFixed(1)} stars`}>
            <Star size={12} className={styles.star} aria-hidden="true" />
            <strong>{rating.toFixed(1)}</strong>
        </span>
    );
}

export function TherapistCard({ therapist, onClick }: Props) {
    const rate = `$${(therapist.ratePerHour / 100).toFixed(0)}`;

    return (
        <article
            className={styles.card}
            onClick={() => onClick(therapist)}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onClick(therapist)}
            role="button"
            tabIndex={0}
            aria-label={`${therapist.name}, ${therapist.title}`}
        >
            {/* Top row: avatar + name + rate */}
            <div className={styles.cardTopRow}>
                <div className={styles.avatar} aria-hidden="true">
                    {therapist.avatarUrl
                        ? <img src={therapist.avatarUrl} alt="" className={styles.avatarImg} />
                        : therapist.initials}
                </div>
                <div className={styles.cardNameRow}>
                    <p className={styles.cardName}>{therapist.name}</p>
                    <p className={styles.cardTitle}>{therapist.title}</p>
                    {therapist.rating !== undefined && <StarRating rating={therapist.rating} />}
                    {therapist.verified && (
                        <span className={styles.verifiedBadge}>
                            <ShieldCheck size={11} aria-hidden="true" />
                            Verified
                        </span>
                    )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
                    <span className={styles.rateTag}>
                        {rate}<span className={styles.rateUnit}>/hr</span>
                    </span>
                </div>
            </div>

            {/* Specialty chips (max 3) */}
            <div className={styles.chipRow}>
                {therapist.specialties.slice(0, 3).map(s => (
                    <span key={s} className={styles.chip}>{s}</span>
                ))}
                {therapist.specialties.length > 3 && (
                    <span className={styles.chip}>+{therapist.specialties.length - 3}</span>
                )}
            </div>

            {/* Short bio */}
            {therapist.bio && <p className={styles.bio}>{therapist.bio}</p>}

            {/* Meta: years exp, languages, session types */}
            <div className={styles.metaRow}>
                {therapist.yearsExperience !== undefined && (
                    <span className={styles.metaItem}>
                        <Clock size={13} aria-hidden="true" />
                        {therapist.yearsExperience}+ yrs
                    </span>
                )}
                {therapist.languages.length > 0 && (
                    <span className={styles.metaItem}>
                        <Globe size={13} aria-hidden="true" />
                        {therapist.languages.slice(0, 2).join(', ')}
                    </span>
                )}
                {therapist.sessionTypes.includes('video') && (
                    <span className={styles.metaItem}>
                        <Video size={13} aria-hidden="true" />
                        Video
                    </span>
                )}
            </div>

            {/* Footer: next slot + CTA */}
            <div className={styles.cardFooter}>
                {therapist.nextAvailable && (
                    <span className={styles.nextSlot}>
                        <Clock size={12} aria-hidden="true" />
                        {new Date(therapist.nextAvailable).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                )}
                {!therapist.nextAvailable && (
                    <span className={styles.nextSlot} style={{ color: '#9ca3af' }}>
                        <Clock size={12} aria-hidden="true" />
                        No upcoming slots
                    </span>
                )}
                <button
                    type="button"
                    className={styles.viewBtn}
                    onClick={e => { e.stopPropagation(); onClick(therapist); }}
                    aria-label={`View profile of ${therapist.name}`}
                >
                    View Profile
                </button>
            </div>
        </article>
    );
}
