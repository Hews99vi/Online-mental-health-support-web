import { useState, useEffect, useRef } from 'react';

interface Session {
    id: string;
    client: string;
    date: string;
    type: string;
}

const SESSIONS: Session[] = [
    { id: '1', client: 'Amara Seneviratne', date: 'Today · 09:00 AM', type: 'Video Call' },
    { id: '2', client: 'Rohan Mendis', date: 'Today · 11:30 AM', type: 'Audio Call' },
    { id: '3', client: 'Priya Kumari', date: 'Feb 17, 2026 · 2:00 PM', type: 'Video Call' },
    { id: '4', client: 'Daniel Wijeratne', date: 'Feb 15, 2026 · 10:00 AM', type: 'Chat' },
    { id: '5', client: 'Linh Tran', date: 'Feb 14, 2026 · 1:00 PM', type: 'Video Call' },
    { id: '6', client: 'Samuel Okonkwo', date: 'Feb 12, 2026 · 3:30 PM', type: 'Audio Call' },
];

// ── Note Write Modal ───────────────────────────────────────────────────────────

interface NoteModalProps {
    session: Session;
    existing: string;
    onSave: (text: string) => void;
    onClose: () => void;
}

function NoteModal({ session, existing, onSave, onClose }: NoteModalProps) {
    const [text, setText] = useState(existing);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const closeRef = useRef<HTMLButtonElement>(null);

    // Focus textarea on open; trap focus inside modal
    useEffect(() => {
        textareaRef.current?.focus();

        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose();
            if (e.key === 'Tab') {
                const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
                    'button, textarea'
                );
                if (!focusable || focusable.length === 0) return;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault(); last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault(); first.focus();
                }
            }
        }
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const modalRef = useRef<HTMLDivElement>(null);

    return (
        /* Backdrop */
        <div
            role="presentation"
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}
        >
            {/* Dialog */}
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                onClick={(e) => e.stopPropagation()}
                style={{ background: '#fff', borderRadius: '1rem', padding: '1.75rem', width: '100%', maxWidth: '520px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h2 id="modal-title" style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#111827' }}>
                            Write Session Note
                        </h2>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: '#6b7280' }}>
                            {session.client} · {session.date}
                        </p>
                    </div>
                    <button
                        ref={closeRef}
                        type="button"
                        aria-label="Close modal"
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#9ca3af', lineHeight: 1, padding: '0.25rem' }}
                    >
                        ✕
                    </button>
                </div>

                {/* Textarea */}
                <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Write your session notes here — observations, progress, follow-up actions…"
                    aria-label="Session note content"
                    rows={7}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem', borderRadius: '0.625rem', border: '1px solid #e5e7eb', fontSize: '0.9rem', color: '#111827', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6, outline: 'none' }}
                />

                {/* Footer actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.625rem' }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{ padding: '0.5rem 1.125rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={!text.trim()}
                        onClick={() => { onSave(text.trim()); onClose(); }}
                        style={{ padding: '0.5rem 1.25rem', borderRadius: '0.5rem', border: 'none', background: text.trim() ? '#6366f1' : '#e5e7eb', color: text.trim() ? '#fff' : '#9ca3af', fontSize: '0.875rem', fontWeight: 600, cursor: text.trim() ? 'pointer' : 'not-allowed', transition: 'background 0.15s' }}
                    >
                        Save Note
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export function TherapistNotesPage() {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [notes, setNotes] = useState<Record<string, string>>({});

    const activeSession = SESSIONS.find((s) => s.id === activeId) ?? null;

    function saveNote(sessionId: string, text: string) {
        setNotes((prev) => ({ ...prev, [sessionId]: text }));
    }

    return (
        <>
            <main style={{ maxWidth: '660px', margin: '0 auto', padding: '3rem 1.5rem', fontFamily: 'inherit' }}>
                {/* ── Heading ── */}
                <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#111827', margin: '0 0 0.375rem' }}>
                    Session Notes
                </h1>
                <p style={{ fontSize: '0.9375rem', color: '#6b7280', margin: '0 0 2rem' }}>
                    {Object.keys(notes).length} of {SESSIONS.length} notes written
                </p>

                {/* ── Session list ── */}
                <ul role="list" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {SESSIONS.map((session) => {
                        const saved = !!notes[session.id];
                        const noteText = notes[session.id] ?? '';

                        return (
                            <li
                                key={session.id}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '1rem 1.25rem', borderRadius: '0.875rem', border: `1px solid ${saved ? '#a7f3d0' : '#e5e7eb'}`, background: saved ? '#f0fdf4' : '#fff', transition: 'all 0.15s' }}
                            >
                                {/* Info */}
                                <div style={{ minWidth: 0 }}>
                                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9375rem', color: '#111827' }}>
                                        {session.client}
                                    </p>
                                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.8125rem', color: '#6b7280' }}>
                                        {session.type} · {session.date}
                                    </p>
                                    {saved && (
                                        <p style={{ margin: '0.3rem 0 0', fontSize: '0.8125rem', color: '#065f46', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '320px' }}>
                                            "{noteText.slice(0, 60)}{noteText.length > 60 ? '…' : ''}"
                                        </p>
                                    )}
                                </div>

                                {/* Right side: badge + button */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}>
                                    {saved ? (
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '999px', background: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7' }}>
                                            ✓ Saved
                                        </span>
                                    ) : (
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '999px', background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                                            Needs note
                                        </span>
                                    )}

                                    <button
                                        type="button"
                                        aria-label={`${saved ? 'Edit' : 'Write'} note for ${session.client}`}
                                        onClick={() => setActiveId(session.id)}
                                        style={{ padding: '0.45rem 0.9rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', background: saved ? '#fff' : '#6366f1', color: saved ? '#374151' : '#fff', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s, color 0.15s' }}
                                    >
                                        {saved ? 'Edit' : 'Write Note'}
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </main>

            {/* ── Modal ── */}
            {activeSession && (
                <NoteModal
                    session={activeSession}
                    existing={notes[activeSession.id] ?? ''}
                    onSave={(text) => saveNote(activeSession.id, text)}
                    onClose={() => setActiveId(null)}
                />
            )}
        </>
    );
}
