import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, AlertTriangle, PlusCircle } from 'lucide-react';
import { http } from '../../api/http';
import { MoodHistoryChart } from './components/MoodHistoryChart';
import { WeeklyInsightPanel } from '../ai/WeeklyInsightPanel';
import type { MoodEntry, MoodScore } from './types';
import { MOOD_EMOJIS, MOOD_LABELS, MOOD_COLORS, MOOD_TAGS } from './types';
import styles from './Mood.module.css';

// ── API ────────────────────────────────────────────────────────────────────────

function loadStubEntries(): MoodEntry[] {
    try {
        const raw = localStorage.getItem('mood_entries_stub');
        if (raw) return JSON.parse(raw) as MoodEntry[];
    } catch { /* ignore */ }
    // Built-in stubs so the chart is visible immediately
    const base = Date.now();
    const entry = (daysAgo: number, score: MoodScore, note?: string): MoodEntry => {
        const d = new Date(base - daysAgo * 86400000);
        return {
            id: `stub-${daysAgo}`,
            date: d.toISOString().slice(0, 10),
            moodScore: score,
            tags: [MOOD_TAGS[daysAgo % MOOD_TAGS.length]],
            note,
            createdAt: d.toISOString(),
        };
    };
    return [
        entry(13, 2, 'Feeling quite low today.'),
        entry(11, 3),
        entry(9, 2, 'Hard week at work.'),
        entry(7, 3, 'Slightly better.'),
        entry(5, 4, 'Good session with therapist.'),
        entry(3, 4),
        entry(1, 3, 'Tired but managing.'),
        entry(0, 4),
    ].sort((a, b) => a.date.localeCompare(b.date));
}

async function fetchEntries(from: string, to: string): Promise<MoodEntry[]> {
    try {
        const data = await http.get<{ items: MoodEntry[] }>(`/mood/entries?from=${from}&to=${to}`);
        return data.items;
    } catch {
        const stubs = loadStubEntries();
        return stubs.filter(e => e.date >= from && e.date <= to);
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isoDate(d: Date) { return d.toISOString().slice(0, 10); }

function rangeFor(period: '7d' | '30d' | '90d'): { from: string; to: string } {
    const to = new Date();
    const from = new Date(to.getTime() - (period === '7d' ? 7 : period === '30d' ? 30 : 90) * 86400000);
    return { from: isoDate(from), to: isoDate(to) };
}

// ── Component ─────────────────────────────────────────────────────────────────

type Period = '7d' | '30d' | '90d';
const PERIOD_LABELS: Record<Period, string> = { '7d': '7 days', '30d': '30 days', '90d': '90 days' };

export function MoodHistoryPage() {
    const navigate = useNavigate();
    const [period, setPeriod] = useState<Period>('30d');
    const [entries, setEntries] = useState<MoodEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const load = useCallback(async () => {
        setIsLoading(true);
        const { from, to } = rangeFor(period);
        const data = await fetchEntries(from, to);
        setEntries(data);
        setIsLoading(false);
    }, [period]);

    useEffect(() => { void load(); }, [load]);

    // Stats
    const avg = entries.length > 0
        ? (entries.reduce((s, e) => s + e.moodScore, 0) / entries.length).toFixed(1)
        : null;
    const best = entries.reduce((m, e) => e.moodScore > m ? e.moodScore : m, 0 as number) || null;
    const lowest = entries.reduce((m, e) => e.moodScore < m ? e.moodScore : m, 6 as number);
    const lowestScore: MoodScore | null = entries.length > 0 ? (lowest as MoodScore) : null;

    return (
        <main className={styles.page}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Mood History</h1>
                    <p className={styles.subtitle}>Your emotional wellbeing over time.</p>
                </div>
                <button
                    type="button"
                    className={styles.submitBtn}
                    onClick={() => navigate('/mood/checkin')}
                    style={{ padding: '0.625rem 1.125rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                >
                    <PlusCircle size={16} aria-hidden="true" />
                    Check In
                </button>
            </div>

            {/* Period selector */}
            <div className={styles.dateRange}>
                <span className={styles.rangeLabel}>Show:</span>
                {(['7d', '30d', '90d'] as Period[]).map(p => (
                    <button
                        key={p}
                        type="button"
                        className={styles.tagChip}
                        style={period === p ? { background: '#ede9fe', borderColor: '#7c3aed', color: '#6d28d9' } : undefined}
                        aria-pressed={period === p}
                        onClick={() => setPeriod(p)}
                    >
                        {PERIOD_LABELS[p]}
                    </button>
                ))}
            </div>

            {/* Stats row */}
            {!isLoading && entries.length > 0 && (
                <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
                    {[
                        { label: 'Avg mood', value: `${avg} / 5` },
                        { label: 'Best', value: best ? `${MOOD_EMOJIS[best as MoodScore]} ${MOOD_LABELS[best as MoodScore]}` : '—' },
                        { label: 'Entries', value: String(entries.length) },
                        ...(lowestScore ? [{ label: 'Lowest', value: `${MOOD_EMOJIS[lowestScore]} ${MOOD_LABELS[lowestScore]}` }] : []),
                    ].map(stat => (
                        <div key={stat.label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '1rem', padding: '0.875rem 1.125rem', display: 'flex', flexDirection: 'column', gap: '0.125rem', minWidth: '110px' }}>
                            <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 500 }}>{stat.label}</span>
                            <span style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#111827' }}>{stat.value}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Chart */}
            <div className={styles.card}>
                <h2 className={styles.sectionTitle}>Trend</h2>
                {isLoading ? (
                    <div aria-busy="true">
                        {[80, 60, 90].map((w, i) => <div key={i} className={styles.skeleton} style={{ width: `${w}%` }} />)}
                    </div>
                ) : entries.length === 0 ? (
                    <div className={styles.empty}>
                        <CalendarDays size={36} style={{ color: '#d1d5db' }} aria-hidden="true" />
                        <p className={styles.emptyTitle}>No entries yet</p>
                        <p className={styles.emptyText}>Complete your first check-in to see a trend.</p>
                    </div>
                ) : (
                    <div className={styles.chartWrap}>
                        <MoodHistoryChart entries={entries} height={180} />
                    </div>
                )}
            </div>

            {/* AI insight panel (consent-gated, inside the page) */}
            <WeeklyInsightPanel entries={entries} />

            {/* Entry list */}
            <div className={styles.card}>
                <h2 className={styles.sectionTitle}>Log</h2>
                {isLoading ? (
                    <div aria-busy="true">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: '#f3f4f6' }} />
                                <div style={{ flex: 1 }}>
                                    <div className={styles.skeleton} style={{ width: '40%' }} />
                                    <div className={styles.skeleton} style={{ width: '75%' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : entries.length === 0 ? null : (
                    <div className={styles.entryList} aria-label="Mood log entries">
                        {[...entries].sort((a, b) => b.date.localeCompare(a.date)).map(e => (
                            <div key={e.id} className={styles.entryCard}>
                                <span className={styles.entryEmoji} aria-hidden="true">{MOOD_EMOJIS[e.moodScore]}</span>
                                <div className={styles.entryMeta}>
                                    <p className={styles.entryDate}>
                                        {new Date(e.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                    <p className={styles.entryScore} style={{ color: MOOD_COLORS[e.moodScore] }}>
                                        {MOOD_LABELS[e.moodScore]} ({e.moodScore}/5)
                                    </p>
                                    {e.tags.length > 0 && (
                                        <div className={styles.tagRow} style={{ marginTop: '0.25rem' }}>
                                            {e.tags.map(t => <span key={t} className={styles.tagChip} style={{ pointerEvents: 'none' }}>{t}</span>)}
                                        </div>
                                    )}
                                    {e.note && <p className={styles.entryNote}>"{e.note}"</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Crisis banner */}
            <div className={styles.crisisBanner}>
                <AlertTriangle size={15} aria-hidden="true" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                <span>
                    AI-generated insights are <strong>not medical advice</strong>.
                    If you're struggling, press <button type="button" className={styles.crisisLink} onClick={() => navigate('/crisis')}>Get Help</button> or contact a qualified professional.
                </span>
            </div>
        </main>
    );
}
