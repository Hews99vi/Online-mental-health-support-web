import { useEffect, useMemo, useState } from 'react';
import { http } from '../../api/http';

interface TherapistClient {
    id: string;
    name: string;
    email: string | null;
}

interface ClientsResponse {
    data: {
        items: TherapistClient[];
    };
}

interface MoodEntry {
    id: string;
    moodScore: number;
    tags: string[];
    note: string;
    createdAt: string;
}

interface MoodResponse {
    data: {
        items: MoodEntry[];
        total: number;
        stats: {
            averageMood: number;
            latestMood: number | null;
        };
    };
}

function toInputDate(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export function TherapistMoodInsightsPage() {
    const [clients, setClients] = useState<TherapistClient[]>([]);
    const [clientId, setClientId] = useState('');
    const [from, setFrom] = useState(toInputDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)));
    const [to, setTo] = useState(toInputDate(new Date()));
    const [entries, setEntries] = useState<MoodEntry[]>([]);
    const [averageMood, setAverageMood] = useState(0);
    const [latestMood, setLatestMood] = useState<number | null>(null);
    const [loadingClients, setLoadingClients] = useState(true);
    const [loadingMood, setLoadingMood] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        void http
            .get<ClientsResponse>('/therapist/clients', { signal: controller.signal })
            .then((response) => {
                setClients(response.data.items);
                if (response.data.items.length > 0) setClientId(response.data.items[0].id);
            })
            .catch((err: unknown) => {
                if ((err as { name?: string }).name === 'AbortError') return;
                setError((err as { message?: string }).message ?? 'Failed to load clients.');
            })
            .finally(() => setLoadingClients(false));
        return () => controller.abort();
    }, []);

    useEffect(() => {
        if (!clientId) {
            setEntries([]);
            setAverageMood(0);
            setLatestMood(null);
            return;
        }
        const controller = new AbortController();
        setLoadingMood(true);
        setError(null);
        const qs = new URLSearchParams();
        qs.set('from', new Date(`${from}T00:00:00`).toISOString());
        qs.set('to', new Date(`${to}T23:59:59`).toISOString());
        void http
            .get<MoodResponse>(`/therapist/clients/${clientId}/mood?${qs.toString()}`, { signal: controller.signal })
            .then((response) => {
                setEntries(response.data.items);
                setAverageMood(response.data.stats.averageMood);
                setLatestMood(response.data.stats.latestMood);
            })
            .catch((err: unknown) => {
                if ((err as { name?: string }).name === 'AbortError') return;
                setError((err as { message?: string }).message ?? 'Failed to load mood insights.');
            })
            .finally(() => setLoadingMood(false));
        return () => controller.abort();
    }, [clientId, from, to]);

    const selectedClient = useMemo(
        () => clients.find((item) => item.id === clientId) ?? null,
        [clients, clientId]
    );

    return (
        <main style={{ maxWidth: '920px', margin: '0 auto', padding: '2rem 1.5rem', fontFamily: 'inherit' }}>
            <h1 style={{ margin: 0, fontSize: '1.6rem', color: '#111827' }}>Client Mood Insights</h1>
            <p style={{ margin: '0.4rem 0 1.2rem', color: '#6b7280', fontSize: '0.9rem' }}>
                Timeline of mood entries for each therapy client.
            </p>

            {error && (
                <p role="alert" style={{ margin: '0 0 1rem', color: '#b91c1c', fontSize: '0.875rem' }}>
                    {error}
                </p>
            )}

            <section style={{ border: '1px solid #e5e7eb', borderRadius: '0.875rem', background: '#fff', padding: '0.9rem', display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.6rem' }}>
                <select
                    value={clientId}
                    onChange={(event) => setClientId(event.target.value)}
                    disabled={loadingClients || clients.length === 0}
                    style={{ border: '1px solid #d1d5db', borderRadius: '0.55rem', padding: '0.5rem 0.65rem', fontFamily: 'inherit' }}
                >
                    {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                            {client.name} {client.email ? `(${client.email})` : ''}
                        </option>
                    ))}
                </select>
                <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} style={{ border: '1px solid #d1d5db', borderRadius: '0.55rem', padding: '0.5rem 0.65rem', fontFamily: 'inherit' }} />
                <input type="date" value={to} onChange={(event) => setTo(event.target.value)} style={{ border: '1px solid #d1d5db', borderRadius: '0.55rem', padding: '0.5rem 0.65rem', fontFamily: 'inherit' }} />
            </section>

            <section style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.75rem' }}>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.75rem', background: '#fff', padding: '0.85rem' }}>
                    <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>Client</div>
                    <div style={{ color: '#111827', fontWeight: 700, marginTop: '0.15rem' }}>{selectedClient?.name ?? '-'}</div>
                </div>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.75rem', background: '#fff', padding: '0.85rem' }}>
                    <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>Average mood</div>
                    <div style={{ color: '#111827', fontWeight: 700, marginTop: '0.15rem' }}>{loadingMood ? '-' : averageMood.toFixed(2)}</div>
                </div>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.75rem', background: '#fff', padding: '0.85rem' }}>
                    <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>Latest mood</div>
                    <div style={{ color: '#111827', fontWeight: 700, marginTop: '0.15rem' }}>{loadingMood ? '-' : latestMood ?? '-'}</div>
                </div>
            </section>

            <section style={{ marginTop: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.875rem', background: '#fff', padding: '0.8rem' }}>
                <h2 style={{ margin: '0 0 0.7rem', fontSize: '0.98rem', color: '#111827' }}>Timeline</h2>
                {loadingMood ? (
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '0.85rem' }}>Loading mood timeline...</p>
                ) : entries.length === 0 ? (
                    <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.85rem' }}>No mood entries for selected range.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                        {entries.map((entry) => (
                            <div key={entry.id} style={{ border: '1px solid #e5e7eb', borderRadius: '0.6rem', padding: '0.55rem 0.65rem', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '0.6rem', alignItems: 'center' }}>
                                <span style={{ fontWeight: 700, color: '#111827' }}>{entry.moodScore}/5</span>
                                <div>
                                    <div style={{ fontSize: '0.82rem', color: '#374151' }}>{new Date(entry.createdAt).toLocaleString()}</div>
                                    {entry.note && <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>{entry.note}</div>}
                                </div>
                                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{entry.tags.join(', ') || 'No tags'}</span>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
