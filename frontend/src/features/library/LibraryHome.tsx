import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Library, SlidersHorizontal } from 'lucide-react';
import { http } from '../../api/http';
import { CategoryFilterChips } from './components/CategoryFilterChips';
import { ResourceCard } from './components/ResourceCard';
import type { ResourceItem, ResourceType, ResourcesPage } from './types';
import styles from './Library.module.css';

interface LibraryListResponse {
    data: ResourcesPage;
}

async function fetchResources(query: string, category: string): Promise<ResourceItem[]> {
    const qs = new URLSearchParams();
    if (query) qs.set('query', query);
    if (category && category !== 'all') qs.set('type', category);
    const data = await http.get<LibraryListResponse>(`/library?${qs.toString()}`);
    return data.data.items;
}

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

export function LibraryHome() {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState<ResourceType | 'all'>('all');
    const [resources, setResources] = useState<ResourceItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const load = useCallback(async (q: string, cat: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const items = await fetchResources(q, cat);
            setResources(items);
        } catch (err: unknown) {
            setResources([]);
            setError((err as { message?: string }).message ?? 'Failed to load library items.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void load('', 'all');
    }, [load]);

    const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            void load(val, category);
        }, 350);
    };

    const handleCategoryChange = (cat: ResourceType | 'all') => {
        setCategory(cat);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        void load(query, cat);
    };

    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    return (
        <main className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Self-Help Library</h1>
                <p className={styles.subtitle}>
                    Articles, videos, podcasts and exercises curated by our clinical team.
                </p>
            </div>

            <div className={styles.searchWrap}>
                <span className={styles.searchIcon} aria-hidden="true">
                    <Search size={18} />
                </span>
                <input
                    type="search"
                    className={styles.searchInput}
                    value={query}
                    onChange={handleQueryChange}
                    placeholder="Search by topic, keyword or author..."
                    aria-label="Search self-help resources"
                />
            </div>

            <CategoryFilterChips active={category} onChange={handleCategoryChange} />

            {error && (
                <div className={styles.resultsBar} aria-live="polite">
                    <span style={{ color: '#dc2626' }}>{error}</span>
                </div>
            )}

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
                            onClick={() => {
                                setQuery('');
                                setCategory('all');
                                void load('', 'all');
                            }}
                            style={{ fontSize: '0.8125rem', color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                            <SlidersHorizontal size={13} aria-hidden="true" />
                            Clear filters
                        </button>
                    )}
                </div>
            )}

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
                    resources.map((r) => (
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
