import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, AlertTriangle, PlusCircle } from 'lucide-react';
import { http } from '../../api/http';
import { MoodHistoryChart } from './components/MoodHistoryChart';
import { WeeklyInsightPanel } from '../ai/WeeklyInsightPanel';
import type { MoodEntriesResponse, MoodEntry, MoodScore } from './types';
import { MOOD_EMOJIS, MOOD_LABELS, MOOD_COLORS } from './types';
import styles from './Mood.module.css';

async function fetchEntries(from: string, to: string): Promise<MoodEntry[]> {
    const query = new URLSearchParams({ from, to }).toString();
    const response = await http.get<MoodEntriesResponse>(`/mood/history?${query}`);
    return response.data.items;
}

function isoDate(date: Date) {
    return date.toISOString().slice(0, 10);
}

function rangeFor(period: '7d' | '30d' | '90d'): { from: string; to: string } {
    const to = new Date();
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const from = new Date(to.getTime() - days * 86400000);
    return { from: isoDate(from), to: isoDate(to) };
}

type Period = '7d' | '30d' | '90d';
const PERIOD_LABELS: Record<Period, string> = { '7d': '7 days', '30d': '30 days', '90d': '90 days' };

export function MoodHistoryPage() {
    const navigate = useNavigate();
    const [period, setPeriod] = useState<Period>('30d');
    const [entries, setEntries] = useState<MoodEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { from, to } = rangeFor(period);
            const data = await fetchEntries(from, to);
            setEntries(data);
        } catch (err: unknown) {
            setEntries([]);
            setError((err as { message?: string }).message ?? 'Failed to load mood history.');
        } finally {
            setIsLoading(false);
        }
    }, [period]);

    useEffect(() => {
        void load();
    }, [load]);

    const avg = entries.length > 0
        ? (entries.reduce((sum, entry) => sum + entry.moodScore, 0) / entries.length).toFixed(1)
        : null;
    const best = entries.reduce((max, entry) => entry.moodScore > max ? entry.moodScore : max, 0 as number) || null;
    const lowest = entries.reduce((min, entry) => entry.moodScore < min ? entry.moodScore : min, 6 as number);
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
                    New Check-In
                </button>
            </div>

            <div className={styles.dateRange}>
                <span className={styles.rangeLabel}>Show:</span>
                {(['7d', '30d', '90d'] as Period[]).map((value) => (
                    <button
                        key={value}
                        type="button"
                        className={styles.tagChip}
                        style={period === value ? { background: '#ede9fe', borderColor: '#7c3aed', color: '#6d28d9' } : undefined}
                        aria-pressed={period === value}
                        onClick={() => setPeriod(value)}
                    >
                        {PERIOD_LABELS[value]}
                    </button>
                ))}
            </div>

            {error && (
                <p role="alert" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: '#dc2626', background: '#fef2f2', borderRadius: '0.875rem', padding: '0.75rem 1rem', margin: 0 }}>
                    <AlertTriangle size={15} aria-hidden="true" /> {error}
                </p>
            )}

            {!isLoading && entries.length > 0 && (
                <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
                    {[
                        { label: 'Avg mood', value: `${avg} / 5` },
                        { label: 'Best', value: best ? `${MOOD_EMOJIS[best as MoodScore]} ${MOOD_LABELS[best as MoodScore]}` : '-' },
                        { label: 'Entries', value: String(entries.length) },
                        ...(lowestScore ? [{ label: 'Lowest', value: `${MOOD_EMOJIS[lowestScore]} ${MOOD_LABELS[lowestScore]}` }] : []),
                    ].map((stat) => (
                        <div key={stat.label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '1rem', padding: '0.875rem 1.125rem', display: 'flex', flexDirection: 'column', gap: '0.125rem', minWidth: '110px' }}>
                            <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 500 }}>{stat.label}</span>
                            <span style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#111827' }}>{stat.value}</span>
                        </div>
                    ))}
                </div>
            )}

            <div className={styles.card}>
                <h2 className={styles.sectionTitle}>Trend</h2>
                {isLoading ? (
                    <div aria-busy="true">
                        {[80, 60, 90].map((width, index) => <div key={index} className={styles.skeleton} style={{ width: `${width}%` }} />)}
                    </div>
                ) : entries.length === 0 ? (
                    <div className={styles.empty}>
                        <CalendarDays size={36} style={{ color: '#d1d5db' }} aria-hidden="true" />
                        <p className={styles.emptyTitle}>No entries yet</p>
                        <p className={styles.emptyText}>Complete your first check-in to see your mood history here.</p>
                    </div>
                ) : (
                    <div className={styles.chartWrap}>
                        <MoodHistoryChart entries={entries} height={180} />
                    </div>
                )}
            </div>

            <WeeklyInsightPanel entries={entries} />

            <div className={styles.card}>
                <h2 className={styles.sectionTitle}>Log</h2>
                {isLoading ? (
                    <div aria-busy="true">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
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
                        {[...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((entry) => (
                            <div key={entry.id} className={styles.entryCard}>
                                <span className={styles.entryEmoji} aria-hidden="true">{MOOD_EMOJIS[entry.moodScore]}</span>
                                <div className={styles.entryMeta}>
                                    <p className={styles.entryDate}>
                                        {new Date(`${entry.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                    <p className={styles.entryScore} style={{ color: MOOD_COLORS[entry.moodScore] }}>
                                        {MOOD_LABELS[entry.moodScore]} ({entry.moodScore}/5)
                                    </p>
                                    {entry.tags.length > 0 && (
                                        <div className={styles.tagRow} style={{ marginTop: '0.25rem' }}>
                                            {entry.tags.map((tag) => <span key={tag} className={styles.tagChip} style={{ pointerEvents: 'none' }}>{tag}</span>)}
                                        </div>
                                    )}
                                    {entry.note && <p className={styles.entryNote}>"{entry.note}"</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className={styles.crisisBanner}>
                <AlertTriangle size={15} aria-hidden="true" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                <span>
                    AI-generated insights are <strong>not medical advice</strong>.
                    If you&apos;re struggling, press <button type="button" className={styles.crisisLink} onClick={() => navigate('/crisis')}>Get Help</button> or contact a qualified professional.
                </span>
            </div>
        </main>
    );
}
