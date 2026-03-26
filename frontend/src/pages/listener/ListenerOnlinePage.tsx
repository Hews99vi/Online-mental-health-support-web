import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { http } from '../../api/http';

interface ChatSessionSummary {
    id: string;
    status: 'queued' | 'active' | 'closed';
    userId: string | null;
    listenerId: string | null;
    createdAt: string;
    closedAt: string | null;
}

interface ListenerOnlineResponse {
    data: {
        isOnline: boolean;
        assignedSession?: ChatSessionSummary | null;
    };
    message?: string;
}

export function ListenerOnlinePage() {
    const navigate = useNavigate();
    const [isOnline, setIsOnline] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        void http
            .get<ListenerOnlineResponse>('/listener/online', { signal: controller.signal })
            .then((response) => setIsOnline(response.data.isOnline))
            .catch((err: unknown) => {
                if ((err as { name?: string }).name === 'AbortError') return;
                setError((err as { message?: string }).message ?? 'Failed to load listener availability.');
            })
            .finally(() => setLoading(false));
        return () => controller.abort();
    }, []);

    const toggle = async () => {
        const next = !isOnline;
        setSaving(true);
        setError(null);
        try {
            const response = await http.put<ListenerOnlineResponse>('/listener/online', { isOnline: next });
            setIsOnline(response.data.isOnline);
            if (next && response.data.assignedSession?.id) {
                navigate(`/chat/${response.data.assignedSession.id}`);
            }
        } catch (err: unknown) {
            setError((err as { message?: string }).message ?? 'Failed to update listener availability.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <main style={{ maxWidth: '480px', margin: '0 auto', padding: '3rem 1.5rem', fontFamily: 'inherit' }}>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#111827', margin: '0 0 0.5rem' }}>
                Go Online
            </h1>
            <p style={{ fontSize: '0.9375rem', color: '#6b7280', margin: '0 0 2.5rem' }}>
                Switch on to start accepting anonymous chat requests.
            </p>

            {error && (
                <p role="alert" style={{ color: '#b91c1c', margin: '0 0 1rem', fontSize: '0.875rem' }}>
                    {error}
                </p>
            )}

            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.25rem 1.5rem',
                    borderRadius: '0.875rem',
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    gap: '1rem',
                }}
            >
                <div>
                    <p style={{ fontWeight: 600, color: '#111827', margin: '0 0 0.25rem', fontSize: '1rem' }}>
                        Availability
                    </p>
                    <span
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            padding: '0.2rem 0.65rem',
                            borderRadius: '999px',
                            background: isOnline ? '#d1fae5' : '#f3f4f6',
                            color: isOnline ? '#065f46' : '#6b7280',
                            border: `1px solid ${isOnline ? '#6ee7b7' : '#d1d5db'}`,
                            transition: 'all 0.2s ease',
                        }}
                        aria-live="polite"
                        aria-atomic="true"
                    >
                        <span
                            aria-hidden="true"
                            style={{
                                width: '7px',
                                height: '7px',
                                borderRadius: '50%',
                                background: isOnline ? '#10b981' : '#9ca3af',
                                display: 'inline-block',
                                flexShrink: 0,
                            }}
                        />
                        {isOnline ? 'Online' : 'Offline'}
                    </span>
                </div>

                <button
                    type="button"
                    role="switch"
                    aria-checked={isOnline}
                    aria-label={isOnline ? 'Go offline' : 'Go online'}
                    onClick={() => void toggle()}
                    disabled={loading || saving}
                    style={{
                        position: 'relative',
                        display: 'inline-flex',
                        alignItems: 'center',
                        width: '52px',
                        height: '28px',
                        borderRadius: '999px',
                        border: 'none',
                        cursor: loading || saving ? 'not-allowed' : 'pointer',
                        background: isOnline ? '#10b981' : '#d1d5db',
                        transition: 'background 0.2s ease',
                        flexShrink: 0,
                        padding: 0,
                        opacity: loading || saving ? 0.7 : 1,
                    }}
                >
                    <span
                        aria-hidden="true"
                        style={{
                            position: 'absolute',
                            left: isOnline ? '26px' : '3px',
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            background: '#fff',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            transition: 'left 0.2s ease',
                        }}
                    />
                </button>
            </div>

            <p style={{ marginTop: '1rem', fontSize: '0.8125rem', color: '#9ca3af', textAlign: 'center' }}>
                {saving ? 'Saving...' : isOnline ? 'You are visible to users seeking support.' : 'You will not receive chat requests while offline.'}
            </p>
        </main>
    );
}
