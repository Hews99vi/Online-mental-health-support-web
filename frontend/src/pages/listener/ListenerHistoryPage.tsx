import { useEffect, useMemo, useState } from 'react';
import { http } from '../../api/http';

interface HistorySession {
    id: string;
    status: 'queued' | 'active' | 'closed';
    userId: string | null;
    listenerId: string | null;
    createdAt: string;
    closedAt: string | null;
}

interface HistoryResponse {
    data: {
        items: HistorySession[];
    };
}

export function ListenerHistoryPage() {
    const [query, setQuery] = useState('');
    const [history, setHistory] = useState<HistorySession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        void http
            .get<HistoryResponse>('/listener/chats/history', { signal: controller.signal })
            .then((response) => setHistory(response.data.items))
            .catch((err: unknown) => {
                if ((err as { name?: string }).name === 'AbortError') return;
                setError((err as { message?: string }).message ?? 'Failed to load chat history.');
            })
            .finally(() => setLoading(false));

        return () => controller.abort();
    }, []);

    const filtered = useMemo(() => {
        const q = query.toLowerCase().trim();
        if (!q) return history;
        return history.filter((item) => item.id.toLowerCase().includes(q) || (item.userId ?? '').toLowerCase().includes(q));
    }, [history, query]);

    return (
        <main style={{ maxWidth: '720px', margin: '0 auto', padding: '3rem 1.5rem', fontFamily: 'inherit' }}>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#111827', margin: '0 0 0.375rem' }}>
                Chat History
            </h1>
            <p style={{ fontSize: '0.9375rem', color: '#6b7280', margin: '0 0 1.75rem' }}>
                A record of your completed support sessions.
            </p>

            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                <span
                    aria-hidden="true"
                    style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', color: '#9ca3af', pointerEvents: 'none' }}
                >
                    🔍
                </span>
                <input
                    type="search"
                    placeholder="Search by session ID or user..."
                    aria-label="Search chat history"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '0.625rem 1rem 0.625rem 2.5rem', borderRadius: '0.625rem', border: '1px solid #e5e7eb', fontSize: '0.9375rem', color: '#111827', background: '#f9fafb', outline: 'none' }}
                />
            </div>

            {error && (
                <p role="alert" style={{ color: '#b91c1c', margin: '0 0 1rem', fontSize: '0.875rem' }}>
                    {error}
                </p>
            )}

            {loading ? (
                <p style={{ color: '#6b7280' }}>Loading history...</p>
            ) : filtered.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#9ca3af', marginTop: '3rem' }}>No sessions match your search.</p>
            ) : (
                <div style={{ borderRadius: '0.875rem', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 100px', padding: '0.625rem 1.25rem', background: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
                        {['Session', 'Started', 'Closed', 'Status'].map((h) => (
                            <span key={h} style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {h}
                            </span>
                        ))}
                    </div>

                    {filtered.map((item, idx) => (
                        <div
                            key={item.id}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr 1fr 100px',
                                alignItems: 'center',
                                padding: '0.875rem 1.25rem',
                                background: idx % 2 === 0 ? '#fff' : '#f9fafb',
                                borderBottom: idx < filtered.length - 1 ? '1px solid #f3f4f6' : 'none',
                            }}
                        >
                            <span style={{ fontSize: '0.8125rem', color: '#374151' }}>{item.id.slice(0, 8)}</span>
                            <span style={{ fontSize: '0.8125rem', color: '#6b7280' }}>{new Date(item.createdAt).toLocaleString()}</span>
                            <span style={{ fontSize: '0.8125rem', color: '#6b7280' }}>{item.closedAt ? new Date(item.closedAt).toLocaleString() : '-'}</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#065f46' }}>{item.status}</span>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}
