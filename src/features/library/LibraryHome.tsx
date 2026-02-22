import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Library, SlidersHorizontal } from 'lucide-react';
import { http } from '../../api/http';
import { CategoryFilterChips } from './components/CategoryFilterChips';
import { ResourceCard } from './components/ResourceCard';
import type { ResourceItem, ResourceType, ResourcesPage } from './types';
import styles from './Library.module.css';

// ── Stub data (used when the API request fails/404) ────────────────────────────

const STUB_RESOURCES: ResourceItem[] = [
    { id: 'r1', type: 'article', title: 'Understanding Anxiety: A Beginner\'s Guide', excerpt: 'Learn how anxiety works in the brain and practical techniques for calming the nervous system.', author: 'Dr. Priya Sharma', category: 'Anxiety', readTimeMin: 8, publishedAt: '2026-02-14' },
    { id: 'r2', type: 'video', title: '5-Minute Breathing Exercise — Calm in a Crisis', excerpt: 'A guided box-breathing video you can follow anywhere, anytime.', author: 'MindBridge Team', category: 'Mindfulness', readTimeMin: 5, publishedAt: '2026-02-10' },
    { id: 'r3', type: 'exercise', title: 'CBT Thought Record Worksheet', excerpt: 'Identify, challenge, and reframe automatic negative thoughts with this structured worksheet.', author: 'Dr. Emma Wilson', category: 'CBT', readTimeMin: 20, publishedAt: '2026-02-07' },
    { id: 'r4', type: 'article', title: 'Grounding Techniques for Panic Attacks', excerpt: '5-4-3-2-1 and other evidence-based grounding strategies that work quickly.', author: 'Dr. Marcus Lee', category: 'Anxiety', readTimeMin: 6, publishedAt: '2026-01-29' },
    { id: 'r5', type: 'podcast', title: 'The Science of Sleep — Episode 12', excerpt: 'Why sleep quality matters for mental health and how to improve it tonight.', author: 'Dr. Amara Osei', category: 'Sleep', readTimeMin: 42, publishedAt: '2026-01-22' },
    { id: 'r6', type: 'exercise', title: 'Sleep Hygiene Checklist', excerpt: 'A printable checklist to build better bedtime habits in 14 days.', author: 'Dr. Amara Osei', category: 'Sleep', readTimeMin: 5, publishedAt: '2026-01-15' },
    { id: 'r7', type: 'guide', title: 'Mindful Walking — 10-Minute Daily Practice', excerpt: 'Step-by-step guide to turning an ordinary walk into a mindfulness session.', author: 'MindBridge Team', category: 'Mindfulness', readTimeMin: 10, publishedAt: '2026-01-10' },
    { id: 'r8', type: 'video', title: 'Progressive Muscle Relaxation for Stress', excerpt: 'Follow along with this 12-minute guided PMR session to release physical tension.', author: 'Dr. Emma Wilson', category: 'Stress', readTimeMin: 12, publishedAt: '2026-01-05' },
    { id: 'r9', type: 'article', title: 'Journaling for Mental Health — Getting Started', excerpt: 'Research-backed journaling prompts that help process emotions and build self-awareness.', author: 'Dr. Priya Sharma', category: 'Self-care', readTimeMin: 7, publishedAt: '2025-12-28' },
    { id: 'r10', type: 'podcast', title: 'Talking About Depression — Breaking the Stigma', excerpt: 'A candid conversation with two therapists about how to talk openly about depression.', author: 'Dr. Johan Voss', category: 'Depression', readTimeMin: 35, publishedAt: '2025-12-20' },
    { id: 'r11', type: 'guide', title: 'Building Healthy Boundaries — A Complete Guide', excerpt: 'Identify what you need, communicate limits clearly, and maintain them kindly.', author: 'Dr. Marcus Lee', category: 'Relationships', readTimeMin: 15, publishedAt: '2025-12-14' },
    { id: 'r12', type: 'exercise', title: 'Gratitude Journal — 30-Day Challenge', excerpt: 'Daily prompts to shift your attention toward what is going well in your life.', author: 'MindBridge Team', category: 'Self-care', readTimeMin: 3, publishedAt: '2025-12-01' },
];

// ── API ────────────────────────────────────────────────────────────────────────

async function fetchResources(query: string, category: string): Promise<ResourceItem[]> {
    try {
        const qs = new URLSearchParams();
        if (query) qs.set('query', query);
        if (category && category !== 'all') qs.set('category', category);
        const data = await http.get<ResourcesPage>(`/resources?${qs.toString()}`);
        return data.items;
    } catch {
        // Fall back to stub data when API not available
        let items = STUB_RESOURCES;
        if (category && category !== 'all') items = items.filter(r => r.type === category);
        if (query) {
            const q = query.toLowerCase();
            items = items.filter(r =>
                r.title.toLowerCase().includes(q) ||
                r.excerpt?.toLowerCase().includes(q) ||
                r.category.toLowerCase().includes(q)
            );
        }
        return items;
    }
}

// ── Skeleton loaders ──────────────────────────────────────────────────────────

function SkeletonCard() {
    return (
        <div className={styles.skeletonCard} aria-hidden="true">
            <div className={styles.skeletonThumb} />
            <div className={styles.skeletonBody}>
                <div className={styles.skeletonLine} style={{ width: '40%' }} />
                <div className={styles.skeletonLine} style={{ width: '90%' }} />
                <div className={styles.skeletonLine} style={{ width: '70%' }} />
            </div>
        </div>
    );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function LibraryHome() {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState<ResourceType | 'all'>('all');
    const [resources, setResources] = useState<ResourceItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const load = useCallback(async (q: string, cat: string) => {
        setIsLoading(true);
        const items = await fetchResources(q, cat);
        setResources(items);
        setIsLoading(false);
    }, []);

    // Initial load
    useEffect(() => { load('', 'all'); }, [load]);

    // Debounced search — 350 ms
    const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => load(val, category), 350);
    };

    const handleCategoryChange = (cat: ResourceType | 'all') => {
        setCategory(cat);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        load(query, cat);
    };

    // Cleanup debounce on unmount
    useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

    return (
        <main className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.title}>Self-Help Library</h1>
                <p className={styles.subtitle}>
                    Articles, videos, podcasts and exercises curated by our clinical team.
                </p>
            </div>

            {/* Search */}
            <div className={styles.searchWrap}>
                <span className={styles.searchIcon} aria-hidden="true">
                    <Search size={18} />
                </span>
                <input
                    type="search"
                    className={styles.searchInput}
                    value={query}
                    onChange={handleQueryChange}
                    placeholder="Search by topic, keyword or author…"
                    aria-label="Search self-help resources"
                />
            </div>

            {/* Category filter */}
            <CategoryFilterChips active={category} onChange={handleCategoryChange} />

            {/* Results count */}
            {!isLoading && (
                <div className={styles.resultsBar} aria-live="polite" aria-atomic="true">
                    <span>
                        {resources.length === 0
                            ? 'No results found'
                            : `${resources.length} resource${resources.length !== 1 ? 's' : ''} found`}
                    </span>
                    {(query || category !== 'all') && (
                        <button
                            type="button"
                            onClick={() => { setQuery(''); setCategory('all'); load('', 'all'); }}
                            style={{ fontSize: '0.8125rem', color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                            <SlidersHorizontal size={13} aria-hidden="true" />
                            Clear filters
                        </button>
                    )}
                </div>
            )}

            {/* Grid */}
            <div className={styles.grid} aria-busy={isLoading} aria-label="Resource results">
                {isLoading ? (
                    Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
                ) : resources.length === 0 ? (
                    <div className={styles.empty}>
                        <Library size={48} className={styles.emptyIcon} aria-hidden="true" />
                        <p className={styles.emptyTitle}>No resources found</p>
                        <p className={styles.emptyText}>
                            Try a different search term or clear your filters.
                        </p>
                    </div>
                ) : (
                    resources.map(r => (
                        <ResourceCard
                            key={r.id}
                            resource={r}
                            onClick={() => navigate(`/library/${r.id}`)}
                        />
                    ))
                )}
            </div>
        </main>
    );
}
