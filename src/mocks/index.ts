/**
 * src/mocks/index.ts
 * Stub mock data for development / testing.
 * Replace with real API calls as features are implemented.
 */

import type { User, Therapist, LibraryContent, ChatRoom } from '../types';

export const MOCK_USER: User = {
    id: 'u1',
    name: 'Alex Rivera',
    email: 'alex@example.com',
    role: 'user',
    createdAt: new Date().toISOString(),
};

export const MOCK_THERAPISTS: Therapist[] = [
    {
        id: 't1',
        userId: 'u100',
        name: 'Dr. Sarah Chen',
        specializations: ['Anxiety', 'Depression', 'CBT'],
        bio: 'Licensed clinical psychologist with 12 years of experience helping individuals manage anxiety and depression using evidence-based approaches.',
        licenseNumber: 'LCP-4892',
        yearsOfExperience: 12,
        status: 'approved',
        rating: 4.9,
        languages: ['English', 'Mandarin'],
        sessionTypes: ['online', 'phone'],
    },
    {
        id: 't2',
        userId: 'u101',
        name: 'Dr. James Osei',
        specializations: ['Grief', 'Trauma', 'Relationships'],
        bio: 'Compassionate therapist specialising in grief counselling and trauma recovery.',
        licenseNumber: 'LCP-3310',
        yearsOfExperience: 8,
        status: 'approved',
        rating: 4.7,
        languages: ['English', 'Twi'],
        sessionTypes: ['online'],
    },
];

export const MOCK_LIBRARY: LibraryContent[] = [
    {
        id: 'l1',
        title: 'Understanding Anxiety: A Beginner\'s Guide',
        description: 'Learn what anxiety is, its causes, and practical strategies to manage it daily.',
        type: 'article',
        category: 'anxiety',
        readTimeMinutes: 7,
        tags: ['anxiety', 'cbt', 'self-help'],
        publishedAt: '2026-01-15T10:00:00Z',
        isPublished: true,
    },
    {
        id: 'l2',
        title: '5-Minute Breathing Exercise',
        description: 'A guided breathing technique to calm the nervous system in minutes.',
        type: 'exercise',
        category: 'mindfulness',
        tags: ['mindfulness', 'breathing', 'stress'],
        publishedAt: '2026-01-20T10:00:00Z',
        isPublished: true,
    },
];

export const MOCK_CHAT_ROOMS: ChatRoom[] = [
    {
        id: 'r1',
        name: 'Anxiety Support',
        description: 'A safe space to share and talk about anxiety.',
        isAnonymous: true,
        participantCount: 14,
        createdAt: '2026-01-01T00:00:00Z',
    },
    {
        id: 'r2',
        name: 'Grief & Loss',
        description: 'Processing grief together in a supportive community.',
        isAnonymous: true,
        participantCount: 8,
        createdAt: '2026-01-01T00:00:00Z',
    },
];
