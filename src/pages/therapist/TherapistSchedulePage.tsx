import { useState } from 'react';

type SessionStatus = 'Upcoming' | 'In Progress' | 'Completed' | 'Cancelled';
type SessionType = 'Video Call' | 'Audio Call' | 'Chat';

interface ScheduledSession {
    id: string;
    client: string;
    time: string;
    type: SessionType;
    status: SessionStatus;
}

const SESSIONS: ScheduledSession[] = [
    { id: '1', client: 'Amara S.', time: 'Today · 09:00 AM', type: 'Video Call', status: 'Completed' },
    { id: '2', client: 'Rohan M.', time: 'Today · 11:30 AM', type: 'Audio Call', status: 'In Progress' },
    { id: '3', client: 'Priya K.', time: 'Today · 02:00 PM', type: 'Video Call', status: 'Upcoming' },
    { id: '4', client: 'Daniel W.', time: 'Tomorrow · 10:00 AM', type: 'Chat', status: 'Upcoming' },
    { id: '5', client: 'Linh T.', time: 'Tomorrow · 01:00 PM', type: 'Video Call', status: 'Upcoming' },
    { id: '6', client: 'Samuel O.', time: 'Feb 22 · 03:30 PM', type: 'Audio Call', status: 'Cancelled' },
];

const STATUS_STYLES: Record<SessionStatus, { bg: string; color: string; border: string }> = {
    'Upcoming': { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
    'In Progress': { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
    'Completed': { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' },
    'Cancelled': { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
};

const TYPE_ICON: Record<SessionType, string> = {
    'Video Call': '📹',
    'Audio Call': '📞',
    'Chat': '💬',
};

export function TherapistSchedulePage() {
    const [expanded, setExpanded] = useState<string | null>(null);

    return (
        <main style={{ maxWidth: '680px', margin: '0 auto', padding: '3rem 1.5rem', fontFamily: 'inherit' }}>
            {/* ── Heading ── */}
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#111827', margin: '0 0 0.375rem' }}>
                My Schedule
            </h1>
            <p style={{ fontSize: '0.9375rem', color: '#6b7280', margin: '0 0 2rem' }}>
                {SESSIONS.filter((s) => s.status === 'Upcoming' || s.status === 'In Progress').length} upcoming sessions this week
            </p>

            {/* ── Session list ── */}
            <ul role="list" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {SESSIONS.map((session) => {
                    const statusStyle = STATUS_STYLES[session.status];
                    const isExpanded = expanded === session.id;

                    return (
                        <li
                            key={session.id}
                            style={{
                                borderRadius: '0.875rem',
                                border: `1px solid ${isExpanded ? '#6366f1' : '#e5e7eb'}`,
                                background: '#fff',
                                overflow: 'hidden',
                                transition: 'border-color 0.15s ease',
                            }}
                        >
                            {/* Main row */}
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '1rem',
                                    padding: '1rem 1.25rem',
                                }}
                            >
                                {/* Left: avatar + info */}
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
                                        {session.client.split(' ').map((w) => w[0]).join('')}
                                    </div>

                                    <div style={{ minWidth: 0 }}>
                                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9375rem', color: '#111827' }}>
                                            {session.client}
                                        </p>
                                        <p style={{ margin: '0.125rem 0 0', fontSize: '0.8125rem', color: '#6b7280' }}>
                                            <span aria-hidden="true">{TYPE_ICON[session.type]} </span>
                                            {session.type} · {session.time}
                                        </p>
                                    </div>
                                </div>

                                {/* Right: status badge + button */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                                    <span
                                        style={{
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            padding: '0.25rem 0.625rem',
                                            borderRadius: '999px',
                                            background: statusStyle.bg,
                                            color: statusStyle.color,
                                            border: `1px solid ${statusStyle.border}`,
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {session.status}
                                    </span>

                                    <button
                                        type="button"
                                        aria-expanded={isExpanded}
                                        aria-controls={`details-${session.id}`}
                                        aria-label={`${isExpanded ? 'Hide' : 'View'} details for ${session.client}`}
                                        onClick={() => setExpanded(isExpanded ? null : session.id)}
                                        style={{
                                            padding: '0.425rem 0.875rem',
                                            borderRadius: '0.5rem',
                                            border: '1px solid #e5e7eb',
                                            background: isExpanded ? '#6366f1' : '#fff',
                                            color: isExpanded ? '#fff' : '#374151',
                                            fontSize: '0.8125rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: 'background 0.15s ease, color 0.15s ease',
                                        }}
                                    >
                                        {isExpanded ? 'Close' : 'View Details'}
                                    </button>
                                </div>
                            </div>

                            {/* Expanded details panel */}
                            {isExpanded && (
                                <div
                                    id={`details-${session.id}`}
                                    style={{
                                        borderTop: '1px solid #f3f4f6',
                                        padding: '0.875rem 1.25rem',
                                        background: '#f9fafb',
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                                        gap: '0.75rem',
                                    }}
                                >
                                    {[
                                        { label: 'Client', value: session.client },
                                        { label: 'Time', value: session.time },
                                        { label: 'Type', value: session.type },
                                        { label: 'Status', value: session.status },
                                        { label: 'Duration', value: '50 min' },
                                        { label: 'Notes', value: 'No notes added yet' },
                                    ].map(({ label, value }) => (
                                        <div key={label}>
                                            <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                {label}
                                            </p>
                                            <p style={{ margin: '0.2rem 0 0', fontSize: '0.875rem', color: '#374151', fontWeight: 500 }}>
                                                {value}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>
        </main>
    );
}
