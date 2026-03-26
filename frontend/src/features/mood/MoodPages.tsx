/**
 * MoodPages.tsx - barrel export for the mood feature.
 */

export { MoodCheckInForm } from './MoodCheckInForm';
export { MoodHistoryPage } from './MoodHistoryPage';

import { Navigate } from 'react-router-dom';
import { EmotionCheckInWidget } from '../biometric/EmotionCheckInWidget';

export function MoodTrackerPage() {
    return <Navigate to="/mood/history" replace />;
}

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
