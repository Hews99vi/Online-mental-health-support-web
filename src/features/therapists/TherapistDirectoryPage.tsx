import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserX, ChevronDown, Check, ShieldCheck } from 'lucide-react';
import { http } from '../../api/http';
import { TherapistCard } from './components/TherapistCard';
import type { Therapist, TherapistFilters, TherapistsPage } from './types';
import { SPECIALTIES, LANGUAGES } from './types';
import styles from './Therapist.module.css';

// ── Stub data ─────────────────────────────────────────────────────────────────

const STUB_THERAPISTS: Therapist[] = [
    { id: 't1', name: 'Dr. Priya Sharma', initials: 'PS', title: 'Licensed Clinical Psychologist', bio: 'Specialising in anxiety, depression and trauma recovery. 12 years of clinical practice with evidence-based CBT and DBT approaches.', specialties: ['Anxiety', 'Depression', 'Trauma & PTSD', 'CBT'], languages: ['English', 'Hindi'], sessionTypes: ['video', 'audio'], ratePerHour: 8000, currency: 'USD', verified: true, rating: 4.9, reviewCount: 124, yearsExperience: 12, nextAvailable: new Date(Date.now() + 2 * 3600 * 1000).toISOString() },
    { id: 't2', name: 'Dr. Marcus Lee', initials: 'ML', title: 'Cognitive Behavioural Therapist', bio: 'Helping clients break negative thought patterns through structured CBT. Certified DBT practitioner with a focus on emotional regulation.', specialties: ['CBT', 'DBT', 'Stress', 'Self-esteem'], languages: ['English', 'Mandarin'], sessionTypes: ['video', 'chat'], ratePerHour: 7500, currency: 'USD', verified: true, rating: 4.8, reviewCount: 87, yearsExperience: 8, nextAvailable: new Date(Date.now() + 24 * 3600 * 1000).toISOString() },
    { id: 't3', name: 'Dr. Emma Wilson', initials: 'EW', title: 'Trauma & EMDR Specialist', bio: 'EMDR-certified therapist with advanced training in complex trauma, PTSD and dissociation. Creating a safe space for healing.', specialties: ['Trauma & PTSD', 'Grief', 'Relationships'], languages: ['English', 'French'], sessionTypes: ['video'], ratePerHour: 9000, currency: 'USD', verified: true, rating: 5.0, reviewCount: 56, yearsExperience: 15, nextAvailable: new Date(Date.now() + 48 * 3600 * 1000).toISOString() },
    { id: 't4', name: 'Dr. Amara Osei', initials: 'AO', title: 'Sleep & Anxiety Therapist', bio: 'Integrating CBT-I and mindfulness for insomnia and anxiety. Published researcher in sleep medicine.', specialties: ['Sleep', 'Anxiety', 'Mindfulness'], languages: ['English', 'French'], sessionTypes: ['video', 'audio'], ratePerHour: 7000, currency: 'USD', verified: true, rating: 4.7, reviewCount: 62, yearsExperience: 10, nextAvailable: new Date(Date.now() + 6 * 3600 * 1000).toISOString() },
    { id: 't5', name: 'Dr. Johan Voss', initials: 'JV', title: 'Depression & Grief Counsellor', bio: 'Warmth-centred approach to depression, loss and life transitions. ACT and compassion-focused therapy.', specialties: ['Depression', 'Grief', 'Addiction'], languages: ['English', 'German'], sessionTypes: ['video', 'audio', 'chat'], ratePerHour: 6500, currency: 'USD', verified: false, rating: 4.6, reviewCount: 41, yearsExperience: 7 },
    { id: 't6', name: 'Dr. Nalini Perera', initials: 'NP', title: 'Relationship & Family Therapist', bio: 'Specialising in couples counselling, communication patterns and attachment styles. Systemic and emotionally-focused therapy.', specialties: ['Relationships', 'Self-esteem', 'Stress'], languages: ['English', 'Sinhala', 'Tamil'], sessionTypes: ['video'], ratePerHour: 6000, currency: 'USD', verified: true, rating: 4.8, reviewCount: 98, yearsExperience: 9, nextAvailable: new Date(Date.now() + 72 * 3600 * 1000).toISOString() },
];

// ── API ────────────────────────────────────────────────────────────────────────

async function fetchTherapists(filters: TherapistFilters): Promise<Therapist[]> {
    try {
        const qs = new URLSearchParams();
        if (filters.q) qs.set('q', filters.q);
        if (filters.specialties.length) qs.set('specialty', filters.specialties.join(','));
        if (filters.language) qs.set('language', filters.language);
        if (filters.verified) qs.set('verified', 'true');
        const data = await http.get<TherapistsPage>(`/therapists?${qs.toString()}`);
        return data.items;
    } catch {
        let items = STUB_THERAPISTS;
        if (filters.verified) items = items.filter(t => t.verified);
        if (filters.specialties.length) items = items.filter(t => filters.specialties.some(s => t.specialties.includes(s)));
        if (filters.language) items = items.filter(t => t.languages.includes(filters.language));
        if (filters.q) {
            const q = filters.q.toLowerCase();
            items = items.filter(t => t.name.toLowerCase().includes(q) || t.bio.toLowerCase().includes(q) || t.specialties.some(s => s.toLowerCase().includes(q)));
        }
        return items;
    }
}

// ── Specialty multi-select ────────────────────────────────────────────────────

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
        onChange(selected.includes(s) ? selected.filter(x => x !== s) : [...selected, s]);

    const label = selected.length === 0 ? 'Specialty' : `${selected.length} selected`;

    return (
        <div className={styles.multiFilter} ref={ref}>
            <button
                type="button"
                className={`${styles.multiFilterBtn} ${selected.length > 0 ? styles.multiFilterBtnActive : ''}`}
                onClick={() => setOpen(o => !o)}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                {label}
                <ChevronDown size={14} aria-hidden="true" />
            </button>
            {open && (
                <div className={styles.multiDropdown} role="listbox" aria-multiselectable="true" aria-label="Specialties">
                    {SPECIALTIES.map(s => {
                        const active = selected.includes(s);
                        return (
                            <div
                                key={s}
                                className={`${styles.dropdownItem} ${active ? styles.dropdownItemActive : ''}`}
                                role="option"
                                aria-selected={active}
                                onClick={() => toggle(s)}
                                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && toggle(s)}
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

// ── Skeleton card ────────────────────────────────────────────────────────────

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

// ── Component ─────────────────────────────────────────────────────────────────

export function TherapistDirectoryPage() {
    const navigate = useNavigate();
    const [filters, setFilters] = useState<TherapistFilters>({ q: '', specialties: [], language: '', verified: true });
    const [results, setResults] = useState<Therapist[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const load = useCallback(async (f: TherapistFilters) => {
        setIsLoading(true);
        const items = await fetchTherapists(f);
        setResults(items);
        setIsLoading(false);
    }, []);

    useEffect(() => { load(filters); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const applyFilters = (patch: Partial<TherapistFilters>) => {
        const next = { ...filters, ...patch };
        setFilters(next);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (patch.q !== undefined) {
            debounceRef.current = setTimeout(() => load(next), 350);
        } else {
            load(next);
        }
    };

    useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

    return (
        <main className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Find a Therapist</h1>
                <p className={styles.subtitle}>All therapists are licensed professionals. Sessions are fully confidential.</p>
            </div>

            {/* Search */}
            <div className={styles.searchRow}>
                <div className={styles.searchWrap}>
                    <span className={styles.searchIcon} aria-hidden="true"><Search size={18} /></span>
                    <input
                        type="search"
                        className={styles.searchInput}
                        value={filters.q}
                        onChange={e => applyFilters({ q: e.target.value })}
                        placeholder="Search by name, specialty, or keyword…"
                        aria-label="Search therapists"
                    />
                </div>
            </div>

            {/* Filters */}
            <div className={styles.filterBar}>
                <SpecialtySelector
                    selected={filters.specialties}
                    onChange={specialties => applyFilters({ specialties })}
                />

                <select
                    className={styles.filterSelect}
                    value={filters.language}
                    onChange={e => applyFilters({ language: e.target.value })}
                    aria-label="Filter by language"
                >
                    <option value="">Any Language</option>
                    {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
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

            {/* Results count */}
            {!isLoading && (
                <div className={styles.resultsBar} aria-live="polite" aria-atomic="true">
                    <span>{results.length} therapist{results.length !== 1 ? 's' : ''} found</span>
                </div>
            )}

            {/* Grid */}
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
                        : results.map(t => (
                            <TherapistCard
                                key={t.id}
                                therapist={t}
                                onClick={() => navigate(`/therapists/${t.id}`)}
                            />
                        ))
                }
            </div>
        </main>
    );
}
