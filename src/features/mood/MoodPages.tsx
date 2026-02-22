/**
 * MoodPages.tsx — barrel export for mood & journal feature
 *
 * /mood/checkin  → MoodCheckInForm
 * /mood/history  → MoodHistoryPage
 * /mood/emotion  → EmotionCheckInWidget (standalone page wrapper)
 * /mood          → redirects to /mood/checkin (handled in Router)
 * /journal       → JournalPage (kept for backward compat, links to history)
 */

export { MoodCheckInForm } from './MoodCheckInForm';
export { MoodHistoryPage } from './MoodHistoryPage';

// ── Journal stub (backward-compat route /journal) ─────────────────────────────
// Redirects to the history page which now includes the full journal experience.
import { Navigate } from 'react-router-dom';
export function JournalPage() { return <Navigate to="/mood/history" replace />; }

// ── Convenience redirect for bare /mood ───────────────────────────────────────
export function MoodTrackerPage() { return <Navigate to="/mood/checkin" replace />; }

// ── Emotion page wrapper ──────────────────────────────────────────────────────
import { EmotionCheckInWidget } from '../biometric/EmotionCheckInWidget';
export function EmotionPage() {
    return (
        <main style={{ maxWidth: '640px', margin: '0 auto', padding: '2rem 1.5rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', marginBottom: '1.5rem' }}>
                Emotion Check-In
            </h1>
            <EmotionCheckInWidget context="standalone check-in page" />
        </main>
    );
}
