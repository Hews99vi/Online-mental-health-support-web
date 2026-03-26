/**
 * src/tests/renderWithProviders.tsx
 *
 * A test utility that renders any component wrapped in the same provider
 * tree used by the real app: MemoryRouter + a lightweight AuthContext stub.
 *
 * Usage:
 *   const { getByRole } = renderWithProviders(<MyComponent />, { route: '/dashboard' });
 *   const { getByRole } = renderWithProviders(<MyComponent />, { authUser: SEED_USERS[0] });
 */

import { type ReactElement, createContext, useContext } from 'react';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom';
import type { User } from '../types';

// Re-export everything from testing-library for convenience
export * from '@testing-library/react';

// ── Auth stub ─────────────────────────────────────────────────────────────────

const noopAsync = async () => { };
const noop = () => { };

export interface StubAuthValue {
    user: User | null;
    tokens: { accessToken: string } | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: typeof noopAsync;
    register: typeof noopAsync;
    logout: typeof noop;
}

function makeAuthValue(user: User | null): StubAuthValue {
    return {
        user,
        tokens: user ? { accessToken: 'test-token' } : null,
        isAuthenticated: user !== null,
        isLoading: false,
        login: noopAsync,
        register: noopAsync,
        logout: noop,
    };
}

/**
 * TestAuthContext — injected on window so modules that call useAuth()
 * can be mocked via vi.mock inside individual tests if needed.
 * By default we patch through a module-level export of AuthContext
 * by re-exporting a compatible context shape.
 */
// We expose this for individual test overrides
export const TestAuthContext = createContext<StubAuthValue>(makeAuthValue(null));
export const useTestAuth = () => useContext(TestAuthContext);

// ── Options ────────────────────────────────────────────────────────────────────

export interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
    /** Initial route for MemoryRouter (default: '/') */
    route?: string;
    /** Router entries array; overrides `route` when provided */
    routerProps?: MemoryRouterProps;
    /** Pre-authenticated user; null = unauthenticated (default: null) */
    authUser?: User | null;
}

// ── renderWithProviders ────────────────────────────────────────────────────────

export function renderWithProviders(
    ui: ReactElement,
    {
        route = '/',
        routerProps,
        authUser = null,
        ...renderOptions
    }: RenderWithProvidersOptions = {}
): RenderResult {
    const router: MemoryRouterProps = routerProps ?? { initialEntries: [route] };

    function Wrapper({ children }: { children: React.ReactNode }) {
        return (
            <TestAuthContext.Provider value={makeAuthValue(authUser)}>
                <MemoryRouter {...router}>
                    {children}
                </MemoryRouter>
            </TestAuthContext.Provider>
        );
    }

    return render(ui, { wrapper: Wrapper, ...renderOptions });
}

