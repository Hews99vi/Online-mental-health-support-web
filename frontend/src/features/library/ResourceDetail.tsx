import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, Tag } from 'lucide-react';
import { http } from '../../api/http';
import { ResourceCard } from './components/ResourceCard';
import { TYPE_CONFIG } from './components/ResourceCard';
import type { ResourceItem } from './types';
import styles from './Library.module.css';

interface LibraryItemResponse {
    data: {
        item: ResourceItem;
    };
}

interface LibraryListResponse {
    data: {
        items: ResourceItem[];
    };
}

async function fetchResource(id: string): Promise<ResourceItem> {
    const response = await http.get<LibraryItemResponse>(`/library/${id}`);
    return response.data.item;
}

async function fetchRelated(category: string, excludeId: string): Promise<ResourceItem[]> {
    const response = await http.get<LibraryListResponse>(`/library?category=${encodeURIComponent(category)}`);
    return response.data.items.filter((item) => item.id !== excludeId).slice(0, 3);
}

export function ResourceDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [resource, setResource] = useState<ResourceItem | null>(null);
    const [related, setRelated] = useState<ResourceItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        setIsLoading(true);
        setError(null);

        (async () => {
            try {
                const item = await fetchResource(id);
                setResource(item);
                const relatedItems = await fetchRelated(item.category, item.id);
                setRelated(relatedItems);
            } catch (err: unknown) {
                setResource(null);
                setRelated([]);
                setError((err as { message?: string }).message ?? 'Failed to load resource.');
            } finally {
                setIsLoading(false);
            }
        })();

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [id]);

    if (isLoading) {
        return (
            <div className={styles.detailPage} aria-busy="true" aria-label="Loading resource">
                <div className={`${styles.detailHero} ${styles.thumbArticle}`} style={{ animation: 'none', background: '#f3f4f6' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[90, 60, 80, 50, 70].map((w, i) => (
                        <div key={i} className={styles.skeletonLine} style={{ width: `${w}%`, height: i === 0 ? '1.75rem' : '0.875rem' }} />
                    ))}
                </div>
            </div>
        );
    }

    if (!resource) {
        return (
            <div className={styles.detailPage}>
                <div className={styles.empty}>
                    <p className={styles.emptyTitle}>{error ?? 'Resource not found.'}</p>
                    <button type="button" className={styles.backBtn} onClick={() => navigate('/library')}>
                        <ArrowLeft size={16} aria-hidden="true" />
                        Back to Library
                    </button>
                </div>
            </div>
        );
    }

    const cfg = TYPE_CONFIG[resource.type];
    const publishDate = new Date(resource.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <article className={styles.detailPage} aria-label={resource.title}>
            <button type="button" className={styles.backBtn} onClick={() => navigate(-1)}>
                <ArrowLeft size={16} aria-hidden="true" />
                Back to Library
            </button>

            <div className={`${styles.detailHero} ${cfg.thumbClass}`}>
                <cfg.Icon size={80} aria-hidden="true" strokeWidth={1} style={{ opacity: 0.5, color: '#374151' }} />
            </div>

            <div className={styles.detailMeta}>
                <span className={`${styles.typeBadge} ${cfg.badgeClass}`}>
                    <cfg.Icon size={11} aria-hidden="true" />
                    {cfg.label}
                </span>
                {resource.readTimeMin && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={13} aria-hidden="true" />
                        {resource.readTimeMin} min read
                    </span>
                )}
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar size={13} aria-hidden="true" />
                    {publishDate}
                </span>
                <span>By <strong>{resource.author}</strong></span>
                {resource.tags?.map((tag) => (
                    <span key={tag} style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', background: '#f3f4f6', padding: '0.15rem 0.5rem', borderRadius: '99px', fontSize: '0.72rem', color: '#6b7280' }}>
                        <Tag size={10} aria-hidden="true" />
                        {tag}
                    </span>
                ))}
            </div>

            <h1 className={styles.detailTitle}>{resource.title}</h1>

            <div className={styles.detailBody} dangerouslySetInnerHTML={{ __html: resource.body ?? resource.excerpt ?? '' }} />

            <section className={styles.relatedSection} aria-labelledby="related-title">
                <h2 id="related-title" className={styles.relatedTitle}>Related resources</h2>
                {related.length === 0 ? (
                    <p className={styles.emptyText}>No related resources found.</p>
                ) : (
                    <div className={styles.relatedGrid}>
                        {related.map((r) => (
                            <ResourceCard key={r.id} resource={r} onClick={() => navigate(`/library/${r.id}`)} />
                        ))}
                    </div>
                )}
            </section>
        </article>
    );
}
