import type { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { ToastProvider } from './ToastContext';
import { ToastRegion } from '../components/ui/ToastRegion';
import { DemoModeProvider } from './DemoModeProvider';

/**
 * Top-level provider composition.
 * Order matters:
 *  1. DemoModeProvider — must be outermost so MSW intercepts all fetches
 *     (including the AuthProvider's /api/users/me session restore) in demo mode.
 *  2. ToastProvider — before AuthProvider so auth can call addToast.
 *  3. AuthProvider
 */
export function AppProviders({ children }: { children: ReactNode }) {
    return (
        <DemoModeProvider>
            <ToastProvider>
                <AuthProvider>
                    {children}
                    <ToastRegion />
                </AuthProvider>
            </ToastProvider>
        </DemoModeProvider>
    );
}

