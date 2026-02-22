/**
 * Central fetch wrapper for all REST API calls to the backend.
 * Automatically attaches Authorization header from localStorage,
 * handles JSON parsing, and throws typed ApiError on failure.
 */

import type { ApiError } from '../types';

const BASE_URL = '/api'; // proxied to http://localhost:4000 via Vite

function getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
}

export function setTokens(accessToken: string, refreshToken?: string): void {
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
}

export function clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
}

async function request<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getAccessToken();
    const headers = new Headers(options.headers);

    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        let apiError: ApiError;
        try {
            const body = await response.json();
            apiError = {
                message: body.message ?? response.statusText,
                code: body.code,
                status: response.status,
            };
        } catch {
            apiError = { message: response.statusText, status: response.status };
        }
        throw apiError;
    }

    // 204 No Content
    if (response.status === 204) {
        return undefined as unknown as T;
    }

    return response.json() as Promise<T>;
}

export const http = {
    get: <T>(path: string, options?: RequestInit) =>
        request<T>(path, { ...options, method: 'GET' }),

    post: <T>(path: string, body?: unknown, options?: RequestInit) =>
        request<T>(path, {
            ...options,
            method: 'POST',
            body: body !== undefined ? JSON.stringify(body) : undefined,
        }),

    put: <T>(path: string, body?: unknown, options?: RequestInit) =>
        request<T>(path, {
            ...options,
            method: 'PUT',
            body: body !== undefined ? JSON.stringify(body) : undefined,
        }),

    patch: <T>(path: string, body?: unknown, options?: RequestInit) =>
        request<T>(path, {
            ...options,
            method: 'PATCH',
            body: body !== undefined ? JSON.stringify(body) : undefined,
        }),

    delete: <T>(path: string, options?: RequestInit) =>
        request<T>(path, { ...options, method: 'DELETE' }),
};
