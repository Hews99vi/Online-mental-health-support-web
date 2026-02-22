/**
 * src/app/DemoModeProvider.tsx
 *
 * DEV-ONLY: toggle that enables MSW mock service worker so the entire
 * app runs without a backend — useful for localhost demos, screenshots,
 * and CI preview environments.
 *
 * Rules:
 *  - Only renders the toggle UI in development builds (import.meta.env.DEV)
 *  - Demo mode is persisted in localStorage['demo_mode']
 *  - When enabled, starts the MSW browser service worker and patches the
 *    http module to block any real /api/ai/* calls (double-safety so no
 *    accidental AI API usage)
 *  - All MSW handlers use stub data from src/mocks/data.ts
 *  - In production builds this component renders null (tree-shaken away)
 */

import {
    type ReactNode,
    createContext,
    useContext,
    useEffect,
    useState,
} from 'react';

// ── Context ────────────────────────────────────────────────────────────────────

interface DemoModeContextValue {
    isDemoMode: boolean;
    toggleDemoMode: () => void;
}

const DemoModeContext = createContext<DemoModeContextValue>({
    isDemoMode: false,
    toggleDemoMode: () => { },
});

export function useDemoMode() {
    return useContext(DemoModeContext);
}

// ── Storage key ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'demo_mode';

function readFlag(): boolean {
    try { return localStorage.getItem(STORAGE_KEY) === 'true'; }
    catch { return false; }
}

function writeFlag(v: boolean) {
    try { localStorage.setItem(STORAGE_KEY, String(v)); }
    catch { /* ignore */ }
}

// ── MSW worker reference (lazy, DEV-only) ─────────────────────────────────────
// We use a dynamic import so the MSW bundle is excluded from production.

type MswWorker = { start: (opts?: object) => Promise<void>; stop: () => void };
let _worker: MswWorker | null = null;

async function startWorker(): Promise<void> {
    if (!import.meta.env.DEV) return;
    if (!_worker) {
        const mod = await import('../mocks/browser');
        _worker = mod.mswWorker as unknown as MswWorker;
    }
    await _worker.start({ onUnhandledRequest: 'bypass' });
    console.info('[DemoMode] MSW worker started — all /api/* calls are mocked');
}

function stopWorker(): void {
    _worker?.stop();
    console.info('[DemoMode] MSW worker stopped');
}

// ── Provider ───────────────────────────────────────────────────────────────────

export function DemoModeProvider({ children }: { children: ReactNode }) {
    const [isDemoMode, setIsDemoMode] = useState(readFlag);
    const [workerReady, setWorkerReady] = useState(false);

    // Start or stop worker when isDemoMode changes
    useEffect(() => {
        if (!import.meta.env.DEV) return;
        if (isDemoMode) {
            startWorker().then(() => setWorkerReady(true));
        } else {
            stopWorker();
            setWorkerReady(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDemoMode]);

    const toggleDemoMode = () => {
        const next = !isDemoMode;
        writeFlag(next);
        setIsDemoMode(next);
    };

    // DEV guard: if demo mode is on but MSW hasn't started yet, hold rendering
    // to avoid a flash of real 404 network errors before the worker intercepts
    if (import.meta.env.DEV && isDemoMode && !workerReady) {
        return (
            <DemoModeContext.Provider value={{ isDemoMode, toggleDemoMode }}>
                <div style={{
                    position: 'fixed', inset: 0, background: '#0f172a',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: '1rem', zIndex: 9999,
                }}>
                    <div style={{ width: '2.5rem', height: '2.5rem', border: '3px solid rgba(255,255,255,0.15)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>Starting Demo Mode…</p>
                    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                </div>
            </DemoModeContext.Provider>
        );
    }

    return (
        <DemoModeContext.Provider value={{ isDemoMode, toggleDemoMode }}>
            {children}
            {/* DEV-only floating toggle badge */}
            {import.meta.env.DEV && (
                <DemoModeToggle isDemoMode={isDemoMode} onToggle={toggleDemoMode} />
            )}
        </DemoModeContext.Provider>
    );
}

// ── Floating toggle UI ─────────────────────────────────────────────────────────

function DemoModeToggle({ isDemoMode, onToggle }: { isDemoMode: boolean; onToggle: () => void }) {
    return (
        <div style={{
            position: 'fixed', bottom: '1rem', right: '1rem',
            zIndex: 9998, display: 'flex', alignItems: 'center',
            gap: '0.5rem',
        }}>
            <button
                type="button"
                onClick={onToggle}
                title={isDemoMode ? 'Demo Mode ON — click to disable' : 'Click to enable Demo Mode (MSW mocks)'}
                style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.5rem 0.875rem',
                    background: isDemoMode ? '#7c3aed' : 'rgba(15,23,42,0.85)',
                    color: '#fff',
                    border: '1.5px solid ' + (isDemoMode ? '#a78bfa' : 'rgba(255,255,255,0.15)'),
                    borderRadius: '2rem',
                    fontSize: '0.75rem', fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit',
                    backdropFilter: 'blur(8px)',
                    boxShadow: isDemoMode ? '0 0 16px rgba(124,58,237,0.4)' : '0 2px 12px rgba(0,0,0,0.3)',
                    transition: 'all 0.2s',
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase',
                }}
                aria-pressed={isDemoMode}
                aria-label={isDemoMode ? 'Demo mode enabled, click to disable' : 'Enable demo mode'}
            >
                <span style={{
                    width: '0.5rem', height: '0.5rem', borderRadius: '50%',
                    background: isDemoMode ? '#4ade80' : '#6b7280',
                    boxShadow: isDemoMode ? '0 0 6px #4ade80' : undefined,
                    flexShrink: 0,
                }} />
                Demo {isDemoMode ? 'ON' : 'OFF'}
            </button>
        </div>
    );
}
