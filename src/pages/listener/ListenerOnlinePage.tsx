import { useState } from 'react';

export function ListenerOnlinePage() {
    const [isOnline, setIsOnline] = useState(false);

    return (
        <main
            style={{
                maxWidth: '480px',
                margin: '0 auto',
                padding: '3rem 1.5rem',
                fontFamily: 'inherit',
            }}
        >
            {/* ── Heading ── */}
            <h1
                style={{
                    fontSize: '1.875rem',
                    fontWeight: 700,
                    color: '#111827',
                    margin: '0 0 0.5rem',
                }}
            >
                Go Online
            </h1>
            <p style={{ fontSize: '0.9375rem', color: '#6b7280', margin: '0 0 2.5rem' }}>
                Switch on to start accepting anonymous chat requests.
            </p>

            {/* ── Toggle card ── */}
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
                    {/* ── Status badge ── */}
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
                        {/* pulse dot */}
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

                {/* ── Toggle button ── */}
                <button
                    type="button"
                    role="switch"
                    aria-checked={isOnline}
                    aria-label={isOnline ? 'Go offline' : 'Go online'}
                    onClick={() => setIsOnline((v) => !v)}
                    style={{
                        position: 'relative',
                        display: 'inline-flex',
                        alignItems: 'center',
                        width: '52px',
                        height: '28px',
                        borderRadius: '999px',
                        border: 'none',
                        cursor: 'pointer',
                        background: isOnline ? '#10b981' : '#d1d5db',
                        transition: 'background 0.2s ease',
                        flexShrink: 0,
                        padding: 0,
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

            {/* ── Contextual hint ── */}
            <p
                style={{
                    marginTop: '1rem',
                    fontSize: '0.8125rem',
                    color: '#9ca3af',
                    textAlign: 'center',
                }}
            >
                {isOnline
                    ? 'You are now visible to users seeking support.'
                    : 'You will not receive any chat requests while offline.'}
            </p>
        </main>
    );
}
