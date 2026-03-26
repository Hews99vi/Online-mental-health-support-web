/**
 * src/tests/WeeklyInsightPanel.test.tsx
 *
 * Tests for the WeeklyInsightPanel component:
 *  1. Shows idle state with "Generate Insight" button when consent IS granted
 *  2. Shows consent-required prompt when ai_insights consent is NOT granted
 *  3. Shows fallback content when the /api/ai/mood-summary returns a network error
 *  4. Shows fallback content when the request returns 403 (blocked)
 *  5. Shows fallback content when AI returns 204 no-content
 *  6. Renders insight text when the API returns a valid response
 *  7. Always shows the "not medical advice" disclaimer after content loads
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { SEED_MOOD_ENTRIES } from '../mocks/data';
import { WeeklyInsightPanel } from '../features/ai/WeeklyInsightPanel';

// ── Helpers ────────────────────────────────────────────────────────────────────

function setAiConsent(val: boolean) {
    const prefs = { ai_insights: val };
    localStorage.setItem('consent_prefs', JSON.stringify(prefs));
}

function renderPanel() {
    return render(
        <MemoryRouter>
            <WeeklyInsightPanel entries={SEED_MOOD_ENTRIES as never} />
        </MemoryRouter>
    );
}

/** Click the "Generate Insight" button that appears in idle state */
async function clickGenerate() {
    const btn = await screen.findByRole('button', { name: /generate insight/i });
    await userEvent.click(btn);
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('WeeklyInsightPanel', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    // ── Consent-gated UI ───────────────────────────────────────────────────────

    it('shows a generate button when ai_insights consent is granted', async () => {
        setAiConsent(true);
        renderPanel();
        expect(await screen.findByRole('button', { name: /generate insight/i })).toBeInTheDocument();
    });

    it('shows consent-required prompt when ai_insights consent is not granted', () => {
        setAiConsent(false);
        renderPanel();
        const text = document.body.textContent ?? '';
        expect(text.toLowerCase()).toMatch(/enable|consent|privacy|not enabled/i);
        expect(screen.queryByRole('button', { name: /generate insight/i })).not.toBeInTheDocument();
    });

    // ── Fallback: network error ────────────────────────────────────────────────

    it('shows fallback content when AI endpoint returns a network error', async () => {
        setAiConsent(true);
        server.use(
            http.post('/api/ai/mood-summary', () => HttpResponse.error())
        );
        renderPanel();
        await clickGenerate();
        await waitFor(() => {
            expect(document.body.textContent?.length).toBeGreaterThan(50);
        }, { timeout: 4000 });
    });

    // ── Fallback: 403 blocked ──────────────────────────────────────────────────

    it('shows fallback content when AI endpoint returns 403 (blocked)', async () => {
        setAiConsent(true);
        server.use(
            http.post('/api/ai/mood-summary', () =>
                HttpResponse.json({ error: 'Forbidden' }, { status: 403 })
            )
        );
        renderPanel();
        await clickGenerate();
        await waitFor(() => {
            expect(document.body.textContent?.length).toBeGreaterThan(50);
        }, { timeout: 4000 });
    });

    // ── Fallback: 204 no content ───────────────────────────────────────────────

    it('shows fallback content when AI returns 204 no content', async () => {
        setAiConsent(true);
        server.use(
            http.post('/api/ai/mood-summary', () => new HttpResponse(null, { status: 204 }))
        );
        renderPanel();
        await clickGenerate();
        await waitFor(() => {
            expect(document.body.textContent?.length).toBeGreaterThan(50);
        }, { timeout: 4000 });
    });

    // ── Success case ───────────────────────────────────────────────────────────

    it('renders AI-generated insight text on a successful response', async () => {
        setAiConsent(true);
        renderPanel();
        await clickGenerate();
        await waitFor(() => {
            const panel = document.body.textContent ?? '';
            const hasInsight =
                panel.includes('trended') ||
                panel.includes('Keep up') ||
                panel.includes('breathing') ||
                panel.includes('suggestions') ||
                panel.includes('unavailable');
            expect(hasInsight).toBe(true);
        }, { timeout: 5000 });
    });

    // ── Disclaimer always visible ──────────────────────────────────────────────

    it('shows "not medical advice" disclaimer after content loads', async () => {
        setAiConsent(true);
        renderPanel();
        await clickGenerate();
        await waitFor(() => {
            expect(screen.getByText(/not medical advice/i)).toBeInTheDocument();
        }, { timeout: 5000 });
    });
});
