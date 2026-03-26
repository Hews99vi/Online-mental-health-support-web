/**
 * src/mocks/handlers.ts
 *
 * MSW request handlers covering every API endpoint used by the frontend.
 * All handlers return realistic data from seed data so the entire app works
 * without a running backend.
 */

import { http, HttpResponse, delay } from 'msw';
import type { JsonBodyType } from 'msw';
import {
    SEED_USERS, SEED_TOKEN,
    SEED_THERAPISTS, SEED_SLOTS,
    SEED_MOOD_ENTRIES, SEED_APPOINTMENTS,
    SEED_RESOURCES, SEED_CRISIS_RESOURCES,
    SEED_MOOD_SUMMARY,
} from './data';

const BASE = '/api';

const demoConsentState = {
    termsAccepted: true,
    privacyAccepted: true,
    biometricConsent: false,
    aiConsent: true,
    analyticsConsent: true,
    updatedAt: new Date().toISOString(),
};

const demoSlots = SEED_SLOTS.map((slot) => ({ ...slot }));

function findDemoSlot(slotId: string) {
    return demoSlots.find((slot) => slot.id === slotId);
}

function reserveDemoSlot(slotId: string) {
    const slot = findDemoSlot(slotId);
    if (!slot || slot.booked) return null;
    slot.booked = true;
    return slot;
}

function releaseDemoSlot(slotId: string) {
    const slot = findDemoSlot(slotId);
    if (!slot) return;
    slot.booked = false;
}

/** Simulated network delay (ms) — keeps demo snappy */
const LAG = 200;

// ── Helpers ────────────────────────────────────────────────────────────────────

function json(body: JsonBodyType, status = 200) {
    return HttpResponse.json(body, { status });
}

type TherapistReviewStatus = 'pending' | 'approved' | 'rejected';

interface TherapistAdminRequest {
    id: string;
    userId: string;
    name: string;
    email: string;
    username: string;
    title: string;
    licenseNo: string;
    licenseBody: string;
    specialization: string[];
    languages: string[];
    bio: string;
    yearsExperience: number;
    ratePerHour: number;
    currency: string;
    documents: Array<{
        name: string;
        mimeType: string;
        size: number;
        lastModified: number;
        source: 'metadata';
    }>;
    status: TherapistReviewStatus;
    submittedAt: string;
    approvedAt: string | null;
    rejectedAt: string | null;
    rejectedReason: string | null;
    reviewedBy: { id: string; email: string; username: string } | null;
}

const demoTherapistApplications: TherapistAdminRequest[] = [
    {
        id: 'tp-001',
        userId: 'u-001',
        name: 'Alex Perera',
        email: 'alex@demo.local',
        username: 'alex',
        title: 'Licensed Psychologist',
        licenseNo: 'LIC-2026-0021',
        licenseBody: 'HCPC',
        specialization: ['Anxiety', 'CBT'],
        languages: ['English'],
        bio: 'Focused on anxiety and stress management.',
        yearsExperience: 7,
        ratePerHour: 12000,
        currency: 'USD',
        documents: [{ name: 'license.pdf', mimeType: 'application/pdf', size: 120000, lastModified: Date.now(), source: 'metadata' }],
        status: 'pending',
        submittedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
        approvedAt: null,
        rejectedAt: null,
        rejectedReason: null,
        reviewedBy: null,
    },
    {
        id: 'tp-002',
        userId: 'l-001',
        name: 'Jamie Silva',
        email: 'jamie@demo.local',
        username: 'jamie',
        title: 'Trauma Therapist',
        licenseNo: 'LIC-2026-0013',
        licenseBody: 'BPS',
        specialization: ['Trauma'],
        languages: ['English', 'Tamil'],
        bio: 'Trauma-informed care and recovery planning.',
        yearsExperience: 5,
        ratePerHour: 9000,
        currency: 'USD',
        documents: [
            { name: 'license.pdf', mimeType: 'application/pdf', size: 120000, lastModified: Date.now(), source: 'metadata' },
            { name: 'references.pdf', mimeType: 'application/pdf', size: 90000, lastModified: Date.now(), source: 'metadata' }
        ],
        status: 'pending',
        submittedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        approvedAt: null,
        rejectedAt: null,
        rejectedReason: null,
        reviewedBy: null,
    },
];

// ── Auth ───────────────────────────────────────────────────────────────────────

const authHandlers = [
    http.post(`${BASE}/auth/login`, async ({ request }) => {
        await delay(LAG);
        const body = await request.json() as { email?: string };
        const u = SEED_USERS.find(u => u.email === body.email) ?? SEED_USERS[0];
        return json({
            ok: true,
            message: 'Login successful',
            data: {
                user: u,
                accessToken: SEED_TOKEN,
                refreshToken: `refresh-${SEED_TOKEN}`,
            },
        });
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
        return json({
            ok: true,
            message: 'Registration successful',
            data: {
                user: newUser,
                accessToken: SEED_TOKEN,
            },
        }, 201);
    }),

    http.get(`${BASE}/auth/me`, async () => {
        await delay(LAG);
        return json({
            ok: true,
            data: {
                user: SEED_USERS[0],
            },
        });
    }),

    http.get(`${BASE}/users/me`, async () => {
        await delay(LAG);
        return json({
            ok: true,
            data: {
                user: SEED_USERS[0],
            },
        });
    }),

    http.post(`${BASE}/auth/logout`, async () => {
        await delay(50);
        return json({ ok: true, message: 'Logout successful' });
    }),

    http.post(`${BASE}/auth/forgot-password`, async () => {
        await delay(LAG);
        return json(
            {
                ok: false,
                error: {
                    message: 'Password reset is not available in this MVP build yet.',
                    code: 'NOT_IMPLEMENTED',
                },
            },
            501
        );
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

        return json({ ok: true, data: { items: results, total: results.length } });
    }),

    http.get(`${BASE}/therapists/:id`, async ({ params }) => {
        await delay(LAG);
        const t = SEED_THERAPISTS.find(t => t.id === params.id);
        if (!t) return json({ ok: false, error: { message: 'Therapist not found', code: 'NOT_FOUND' } }, 404);
        return json({ ok: true, data: { therapist: t } });
    }),

    http.get(`${BASE}/therapists/:id/availability`, async ({ params }) => {
        await delay(LAG);
        const slots = demoSlots.filter(s => s.therapistId === params.id);
        const items = slots.map(slot => ({
            id: slot.id,
            start: slot.start,
            end: slot.end,
            available: !slot.booked,
        }));
        return json({ ok: true, data: { items } });
    }),

    http.post(`${BASE}/therapists/apply`, async ({ request }) => {
        await delay(LAG * 2);
        const body = await request.json() as {
            fullName?: string;
            title?: string;
            licenseNo?: string;
            licenseBody?: string;
            specialization?: string[];
            languages?: string[];
            bio?: string;
            yearsExperience?: number;
            ratePerHour?: number;
            currency?: string;
            documents?: Array<{
                name?: string;
                mimeType?: string;
                size?: number;
                lastModified?: number;
            }>;
        };
        const user = SEED_USERS[0];
        demoTherapistApplications.unshift({
            id: `tp-${Date.now()}`,
            userId: user.id,
            name: body.fullName?.trim() || user.name,
            email: user.email,
            username: user.name.toLowerCase().replace(/\s+/g, '.'),
            title: body.title?.trim() || 'Licensed Therapist',
            licenseNo: body.licenseNo?.trim() || 'LIC-NEW',
            licenseBody: body.licenseBody?.trim() || '',
            specialization: Array.isArray(body.specialization) ? body.specialization : [],
            languages: Array.isArray(body.languages) ? body.languages : ['English'],
            bio: body.bio?.trim() || '',
            yearsExperience: Number(body.yearsExperience) > 0 ? Number(body.yearsExperience) : 0,
            ratePerHour: Number(body.ratePerHour) > 0 ? Number(body.ratePerHour) : 0,
            currency: body.currency?.trim() || 'USD',
            documents: Array.isArray(body.documents)
                ? body.documents
                    .map((doc) => ({
                        name: String(doc?.name || '').trim(),
                        mimeType: String(doc?.mimeType || '').trim(),
                        size: Number(doc?.size) > 0 ? Number(doc?.size) : 0,
                        lastModified: Number(doc?.lastModified) > 0 ? Number(doc?.lastModified) : 0,
                        source: 'metadata' as const,
                    }))
                    .filter((doc) => doc.name.length > 0)
                : [],
            status: 'pending',
            submittedAt: new Date().toISOString(),
            approvedAt: null,
            rejectedAt: null,
            rejectedReason: null,
            reviewedBy: null,
        });
        return json({ ok: true, message: 'Application received. We will review within 5 business days.' }, 201);
    }),

    http.get(`${BASE}/therapist/availability`, async () => {
        await delay(LAG);
        const items = demoSlots.map(slot => ({
            id: slot.id,
            start: slot.start,
            end: slot.end,
            available: !slot.booked,
        }));
        return json({ ok: true, data: { items } });
    }),

    http.post(`${BASE}/therapist/availability`, async ({ request }) => {
        await delay(LAG);
        const body = await request.json() as { startTime: string; endTime: string };
        const newSlot = {
            id: `slot-${Date.now()}`,
            therapistId: 't-001',
            start: body.startTime,
            end: body.endTime,
            booked: false,
        };
        demoSlots.push(newSlot);
        return json({
            ok: true,
            message: 'Availability published',
            data: {
                items: [
                    {
                        id: newSlot.id,
                        start: newSlot.start,
                        end: newSlot.end,
                        available: true,
                    },
                ],
            },
        }, 201);
    }),

    http.get(`${BASE}/admin/therapists`, async ({ request }) => {
        await delay(LAG);
        const url = new URL(request.url);
        const status = url.searchParams.get('status') as TherapistReviewStatus | null;
        const items = demoTherapistApplications.filter((item) => {
            if (!status) return true;
            return item.status === status;
        });
        return json({ ok: true, data: { items, total: items.length } });
    }),

    http.post(`${BASE}/admin/therapists/:id/approve`, async ({ params }) => {
        await delay(LAG);
        const index = demoTherapistApplications.findIndex((item) => item.id === params.id);
        if (index === -1) return json({ ok: false, error: { message: 'Therapist profile not found', code: 'NOT_FOUND' } }, 404);
        const updated: TherapistAdminRequest = {
            ...demoTherapistApplications[index],
            status: 'approved',
            approvedAt: new Date().toISOString(),
            rejectedAt: null,
            rejectedReason: null,
            reviewedBy: { id: 'a-001', email: 'admin@demo.local', username: 'admin' },
        };
        demoTherapistApplications[index] = updated;
        return json({ ok: true, message: 'Therapist approved', data: { profile: updated } });
    }),

    http.post(`${BASE}/admin/therapists/:id/reject`, async ({ params, request }) => {
        await delay(LAG);
        const body = await request.json() as { reason?: string };
        const reason = body.reason?.trim();
        if (!reason) return json({ ok: false, error: { message: 'Rejection reason is required', code: 'VALIDATION_ERROR' } }, 400);
        const index = demoTherapistApplications.findIndex((item) => item.id === params.id);
        if (index === -1) return json({ ok: false, error: { message: 'Therapist profile not found', code: 'NOT_FOUND' } }, 404);
        const updated: TherapistAdminRequest = {
            ...demoTherapistApplications[index],
            status: 'rejected',
            rejectedAt: new Date().toISOString(),
            rejectedReason: reason,
            reviewedBy: { id: 'a-001', email: 'admin@demo.local', username: 'admin' },
        };
        demoTherapistApplications[index] = updated;
        return json({ ok: true, message: 'Therapist rejected', data: { profile: updated } });
    }),
];

// ── Appointments ───────────────────────────────────────────────────────────────

const demoAppointments: Array<Record<string, unknown>> = [...SEED_APPOINTMENTS];

type ReportStatus = 'open' | 'closed';

interface DemoReport {
    id: string;
    reporterUserId: string;
    reporter: {
        id: string;
        username: string;
        email: string;
    };
    targetType: string;
    targetId: string;
    reason: string;
    status: ReportStatus;
    createdAt: string;
}

const demoReports: DemoReport[] = [
    {
        id: 'rep-001',
        reporterUserId: 'u-001',
        reporter: { id: 'u-001', username: 'alex', email: 'alex@demo.local' },
        targetType: 'listener',
        targetId: 'listener-001',
        reason: 'Inappropriate personal comments during session',
        status: 'open',
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
        id: 'rep-002',
        reporterUserId: 'u-001',
        reporter: { id: 'u-001', username: 'alex', email: 'alex@demo.local' },
        targetType: 'therapist',
        targetId: 'th-002',
        reason: 'Shared unverified medical advice',
        status: 'open',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
];

function normalizeAppointment(value: Record<string, unknown>) {
    const therapistName = String(value.therapistName ?? 'Therapist');
    const initials = therapistName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('') || 'TH';

    return {
        ...value,
        therapistInitials: String(value.therapistInitials ?? initials),
        therapistAvatarUrl: value.therapistAvatarUrl ?? value.therapistAvatar ?? null,
        status: String(value.status ?? 'requested'),
    };
}

const appointmentHandlers = [
    http.post(`${BASE}/appointments`, async ({ request }) => {
        await delay(LAG);
        const body = await request.json() as { therapistId: string; slotId: string; userNotes?: string };
        const therapist = SEED_THERAPISTS.find(t => t.id === body.therapistId);
        const slot = reserveDemoSlot(body.slotId);
        if (!slot || slot.therapistId !== body.therapistId) {
            return json({ ok: false, error: { message: 'Selected slot is no longer available', code: 'CONFLICT' } }, 409);
        }
        const newAppt = {
            id: `appt-${Date.now()}`,
            userId: 'u-001',
            therapistId: body.therapistId,
            therapistName: therapist?.name ?? 'Unknown',
            therapistAvatarUrl: null,
            therapistInitials: therapist?.name?.split(' ').map(p => p[0]).slice(0, 2).join('') ?? 'TH',
            start: slot?.start ?? new Date().toISOString(),
            end: slot?.end ?? new Date().toISOString(),
            sessionType: 'video',
            status: 'requested',
            userNotes: body.userNotes,
        };
        demoAppointments.unshift(newAppt as Record<string, unknown>);
        return json({ ok: true, data: { appointment: newAppt } }, 201);
    }),

    http.get(`${BASE}/appointments/me`, async () => {
        await delay(LAG);
        return json({ ok: true, data: { items: demoAppointments.map(normalizeAppointment) } });
    }),

    http.get(`${BASE}/appointments`, async () => {
        await delay(LAG);
        return json({ ok: true, data: { items: demoAppointments.map(normalizeAppointment) } });
    }),

    http.get(`${BASE}/appointments/therapist`, async () => {
        await delay(LAG);
        return json({ ok: true, data: { items: demoAppointments.map(normalizeAppointment) } });
    }),

    http.post(`${BASE}/appointments/:id/confirm`, async ({ params }) => {
        await delay(LAG);
        const index = demoAppointments.findIndex(a => a.id === params.id);
        if (index === -1) return json({ ok: false, error: { message: 'Not found', code: 'NOT_FOUND' } }, 404);
        demoAppointments[index] = { ...demoAppointments[index], status: 'confirmed' };
        return json({ ok: true, data: { appointment: normalizeAppointment(demoAppointments[index]) } });
    }),

    http.post(`${BASE}/appointments/:id/cancel`, async ({ params }) => {
        await delay(LAG);
        const index = demoAppointments.findIndex(a => a.id === params.id);
        if (index === -1) return json({ ok: false, error: { message: 'Not found', code: 'NOT_FOUND' } }, 404);
        const slotId = String(demoAppointments[index].slotId ?? '');
        if (slotId) releaseDemoSlot(slotId);
        demoAppointments[index] = { ...demoAppointments[index], status: 'cancelled' };
        return json({ ok: true, data: { appointment: normalizeAppointment(demoAppointments[index]) } });
    }),

    http.post(`${BASE}/appointments/:id/reschedule`, async ({ params, request }) => {
        await delay(LAG);
        const body = await request.json() as { slotId?: string };
        const slotId = body.slotId?.trim();
        if (!slotId) {
            return json({ ok: false, error: { message: 'slotId is required', code: 'VALIDATION_ERROR' } }, 400);
        }
        const index = demoAppointments.findIndex(a => a.id === params.id);
        if (index === -1) return json({ ok: false, error: { message: 'Not found', code: 'NOT_FOUND' } }, 404);
        const slot = reserveDemoSlot(slotId);
        if (!slot) {
            return json({ ok: false, error: { message: 'Selected slot is no longer available', code: 'CONFLICT' } }, 409);
        }
        const currentSlotId = String(demoAppointments[index].slotId ?? '');
        if (currentSlotId) releaseDemoSlot(currentSlotId);
        demoAppointments[index] = {
            ...demoAppointments[index],
            slotId,
            start: slot.start,
            end: slot.end,
        };
        return json({ ok: true, data: { appointment: normalizeAppointment(demoAppointments[index]) } });
    }),

    http.get(`${BASE}/appointments/:id`, async ({ params }) => {
        await delay(LAG);
        const a = demoAppointments.find(a => a.id === params.id);
        if (!a) return json({ ok: false, error: { message: 'Not found', code: 'NOT_FOUND' } }, 404);
        return json({ ok: true, data: { appointment: normalizeAppointment(a) } });
    }),

    http.get(`${BASE}/appointments/:id/join`, async ({ params }) => {
        await delay(LAG);
        const a = demoAppointments.find(a => a.id === params.id);
        if (!a) return json({ ok: false, error: { message: 'Not found', code: 'NOT_FOUND' } }, 404);
        // In demo mode the session is always joinable 5 min ago
        return json({
            ok: true,
            data: {
                appointmentId: params.id,
                joinUrl: `https://meet.demo.local/room/${params.id}`,
                provider: 'custom',
                availableAt: new Date(Date.now() - 5 * 60000).toISOString(),
            },
        });
    }),
];

// ── Mood entries ───────────────────────────────────────────────────────────────

const moodHandlers = [
    http.get(`${BASE}/mood`, async ({ request }) => {
        await delay(LAG);
        const url = new URL(request.url);
        const from = url.searchParams.get('from') ?? '';
        const to = url.searchParams.get('to') ?? '';
        const items = SEED_MOOD_ENTRIES.filter(e =>
            (!from || e.date >= from) && (!to || e.date <= to)
        );
        return json({ ok: true, data: { items } });
    }),

    http.get(`${BASE}/mood/history`, async ({ request }) => {
        await delay(LAG);
        const url = new URL(request.url);
        const from = url.searchParams.get('from') ?? '';
        const to = url.searchParams.get('to') ?? '';
        const items = SEED_MOOD_ENTRIES.filter(e =>
            (!from || e.date >= from) && (!to || e.date <= to)
        );
        return json({ ok: true, data: { items } });
    }),

    http.post(`${BASE}/mood`, async ({ request }) => {
        await delay(LAG);
        const body = await request.json() as object;
        const entry = { id: `mood-${Date.now()}`, userId: 'u-001', createdAt: new Date().toISOString(), ...body };
        return json({ ok: true, message: 'Mood entry saved', data: { entry } }, 201);
    }),

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

const journalEntries = [
    {
        id: 'journal-6',
        userId: 'u-001',
        title: 'After therapy',
        content: 'Today felt lighter than last week. I noticed I was less reactive and more patient with myself.',
        createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    },
    {
        id: 'journal-3',
        userId: 'u-001',
        title: 'Midweek reset',
        content: 'I took a short walk, turned off notifications, and wrote this before bed. That helped me settle.',
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
        id: 'journal-1',
        userId: 'u-001',
        title: 'Quiet evening',
        content: 'No big breakthrough, but I stayed consistent and that matters.',
        createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
];

const journalHandlers = [
    http.get(`${BASE}/journal`, async () => {
        await delay(LAG);
        const items = [...journalEntries].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        return json({ ok: true, data: { items } });
    }),

    http.post(`${BASE}/journal`, async ({ request }) => {
        await delay(LAG);
        const body = await request.json() as { title?: string; content?: string };
        const entry = {
            id: `journal-${Date.now()}`,
            userId: 'u-001',
            title: body.title?.trim() ?? '',
            content: body.content?.trim() ?? '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        journalEntries.unshift(entry);
        return json({ ok: true, message: 'Journal entry created', data: { entry } }, 201);
    }),

    http.get(`${BASE}/journal/:id`, async ({ params }) => {
        await delay(LAG);
        const entry = journalEntries.find((item) => item.id === params.id);
        if (!entry) return json({ ok: false, error: { message: 'Journal entry not found', code: 'NOT_FOUND' } }, 404);
        return json({ ok: true, data: { entry } });
    }),

    http.put(`${BASE}/journal/:id`, async ({ params, request }) => {
        await delay(LAG);
        const body = await request.json() as { title?: string; content?: string };
        const index = journalEntries.findIndex((item) => item.id === params.id);
        if (index === -1) return json({ ok: false, error: { message: 'Journal entry not found', code: 'NOT_FOUND' } }, 404);

        journalEntries[index] = {
            ...journalEntries[index],
            title: body.title?.trim() ?? '',
            content: body.content?.trim() ?? '',
            updatedAt: new Date().toISOString(),
        };

        return json({ ok: true, message: 'Journal entry updated', data: { entry: journalEntries[index] } });
    }),

    http.delete(`${BASE}/journal/:id`, async ({ params }) => {
        await delay(LAG);
        const index = journalEntries.findIndex((item) => item.id === params.id);
        if (index === -1) return json({ ok: false, error: { message: 'Journal entry not found', code: 'NOT_FOUND' } }, 404);
        journalEntries.splice(index, 1);
        return json({ ok: true, message: 'Journal entry deleted' });
    }),
];

// ── Library ────────────────────────────────────────────────────────────────────

type LibraryStatus = 'draft' | 'published';

interface DemoLibraryItem {
    id: string;
    type: 'article' | 'podcast' | 'video' | 'exercise' | 'guide';
    title: string;
    excerpt?: string;
    body?: string;
    author: string;
    authorInitials?: string;
    category: string;
    readTimeMin?: number;
    publishedAt: string;
    thumbnailUrl?: string | null;
    tags?: string[];
    status: LibraryStatus;
}

function toLibraryItem(resource: (typeof SEED_RESOURCES)[number]): DemoLibraryItem {
    const author = 'Clinical Team';
    return {
        id: resource.id,
        type: resource.type === 'exercise' ? 'exercise' : 'article',
        title: resource.title,
        excerpt: resource.description,
        body: resource.description,
        author,
        authorInitials: 'CT',
        category: resource.category,
        readTimeMin: resource.durationMinutes,
        publishedAt: resource.publishedAt,
        thumbnailUrl: resource.thumbnailUrl,
        tags: resource.tags,
        status: 'published',
    };
}

const demoLibraryItems: DemoLibraryItem[] = SEED_RESOURCES.map(toLibraryItem);

const libraryHandlers = [
    http.get(`${BASE}/library`, async ({ request }) => {
        await delay(LAG);
        const url = new URL(request.url);
        const q = url.searchParams.get('query')?.toLowerCase() ?? '';
        const category = url.searchParams.get('category')?.toLowerCase() ?? '';
        const type = url.searchParams.get('type')?.toLowerCase() ?? '';
        const status = url.searchParams.get('status')?.toLowerCase() ?? '';
        const includeDraft = url.searchParams.get('includeDraft') === 'true';
        const filtered = demoLibraryItems.filter((item) => {
            if (!includeDraft && item.status !== 'published') return false;
            if (status && status !== 'all' && item.status.toLowerCase() !== status) return false;
            if (category && category !== 'all') {
                if (item.category.toLowerCase() !== category) return false;
            }
            if (type && type !== 'all') {
                if (item.type.toLowerCase() !== type) return false;
            }
            if (!q) return true;
            const haystack = `${item.title} ${item.excerpt ?? ''} ${item.body ?? ''} ${item.category} ${item.type} ${(item.tags ?? []).join(' ')}`.toLowerCase();
            return haystack.includes(q);
        });
        return json({ ok: true, data: { items: filtered, total: filtered.length } });
    }),

    http.get(`${BASE}/library/:id`, async ({ params }) => {
        await delay(LAG);
        const item = demoLibraryItems.find((entry) => entry.id === params.id);
        if (!item) {
            return json({ ok: false, error: { message: 'Library item not found', code: 'NOT_FOUND' } }, 404);
        }
        return json({ ok: true, data: { item } });
    }),

    http.post(`${BASE}/admin/library`, async ({ request }) => {
        await delay(LAG);
        const body = await request.json() as {
            type?: DemoLibraryItem['type'];
            title?: string;
            category?: string;
            content?: string;
            status?: LibraryStatus;
            tags?: string[];
        };
        const title = body.title?.trim() ?? '';
        const category = body.category?.trim() ?? '';
        const content = body.content?.trim() ?? '';
        if (!title || !category || !content) {
            return json({ ok: false, error: { message: 'title, category and content are required', code: 'VALIDATION_ERROR' } }, 400);
        }
        const item: DemoLibraryItem = {
            id: `lib-${Date.now()}`,
            type: body.type && ['article', 'podcast', 'video', 'exercise', 'guide'].includes(body.type) ? body.type : 'article',
            title,
            excerpt: content.slice(0, 180),
            body: content,
            author: 'Admin User',
            authorInitials: 'AU',
            category,
            readTimeMin: Math.max(1, Math.ceil(content.split(/\s+/).filter(Boolean).length / 180)),
            publishedAt: new Date().toISOString(),
            tags: Array.isArray(body.tags) ? body.tags : [],
            status: body.status === 'published' ? 'published' : 'draft',
        };
        demoLibraryItems.unshift(item);
        return json({ ok: true, message: 'Library item created', data: { item } }, 201);
    }),

    http.put(`${BASE}/admin/library/:id`, async ({ params, request }) => {
        await delay(LAG);
        const body = await request.json() as {
            type?: DemoLibraryItem['type'];
            title?: string;
            category?: string;
            content?: string;
            status?: LibraryStatus;
            tags?: string[];
        };
        const index = demoLibraryItems.findIndex((entry) => entry.id === params.id);
        if (index === -1) {
            return json({ ok: false, error: { message: 'Library item not found', code: 'NOT_FOUND' } }, 404);
        }
        const current = demoLibraryItems[index];
        const content = body.content?.trim();
        demoLibraryItems[index] = {
            ...current,
            type: body.type && ['article', 'podcast', 'video', 'exercise', 'guide'].includes(body.type) ? body.type : current.type,
            title: body.title?.trim() || current.title,
            category: body.category?.trim() || current.category,
            body: content ?? current.body,
            excerpt: content ? content.slice(0, 180) : current.excerpt,
            tags: Array.isArray(body.tags) ? body.tags : current.tags,
            status: body.status === 'published' || body.status === 'draft' ? body.status : current.status,
            publishedAt: new Date().toISOString(),
        };
        return json({ ok: true, message: 'Library item updated', data: { item: demoLibraryItems[index] } });
    }),

    http.delete(`${BASE}/admin/library/:id`, async ({ params }) => {
        await delay(LAG);
        const index = demoLibraryItems.findIndex((entry) => entry.id === params.id);
        if (index === -1) {
            return json({ ok: false, error: { message: 'Library item not found', code: 'NOT_FOUND' } }, 404);
        }
        demoLibraryItems.splice(index, 1);
        return json({ ok: true, message: 'Library item deleted' });
    }),
];

// ── AI endpoints ───────────────────────────────────────────────────────────────

const reportHandlers = [
    http.post(`${BASE}/reports`, async ({ request }) => {
        await delay(LAG);
        const body = await request.json() as { targetType?: string; targetId?: string; reason?: string };
        const targetType = body.targetType?.trim();
        const targetId = body.targetId?.trim();
        const reason = body.reason?.trim();
        if (!targetType || !targetId || !reason) {
            return json({ ok: false, error: { message: 'targetType, targetId and reason are required', code: 'VALIDATION_ERROR' } }, 400);
        }
        const reporter = { id: 'u-001', username: 'alex', email: 'alex@demo.local' };
        const report: DemoReport = {
            id: `rep-${Date.now()}`,
            reporterUserId: reporter.id,
            reporter,
            targetType,
            targetId,
            reason,
            status: 'open',
            createdAt: new Date().toISOString(),
        };
        demoReports.unshift(report);
        return json({ ok: true, message: 'Report submitted', data: { report } }, 201);
    }),

    http.get(`${BASE}/admin/reports`, async ({ request }) => {
        await delay(LAG);
        const url = new URL(request.url);
        const status = url.searchParams.get('status') as ReportStatus | null;
        if (status && !['open', 'closed'].includes(status)) {
            return json({ ok: false, error: { message: 'Invalid status filter', code: 'VALIDATION_ERROR' } }, 400);
        }
        const items = status ? demoReports.filter((item) => item.status === status) : demoReports;
        return json({ ok: true, data: { items, total: items.length } });
    }),

    http.post(`${BASE}/admin/reports/:id/close`, async ({ params }) => {
        await delay(LAG);
        const index = demoReports.findIndex((item) => item.id === params.id);
        if (index === -1) {
            return json({ ok: false, error: { message: 'Report not found', code: 'NOT_FOUND' } }, 404);
        }
        demoReports[index] = { ...demoReports[index], status: 'closed' };
        return json({ ok: true, message: 'Report closed', data: { report: demoReports[index] } });
    }),

    http.get(`${BASE}/admin/analytics`, async () => {
        await delay(LAG);
        const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const bookingsTotal = demoAppointments.length;
        const cancelledBookings = demoAppointments.filter((item) => String(item.status ?? '') === 'cancelled').length;
        const openReports = demoReports.filter((item) => item.status === 'open').length;
        const approvedTherapists = SEED_THERAPISTS.filter((item) => item.verified).length;
        const pendingTherapists = demoTherapistApplications.filter((item) => item.status === 'pending').length;
        return json({
            ok: true,
            data: {
                totalUsers: SEED_USERS.length,
                approvedTherapists,
                pendingTherapistApplications: pendingTherapists,
                approvedListeners: 0,
                bookingsCount: bookingsTotal,
                totalBookings: bookingsTotal,
                cancelledBookings,
                moodEntriesCount: SEED_MOOD_ENTRIES.length,
                totalMoodEntries: SEED_MOOD_ENTRIES.length,
                openReports,
                libraryItems: demoLibraryItems.filter((item) => item.status === 'published').length,
                libraryItemCount: demoLibraryItems.length,
                trends: {
                    labels,
                    newUsers: [2, 1, 3, 2, 4, 1, 2],
                    bookings: [1, 2, 2, 1, 3, 1, 0],
                    cancelledBookings: [0, 0, 1, 0, 1, 0, 0],
                    moodEntries: [3, 2, 4, 3, 5, 2, 3],
                    reportsOpened: [0, 1, 0, 1, 0, 0, 0],
                },
                grouped: {
                    libraryByType: ['article', 'podcast', 'video', 'exercise', 'guide'].map((type) => ({
                        type,
                        count: demoLibraryItems.filter((item) => item.type === type).length,
                    })),
                    therapistApplicationsByStatus: ['pending', 'approved', 'rejected'].map((status) => ({
                        status,
                        count: demoTherapistApplications.filter((item) => item.status === status).length,
                    })),
                },
            },
        });
    }),
];

const aiHandlers = [
    http.post(`${BASE}/ai/mood-summary`, async () => {
        await delay(LAG * 4);  // simulate a slower LLM call
        if (!demoConsentState.aiConsent) {
            return json({
                ok: false,
                error: {
                    message: 'AI consent required for mood summaries',
                    code: 'CONSENT_REQUIRED',
                    details: { requiredConsent: 'aiConsent' },
                },
            }, 403);
        }
        return json(SEED_MOOD_SUMMARY);
    }),

    http.post(`${BASE}/ai/emotion-detect`, async () => {
        await delay(LAG * 3);
        if (!demoConsentState.biometricConsent) {
            return json({
                ok: false,
                error: {
                    message: 'Biometric consent required for emotion detection',
                    code: 'CONSENT_REQUIRED',
                    details: { requiredConsent: 'biometricConsent' },
                },
            }, 403);
        }
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
    http.get(`${BASE}/consent/me`, async () => {
        await delay(50);
        return json({
            ok: true,
            data: {
                consent: demoConsentState,
            },
        });
    }),

    http.put(`${BASE}/consent/me`, async ({ request }) => {
        await delay(50);
        const body = await request.json() as Record<string, boolean>;
        demoConsentState.termsAccepted = body.termsAccepted ?? demoConsentState.termsAccepted;
        demoConsentState.privacyAccepted = body.privacyAccepted ?? demoConsentState.privacyAccepted;
        demoConsentState.biometricConsent = body.biometricConsent ?? demoConsentState.biometricConsent;
        demoConsentState.aiConsent = body.aiConsent ?? demoConsentState.aiConsent;
        demoConsentState.analyticsConsent = body.analyticsConsent ?? demoConsentState.analyticsConsent;
        demoConsentState.updatedAt = new Date().toISOString();
        return json({
            ok: true,
            message: 'Consent preferences updated',
            data: {
                consent: demoConsentState,
            },
        });
    }),
];

// ── Crisis ─────────────────────────────────────────────────────────────────────

const crisisHandlers = [
    http.get(`${BASE}/crisis/resources`, async () => {
        await delay(50);
        return json({
            ok: true,
            data: {
                resources: SEED_CRISIS_RESOURCES,
            },
        });
    }),
];

// ── Chat ───────────────────────────────────────────────────────────────────────

type DemoChatStatus = 'queued' | 'active' | 'closed';

interface DemoChatSession {
    id: string;
    status: DemoChatStatus;
    userId: string | null;
    listenerId: string | null;
    createdAt: string;
    closedAt: string | null;
}

interface DemoChatMessage {
    id: string;
    sessionId: string;
    senderRole: 'user' | 'listener';
    text: string;
    createdAt: string;
}

const demoChatSessions: DemoChatSession[] = [];
const demoChatMessages: DemoChatMessage[] = [];

function isListenerUserId(userId: string) {
    const user = SEED_USERS.find((entry) => entry.id === userId);
    return user?.role === 'listener';
}

const chatHandlers = [
    http.post(`${BASE}/chat/queue`, async ({ request }) => {
        await delay(LAG);
        const body = await request.json() as { role?: 'user' | 'listener' };
        const role = body.role ?? 'user';
        const currentUserId = role === 'listener' ? 'l-001' : 'u-001';

        if (role === 'listener') {
            if (!isListenerUserId(currentUserId)) {
                return json({ ok: false, error: { message: 'Only listeners can assign queued chats', code: 'FORBIDDEN' } }, 403);
            }
            const queued = demoChatSessions.find((session) => session.status === 'queued' && !session.listenerId);
            if (!queued) {
                return json({ ok: false, error: { message: 'No queued chat sessions available', code: 'NOT_FOUND' } }, 404);
            }
            queued.listenerId = currentUserId;
            queued.status = 'active';
            return json({ ok: true, message: 'Chat session assigned', data: { session: queued } });
        }

        const session: DemoChatSession = {
            id: `chat-${Date.now()}`,
            status: 'queued',
            userId: currentUserId,
            listenerId: null,
            createdAt: new Date().toISOString(),
            closedAt: null,
        };
        demoChatSessions.unshift(session);
        return json({ ok: true, message: 'Chat session queued', data: { session } }, 201);
    }),

    http.post(`${BASE}/chat/:sessionId/assign`, async ({ params }) => {
        await delay(LAG);
        const session = demoChatSessions.find((entry) => entry.id === params.sessionId);
        if (!session) {
            return json({ ok: false, error: { message: 'Session not found', code: 'NOT_FOUND' } }, 404);
        }
        session.listenerId = 'l-001';
        session.status = 'active';
        return json({ ok: true, message: 'Chat session assigned', data: { session } });
    }),

    http.get(`${BASE}/chat/:sessionId/messages`, async ({ params }) => {
        await delay(LAG);
        const session = demoChatSessions.find((entry) => entry.id === params.sessionId);
        if (!session) {
            return json({ ok: false, error: { message: 'Session not found', code: 'NOT_FOUND' } }, 404);
        }
        const items = demoChatMessages.filter((message) => message.sessionId === session.id);
        return json({ ok: true, data: { session, items } });
    }),

    http.post(`${BASE}/chat/:sessionId/messages`, async ({ params, request }) => {
        await delay(LAG);
        const session = demoChatSessions.find((entry) => entry.id === params.sessionId);
        if (!session) {
            return json({ ok: false, error: { message: 'Session not found', code: 'NOT_FOUND' } }, 404);
        }
        if (session.status === 'closed') {
            return json({ ok: false, error: { message: 'Session already closed', code: 'INVALID_STATE' } }, 400);
        }
        const body = await request.json() as { text?: string };
        const text = body.text?.trim();
        if (!text) {
            return json({ ok: false, error: { message: 'text is required', code: 'VALIDATION_ERROR' } }, 400);
        }
        const message: DemoChatMessage = {
            id: `msg-${Date.now()}`,
            sessionId: session.id,
            senderRole: session.listenerId ? 'listener' : 'user',
            text,
            createdAt: new Date().toISOString(),
        };
        demoChatMessages.push(message);
        return json({ ok: true, message: 'Message sent', data: { message } }, 201);
    }),

    http.post(`${BASE}/chat/:sessionId/close`, async ({ params }) => {
        await delay(LAG);
        const session = demoChatSessions.find((entry) => entry.id === params.sessionId);
        if (!session) {
            return json({ ok: false, error: { message: 'Session not found', code: 'NOT_FOUND' } }, 404);
        }
        session.status = 'closed';
        session.closedAt = new Date().toISOString();
        return json({ ok: true, message: 'Chat session closed', data: { session } });
    }),
];

// ── Export all handlers ────────────────────────────────────────────────────────

export const handlers = [
    ...authHandlers,
    ...therapistHandlers,
    ...appointmentHandlers,
    ...moodHandlers,
    ...journalHandlers,
    ...libraryHandlers,
    ...reportHandlers,
    ...aiHandlers,
    ...consentHandlers,
    ...crisisHandlers,
    ...chatHandlers,
];
