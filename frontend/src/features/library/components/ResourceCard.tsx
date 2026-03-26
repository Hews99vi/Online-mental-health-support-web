import { FileText, Headphones, Video, BookOpen, Map } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import styles from '../Library.module.css';
import type { ResourceType } from '../types';

// ── Type config ───────────────────────────────────────────────────────────────

export const TYPE_CONFIG: Record<
    ResourceType,
    { Icon: LucideIcon; label: string; thumbClass: string; badgeClass: string }
> = {
    article: { Icon: FileText, label: 'Article', thumbClass: styles.thumbArticle, badgeClass: styles.badgeArticle },
    podcast: { Icon: Headphones, label: 'Podcast', thumbClass: styles.thumbPodcast, badgeClass: styles.badgePodcast },
    video: { Icon: Video, label: 'Video', thumbClass: styles.thumbVideo, badgeClass: styles.badgeVideo },
    exercise: { Icon: BookOpen, label: 'Exercise', thumbClass: styles.thumbExercise, badgeClass: styles.badgeExercise },
    guide: { Icon: Map, label: 'Guide', thumbClass: styles.thumbGuide, badgeClass: styles.badgeGuide },
};

import type { ResourceItem } from '../types';

interface Props {
    resource: ResourceItem;
    onClick: (resource: ResourceItem) => void;
}

function authorInitials(name: string) {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

/**
 * ResourceCard — shows thumbnail, type badge, read time, title, excerpt.
 */
export function ResourceCard({ resource, onClick }: Props) {
    const cfg = TYPE_CONFIG[resource.type];

    return (
        <article
            className={styles.card}
            onClick={() => onClick(resource)}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onClick(resource)}
            role="button"
            tabIndex={0}
            aria-label={`${cfg.label}: ${resource.title}`}
        >
            {/* Thumbnail */}
            <div className={`${styles.cardThumb} ${cfg.thumbClass}`}>
                <cfg.Icon size={48} className={styles.thumbIcon} aria-hidden="true" strokeWidth={1.25} />
            </div>

            <div className={styles.cardBody}>
                <div className={styles.cardTopRow}>
                    <span className={`${styles.typeBadge} ${cfg.badgeClass}`}>
                        <cfg.Icon size={10} aria-hidden="true" />
                        {cfg.label}
                    </span>
                    {resource.readTimeMin && (
                        <span className={styles.readTime}>{resource.readTimeMin} min</span>
                    )}
                </div>

                <h3 className={styles.cardTitle}>{resource.title}</h3>
                {resource.excerpt && <p className={styles.cardExcerpt}>{resource.excerpt}</p>}

                <div className={styles.cardFooter}>
                    <div className={styles.authorAvatar} aria-hidden="true">
                        {authorInitials(resource.author)}
                    </div>
                    <span className={styles.authorName}>{resource.author}</span>
                </div>
            </div>
        </article>
    );
}
