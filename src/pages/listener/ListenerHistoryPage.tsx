import { useState, useMemo } from 'react';

interface PastChat {
    id: string;
    date: string;
    topic: string;
    duration: string;
    rating: number; // 1–5, 0 = not rated
}

const HISTORY: PastChat[] = [
    { id: '1', date: 'Feb 19, 2026', topic: 'Anxiety & work stress', duration: '28 min', rating: 5 },
    { id: '2', date: 'Feb 18, 2026', topic: 'Feeling lonely lately', duration: '14 min', rating: 4 },
    { id: '3', date: 'Feb 17, 2026', topic: 'Trouble sleeping', duration: '41 min', rating: 5 },
    { id: '4', date: 'Feb 16, 2026', topic: 'Relationship difficulties', duration: '22 min', rating: 3 },
    { id: '5', date: 'Feb 15, 2026', topic: 'Low motivation / burnout', duration: '35 min', rating: 4 },
    { id: '6', date: 'Feb 13, 2026', topic: 'Grief and loss', duration: '50 min', rating: 5 },
    { id: '7', date: 'Feb 11, 2026', topic: 'Panic attacks at night', duration: '19 min', rating: 0 },
    { id: '8', date: 'Feb 09, 2026', topic: 'Family conflict & communication', duration: '33 min', rating: 4 },
];

function StarRating({ rating }: { rating: number }) {
    if (rating === 0) {
        return <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>No rating</span>;
    }
    return (
        <span aria-label={`${rating} out of 5 stars`}>
            {Array.from({ length: 5 }, (_, i) => (
                <span
                    key={i}
                    aria-hidden="true"
                    style={{
                        color: i < rating ? '#f59e0b' : '#d1d5db',
                        fontSize: '0.875rem',
                    }}
                >
                    ★
                </span>
            ))}
        </span>
    );
}

export function ListenerHistoryPage() {
    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
        const q = query.toLowerCase().trim();
        if (!q) return HISTORY;
        return HISTORY.filter(
            (c) =>
                c.topic.toLowerCase().includes(q) ||
                c.date.toLowerCase().includes(q)
        );
    }, [query]);

    return (
        <main style={{ maxWidth: '720px', margin: '0 auto', padding: '3rem 1.5rem', fontFamily: 'inherit' }}>
            {/* ── Heading ── */}
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#111827', margin: '0 0 0.375rem' }}>
                Chat History
            </h1>
            <p style={{ fontSize: '0.9375rem', color: '#6b7280', margin: '0 0 1.75rem' }}>
                A record of all your completed support sessions.
            </p>

            {/* ── Search ── */}
            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                <span
                    aria-hidden="true"
                    style={{
                        position: 'absolute',
                        left: '0.875rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '1rem',
                        color: '#9ca3af',
                        pointerEvents: 'none',
                    }}
                >
                    🔍
                </span>
                <input
                    type="search"
                    placeholder="Search by topic or date…"
                    aria-label="Search chat history"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '0.625rem 1rem 0.625rem 2.5rem',
                        borderRadius: '0.625rem',
                        border: '1px solid #e5e7eb',
                        fontSize: '0.9375rem',
                        color: '#111827',
                        background: '#f9fafb',
                        outline: 'none',
                    }}
                />
            </div>

            {/* ── Table ── */}
            {filtered.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#9ca3af', marginTop: '3rem' }}>
                    No sessions match your search.
                </p>
            ) : (
                <div style={{ borderRadius: '0.875rem', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                    {/* Header row */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 2fr 90px 110px',
                            padding: '0.625rem 1.25rem',
                            background: '#f3f4f6',
                            borderBottom: '1px solid #e5e7eb',
                        }}
                    >
                        {['Date', 'Topic', 'Duration', 'Rating'].map((h) => (
                            <span
                                key={h}
                                style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                            >
                                {h}
                            </span>
                        ))}
                    </div>

                    {/* Data rows */}
                    {filtered.map((chat, idx) => (
                        <div
                            key={chat.id}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 2fr 90px 110px',
                                alignItems: 'center',
                                padding: '0.875rem 1.25rem',
                                background: idx % 2 === 0 ? '#fff' : '#f9fafb',
                                borderBottom: idx < filtered.length - 1 ? '1px solid #f3f4f6' : 'none',
                                transition: 'background 0.1s',
                            }}
                        >
                            <span style={{ fontSize: '0.8125rem', color: '#6b7280', whiteSpace: 'nowrap' }}>
                                {chat.date}
                            </span>
                            <span style={{ fontSize: '0.9rem', color: '#111827', fontWeight: 500, paddingRight: '0.5rem' }}>
                                {chat.topic}
                            </span>
                            <span style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                                {chat.duration}
                            </span>
                            <StarRating rating={chat.rating} />
                        </div>
                    ))}
                </div>
            )}

            {/* ── Row count ── */}
            {query && (
                <p style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: '#9ca3af', textAlign: 'right' }}>
                    {filtered.length} of {HISTORY.length} sessions
                </p>
            )}
        </main>
    );
}
