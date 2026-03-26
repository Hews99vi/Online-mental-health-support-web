/**
 * types.ts — shared types for the Mood & Journal feature
 */

export type MoodScore = 1 | 2 | 3 | 4 | 5;

export const MOOD_LABELS: Record<MoodScore, string> = {
    1: 'Very Low', 2: 'Low', 3: 'Neutral', 4: 'Good', 5: 'Excellent',
};

export const MOOD_EMOJIS: Record<MoodScore, string> = {
    1: '😢', 2: '😟', 3: '😐', 4: '🙂', 5: '😄',
};

/** Colour stops for SVG chart and UI accents */
export const MOOD_COLORS: Record<MoodScore, string> = {
    1: '#ef4444', 2: '#f97316', 3: '#eab308', 4: '#22c55e', 5: '#7c3aed',
};

export const MOOD_TAGS = [
    'Anxious', 'Depressed', 'Hopeful', 'Grateful', 'Overwhelmed',
    'Calm', 'Irritable', 'Energised', 'Lonely', 'Connected', 'Tired',
    'Motivated', 'Stressed', 'Peaceful', 'Confused',
] as const;

export type MoodTag = (typeof MOOD_TAGS)[number];

export interface MoodEntry {
    id: string;
    date: string;              // YYYY-MM-DD
    moodScore: MoodScore;
    tags: MoodTag[];
    note?: string;
    createdAt: string;         // ISO-8601
}

export interface MoodEntriesPage {
    items: MoodEntry[];
}

export interface MoodEntriesResponse {
    data: MoodEntriesPage;
}

export interface MoodEntryCreateResponse {
    data: {
        entry: MoodEntry;
    };
}

// ── AI ─────────────────────────────────────────────────────────────────────────

export interface MoodSummaryResponse {
    summaryText: string;
    suggestions: string[];
    disclaimer: string;
}

// ── Biometric / Emotion ───────────────────────────────────────────────────────

export interface EmotionScore {
    label: string;
    confidence: number;   // 0–1
}

export interface EmotionDetectResponse {
    dominantEmotion: string;
    emotions: EmotionScore[];
    disclaimer: string;
}
