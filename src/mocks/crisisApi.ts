/**
 * Mock API stub for GET /api/crisis/resources
 * Replace with real http.get('/crisis/resources') when backend is ready.
 */

import type { CrisisResources } from '../types';

const CRISIS_DATA: CrisisResources = {
    hotlines: [
        {
            name: 'National Mental Health Helpline',
            number: '1926',
            available: '24/7',
            description: 'Sri Lanka\'s national crisis support line. Free, confidential counselling in Sinhala, Tamil, and English.',
            isSriLanka: true,
        },
        {
            name: 'Sumithrayo',
            number: '+94 11 2696666',
            available: '24/7',
            description: 'Befriending & emotional support for those in distress. Sri Lanka\'s longest-standing mental health helpline.',
            isSriLanka: true,
        },
        {
            name: 'CCCline (Child & Adolescent)',
            number: '1929',
            available: 'Mon–Fri 8am–8pm',
            description: 'Specialist support line for children and young people.',
            isSriLanka: true,
        },
        {
            name: 'IASP Crisis Centres (International)',
            number: 'iasp.info/resources/Crisis_Centres',
            available: 'Varies by country',
            description: 'International directory of crisis centres worldwide.',
            isSriLanka: false,
        },
    ],
    guidanceText: `You are not alone. Many people experience moments of overwhelming distress — this is a human experience, not a weakness.
    
Reaching out is one of the bravest things you can do. The people on these lines are trained, compassionate, and here specifically for you.

If you are in immediate physical danger, call your local emergency services (119 in Sri Lanka) or go to your nearest Emergency Room immediately.`,
};

/** Simulates GET /api/crisis/resources */
export async function mockGetCrisisResources(): Promise<CrisisResources> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return { ...CRISIS_DATA, hotlines: [...CRISIS_DATA.hotlines] };
}
