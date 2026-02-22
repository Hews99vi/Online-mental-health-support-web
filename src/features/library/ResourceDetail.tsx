import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, Tag } from 'lucide-react';
import { http } from '../../api/http';
import { ResourceCard } from './components/ResourceCard';
import { TYPE_CONFIG } from './components/ResourceCard';
import type { ResourceItem } from './types';
import styles from './Library.module.css';

// ── Stub body content ─────────────────────────────────────────────────────────

const STUB_BODY = `
<h2>Introduction</h2>
<p>Mental wellbeing is a journey, not a destination. This resource will walk you through evidence-based techniques used by therapists worldwide to help you manage your emotions and build resilience.</p>

<h2>Key Concepts</h2>
<p>Understanding the underlying principles helps you apply them more consistently in daily life. Research consistently shows that regular practice — even just 5–10 minutes per day — produces measurable improvements within 4–6 weeks.</p>

<ul>
  <li>Acknowledge what you are feeling without judgment</li>
  <li>Notice physical sensations in your body</li>
  <li>Use grounding techniques when overwhelmed</li>
  <li>Schedule regular check-ins with yourself</li>
</ul>

<h2>How to Get Started</h2>
<p>Start small. Pick one technique from this resource and practice it every day for one week before adding another. Consistency matters more than perfection.</p>

<p>If you find that symptoms are significantly affecting your daily life, consider reaching out to one of our licensed therapists via the <strong>Find a Therapist</strong> section.</p>
`;

// ── Stub related items ─────────────────────────────────────────────────────────

const RELATED_STUB: ResourceItem[] = [
    { id: 'rel1', type: 'article', title: 'Grounding Techniques for Panic Attacks', author: 'Dr. Marcus Lee', category: 'Anxiety', readTimeMin: 6, publishedAt: '2026-01-29' },
    { id: 'rel2', type: 'exercise', title: 'CBT Thought Record Worksheet', author: 'Dr. Emma Wilson', category: 'CBT', readTimeMin: 20, publishedAt: '2026-02-07' },
    { id: 'rel3', type: 'video', title: '5-Minute Breathing Exercise', author: 'MindBridge Team', category: 'Mindfulness', readTimeMin: 5, publishedAt: '2026-02-10' },
];

// ── API ────────────────────────────────────────────────────────────────────────

async function fetchResource(id: string): Promise<ResourceItem> {
    try {
        return await http.get<ResourceItem>(`/resources/${id}`);
    } catch {
        // Return a stub for development
        return {
            id,
            type: 'article',
            title: 'Understanding Anxiety: A Beginner\'s Guide',
            excerpt: 'Learn how anxiety works and discover practical coping techniques.',
            body: STUB_BODY,
            author: 'Dr. Priya Sharma',
            category: 'Anxiety',
            readTimeMin: 8,
            publishedAt: '2026-02-14',
            tags: ['anxiety', 'cbt', 'beginners'],
        };
    }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ResourceDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [resource, setResource] = useState<ResourceItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        setIsLoading(true);
        fetchResource(id)
            .then(setResource)
            .finally(() => setIsLoading(false));
        // Scroll to top on navigation
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
                    <p className={styles.emptyTitle}>Resource not found.</p>
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
        year: 'numeric', month: 'long', day: 'numeric',
    });

    return (
        <article className={styles.detailPage} aria-label={resource.title}>
            {/* Back */}
            <button type="button" className={styles.backBtn} onClick={() => navigate(-1)}>
                <ArrowLeft size={16} aria-hidden="true" />
                Back to Library
            </button>

            {/* Hero */}
            <div className={`${styles.detailHero} ${cfg.thumbClass}`}>
                <cfg.Icon size={80} aria-hidden="true" strokeWidth={1} style={{ opacity: 0.5, color: '#374151' }} />
            </div>

            {/* Meta strip */}
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
                {resource.tags?.map(tag => (
                    <span key={tag} style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', background: '#f3f4f6', padding: '0.15rem 0.5rem', borderRadius: '99px', fontSize: '0.72rem', color: '#6b7280' }}>
                        <Tag size={10} aria-hidden="true" />
                        {tag}
                    </span>
                ))}
            </div>

            {/* Title */}
            <h1 className={styles.detailTitle}>{resource.title}</h1>

            {/* Body */}
            <div
                className={styles.detailBody}
                dangerouslySetInnerHTML={{ __html: resource.body ?? resource.excerpt ?? '' }}
            />

            {/* Related resources */}
            <section className={styles.relatedSection} aria-labelledby="related-title">
                <h2 id="related-title" className={styles.relatedTitle}>Related resources</h2>
                <div className={styles.relatedGrid}>
                    {RELATED_STUB.map(r => (
                        <ResourceCard
                            key={r.id}
                            resource={r}
                            onClick={() => navigate(`/library/${r.id}`)}
                        />
                    ))}
                </div>
            </section>
        </article>
    );
}
