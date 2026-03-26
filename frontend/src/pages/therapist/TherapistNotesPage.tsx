import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { http } from '../../api/http';

interface TherapistAppointment {
    id: string;
    userId: string;
    userName?: string;
    userEmail?: string | null;
    start: string;
    end: string;
    status: 'requested' | 'confirmed' | 'cancelled' | 'completed';
    therapistNotes?: string;
}

interface TherapistAppointmentsResponse {
    data: {
        items: TherapistAppointment[];
        total?: number;
    };
}

interface SaveNoteResponse {
    data: {
        appointment: TherapistAppointment;
    };
}

interface NoteModalProps {
    session: TherapistAppointment;
    existing: string;
    onSave: (text: string) => Promise<void>;
    onClose: () => void;
}

function statusColor(status: TherapistAppointment['status']) {
    if (status === 'completed') return { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' };
    if (status === 'confirmed') return { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' };
    if (status === 'requested') return { bg: '#fef3c7', color: '#92400e', border: '#fde68a' };
    return { bg: '#f3f4f6', color: '#6b7280', border: '#d1d5db' };
}

function NoteModal({ session, existing, onSave, onClose }: NoteModalProps) {
    const [text, setText] = useState(existing);
    const [saving, setSaving] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        textareaRef.current?.focus();
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose();
            if (e.key === 'Tab') {
                const focusable = modalRef.current?.querySelectorAll<HTMLElement>('button, textarea');
                if (!focusable || focusable.length === 0) return;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        }
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const hasExisting = existing.trim().length > 0;

    return (
        <div
            role="presentation"
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}
        >
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                onClick={(e) => e.stopPropagation()}
                style={{ background: '#fff', borderRadius: '1rem', padding: '1.75rem', width: '100%', maxWidth: '540px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h2 id="modal-title" style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#111827' }}>
                            {hasExisting ? 'Update Session Note' : 'Create Session Note'}
                        </h2>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: '#6b7280' }}>
                            {session.userName ?? `Client ${session.userId.slice(0, 6)}`} · {new Date(session.start).toLocaleString()}
                        </p>
                    </div>
                    <button type="button" aria-label="Close modal" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#9ca3af', lineHeight: 1, padding: '0.25rem' }}>
                        ×
                    </button>
                </div>

                <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Write your session notes..."
                    aria-label="Session note content"
                    rows={8}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem', borderRadius: '0.625rem', border: '1px solid #e5e7eb', fontSize: '0.9rem', color: '#111827', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6, outline: 'none' }}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.625rem' }}>
                    <button type="button" onClick={onClose} style={{ padding: '0.5rem 1.125rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={!text.trim() || saving}
                        onClick={async () => {
                            setSaving(true);
                            await onSave(text.trim());
                            setSaving(false);
                            onClose();
                        }}
                        style={{ padding: '0.5rem 1.25rem', borderRadius: '0.5rem', border: 'none', background: text.trim() ? '#6366f1' : '#e5e7eb', color: text.trim() ? '#fff' : '#9ca3af', fontSize: '0.875rem', fontWeight: 600, cursor: text.trim() ? 'pointer' : 'not-allowed' }}
                    >
                        {saving ? 'Saving...' : hasExisting ? 'Update Note' : 'Create Note'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function TherapistNotesPage() {
    const [searchParams] = useSearchParams();
    const clientId = searchParams.get('clientId');

    const [activeId, setActiveId] = useState<string | null>(null);
    const [sessions, setSessions] = useState<TherapistAppointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError(null);
        const path = clientId
            ? `/therapist/clients/${clientId}/appointments`
            : '/appointments/therapist';

        void http
            .get<TherapistAppointmentsResponse>(path, { signal: controller.signal })
            .then((response) => setSessions(response.data.items))
            .catch((err: unknown) => {
                if ((err as { name?: string }).name === 'AbortError') return;
                setError((err as { message?: string }).message ?? 'Failed to load therapist appointments.');
            })
            .finally(() => setLoading(false));
        return () => controller.abort();
    }, [clientId]);

    const activeSession = sessions.find((session) => session.id === activeId) ?? null;
    const noteSessions = useMemo(
        () => sessions.filter((session) => session.status !== 'cancelled'),
        [sessions]
    );

    const selectedClientName = useMemo(() => {
        const withName = sessions.find((session) => session.userName)?.userName;
        return withName ?? null;
    }, [sessions]);

    async function saveNote(sessionId: string, text: string) {
        const response = await http.put<SaveNoteResponse>(`/appointments/${sessionId}/notes`, {
            therapistNotes: text,
        });
        const updated = response.data.appointment;
        setSessions((prev) =>
            prev.map((item) =>
                item.id === sessionId ? { ...item, therapistNotes: updated.therapistNotes } : item
            )
        );
    }

    async function deleteNote(sessionId: string) {
        if (!window.confirm('Delete this session note?')) return;
        setIsDeletingId(sessionId);
        try {
            const response = await http.delete<SaveNoteResponse>(`/appointments/${sessionId}/notes`);
            const updated = response.data.appointment;
            setSessions((prev) =>
                prev.map((item) =>
                    item.id === sessionId ? { ...item, therapistNotes: updated.therapistNotes } : item
                )
            );
        } catch (err: unknown) {
            setError((err as { message?: string }).message ?? 'Failed to delete note.');
        } finally {
            setIsDeletingId(null);
        }
    }

    return (
        <>
            <main style={{ maxWidth: '760px', margin: '0 auto', padding: '3rem 1.5rem', fontFamily: 'inherit' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#111827', margin: '0 0 0.375rem' }}>
                    Session Notes
                </h1>
                <p style={{ fontSize: '0.9375rem', color: '#6b7280', margin: '0 0 0.5rem' }}>
                    {clientId ? `Client focus: ${selectedClientName ?? clientId}` : 'All clients and appointments'}
                </p>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 2rem' }}>
                    {loading ? 'Loading...' : `${noteSessions.filter((s) => Boolean(s.therapistNotes)).length} of ${noteSessions.length} appointments have notes`}
                </p>

                {error && (
                    <p role="alert" style={{ fontSize: '0.875rem', color: '#dc2626', margin: '0 0 1rem' }}>
                        {error}
                    </p>
                )}

                {loading ? (
                    <p style={{ color: '#6b7280' }}>Loading sessions...</p>
                ) : noteSessions.length === 0 ? (
                    <p style={{ color: '#9ca3af' }}>No appointments available for notes yet.</p>
                ) : (
                    <ul role="list" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {noteSessions.map((session) => {
                            const saved = Boolean(session.therapistNotes);
                            const noteText = session.therapistNotes ?? '';
                            const badge = statusColor(session.status);

                            return (
                                <li
                                    key={session.id}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '1rem 1.25rem', borderRadius: '0.875rem', border: `1px solid ${saved ? '#a7f3d0' : '#e5e7eb'}`, background: saved ? '#f0fdf4' : '#fff' }}
                                >
                                    <div style={{ minWidth: 0 }}>
                                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9375rem', color: '#111827' }}>
                                            {session.userName ?? `Client ${session.userId.slice(0, 8)}`}
                                        </p>
                                        <p style={{ margin: '0.2rem 0 0', fontSize: '0.8125rem', color: '#6b7280' }}>
                                            {new Date(session.start).toLocaleString()}
                                        </p>
                                        <div style={{ marginTop: '0.3rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.18rem 0.58rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                                            {session.status}
                                        </div>
                                        {saved && (
                                            <p style={{ margin: '0.35rem 0 0', fontSize: '0.8125rem', color: '#065f46', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '360px' }}>
                                                "{noteText.slice(0, 80)}{noteText.length > 80 ? '…' : ''}"
                                            </p>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                                        <button
                                            type="button"
                                            aria-label={`${saved ? 'Edit' : 'Write'} note for appointment ${session.id}`}
                                            onClick={() => setActiveId(session.id)}
                                            style={{ padding: '0.45rem 0.9rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', background: saved ? '#fff' : '#6366f1', color: saved ? '#374151' : '#fff', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}
                                        >
                                            {saved ? 'Edit' : 'Write'}
                                        </button>
                                        {saved && (
                                            <button
                                                type="button"
                                                aria-label={`Delete note for appointment ${session.id}`}
                                                disabled={isDeletingId === session.id}
                                                onClick={() => void deleteNote(session.id)}
                                                style={{ padding: '0.45rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #fecaca', background: '#fff5f5', color: '#dc2626', fontSize: '0.8125rem', fontWeight: 600, cursor: isDeletingId === session.id ? 'not-allowed' : 'pointer' }}
                                            >
                                                {isDeletingId === session.id ? 'Deleting...' : 'Delete'}
                                            </button>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </main>

            {activeSession && (
                <NoteModal
                    session={activeSession}
                    existing={activeSession.therapistNotes ?? ''}
                    onSave={(text) => saveNote(activeSession.id, text)}
                    onClose={() => setActiveId(null)}
                />
            )}
        </>
    );
}
