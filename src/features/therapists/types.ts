/**
 * types.ts — shared types for the Therapist feature
 */

export interface Therapist {
    id: string;
    name: string;
    title: string;               // e.g. "Licensed Clinical Psychologist"
    avatarUrl?: string;
    initials: string;
    bio: string;
    specialties: string[];
    languages: string[];
    sessionTypes: ('video' | 'audio' | 'chat')[];
    ratePerHour: number;         // in USD cents
    currency: string;
    verified: boolean;
    rating?: number;             // 0–5
    reviewCount?: number;
    yearsExperience?: number;
    education?: string[];
    certifications?: string[];
    nextAvailable?: string;      // ISO-8601 datetime string
}

export interface TherapistsPage {
    items: Therapist[];
    total: number;
}

export interface TherapistFilters {
    q: string;
    specialties: string[];
    language: string;
    verified: boolean;
}

export interface AvailabilitySlot {
    id: string;
    start: string;   // ISO-8601
    end: string;     // ISO-8601
    available: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const SPECIALTIES = [
    'Anxiety', 'Depression', 'Trauma & PTSD', 'Relationships', 'Grief',
    'Stress', 'CBT', 'DBT', 'Mindfulness', 'Addiction', 'Sleep', 'Self-esteem',
] as const;

export const LANGUAGES = [
    'English', 'Spanish', 'French', 'Arabic', 'Mandarin', 'Portuguese',
    'German', 'Hindi', 'Sinhala', 'Tamil',
] as const;
