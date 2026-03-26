import {
    type ReactNode,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useReducer,
} from 'react';
import type { AuthState, AuthTokens, User } from '../types';
import { http, setTokens, clearTokens } from '../api/http';
import { destroySocket } from '../api/socket';

interface LoginCredentials {
    email: string;
    password: string;
}

interface RegisterPayload {
    name: string;
    email: string;
    password: string;
}

interface AuthResponse {
    data: {
        user: User;
        accessToken: string;
        refreshToken?: string;
    };
}

interface MeResponse {
    data: {
        user: User;
    };
}

interface AuthContextValue extends AuthState {
    login: (creds: LoginCredentials) => Promise<void>;
    register: (payload: RegisterPayload) => Promise<void>;
    logout: () => Promise<void>;
}

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

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(authReducer, initialState);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            dispatch({ type: 'CLEAR' });
            return;
        }

        http
            .get<MeResponse>('/auth/me')
            .then(({ data }) => {
                dispatch({
                    type: 'SET_USER',
                    user: data.user,
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
        const response = await http.post<AuthResponse>('/auth/login', creds);
        const { accessToken, refreshToken, user } = response.data;
        setTokens(accessToken, refreshToken);
        dispatch({ type: 'SET_USER', user, tokens: { accessToken } });
    }, []);

    const register = useCallback(async (payload: RegisterPayload) => {
        dispatch({ type: 'LOADING' });
        const response = await http.post<AuthResponse>('/auth/register', payload);
        const { accessToken, refreshToken, user } = response.data;
        setTokens(accessToken, refreshToken);
        dispatch({ type: 'SET_USER', user, tokens: { accessToken } });
    }, []);

    const logout = useCallback(async () => {
        try {
            await http.post('/auth/logout');
        } catch {
            // Stateless JWT logout still succeeds client-side even if backend call fails.
        } finally {
            clearTokens();
            destroySocket();
            dispatch({ type: 'CLEAR' });
        }
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({ ...state, login, register, logout }),
        [state, login, register, logout]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
}
