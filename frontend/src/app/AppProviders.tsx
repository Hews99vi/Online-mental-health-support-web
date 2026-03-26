import type { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { ToastProvider } from './ToastContext';
import { ToastRegion } from '../components/ui/ToastRegion';

/**
 * Top-level provider composition.
 * Order matters:
 *  1. ToastProvider — before AuthProvider so auth can call addToast.
 *  2. AuthProvider
 */
export function AppProviders({ children }: { children: ReactNode }) {
    return (
        <ToastProvider>
            <AuthProvider>
                {children}
                <ToastRegion />
            </AuthProvider>
        </ToastProvider>
    );
}

