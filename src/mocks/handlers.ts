/**
 * src/mocks/handlers.ts
 *
 * MSW request handlers covering every API endpoint used by the frontend.
 * All handlers return realistic data from seed data so the entire app works
 * without a running backend.
 */

import { http, HttpResponse, delay } from 'msw';
import {
    SEED_USERS, SEED_TOKEN,
    SEED_THERAPISTS, SEED_SLOTS,
    SEED_MOOD_ENTRIES, SEED_APPOINTMENTS,
    SEED_RESOURCES, SEED_CRISIS_RESOURCES,
    SEED_MOOD_SUMMARY,
} from './data';

const BASE = '/api';

/** Simulated network delay (ms) — keeps demo snappy */
const LAG = 200;

// ── Helpers ────────────────────────────────────────────────────────────────────

function json<T>(body: T, status = 200) {
    return HttpResponse.json(body, { status });
}

// ── Auth ───────────────────────────────────────────────────────────────────────

const authHandlers = [
    http.post(`${BASE}/auth/login`, async ({ request }) => {
        await delay(LAG);
        const body = await request.json() as { email?: string };
        const u = SEED_USERS.find(u => u.email === body.email) ?? SEED_USERS[0];
        return json({ user: u, accessToken: SEED_TOKEN, refreshToken: `refresh-${SEED_TOKEN}` });
    }),

    http.post(`${BASE}/auth/register`, async ({ request }) => {
        await delay(LAG);
        const body = await request.json() as { name?: string; email?: string; role?: string };
        const newUser = {
            id: `u-${Date.now()}`,
            name: body.name ?? 'New User',
            email: body.email ?? 'new@demo.local',
            role: (body.role as 'user') ?? 'user',
            createdAt: new Date().toISOString(),
        };
        return json({ user: newUser, accessToken: SEED_TOKEN }, 201);
    }),

    http.get(`${BASE}/users/me`, async () => {
        await delay(LAG);
        return json({ user: SEED_USERS[0] });
    }),

    http.post(`${BASE}/auth/logout`, async () => {
        await delay(50);
        return json({ ok: true });
    }),

    http.post(`${BASE}/auth/forgot-password`, async () => {
        await delay(LAG);
        return json({ message: 'If an account exists, a reset link has been sent.' });
    }),
];

// ── Therapists ─────────────────────────────────────────────────────────────────

const therapistHandlers = [
    http.get(`${BASE}/therapists`, async ({ request }) => {
        await delay(LAG);
        const url = new URL(request.url);
        const q = url.searchParams.get('q')?.toLowerCase() ?? '';
        const spec = url.searchParams.get('specialty')?.toLowerCase() ?? '';
        const lang = url.searchParams.get('language')?.toLowerCase() ?? '';
        const verified = url.searchParams.get('verified');

        let results = [...SEED_THERAPISTS];
        if (q) results = results.filter(t => t.name.toLowerCase().includes(q) || t.bio.toLowerCase().includes(q));
        if (spec) results = results.filter(t => t.specialties.some(s => s.toLowerCase().includes(spec)));
        if (lang) results = results.filter(t => t.languages.some(l => l.toLowerCase().includes(lang)));
        if (verified === 'true') results = results.filter(t => t.verified);

        return json({ items: results, total: results.length });
    }),

    http.get(`${BASE}/therapists/:id`, async ({ params }) => {
        await delay(LAG);
        const t = SEED_THERAPISTS.find(t => t.id === params.id);
        if (!t) return json({ error: 'Not found' }, 404);
        return json(t);
    }),

    http.get(`${BASE}/therapists/:id/availability`, async ({ params }) => {
        await delay(LAG);
        const slots = SEED_SLOTS.filter(s => s.therapistId === params.id);
        return json({ slots });
    }),

    http.post(`${BASE}/therapists/apply`, async () => {
        await delay(LAG * 2);
        return json({ message: 'Application received. We will review within 5 business days.' }, 201);
    }),
];

// ── Appointments ───────────────────────────────────────────────────────────────

const appointmentHandlers = [
    http.post(`${BASE}/appointments`, async ({ request }) => {
        await delay(LAG);
        const body = await request.json() as { therapistId: string; slotId: string; userNotes?: string };
        const therapist = SEED_THERAPISTS.find(t => t.id === body.therapistId);
        const slot = SEED_SLOTS.find(s => s.id === body.slotId);
        const newAppt = {
            id: `appt-${Date.now()}`,
            userId: 'u-001',
            therapistId: body.therapistId,
            therapistName: therapist?.name ?? 'Unknown',
            therapistAvatar: null,
            start: slot?.start ?? new Date().toISOString(),
            end: slot?.end ?? new Date().toISOString(),
            sessionType: 'video',
            status: 'confirmed',
            userNotes: body.userNotes,
        };
        return json({ appointment: newAppt }, 201);
    }),

    http.get(`${BASE}/appointments`, async () => {
        await delay(LAG);
        return json({ items: SEED_APPOINTMENTS });
    }),

    http.get(`${BASE}/appointments/therapist`, async () => {
        await delay(LAG);
        const therapistView = SEED_APPOINTMENTS.map(a => ({
            ...a,
            clientId: `client-${a.userId.slice(-3)}`,   // anonymised
            userId: undefined,
        }));
        return json({ items: therapistView });
    }),

    http.get(`${BASE}/appointments/:id`, async ({ params }) => {
        await delay(LAG);
        const a = SEED_APPOINTMENTS.find(a => a.id === params.id);
        if (!a) return json({ error: 'Not found' }, 404);
        return json(a);
    }),

    http.get(`${BASE}/appointments/:id/join`, async ({ params }) => {
        await delay(LAG);
        const a = SEED_APPOINTMENTS.find(a => a.id === params.id);
        if (!a) return json({ error: 'Not found' }, 404);
        // In demo mode the session is always joinable 5 min ago
        return json({
            joinUrl: `https://meet.demo.local/room/${params.id}`,
            provider: 'demo',
            availableAt: new Date(Date.now() - 5 * 60000).toISOString(),
        });
    }),
];

// ── Mood entries ───────────────────────────────────────────────────────────────

const moodHandlers = [
    http.get(`${BASE}/mood/entries`, async ({ request }) => {
        await delay(LAG);
        const url = new URL(request.url);
        const from = url.searchParams.get('from') ?? '';
        const to = url.searchParams.get('to') ?? '';
        const items = SEED_MOOD_ENTRIES.filter(e =>
            (!from || e.date >= from) && (!to || e.date <= to)
        );
        return json({ items });
    }),

    http.post(`${BASE}/mood/entries`, async ({ request }) => {
        await delay(LAG);
        const body = await request.json() as object;
        const entry = { id: `mood-${Date.now()}`, userId: 'u-001', createdAt: new Date().toISOString(), ...body };
        return json({ entry }, 201);
    }),
];

// ── Library ────────────────────────────────────────────────────────────────────

const libraryHandlers = [
    http.get(`${BASE}/library/resources`, async ({ request }) => {
        await delay(LAG);
        const url = new URL(request.url);
        const q = url.searchParams.get('q')?.toLowerCase() ?? '';
        const cat = url.searchParams.get('category')?.toLowerCase() ?? '';
        let items = [...SEED_RESOURCES];
        if (q) items = items.filter(r => r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q));
        if (cat) items = items.filter(r => r.category.toLowerCase() === cat);
        return json({ items, total: items.length });
    }),

    http.get(`${BASE}/library/resources/:id`, async ({ params }) => {
        await delay(LAG);
        const r = SEED_RESOURCES.find(r => r.id === params.id);
        if (!r) return json({ error: 'Not found' }, 404);
        return json(r);
    }),
];

// ── AI endpoints ───────────────────────────────────────────────────────────────

const aiHandlers = [
    http.post(`${BASE}/ai/mood-summary`, async () => {
        await delay(LAG * 4);  // simulate a slower LLM call
        return json(SEED_MOOD_SUMMARY);
    }),

    http.post(`${BASE}/ai/emotion-detect`, async () => {
        await delay(LAG * 3);
        return json({
            dominantEmotion: 'Calm',
            emotions: [
                { label: 'Calm', confidence: 0.62 },
                { label: 'Neutral', confidence: 0.21 },
                { label: 'Happy', confidence: 0.12 },
                { label: 'Sad', confidence: 0.05 },
            ],
            disclaimer: 'AI emotion detection is experimental and NOT medical advice.',
        });
    }),
];

// ── Consent ────────────────────────────────────────────────────────────────────

const consentHandlers = [
    http.get(`${BASE}/consent`, async () => {
        await delay(50);
        return json({ prefs: { ai_insights: false, biometric_emotion: false, analytics: true } });
    }),

    http.post(`${BASE}/consent`, async ({ request }) => {
        await delay(50);
        const body = await request.json() as object;
        return json({ prefs: body });
    }),
];

// ── Crisis ─────────────────────────────────────────────────────────────────────

const crisisHandlers = [
    http.get(`${BASE}/crisis/resources`, async () => {
        await delay(50);
        return json(SEED_CRISIS_RESOURCES);
    }),
];

// ── Chat ───────────────────────────────────────────────────────────────────────

const chatHandlers = [
    http.get(`${BASE}/chat/rooms/:roomId/messages`, async () => {
        await delay(LAG);
        return json({ messages: [], nextCursor: undefined });
    }),
];

// ── Export all handlers ────────────────────────────────────────────────────────

export const handlers = [
    ...authHandlers,
    ...therapistHandlers,
    ...appointmentHandlers,
    ...moodHandlers,
    ...libraryHandlers,
    ...aiHandlers,
    ...consentHandlers,
    ...crisisHandlers,
    ...chatHandlers,
];
