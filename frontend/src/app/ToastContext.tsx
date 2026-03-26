import React, { createContext, useCallback, useContext, useMemo, useReducer } from 'react';
import type { Toast, ToastVariant } from '../types';

// ── Types ────────────────────────────────────────────────────────────────────

interface ToastContextValue {
    toasts: Toast[];
    addToast: (message: string, variant?: ToastVariant, durationMs?: number) => void;
    removeToast: (id: string) => void;
}

type Action =
    | { type: 'ADD'; toast: Toast }
    | { type: 'REMOVE'; id: string };

function toastReducer(state: Toast[], action: Action): Toast[] {
    switch (action.type) {
        case 'ADD':
            return [...state, action.toast];
        case 'REMOVE':
            return state.filter((t) => t.id !== action.id);
        default:
            return state;
    }
}

let _nextId = 0;

// ── Context ───────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, dispatch] = useReducer(toastReducer, []);

    const removeToast = useCallback((id: string) => {
        dispatch({ type: 'REMOVE', id });
    }, []);

    const addToast = useCallback(
        (message: string, variant: ToastVariant = 'info', durationMs = 4000) => {
            const id = String(++_nextId);
            dispatch({ type: 'ADD', toast: { id, message, variant, durationMs } });
            setTimeout(() => dispatch({ type: 'REMOVE', id }), durationMs);
        },
        []
    );

    const value = useMemo<ToastContextValue>(
        () => ({ toasts, addToast, removeToast }),
        [toasts, addToast, removeToast]
    );

    return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
    return ctx;
}
