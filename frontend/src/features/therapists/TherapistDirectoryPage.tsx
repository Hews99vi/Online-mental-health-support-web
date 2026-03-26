import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserX, ChevronDown, Check, ShieldCheck } from 'lucide-react';
import { http } from '../../api/http';
import { TherapistCard } from './components/TherapistCard';
import type { Therapist, TherapistFilters, TherapistsPage } from './types';
import { SPECIALTIES, LANGUAGES } from './types';
import styles from './Therapist.module.css';

async function fetchTherapists(filters: TherapistFilters): Promise<Therapist[]> {
    const qs = new URLSearchParams();
    if (filters.q) qs.set('q', filters.q);
    if (filters.specialties.length) qs.set('specialty', filters.specialties.join(','));
    if (filters.language) qs.set('language', filters.language);
    if (filters.verified) qs.set('verified', 'true');
    const data = await http.get<{ data: TherapistsPage }>(`/therapists?${qs.toString()}`);
    return data.data.items;
}

function SpecialtySelector({ selected, onChange }: {
    selected: string[];
    onChange: (v: string[]) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function outsideClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener('mousedown', outsideClick);
        return () => document.removeEventListener('mousedown', outsideClick);
    }, []);

    const toggle = (s: string) =>
        onChange(selected.includes(s) ? selected.filter((x) => x !== s) : [...selected, s]);

    const label = selected.length === 0 ? 'Specialty' : `${selected.length} selected`;

    return (
        <div className={styles.multiFilter} ref={ref}>
            <button
                type="button"
                className={`${styles.multiFilterBtn} ${selected.length > 0 ? styles.multiFilterBtnActive : ''}`}
                onClick={() => setOpen((o) => !o)}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                {label}
                <ChevronDown size={14} aria-hidden="true" />
            </button>
            {open && (
                <div className={styles.multiDropdown} role="listbox" aria-multiselectable="true" aria-label="Specialties">
                    {SPECIALTIES.map((s) => {
                        const active = selected.includes(s);
                        return (
                            <div
                                key={s}
                                className={`${styles.dropdownItem} ${active ? styles.dropdownItemActive : ''}`}
                                role="option"
                                aria-selected={active}
                                onClick={() => toggle(s)}
                                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggle(s)}
                                tabIndex={0}
                            >
                                {active && <Check size={13} className={styles.checkIcon} aria-hidden="true" />}
                                {s}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function SkeletonCard() {
    return (
        <div className={styles.skeletonCard} aria-hidden="true">
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div className={styles.skeletonAvatar} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div className={styles.skeletonLine} style={{ width: '60%' }} />
                    <div className={styles.skeletonLine} style={{ width: '80%' }} />
                </div>
            </div>
            <div className={styles.skeletonLine} style={{ width: '50%' }} />
            <div className={styles.skeletonLine} style={{ width: '90%' }} />
        </div>
    );
}

export function TherapistDirectoryPage() {
    const navigate = useNavigate();
    const [filters, setFilters] = useState<TherapistFilters>({ q: '', specialties: [], language: '', verified: true });
    const [results, setResults] = useState<Therapist[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const load = useCallback(async (f: TherapistFilters) => {
        setIsLoading(true);
        setError(null);
        try {
            const items = await fetchTherapists(f);
            const sorted = items.slice().sort((a, b) => {
                const aTs = a.nextAvailable ? new Date(a.nextAvailable).getTime() : Number.POSITIVE_INFINITY;
                const bTs = b.nextAvailable ? new Date(b.nextAvailable).getTime() : Number.POSITIVE_INFINITY;
                return aTs - bTs;
            });
            setResults(sorted);
        } catch (err: unknown) {
            setResults([]);
            setError((err as { message?: string }).message ?? 'Failed to load therapists.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void load(filters);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const applyFilters = (patch: Partial<TherapistFilters>) => {
        const next = { ...filters, ...patch };
        setFilters(next);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (patch.q !== undefined) {
            debounceRef.current = setTimeout(() => void load(next), 350);
        } else {
            void load(next);
        }
    };

    useEffect(
        () => () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        },
        []
    );

    return (
        <main className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Find a Therapist</h1>
                <p className={styles.subtitle}>All therapists are licensed professionals. Sessions are fully confidential.</p>
            </div>

            <div className={styles.searchRow}>
                <div className={styles.searchWrap}>
                    <span className={styles.searchIcon} aria-hidden="true">
                        <Search size={18} />
                    </span>
                    <input
                        type="search"
                        className={styles.searchInput}
                        value={filters.q}
                        onChange={(e) => applyFilters({ q: e.target.value })}
                        placeholder="Search by name, specialty, or keyword..."
                        aria-label="Search therapists"
                    />
                </div>
            </div>

            <div className={styles.filterBar}>
                <SpecialtySelector selected={filters.specialties} onChange={(specialties) => applyFilters({ specialties })} />

                <select
                    className={styles.filterSelect}
                    value={filters.language}
                    onChange={(e) => applyFilters({ language: e.target.value })}
                    aria-label="Filter by language"
                >
                    <option value="">Any Language</option>
                    {LANGUAGES.map((l) => (
                        <option key={l} value={l}>
                            {l}
                        </option>
                    ))}
                </select>

                <button
                    type="button"
                    className={`${styles.verifiedToggle} ${filters.verified ? styles.verifiedToggleOn : ''}`}
                    aria-pressed={filters.verified}
                    onClick={() => applyFilters({ verified: !filters.verified })}
                >
                    <ShieldCheck size={14} aria-hidden="true" />
                    Verified only
                </button>
            </div>

            {error && (
                <div className={styles.resultsBar} aria-live="polite">
                    <span style={{ color: '#dc2626' }}>{error}</span>
                </div>
            )}

            {!isLoading && (
                <div className={styles.resultsBar} aria-live="polite" aria-atomic="true">
                    <span>{results.length} therapist{results.length !== 1 ? 's' : ''} found</span>
                </div>
            )}

            <div className={styles.grid} aria-busy={isLoading} aria-label="Therapist results">
                {isLoading
                    ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
                    : results.length === 0
                      ? (
                          <div className={styles.empty}>
                              <UserX size={48} style={{ color: '#d1d5db' }} aria-hidden="true" />
                              <p className={styles.emptyTitle}>No therapists found</p>
                              <p className={styles.emptyText}>Try different filters or disable "Verified only".</p>
                          </div>
                        )
                      : results.map((t) => (
                          <TherapistCard key={t.id} therapist={t} onClick={() => navigate(`/therapists/${t.id}`)} />
                        ))}
            </div>
        </main>
    );
}
