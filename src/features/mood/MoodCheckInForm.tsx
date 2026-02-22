import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { http } from '../../api/http';
import type { MoodScore, MoodTag } from './types';
import { MOOD_LABELS, MOOD_EMOJIS, MOOD_COLORS, MOOD_TAGS } from './types';
import styles from './Mood.module.css';

// ── API ────────────────────────────────────────────────────────────────────────

interface SubmitPayload {
    date: string;
    moodScore: MoodScore;
    tags: MoodTag[];
    note?: string;
}

async function submitEntry(payload: SubmitPayload): Promise<void> {
    try {
        await http.post('/mood/entries', payload);
    } catch {
        // Stub: simulate persist for dev
        const key = 'mood_entries_stub';
        const id = crypto.randomUUID();
        const arr = JSON.parse(localStorage.getItem(key) ?? '[]') as object[];
        arr.push({ ...payload, id, createdAt: new Date().toISOString() });
        localStorage.setItem(key, JSON.stringify(arr));
    }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function MoodCheckInForm() {
    const navigate = useNavigate();

    // Today in local YYYY-MM-DD
    const today = new Date().toISOString().slice(0, 10);

    const [date, setDate] = useState(today);
    const [score, setScore] = useState<MoodScore | null>(null);
    const [tags, setTags] = useState<MoodTag[]>([]);
    const [note, setNote] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const toggleTag = (tag: MoodTag) =>
        setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (score === null) { setError('Please select a mood score.'); return; }
        setError(null);
        setIsLoading(true);
        try {
            await submitEntry({ date, moodScore: score, tags, note: note.trim() || undefined });
            setSuccess(true);
            // reset
            setScore(null); setTags([]); setNote(''); setDate(today);
            // auto-navigate after 2 s
            setTimeout(() => navigate('/mood/history'), 2000);
        } catch {
            setError('Failed to save check-in. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Daily Check-In</h1>
                <p className={styles.subtitle}>How are you feeling today? Take a moment to reflect.</p>
            </div>

            {success && (
                <div className={styles.successBanner} role="status" aria-live="polite">
                    <CheckCircle2 size={20} aria-hidden="true" />
                    Check-in saved! Redirecting to your history…
                </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
                {/* Date */}
                <div className={styles.card}>
                    <h2 className={styles.sectionTitle}>Date</h2>
                    <input
                        type="date"
                        className={styles.dateInput}
                        value={date}
                        max={today}
                        onChange={e => setDate(e.target.value)}
                        aria-label="Check-in date"
                    />
                </div>

                {/* Mood score */}
                <div className={styles.card} style={{ marginTop: '1rem' }}>
                    <h2 className={styles.sectionTitle}>How do you feel? <span aria-hidden="true">*</span></h2>
                    <div className={styles.moodRow} role="radiogroup" aria-label="Mood score" aria-required="true">
                        {([1, 2, 3, 4, 5] as MoodScore[]).map(s => {
                            const active = score === s;
                            const color = MOOD_COLORS[s];
                            return (
                                <button
                                    key={s}
                                    type="button"
                                    role="radio"
                                    aria-checked={active}
                                    aria-label={MOOD_LABELS[s]}
                                    className={`${styles.moodBtn} ${active ? styles.moodBtnActive : ''}`}
                                    style={active ? { borderColor: color, background: `${color}18` } : undefined}
                                    onClick={() => setScore(s)}
                                >
                                    <span className={styles.moodEmoji} aria-hidden="true">{MOOD_EMOJIS[s]}</span>
                                    <span className={styles.moodLabel}>{MOOD_LABELS[s]}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tags */}
                <div className={styles.card} style={{ marginTop: '1rem' }}>
                    <h2 className={styles.sectionTitle}>What's on your mind?</h2>
                    <div className={styles.tagRow} role="group" aria-label="Mood tags">
                        {MOOD_TAGS.map(tag => (
                            <button
                                key={tag}
                                type="button"
                                aria-pressed={tags.includes(tag)}
                                className={`${styles.tagChip} ${tags.includes(tag) ? styles.tagChipActive : ''}`}
                                onClick={() => toggleTag(tag)}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Note */}
                <div className={styles.card} style={{ marginTop: '1rem' }}>
                    <h2 className={styles.sectionTitle}>Journal note <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span></h2>
                    <label className="sr-only" htmlFor="mood-note">Journal note</label>
                    <textarea
                        id="mood-note"
                        className={styles.noteInput}
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        placeholder="What happened today? How did it make you feel?"
                        maxLength={1000}
                    />
                    <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0, textAlign: 'right' }}>
                        {note.length}/1000
                    </p>
                </div>

                {error && (
                    <p role="alert" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: '#dc2626', background: '#fef2f2', borderRadius: '0.875rem', padding: '0.75rem 1rem', margin: '1rem 0 0' }}>
                        <AlertTriangle size={15} aria-hidden="true" /> {error}
                    </p>
                )}

                {/* Crisis banner */}
                <div className={styles.crisisBanner} style={{ marginTop: '1rem' }}>
                    <AlertTriangle size={15} aria-hidden="true" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                    <span>
                        AI suggestions are <strong>not medical advice</strong>.
                        If you are in distress, please press <button type="button" className={styles.crisisLink} onClick={() => navigate('/crisis')}>Get Help</button> or call a crisis line immediately.
                    </span>
                </div>

                <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={isLoading || score === null}
                    style={{ marginTop: '1.25rem' }}
                >
                    {isLoading ? 'Saving…' : 'Save Check-In'}
                </button>
            </form>
        </main>
    );
}
