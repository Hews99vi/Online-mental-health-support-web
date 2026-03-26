import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, AlertTriangle, RefreshCw } from 'lucide-react';
import { http } from '../../api/http';
import type { MoodEntry, MoodSummaryResponse } from '../mood/types';
import styles from '../mood/Mood.module.css';

interface ConsentResponse {
    data: {
        consent: {
            aiConsent: boolean;
        };
    };
}

async function fetchAiConsent(): Promise<boolean> {
    const response = await http.get<ConsentResponse>('/consent/me');
    return response.data.consent.aiConsent === true;
}

async function fetchMoodSummary(entries: MoodEntry[]): Promise<MoodSummaryResponse> {
    const lastDate = entries.length > 0
        ? new Date(entries[entries.length - 1].date + 'T00:00:00')
        : new Date();
    const dayOfWeek = lastDate.getDay();
    const monday = new Date(lastDate.getTime() - ((dayOfWeek === 0 ? 6 : dayOfWeek - 1) * 86400000));
    const weekStart = monday.toISOString().slice(0, 10);
    const safeEntries = entries.map((entry) => ({
        date: entry.date,
        moodScore: entry.moodScore,
        tags: entry.tags,
    }));
    const response = await http.post<{ data: MoodSummaryResponse }>('/ai/mood-summary', { weekStart, entries: safeEntries });
    return response.data;
}

function isValidMoodSummary(value: unknown): value is MoodSummaryResponse {
    if (!value || typeof value !== 'object') return false;
    const next = value as MoodSummaryResponse;
    return (
        typeof next.summaryText === 'string'
        && next.summaryText.trim().length > 0
        && Array.isArray(next.suggestions)
        && next.suggestions.every((item) => typeof item === 'string')
        && typeof next.disclaimer === 'string'
        && next.disclaimer.trim().length > 0
    );
}

interface Props {
    entries: MoodEntry[];
}

export function WeeklyInsightPanel({ entries }: Props) {
    const navigate = useNavigate();
    const [consented, setConsented] = useState<boolean | null>(null);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'empty' | 'error' | 'consent_required'>('idle');
    const [result, setResult] = useState<MoodSummaryResponse | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const allowed = await fetchAiConsent();
                setConsented(allowed);
            } catch {
                setConsented(false);
            }
        })();
    }, []);

    const generate = useCallback(async () => {
        setStatus('loading');
        setErrorMessage(null);
        try {
            const response = await fetchMoodSummary(entries);
            if (!isValidMoodSummary(response)) {
                setResult(null);
                setStatus('empty');
                return;
            }
            setResult(response);
            setStatus('success');
        } catch (err: unknown) {
            const apiError = err as { code?: string; message?: string };
            if (apiError.code === 'CONSENT_REQUIRED') {
                setConsented(false);
                setResult(null);
                setStatus('consent_required');
                return;
            }
            setResult(null);
            setStatus('error');
            setErrorMessage(apiError.message ?? 'Unable to generate insight right now.');
        }
    }, [entries]);

    if (consented === null) {
        return (
            <div className={styles.insightCard} aria-busy="true" aria-label="Loading AI consent">
                <div className={styles.insightHeader}>
                    <div className={styles.insightIconWrap}><Sparkles size={18} aria-hidden="true" /></div>
                    <div>
                        <h2 className={styles.insightTitle}>AI Weekly Insight</h2>
                        <p className={styles.insightSubtitle}>Checking your consent settings...</p>
                    </div>
                </div>
                {[90, 70, 80].map((w, i) => (
                    <div key={i} className={styles.skeleton} style={{ width: `${w}%` }} />
                ))}
            </div>
        );
    }

    if (!consented) {
        return (
            <div className={styles.insightCard}>
                <div className={styles.insightHeader}>
                    <div className={styles.insightIconWrap}><Sparkles size={18} aria-hidden="true" /></div>
                    <div>
                        <h2 className={styles.insightTitle}>AI Weekly Insight</h2>
                        <p className={styles.insightSubtitle}>Personalized patterns from your mood data</p>
                    </div>
                </div>
                <div className={styles.aiConsentGate}>
                    <Sparkles size={32} style={{ color: '#c4b5fd' }} aria-hidden="true" />
                    <p style={{ margin: 0, maxWidth: '320px' }}>
                        Enable <strong>AI Insights</strong> in Consent settings to receive weekly summaries.
                    </p>
                    <button type="button" className={styles.aiConsentBtn} onClick={() => navigate('/consent')}>
                        Open Consent Settings
                    </button>
                </div>
            </div>
        );
    }

    if (status === 'idle') {
        return (
            <div className={styles.insightCard}>
                <div className={styles.insightHeader}>
                    <div className={styles.insightIconWrap}><Sparkles size={18} aria-hidden="true" /></div>
                    <div>
                        <h2 className={styles.insightTitle}>AI Weekly Insight</h2>
                        <p className={styles.insightSubtitle}>Personalized patterns from your mood data</p>
                    </div>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                    Generate a summary of your mood patterns for the past week.
                </p>
                {entries.length === 0 && (
                    <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: 0 }}>
                        No recent mood entries available yet.
                    </p>
                )}
                <button
                    type="button"
                    className={styles.generateBtn}
                    disabled={entries.length === 0}
                    onClick={() => void generate()}
                >
                    <Sparkles size={14} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                    Generate Insight
                </button>
            </div>
        );
    }

    if (status === 'loading') {
        return (
            <div className={styles.insightCard} aria-busy="true" aria-label="Generating AI insight">
                <div className={styles.insightHeader}>
                    <div className={styles.insightIconWrap}><Sparkles size={18} aria-hidden="true" /></div>
                    <div>
                        <h2 className={styles.insightTitle}>Generating Insight...</h2>
                    </div>
                </div>
                {[90, 70, 80, 60].map((w, i) => (
                    <div key={i} className={styles.skeleton} style={{ width: `${w}%` }} />
                ))}
            </div>
        );
    }

    if (status === 'consent_required') {
        return (
            <div className={styles.insightCard}>
                <div className={styles.insightHeader}>
                    <div className={styles.insightIconWrap}><Sparkles size={18} aria-hidden="true" /></div>
                    <div>
                        <h2 className={styles.insightTitle}>AI Weekly Insight</h2>
                        <p className={styles.insightSubtitle}>Personalized patterns from your mood data</p>
                    </div>
                </div>
                <div className={styles.aiConsentGate}>
                    <AlertTriangle size={28} style={{ color: '#f59e0b' }} aria-hidden="true" />
                    <p style={{ margin: 0, maxWidth: '320px' }}>
                        AI insight consent is required before generating weekly summaries.
                    </p>
                    <button type="button" className={styles.aiConsentBtn} onClick={() => navigate('/consent')}>
                        Open Consent Settings
                    </button>
                </div>
            </div>
        );
    }

    if (status === 'empty') {
        return (
            <div className={styles.insightCard}>
                <div className={styles.insightHeader}>
                    <div className={styles.insightIconWrap}><Sparkles size={18} aria-hidden="true" /></div>
                    <div>
                        <h2 className={styles.insightTitle}>No Insight Available Yet</h2>
                        <p className={styles.insightSubtitle}>The AI service did not return insight content.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => void generate()}
                        title="Retry generation"
                        style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed', padding: '0.25rem', borderRadius: '50%' }}
                        aria-label="Retry insight generation"
                    >
                        <RefreshCw size={16} aria-hidden="true" />
                    </button>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                    Try again after adding more recent mood check-ins.
                </p>
                <button
                    type="button"
                    className={styles.generateBtn}
                    disabled={entries.length === 0}
                    onClick={() => void generate()}
                >
                    Retry
                </button>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className={styles.insightCard}>
                <div className={styles.insightHeader}>
                    <div className={styles.insightIconWrap}><Sparkles size={18} aria-hidden="true" /></div>
                    <div>
                        <h2 className={styles.insightTitle}>Unable to Generate Insight</h2>
                        <p className={styles.insightSubtitle}>Please try again in a moment.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => void generate()}
                        title="Retry generation"
                        style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed', padding: '0.25rem', borderRadius: '50%' }}
                        aria-label="Retry insight generation"
                    >
                        <RefreshCw size={16} aria-hidden="true" />
                    </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#92400e', background: '#fff7ed', borderRadius: '0.75rem', padding: '0.5rem 0.875rem' }}>
                    <AlertTriangle size={14} aria-hidden="true" />
                    {errorMessage ?? 'Unable to generate insight right now.'}
                </div>
                <button
                    type="button"
                    className={styles.generateBtn}
                    disabled={entries.length === 0}
                    onClick={() => void generate()}
                >
                    Retry
                </button>
            </div>
        );
    }

    const data = result;
    if (!data) {
        return null;
    }

    return (
        <div className={styles.insightCard}>
            <div className={styles.insightHeader}>
                <div className={styles.insightIconWrap}><Sparkles size={18} aria-hidden="true" /></div>
                <div>
                    <h2 className={styles.insightTitle}>Your Weekly Insight</h2>
                    <p className={styles.insightSubtitle}>Generated from your mood data</p>
                </div>
                <button
                    type="button"
                    onClick={() => void generate()}
                    title="Regenerate"
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed', padding: '0.25rem', borderRadius: '50%' }}
                    aria-label="Regenerate insight"
                >
                    <RefreshCw size={16} aria-hidden="true" />
                </button>
            </div>

            <p className={styles.insightBody}>{data.summaryText}</p>
            {data.suggestions.length > 0 && (
                <>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#5b21b6', margin: 0 }}>Suggestions</p>
                    <ul className={styles.insightSuggestions} aria-label="AI suggestions">
                        {data.suggestions.map((item, index) => (
                            <li key={index} className={styles.insightSuggestion}>
                                <span className={styles.suggDot} aria-hidden="true" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </>
            )}
            <p className={styles.insightDisclaimer} role="note">⚠️ {data.disclaimer}</p>
        </div>
    );
}
