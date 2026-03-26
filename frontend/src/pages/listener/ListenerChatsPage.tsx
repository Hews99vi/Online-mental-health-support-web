import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { http } from '../../api/http';

interface ActiveChat {
    id: string;
    status: 'queued' | 'active' | 'closed';
    userId: string | null;
    listenerId: string | null;
    createdAt: string;
    closedAt: string | null;
}

interface ListenerChatsResponse {
    data: {
        items: ActiveChat[];
    };
}

interface QueueAssignResponse {
    data: {
        session: ActiveChat;
    };
}

export function ListenerChatsPage() {
    const navigate = useNavigate();
    const [chats, setChats] = useState<ActiveChat[]>([]);
    const [loading, setLoading] = useState(true);
    const [isClaiming, setIsClaiming] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadChats = () => {
        setLoading(true);
        const controller = new AbortController();
        void http
            .get<ListenerChatsResponse>('/listener/chats/active', { signal: controller.signal })
            .then((response) => setChats(response.data.items))
            .catch((err: unknown) => {
                if ((err as { name?: string }).name === 'AbortError') return;
                setError((err as { message?: string }).message ?? 'Failed to load active chats.');
            })
            .finally(() => setLoading(false));

        return () => controller.abort();
    };

    useEffect(() => {
        const cleanup = loadChats();
        return cleanup;
    }, []);

    const claimNextChat = async () => {
        setIsClaiming(true);
        setError(null);
        try {
            const response = await http.post<QueueAssignResponse>('/chat/queue', { role: 'listener' });
            navigate(`/chat/${response.data.session.id}`);
        } catch (err: unknown) {
            setError((err as { message?: string }).message ?? 'No queued chats available right now.');
        } finally {
            setIsClaiming(false);
            loadChats();
        }
    };

    return (
        <main style={{ maxWidth: '640px', margin: '0 auto', padding: '3rem 1.5rem', fontFamily: 'inherit' }}>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#111827', margin: '0 0 0.375rem' }}>
                Active Chats
            </h1>
            <p style={{ fontSize: '0.9375rem', color: '#6b7280', margin: '0 0 2rem' }}>
                {loading ? 'Loading...' : `${chats.length} ongoing sessions`}
            </p>

            <div style={{ marginBottom: '1rem' }}>
                <button
                    type="button"
                    onClick={() => void claimNextChat()}
                    disabled={loading || isClaiming}
                    style={{
                        padding: '0.5rem 0.95rem',
                        borderRadius: '0.55rem',
                        border: 'none',
                        cursor: loading || isClaiming ? 'not-allowed' : 'pointer',
                        fontSize: '0.825rem',
                        fontWeight: 600,
                        background: '#2563eb',
                        color: '#fff',
                        opacity: loading || isClaiming ? 0.75 : 1,
                    }}
                >
                    {isClaiming ? 'Claiming...' : 'Claim Next Queued Chat'}
                </button>
            </div>

            {error && (
                <p role="alert" style={{ color: '#b91c1c', margin: '0 0 1rem', fontSize: '0.875rem' }}>
                    {error}
                </p>
            )}

            {loading ? (
                <p style={{ color: '#6b7280' }}>Loading chats...</p>
            ) : chats.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#9ca3af', marginTop: '3rem' }}>No active chats right now.</p>
            ) : (
                <ul role="list" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    {chats.map((chat) => {
                        const initials = (chat.userId ?? 'AN').slice(-2).toUpperCase();
                        const created = new Date(chat.createdAt).toLocaleString();
                        return (
                            <li
                                key={chat.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '1rem',
                                    padding: '1.125rem 1.25rem',
                                    borderRadius: '0.875rem',
                                    background: '#f9fafb',
                                    border: '1px solid #e5e7eb',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', minWidth: 0 }}>
                                    <div
                                        aria-hidden="true"
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            background: '#e0e7ff',
                                            color: '#4338ca',
                                            fontWeight: 700,
                                            fontSize: '0.875rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}
                                    >
                                        {initials}
                                    </div>

                                    <div style={{ minWidth: 0 }}>
                                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9375rem', color: '#111827' }}>
                                            Session {chat.id.slice(0, 6)}
                                        </p>
                                        <p style={{ margin: '0.125rem 0 0', fontSize: '0.8125rem', color: '#6b7280' }}>
                                            Started {created}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    aria-label={`Open chat ${chat.id}`}
                                    onClick={() => navigate(`/chat/${chat.id}`)}
                                    style={{
                                        flexShrink: 0,
                                        padding: '0.45rem 1rem',
                                        borderRadius: '0.5rem',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '0.8125rem',
                                        fontWeight: 600,
                                        background: '#6366f1',
                                        color: '#fff',
                                    }}
                                >
                                    Open Chat
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </main>
    );
}
