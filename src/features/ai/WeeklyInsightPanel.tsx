/**
 * WeeklyInsightPanel.tsx
 *
 * Security / privacy rules enforced here:
 *  1. AI is ONLY called through the backend proxy (/api/ai/mood-summary).
 *     No Gemini API key exists in the frontend.
 *  2. AI features are consent-gated: user must have accepted "ai_consent" in
 *     ConsentCenterPage. We check the flag in localStorage (set by ConsentCenterPage).
 *     The backend independently re-checks consent on every request.
 *  3. If the AI response is blocked / unavailable we show a safe fallback UI.
 *  4. A "not medical advice" disclaimer is always rendered when any AI content is shown.
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, AlertTriangle, RefreshCw } from 'lucide-react';
import { http } from '../../api/http';
import type { MoodEntry, MoodSummaryResponse } from '../mood/types';
import styles from '../mood/Mood.module.css';

// ── Consent gate ──────────────────────────────────────────────────────────────

/** Check if user has previously accepted AI consent.
 *  The authoritative source is the backend; this is a lightweight UX check only. */
function hasAiConsent(): boolean {
    try {
        const prefs = JSON.parse(localStorage.getItem('consent_prefs') ?? '{}') as Record<string, boolean>;
        return prefs['ai_insights'] === true;
    } catch { return false; }
}

function saveAiConsent() {
    try {
        const prefs = JSON.parse(localStorage.getItem('consent_prefs') ?? '{}') as Record<string, boolean>;
        prefs['ai_insights'] = true;
        localStorage.setItem('consent_prefs', JSON.stringify(prefs));
    } catch { /* ignore */ }
}

// ── API ────────────────────────────────────────────────────────────────────────

async function fetchMoodSummary(entries: MoodEntry[]): Promise<MoodSummaryResponse> {
    // Derive the week-start (Monday) of the most recent entry
    const lastDate = entries.length > 0
        ? new Date(entries[entries.length - 1].date + 'T00:00:00')
        : new Date();
    const dayOfWeek = lastDate.getDay();
    const monday = new Date(lastDate.getTime() - ((dayOfWeek === 0 ? 6 : dayOfWeek - 1) * 86400000));
    const weekStart = monday.toISOString().slice(0, 10);

    // Sends ONLY score + date + tags — never the raw journal note to protect privacy
    const safeEntries = entries.map(e => ({
        date: e.date,
        moodScore: e.moodScore,
        tags: e.tags,
    }));

    return http.post<MoodSummaryResponse>('/ai/mood-summary', { weekStart, entries: safeEntries });
}

// ── Fallback content (shown when AI is unavailable) ───────────────────────────

const FALLBACK: MoodSummaryResponse = {
    summaryText: 'AI insights are temporarily unavailable. This could be due to high server load or connectivity issues.',
    suggestions: [
        'Try a 5-minute breathing exercise to centre yourself.',
        'Reach out to someone you trust if you\'re feeling low.',
        'Review your mood trend below — small improvements matter.',
    ],
    disclaimer:
        'These are general wellness suggestions, not medical advice. If you are in distress, please seek crisis support immediately.',
};

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
    entries: MoodEntry[];
}

export function WeeklyInsightPanel({ entries }: Props) {
    const navigate = useNavigate();
    const [consented, setConsented] = useState(hasAiConsent());
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'fallback'>('idle');
    const [result, setResult] = useState<MoodSummaryResponse | null>(null);

    const generate = useCallback(async () => {
        setStatus('loading');
        try {
            const res = await fetchMoodSummary(entries);
            setResult(res);
            setStatus('success');
        } catch {
            // Graceful fallback — never crash, never show blank
            setResult(FALLBACK);
            setStatus('fallback');
        }
    }, [entries]);

    // ── Not consented ──────────────────────────────────────────────────────────

    if (!consented) {
        return (
            <div className={styles.insightCard}>
                <div className={styles.insightHeader}>
                    <div className={styles.insightIconWrap}><Sparkles size={18} aria-hidden="true" /></div>
                    <div>
                        <h2 className={styles.insightTitle}>AI Weekly Insight</h2>
                        <p className={styles.insightSubtitle}>Personalised patterns from your mood data</p>
                    </div>
                </div>
                <div className={styles.aiConsentGate}>
                    <Sparkles size={32} style={{ color: '#c4b5fd' }} aria-hidden="true" />
                    <p style={{ margin: 0, maxWidth: '320px' }}>
                        Enable <strong>AI Insights</strong> to receive weekly summaries and suggestions based on your mood data. Your notes are never sent to the AI.
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>
                        You can change this at any time in Privacy Settings.
                    </p>
                    <button
                        type="button"
                        className={styles.aiConsentBtn}
                        onClick={() => { saveAiConsent(); setConsented(true); }}
                    >
                        Enable AI Insights
                    </button>
                    <button
                        type="button"
                        style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '0.8125rem', cursor: 'pointer', fontFamily: 'inherit' }}
                        onClick={() => navigate('/consent')}
                    >
                        Manage Privacy Settings
                    </button>
                </div>
            </div>
        );
    }

    // ── Idle ───────────────────────────────────────────────────────────────────

    if (status === 'idle') {
        return (
            <div className={styles.insightCard}>
                <div className={styles.insightHeader}>
                    <div className={styles.insightIconWrap}><Sparkles size={18} aria-hidden="true" /></div>
                    <div>
                        <h2 className={styles.insightTitle}>AI Weekly Insight</h2>
                        <p className={styles.insightSubtitle}>Personalised patterns from your mood data</p>
                    </div>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                    Generate an AI summary of your mood patterns for the past week. Your journal notes are never shared.
                </p>
                <button
                    type="button"
                    className={styles.generateBtn}
                    disabled={entries.length === 0}
                    onClick={generate}
                >
                    <Sparkles size={14} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                    Generate Insight
                </button>
                {entries.length === 0 && (
                    <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>
                        Add at least one mood check-in to generate an insight.
                    </p>
                )}
            </div>
        );
    }

    // ── Loading ────────────────────────────────────────────────────────────────

    if (status === 'loading') {
        return (
            <div className={styles.insightCard} aria-busy="true" aria-label="Generating AI insight">
                <div className={styles.insightHeader}>
                    <div className={styles.insightIconWrap}><Sparkles size={18} aria-hidden="true" /></div>
                    <div>
                        <h2 className={styles.insightTitle}>Generating Insight…</h2>
                    </div>
                </div>
                {[90, 70, 80, 60].map((w, i) => (
                    <div key={i} className={styles.skeleton} style={{ width: `${w}%` }} />
                ))}
            </div>
        );
    }

    // ── Result (success or fallback) ───────────────────────────────────────────

    const data = result ?? FALLBACK;
    const isFallback = status === 'fallback';

    return (
        <div className={styles.insightCard}>
            <div className={styles.insightHeader}>
                <div className={styles.insightIconWrap}><Sparkles size={18} aria-hidden="true" /></div>
                <div>
                    <h2 className={styles.insightTitle}>
                        {isFallback ? 'AI Insight Unavailable' : 'Your Weekly Insight'}
                    </h2>
                    <p className={styles.insightSubtitle}>
                        {isFallback ? 'Showing general suggestions' : 'Generated from your mood data only'}
                    </p>
                </div>
                {/* Regenerate */}
                <button
                    type="button"
                    onClick={generate}
                    title="Regenerate"
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed', padding: '0.25rem', borderRadius: '50%' }}
                    aria-label="Regenerate insight"
                >
                    <RefreshCw size={16} aria-hidden="true" />
                </button>
            </div>

            {isFallback && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#92400e', background: '#fff7ed', borderRadius: '0.75rem', padding: '0.5rem 0.875rem' }}>
                    <AlertTriangle size={14} aria-hidden="true" />
                    AI is temporarily unavailable. Showing general suggestions.
                </div>
            )}

            <p className={styles.insightBody}>{data.summaryText}</p>

            {data.suggestions.length > 0 && (
                <>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#5b21b6', margin: 0 }}>Suggestions</p>
                    <ul className={styles.insightSuggestions} aria-label="AI suggestions">
                        {data.suggestions.map((s, i) => (
                            <li key={i} className={styles.insightSuggestion}>
                                <span className={styles.suggDot} aria-hidden="true" />
                                {s}
                            </li>
                        ))}
                    </ul>
                </>
            )}

            {/* Mandatory disclaimer — must be visible whenever AI content is shown */}
            <p className={styles.insightDisclaimer} role="note">
                ⚠️ {data.disclaimer || 'AI suggestions are for general wellness only and are NOT medical advice. If you are in crisis, please '}
                {!data.disclaimer && (
                    <button type="button" className={styles.crisisLink} style={{ color: '#9a3412' }} onClick={() => navigate('/crisis')}>
                        use Get Help
                    </button>
                )}
                {!data.disclaimer && ' immediately.'}
            </p>
        </div>
    );
}
