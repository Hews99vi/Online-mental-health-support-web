import { useState } from 'react';

const GUIDELINES = [
    {
        icon: '🤝',
        title: 'Respect boundaries',
        body: 'Always respect the user\'s emotional boundaries. Never push them to share more than they are comfortable with.',
    },
    {
        icon: '🚫',
        title: 'Do not give advice',
        body: 'Your role is to listen, not to advise. Avoid prescribing solutions, medications, or professional diagnoses.',
    },
    {
        icon: '🆘',
        title: 'Report crisis immediately',
        body: 'If a user expresses intent to harm themselves or others, use the in-app Report button and direct them to emergency services (119) without delay.',
    },
    {
        icon: '🔒',
        title: 'Maintain strict privacy',
        body: 'Never share, screenshot, or discuss any conversation content outside the platform. All sessions are confidential.',
    },
    {
        icon: '💬',
        title: 'Use active listening',
        body: 'Reflect, paraphrase, and validate feelings. Show empathy through your words and avoid interrupting the user.',
    },
    {
        icon: '⚖️',
        title: 'Stay neutral and non-judgmental',
        body: 'Do not express opinions on the user\'s choices, relationships, or lifestyle. Your role is to support, not to judge.',
    },
    {
        icon: '🛑',
        title: 'Know your limits',
        body: 'If a topic is outside your training or feels overwhelming, it is acceptable to say so and escalate to a qualified therapist.',
    },
    {
        icon: '🌱',
        title: 'Practise self-care',
        body: 'Listening to distressing content can affect you too. Take breaks between sessions and reach out to the support team if you need help.',
    },
];

export function ListenerSafetyPage() {
    const [understood, setUnderstood] = useState(false);
    const [confirmed, setConfirmed] = useState(false);

    function handleConfirm() {
        if (understood) setConfirmed(true);
    }

    return (
        <main style={{ maxWidth: '660px', margin: '0 auto', padding: '3rem 1.5rem', fontFamily: 'inherit' }}>
            {/* ── Heading ── */}
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#111827', margin: '0 0 0.375rem' }}>
                Safety Guidelines
            </h1>
            <p style={{ fontSize: '0.9375rem', color: '#6b7280', margin: '0 0 2rem' }}>
                Please read all guidelines carefully before going online as a listener.
            </p>

            {/* ── Guidelines list ── */}
            <ol
                role="list"
                style={{ listStyle: 'none', margin: '0 0 2rem', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
            >
                {GUIDELINES.map((g, i) => (
                    <li
                        key={i}
                        style={{
                            display: 'flex',
                            gap: '1rem',
                            padding: '1rem 1.125rem',
                            borderRadius: '0.75rem',
                            background: '#f9fafb',
                            border: '1px solid #e5e7eb',
                            alignItems: 'flex-start',
                        }}
                    >
                        {/* Icon */}
                        <span
                            aria-hidden="true"
                            style={{
                                fontSize: '1.375rem',
                                lineHeight: 1,
                                flexShrink: 0,
                                marginTop: '0.125rem',
                            }}
                        >
                            {g.icon}
                        </span>

                        <div>
                            <p style={{ margin: '0 0 0.25rem', fontWeight: 600, fontSize: '0.9375rem', color: '#111827' }}>
                                {g.title}
                            </p>
                            <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.6 }}>
                                {g.body}
                            </p>
                        </div>
                    </li>
                ))}
            </ol>

            {/* ── Divider ── */}
            <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '0 0 1.5rem' }} />

            {/* ── Checkbox + button ── */}
            {confirmed ? (
                <div
                    role="status"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.625rem',
                        padding: '0.875rem 1.25rem',
                        borderRadius: '0.75rem',
                        background: '#d1fae5',
                        border: '1px solid #6ee7b7',
                        color: '#065f46',
                        fontWeight: 600,
                        fontSize: '0.9375rem',
                    }}
                >
                    <span aria-hidden="true">✅</span>
                    Guidelines acknowledged. You're ready to go online.
                </div>
            ) : (
                <>
                    <label
                        style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.75rem',
                            cursor: 'pointer',
                            marginBottom: '1.25rem',
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={understood}
                            onChange={(e) => setUnderstood(e.target.checked)}
                            style={{ marginTop: '0.2rem', width: '18px', height: '18px', cursor: 'pointer', accentColor: '#6366f1', flexShrink: 0 }}
                        />
                        <span style={{ fontSize: '0.9375rem', color: '#374151', lineHeight: 1.55 }}>
                            I have read and understood all safety guidelines and agree to follow them while acting as a listener on this platform.
                        </span>
                    </label>

                    <button
                        type="button"
                        disabled={!understood}
                        onClick={handleConfirm}
                        aria-disabled={!understood}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '0.625rem',
                            border: 'none',
                            fontSize: '0.9375rem',
                            fontWeight: 600,
                            cursor: understood ? 'pointer' : 'not-allowed',
                            background: understood ? '#6366f1' : '#e5e7eb',
                            color: understood ? '#fff' : '#9ca3af',
                            transition: 'background 0.2s ease, color 0.2s ease',
                        }}
                    >
                        I Understand
                    </button>
                </>
            )}
        </main>
    );
}
