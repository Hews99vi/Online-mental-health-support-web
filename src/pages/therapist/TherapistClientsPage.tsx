import { useState, useMemo } from 'react';

type RiskLevel = 'High' | 'Medium' | 'Low' | 'None';

interface Client {
    id: string;
    name: string;
    lastSession: string;
    risk: RiskLevel;
    sessions: number;
}

const CLIENTS: Client[] = [
    { id: '1', name: 'Amara Seneviratne', lastSession: 'Today', risk: 'High', sessions: 12 },
    { id: '2', name: 'Rohan Mendis', lastSession: 'Yesterday', risk: 'Medium', sessions: 6 },
    { id: '3', name: 'Priya Kumari', lastSession: 'Feb 17, 2026', risk: 'Low', sessions: 9 },
    { id: '4', name: 'Daniel Wijeratne', lastSession: 'Feb 15, 2026', risk: 'None', sessions: 3 },
    { id: '5', name: 'Linh Tran', lastSession: 'Feb 14, 2026', risk: 'Medium', sessions: 8 },
    { id: '6', name: 'Samuel Okonkwo', lastSession: 'Feb 12, 2026', risk: 'High', sessions: 15 },
    { id: '7', name: 'Fatima Nasser', lastSession: 'Feb 11, 2026', risk: 'Low', sessions: 4 },
    { id: '8', name: 'Kasun Perera', lastSession: 'Feb 09, 2026', risk: 'None', sessions: 2 },
    { id: '9', name: 'Mei Sasaki', lastSession: 'Feb 07, 2026', risk: 'Medium', sessions: 7 },
    { id: '10', name: 'Hassan Al-Rashid', lastSession: 'Feb 04, 2026', risk: 'Low', sessions: 11 },
];

const RISK_STYLES: Record<RiskLevel, { bg: string; color: string; border: string; label: string }> = {
    High: { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca', label: '🔴 High Risk' },
    Medium: { bg: '#fffbeb', color: '#92400e', border: '#fde68a', label: '🟡 Medium Risk' },
    Low: { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0', label: '🟢 Low Risk' },
    None: { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb', label: '⬜ No Flag' },
};

// Derive coloured initials avatar background from name
const AVATAR_COLOURS = ['#e0e7ff', '#fce7f3', '#d1fae5', '#fef3c7', '#ede9fe', '#fee2e2'];
function avatarBg(id: string) {
    return AVATAR_COLOURS[parseInt(id, 10) % AVATAR_COLOURS.length];
}
const AVATAR_TEXT_COLOURS = ['#4338ca', '#be185d', '#065f46', '#92400e', '#6d28d9', '#b91c1c'];
function avatarColor(id: string) {
    return AVATAR_TEXT_COLOURS[parseInt(id, 10) % AVATAR_TEXT_COLOURS.length];
}

export function TherapistClientsPage() {
    const [query, setQuery] = useState('');
    const [viewedId, setViewedId] = useState<string | null>(null);

    const filtered = useMemo(() => {
        const q = query.toLowerCase().trim();
        return q ? CLIENTS.filter((c) => c.name.toLowerCase().includes(q)) : CLIENTS;
    }, [query]);

    return (
        <main style={{ maxWidth: '720px', margin: '0 auto', padding: '3rem 1.5rem', fontFamily: 'inherit' }}>
            {/* ── Heading ── */}
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#111827', margin: '0 0 0.375rem' }}>
                Clients
            </h1>
            <p style={{ fontSize: '0.9375rem', color: '#6b7280', margin: '0 0 1.75rem' }}>
                {CLIENTS.length} active clients
            </p>

            {/* ── Search ── */}
            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                <span aria-hidden="true" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', color: '#9ca3af', pointerEvents: 'none' }}>
                    🔍
                </span>
                <input
                    type="search"
                    placeholder="Search by name…"
                    aria-label="Search clients"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '0.625rem 1rem 0.625rem 2.5rem', borderRadius: '0.625rem', border: '1px solid #e5e7eb', fontSize: '0.9375rem', color: '#111827', background: '#f9fafb', outline: 'none' }}
                />
            </div>

            {/* ── Client grid ── */}
            {filtered.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#9ca3af', marginTop: '3rem' }}>No clients match your search.</p>
            ) : (
                <ul
                    role="list"
                    style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.875rem' }}
                >
                    {filtered.map((client) => {
                        const risk = RISK_STYLES[client.risk];
                        const isViewed = viewedId === client.id;
                        return (
                            <li
                                key={client.id}
                                style={{ borderRadius: '0.875rem', border: `1px solid ${isViewed ? '#6366f1' : '#e5e7eb'}`, background: '#fff', padding: '1.125rem', display: 'flex', flexDirection: 'column', gap: '0.875rem', transition: 'border-color 0.15s' }}
                            >
                                {/* Top row: avatar + name + risk badge */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    {/* Avatar */}
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

                                    {/* Risk badge */}
                                    <span
                                        style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '999px', background: risk.bg, color: risk.color, border: `1px solid ${risk.border}`, whiteSpace: 'nowrap', flexShrink: 0 }}
                                        aria-label={`Risk level: ${client.risk}`}
                                    >
                                        {risk.label}
                                    </span>
                                </div>

                                {/* Last session */}
                                <p style={{ margin: 0, fontSize: '0.8125rem', color: '#6b7280' }}>
                                    <span style={{ color: '#9ca3af' }}>Last session: </span>
                                    <strong style={{ color: '#374151' }}>{client.lastSession}</strong>
                                </p>

                                {/* Open Profile button */}
                                <button
                                    type="button"
                                    aria-label={`Open profile for ${client.name}`}
                                    onClick={() => setViewedId(isViewed ? null : client.id)}
                                    style={{ marginTop: 'auto', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', background: isViewed ? '#6366f1' : '#f9fafb', color: isViewed ? '#fff' : '#374151', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s, color 0.15s' }}
                                >
                                    {isViewed ? '✓ Opened' : 'Open Profile'}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}

            {/* Result count when filtering */}
            {query && (
                <p style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: '#9ca3af', textAlign: 'right' }}>
                    {filtered.length} of {CLIENTS.length} clients
                </p>
            )}
        </main>
    );
}
