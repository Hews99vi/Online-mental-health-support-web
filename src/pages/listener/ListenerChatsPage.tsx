import { useState } from 'react';

interface ChatSession {
    id: string;
    name: string;
    topic: string;
    startedAt: string;
}

const DUMMY_CHATS: ChatSession[] = [
    { id: '1', name: 'Anonymous Sunflower', topic: 'Anxiety & work stress', startedAt: '2 min ago' },
    { id: '2', name: 'Anonymous River', topic: 'Feeling lonely lately', startedAt: '11 min ago' },
    { id: '3', name: 'Anonymous Storm', topic: 'Trouble sleeping', startedAt: '24 min ago' },
    { id: '4', name: 'Anonymous Ember', topic: 'Relationship difficulties', startedAt: '38 min ago' },
    { id: '5', name: 'Anonymous Willow', topic: 'Low motivation / burnout', startedAt: '52 min ago' },
];

export function ListenerChatsPage() {
    const [opened, setOpened] = useState<string | null>(null);

    return (
        <main style={{ maxWidth: '640px', margin: '0 auto', padding: '3rem 1.5rem', fontFamily: 'inherit' }}>
            {/* ── Heading ── */}
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#111827', margin: '0 0 0.375rem' }}>
                Active Chats
            </h1>
            <p style={{ fontSize: '0.9375rem', color: '#6b7280', margin: '0 0 2rem' }}>
                {DUMMY_CHATS.length} ongoing sessions
            </p>

            {/* ── Chat list ── */}
            <ul role="list" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {DUMMY_CHATS.map((chat) => {
                    const isOpen = opened === chat.id;
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
                                border: `1px solid ${isOpen ? '#6366f1' : '#e5e7eb'}`,
                                transition: 'border-color 0.15s ease',
                            }}
                        >
                            {/* Avatar + info */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', minWidth: 0 }}>
                                {/* Initials avatar */}
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
                                    {chat.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                                </div>

                                <div style={{ minWidth: 0 }}>
                                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9375rem', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {chat.name}
                                    </p>
                                    <p style={{ margin: '0.125rem 0 0', fontSize: '0.8125rem', color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {chat.topic}
                                    </p>
                                    <p style={{ margin: '0.125rem 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>
                                        Started {chat.startedAt}
                                    </p>
                                </div>
                            </div>

                            {/* Open Chat button */}
                            <button
                                type="button"
                                aria-label={`Open chat with ${chat.name}`}
                                onClick={() => setOpened(chat.id)}
                                style={{
                                    flexShrink: 0,
                                    padding: '0.45rem 1rem',
                                    borderRadius: '0.5rem',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '0.8125rem',
                                    fontWeight: 600,
                                    background: isOpen ? '#6366f1' : '#ede9fe',
                                    color: isOpen ? '#fff' : '#4f46e5',
                                    transition: 'background 0.15s ease, color 0.15s ease',
                                }}
                            >
                                {isOpen ? 'Opened' : 'Open Chat'}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </main>
    );
}
