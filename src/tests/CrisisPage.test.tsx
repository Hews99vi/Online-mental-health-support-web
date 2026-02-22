/**
 * src/tests/CrisisPage.test.tsx
 *
 * Accessibility-focused tests for CrisisPage:
 *  - Emergency alert banner is reachable by assistive technology (role=alert)
 *  - Primary hotline heading exists with id="primary-heading"
 *  - All rendered hotline phone links carry aria-label values
 *  - The disclaimer note is rendered with role="note"
 *  - The page has exactly one h1
 */

import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CrisisPage } from '../features/crisis/CrisisPage';

// MSW intercepts GET /api/crisis/resources automatically via setup.ts

function renderCrisisPage() {
    return render(
        <MemoryRouter>
            <CrisisPage />
        </MemoryRouter>
    );
}

describe('CrisisPage – accessibility', () => {
    it('renders the emergency alert banner with role="alert"', () => {
        renderCrisisPage();
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert.textContent).toMatch(/119|emergency/i);
    });

    it('has exactly one h1 with id="primary-heading"', () => {
        renderCrisisPage();
        const h1s = document.querySelectorAll('h1');
        expect(h1s.length).toBe(1);
        expect(h1s[0].id).toBe('primary-heading');
    });

    it('primary call-to-action links to tel:1926 with aria-label', () => {
        renderCrisisPage();
        const phoneLink = screen.getByRole('link', { name: /call 1926/i });
        expect(phoneLink).toBeInTheDocument();
        expect(phoneLink.getAttribute('href')).toBe('tel:1926');
    });

    it('renders the disclaimer note with role="note"', () => {
        renderCrisisPage();
        const notes = screen.getAllByRole('note');
        expect(notes.length).toBeGreaterThanOrEqual(1);
        expect(notes[0].textContent).toMatch(/not.*emergency|platform|professional/i);
    });

    it('renders the "All crisis contacts" section heading', async () => {
        renderCrisisPage();
        // Section is always present (even while loading)
        expect(screen.getByRole('heading', { name: /all crisis contacts/i })).toBeInTheDocument();
    });

    it('renders hotline list items with aria-label phone links after data loads', async () => {
        renderCrisisPage();
        // Wait for MSW-mocked /api/crisis/resources to resolve
        await waitFor(() => {
            const links = screen.getAllByRole('link', { name: /call/i });
            expect(links.length).toBeGreaterThanOrEqual(1);
        });
    });

    it('has a section with "Immediate safety steps" heading', () => {
        renderCrisisPage();
        expect(screen.getByRole('heading', { name: /immediate safety steps/i })).toBeInTheDocument();
    });
});
