import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { http } from '../../api/http';

interface TherapistClient {
    id: string;
    name: string;
    email: string | null;
    sessions: number;
    lastSessionAt: string | null;
}

interface TherapistClientsResponse {
    data: {
        items: TherapistClient[];
        total: number;
    };
}

const AVATAR_COLOURS = ['#e0e7ff', '#fce7f3', '#d1fae5', '#fef3c7', '#ede9fe', '#fee2e2'];
function avatarBg(id: string) {
    return AVATAR_COLOURS[parseInt(id.slice(-2), 16) % AVATAR_COLOURS.length];
}
const AVATAR_TEXT_COLOURS = ['#4338ca', '#be185d', '#065f46', '#92400e', '#6d28d9', '#b91c1c'];
function avatarColor(id: string) {
    return AVATAR_TEXT_COLOURS[parseInt(id.slice(-2), 16) % AVATAR_TEXT_COLOURS.length];
}

export function TherapistClientsPage() {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [clients, setClients] = useState<TherapistClient[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        void http
            .get<TherapistClientsResponse>('/therapist/clients', { signal: controller.signal })
            .then((response) => setClients(response.data.items))
            .catch((err: unknown) => {
                if ((err as { name?: string }).name === 'AbortError') return;
                setError((err as { message?: string }).message ?? 'Failed to load clients.');
            })
            .finally(() => setLoading(false));
        return () => controller.abort();
    }, []);

    const filtered = useMemo(() => {
        const q = query.toLowerCase().trim();
        return q
            ? clients.filter((client) => client.name.toLowerCase().includes(q) || (client.email ?? '').toLowerCase().includes(q))
            : clients;
    }, [clients, query]);

    return (
        <main style={{ maxWidth: '720px', margin: '0 auto', padding: '3rem 1.5rem', fontFamily: 'inherit' }}>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#111827', margin: '0 0 0.375rem' }}>
                Clients
            </h1>
            <p style={{ fontSize: '0.9375rem', color: '#6b7280', margin: '0 0 1.75rem' }}>
                {loading ? 'Loading...' : `${clients.length} active clients`}
            </p>

            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                <span aria-hidden="true" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', color: '#9ca3af', pointerEvents: 'none' }}>
                    🔍
                </span>
                <input
                    type="search"
                    placeholder="Search by name or email..."
                    aria-label="Search clients"
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
                <p style={{ color: '#6b7280' }}>Loading clients...</p>
            ) : filtered.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#9ca3af', marginTop: '3rem' }}>No clients match your search.</p>
            ) : (
                <ul role="list" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.875rem' }}>
                    {filtered.map((client) => {
                        return (
                            <li
                                key={client.id}
                                style={{ borderRadius: '0.875rem', border: '1px solid #e5e7eb', background: '#fff', padding: '1.125rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div
                                        aria-hidden="true"
                                        style={{ width: '44px', height: '44px', borderRadius: '50%', background: avatarBg(client.id), color: avatarColor(client.id), fontWeight: 700, fontSize: '0.9375rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                                    >
                                        {client.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                                    </div>

                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9375rem', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {client.name}
                                        </p>
                                        <p style={{ margin: '0.125rem 0 0', fontSize: '0.8125rem', color: '#6b7280' }}>
                                            {client.sessions} sessions
                                        </p>
                                    </div>
                                </div>

                                <p style={{ margin: 0, fontSize: '0.8125rem', color: '#6b7280' }}>
                                    <span style={{ color: '#9ca3af' }}>Last session: </span>
                                    <strong style={{ color: '#374151' }}>
                                        {client.lastSessionAt ? new Date(client.lastSessionAt).toLocaleString() : 'N/A'}
                                    </strong>
                                </p>

                                <button
                                    type="button"
                                    aria-label={`Open profile for ${client.name}`}
                                    onClick={() => navigate(`/therapist/notes?clientId=${client.id}`)}
                                    style={{ marginTop: 'auto', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', background: '#f9fafb', color: '#374151', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
                                >
                                    Open Session Notes
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </main>
    );
}
