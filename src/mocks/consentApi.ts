/**
 * Mock API stubs for GET/POST /api/consent
 * Replace with real http.get/http.post calls when backend is ready.
 */

import type { ConsentItem } from '../types';

const DEMO_CONSENTS: ConsentItem[] = [
    {
        id: 'terms',
        label: 'Terms of Service',
        description: 'You agree to use MindBridge only for personal well-being purposes and accept our terms of use.',
        required: true,
        enabled: true,
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'privacy',
        label: 'Privacy Policy',
        description: 'You consent to the processing of your personal data as described in our Privacy Policy.',
        required: true,
        enabled: true,
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'biometric',
        label: 'Biometric Data',
        description: 'Optional: allow mood pattern analysis using biometric input (heart-rate from wearables, if supported).',
        required: false,
        enabled: false,
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'ai',
        label: 'AI Personalisation',
        description: 'Allow Gemini AI to analyse your journal and mood history to generate personalised weekly insights.',
        required: false,
        enabled: true,
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'analytics',
        label: 'Anonymous Analytics',
        description: 'Help us improve the platform by sharing anonymised usage data. No personally identifiable information is shared.',
        required: false,
        enabled: true,
        updatedAt: new Date().toISOString(),
    },
];

// In-memory store for demo purposes
let _consents: ConsentItem[] = DEMO_CONSENTS.map((c) => ({ ...c }));

/** Simulates GET /api/consent */
export async function mockGetConsent(): Promise<{ items: ConsentItem[] }> {
    await delay(300);
    return { items: _consents.map((c) => ({ ...c })) };
}

/** Simulates POST /api/consent */
export async function mockUpdateConsent(
    updates: { id: string; enabled: boolean }[]
): Promise<{ items: ConsentItem[] }> {
    await delay(400);
    _consents = _consents.map((c) => {
        const update = updates.find((u) => u.id === c.id);
        if (!update) return c;
        return { ...c, enabled: update.enabled, updatedAt: new Date().toISOString() };
    });
    return { items: _consents.map((c) => ({ ...c })) };
}

function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
