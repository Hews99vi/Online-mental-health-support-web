import {
    type ReactNode,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useReducer,
} from 'react';
import type { AuthState, User, AuthTokens } from '../types';
import { http, setTokens, clearTokens } from '../api/http';
import { destroySocket } from '../api/socket';

// ── Types ────────────────────────────────────────────────────────────────────

interface LoginCredentials {
    email: string;
    password: string;
}

interface RegisterPayload {
    name: string;
    email: string;
    password: string;
    role?: 'user' | 'listener' | 'therapist';
}

interface AuthContextValue extends AuthState {
    login: (creds: LoginCredentials) => Promise<void>;
    register: (payload: RegisterPayload) => Promise<void>;
    loginDemo: (role: 'user' | 'listener' | 'therapist' | 'admin') => void;
    logout: () => void;
}

// ── Reducer ──────────────────────────────────────────────────────────────────

type AuthAction =
    | { type: 'LOADING' }
    | { type: 'SET_USER'; user: User; tokens: AuthTokens }
    | { type: 'CLEAR' };

function authReducer(state: AuthState, action: AuthAction): AuthState {
    switch (action.type) {
        case 'LOADING':
            return { ...state, isLoading: true };
        case 'SET_USER':
            return {
                user: action.user,
                tokens: action.tokens,
                isLoading: false,
                isAuthenticated: true,
            };
        case 'CLEAR':
            return { user: null, tokens: null, isLoading: false, isAuthenticated: false };
        default:
            return state;
    }
}

const initialState: AuthState = {
    user: null,
    tokens: null,
    isLoading: true,
    isAuthenticated: false,
};

// ── Demo accounts ────────────────────────────────────────────────────────────

const DEMO_TOKEN = 'demo-token-local-only';

const DEMO_USERS: Record<'user' | 'listener' | 'therapist' | 'admin', User> = {
    user: {
        id: 'demo-u1',
        name: 'Demo User',
        email: 'user@demo.local',
        role: 'user',
        createdAt: new Date().toISOString(),
    },
    listener: {
        id: 'demo-l1',
        name: 'Demo Listener',
        email: 'listener@demo.local',
        role: 'listener',
        createdAt: new Date().toISOString(),
    },
    therapist: {
        id: 'demo-t1',
        name: 'Demo Therapist',
        email: 'therapist@demo.local',
        role: 'therapist',
        createdAt: new Date().toISOString(),
    },
    admin: {
        id: 'demo-a1',
        name: 'Admin User',
        email: 'admin@demo.local',
        role: 'admin',
        createdAt: new Date().toISOString(),
    },
};

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(authReducer, initialState);

    // On mount, try to restore session from stored token
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            dispatch({ type: 'CLEAR' });
            return;
        }
        http
            .get<{ user: User }>('/users/me')
            .then(({ user }) => {
                dispatch({
                    type: 'SET_USER',
                    user,
                    tokens: { accessToken: token },
                });
            })
            .catch(() => {
                clearTokens();
                dispatch({ type: 'CLEAR' });
            });
    }, []);

    const login = useCallback(async (creds: LoginCredentials) => {
        dispatch({ type: 'LOADING' });
        const data = await http.post<{ user: User; accessToken: string; refreshToken?: string }>(
            '/auth/login',
            creds
        );
        setTokens(data.accessToken, data.refreshToken);
        dispatch({ type: 'SET_USER', user: data.user, tokens: { accessToken: data.accessToken } });
    }, []);

    const register = useCallback(async (payload: RegisterPayload) => {
        dispatch({ type: 'LOADING' });
        const data = await http.post<{ user: User; accessToken: string; refreshToken?: string }>(
            '/auth/register',
            payload
        );
        setTokens(data.accessToken, data.refreshToken);
        dispatch({ type: 'SET_USER', user: data.user, tokens: { accessToken: data.accessToken } });
    }, []);

    const loginDemo = useCallback((role: 'user' | 'listener' | 'therapist' | 'admin') => {
        const user = DEMO_USERS[role];
        setTokens(DEMO_TOKEN);
        dispatch({ type: 'SET_USER', user, tokens: { accessToken: DEMO_TOKEN } });
    }, []);

    const logout = useCallback(() => {
        clearTokens();
        destroySocket();
        dispatch({ type: 'CLEAR' });
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({ ...state, login, register, loginDemo, logout }),
        [state, login, register, loginDemo, logout]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
}
