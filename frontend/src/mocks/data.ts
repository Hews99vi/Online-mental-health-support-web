/**
 * src/mocks/data.ts
 * Seed data used by MSW handlers and DemoModeProvider.
 * All IDs and dates are deterministic so snapshot tests don't flicker.
 */

import type { User } from '../types';

// ── Users ─────────────────────────────────────────────────────────────────────

export const SEED_USERS: User[] = [
    { id: 'u-001', name: 'Alex Perera', email: 'alex@demo.local', role: 'user', createdAt: '2025-01-10T08:00:00Z' },
    { id: 'l-001', name: 'Jamie Silva', email: 'jamie@demo.local', role: 'listener', createdAt: '2025-01-11T09:00:00Z' },
    { id: 't-001', name: 'Dr. Nisha Fernando', email: 'nisha@demo.local', role: 'therapist', createdAt: '2025-01-12T10:00:00Z' },
    { id: 'a-001', name: 'Admin User', email: 'admin@demo.local', role: 'admin', createdAt: '2025-01-13T11:00:00Z' },
];

export const SEED_TOKEN = 'demo-msw-token-abc123';

// ── Therapists ────────────────────────────────────────────────────────────────

export interface SeedTherapist {
    id: string;
    name: string;
    title: string;
    bio: string;
    specialties: string[];
    languages: string[];
    rating: number;
    reviewCount: number;
    hourlyRate: number;
    experience: number;
    verified: boolean;
    sessionTypes: ('video' | 'audio' | 'text')[];
    nextAvailable?: string;
}

export const SEED_THERAPISTS: SeedTherapist[] = [
    {
        id: 'th-001',
        name: 'Dr. Nisha Fernando',
        title: 'Clinical Psychologist',
        bio: 'Specialising in anxiety, depression and trauma recovery with a compassionate CBT approach.',
        specialties: ['Anxiety', 'Depression', 'Trauma & PTSD'],
        languages: ['English', 'Sinhala'],
        rating: 4.9, reviewCount: 128, hourlyRate: 75,
        experience: 12, verified: true,
        sessionTypes: ['video', 'audio'],
        nextAvailable: new Date(Date.now() + 2 * 86400000).toISOString(),
    },
    {
        id: 'th-002',
        name: 'Marcus Chen, LMFT',
        title: 'Marriage & Family Therapist',
        bio: 'Helping individuals and couples navigate relationships, grief, and life transitions.',
        specialties: ['Relationships', 'Grief & Loss', 'Life Transitions'],
        languages: ['English', 'Mandarin'],
        rating: 4.7, reviewCount: 94, hourlyRate: 65,
        experience: 8, verified: true,
        sessionTypes: ['video', 'text'],
        nextAvailable: new Date(Date.now() + 86400000).toISOString(),
    },
    {
        id: 'th-003',
        name: 'Priya Kapoor, MSW',
        title: 'Licensed Social Worker',
        bio: 'Warm and strengths-based practitioner focusing on resilience and self-compassion.',
        specialties: ['Self-Esteem', 'Stress', 'Mindfulness'],
        languages: ['English', 'Hindi', 'Tamil'],
        rating: 4.8, reviewCount: 61, hourlyRate: 55,
        experience: 6, verified: false,
        sessionTypes: ['video', 'audio', 'text'],
        nextAvailable: new Date(Date.now() + 3 * 86400000).toISOString(),
    },
];

// ── Availability slots ────────────────────────────────────────────────────────

function slot(therapistId: string, daysFromNow: number, hour: number) {
    const d = new Date(Date.now() + daysFromNow * 86400000);
    d.setHours(hour, 0, 0, 0);
    const end = new Date(d.getTime() + 60 * 60000);
    return {
        id: `slot-${therapistId}-${daysFromNow}-${hour}`,
        therapistId,
        start: d.toISOString(),
        end: end.toISOString(),
        booked: false,
    };
}

export const SEED_SLOTS = SEED_THERAPISTS.flatMap(t =>
    [1, 2, 3].flatMap(d => [9, 11, 14, 16].map(h => slot(t.id, d, h)))
);

// ── Mood entries ──────────────────────────────────────────────────────────────

export interface SeedMoodEntry {
    id: string;
    userId: string;
    date: string;
    moodScore: 1 | 2 | 3 | 4 | 5;
    tags: string[];
    note?: string;
    createdAt: string;
}

const moodDay = (daysAgo: number, score: 1 | 2 | 3 | 4 | 5, note?: string): SeedMoodEntry => {
    const d = new Date(Date.now() - daysAgo * 86400000);
    return {
        id: `mood-${daysAgo}`,
        userId: 'u-001',
        date: d.toISOString().slice(0, 10),
        moodScore: score,
        tags: daysAgo % 3 === 0 ? ['Anxious'] : daysAgo % 3 === 1 ? ['Hopeful'] : ['Calm'],
        note,
        createdAt: d.toISOString(),
    };
};

export const SEED_MOOD_ENTRIES: SeedMoodEntry[] = [
    moodDay(13, 2, 'Tough start to the week.'),
    moodDay(11, 3),
    moodDay(9, 2, 'Deadline stress.'),
    moodDay(7, 3),
    moodDay(5, 4, 'Therapy helped a lot today.'),
    moodDay(3, 4),
    moodDay(1, 3, 'Tired but managing.'),
    moodDay(0, 4),
];

// ── Appointments ──────────────────────────────────────────────────────────────

const apptDate = (daysFromNow: number, hour = 10) => {
    const d = new Date(Date.now() + daysFromNow * 86400000);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
};

export const SEED_APPOINTMENTS = [
    {
        id: 'appt-001',
        userId: 'u-001',
        therapistId: 'th-001',
        therapistName: 'Dr. Nisha Fernando',
        therapistAvatar: null,
        start: apptDate(2),
        end: apptDate(2, 11),
        sessionType: 'video' as const,
        status: 'confirmed' as const,
        userNotes: 'Would like to discuss coping strategies.',
    },
    {
        id: 'appt-002',
        userId: 'u-001',
        therapistId: 'th-002',
        therapistName: 'Marcus Chen, LMFT',
        therapistAvatar: null,
        start: apptDate(-7),
        end: apptDate(-7, 11),
        sessionType: 'audio' as const,
        status: 'completed' as const,
        userNotes: undefined,
    },
];

// ── Library resources ─────────────────────────────────────────────────────────

export const SEED_RESOURCES = [
    {
        id: 'res-001',
        title: 'Understanding Anxiety',
        category: 'Anxiety',
        type: 'article',
        durationMinutes: 8,
        description: 'A practical guide to recognising and managing everyday anxiety.',
        thumbnailUrl: null,
        tags: ['anxiety', 'CBT', 'self-help'],
        publishedAt: '2025-03-01T00:00:00Z',
    },
    {
        id: 'res-002',
        title: '5-Minute Breathing Exercise',
        category: 'Mindfulness',
        type: 'exercise',
        durationMinutes: 5,
        description: 'Guided box-breathing technique to calm your nervous system instantly.',
        thumbnailUrl: null,
        tags: ['breathing', 'calm', 'stress'],
        publishedAt: '2025-03-15T00:00:00Z',
    },
    {
        id: 'res-003',
        title: 'Sleep Hygiene Basics',
        category: 'Sleep',
        type: 'article',
        durationMinutes: 6,
        description: 'Evidence-based habits for better sleep and reduced fatigue.',
        thumbnailUrl: null,
        tags: ['sleep', 'fatigue', 'routine'],
        publishedAt: '2025-04-01T00:00:00Z',
    },
];

// ── Crisis resources ──────────────────────────────────────────────────────────

export const SEED_CRISIS_RESOURCES = {
    emergencyHotline: {
        name: 'Sri Lanka National Mental Health Helpline',
        number: '1926',
        available: '24/7',
        description: 'Free, confidential support in Sinhala, Tamil, and English.',
        actionLabel: 'Call 1926 now',
    },
    supportText: 'You are not alone.\n\nMany people experience moments of overwhelming distress. Help is available right now.',
    localResources: [
        { name: 'National Mental Health Helpline', number: '1926', available: '24/7', description: 'Free, confidential support in Sinhala, Tamil, and English.', actionLabel: 'Call now' },
        { name: 'Sumithrayo', number: '+94 11 269 6666', available: '24/7', description: 'Befriending and emotional support.', actionLabel: 'Call Sumithrayo' },
        { name: 'Emergency Services', number: '119', available: '24/7', description: 'For immediate physical danger.', actionLabel: 'Call 119' },
    ],
    quickActionLabels: ['Call 1926', 'Reach out to someone you trust', 'Move to a safe place', 'Call 119 if in immediate danger'],
};

// ── AI mock responses ─────────────────────────────────────────────────────────

export const SEED_MOOD_SUMMARY = {
    summaryText: 'Your mood this week trended upward after a difficult start. You logged 4 entries averaging 3.5/5, with Hopeful and Calm being your most common feelings by the end of the week.',
    suggestions: [
        'Keep up the short walks — they appear to coincide with your higher-mood days.',
        'When you notice anxiety rising, try the 5-minute breathing exercise in the library.',
        'Consider journaling briefly before bed to process the day.',
    ],
    disclaimer: 'AI suggestions are for general wellness only and are NOT medical advice. If you are in crisis, please seek professional help immediately.',
};
