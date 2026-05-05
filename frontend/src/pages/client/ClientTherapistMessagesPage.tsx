import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageCircle, Send, Stethoscope } from 'lucide-react';
import { http } from '../../api/http';

interface TherapistThread {
    therapistId: string;
    therapistName: string;
    therapistInitials: string;
    latestMessage: {
        id: string;
        senderRole: 'therapist' | 'client';
        text: string;
        createdAt: string;
    } | null;
    latestAt: string | null;
}

interface ThreadMessage {
    id: string;
    therapistUserId: string;
    clientUserId: string;
    appointmentId: string | null;
    senderRole: 'therapist' | 'client';
    text: string;
    createdAt: string;
}

interface ThreadsResponse {
    data: {
        items: TherapistThread[];
    };
}

interface MessagesResponse {
    data: {
        items: ThreadMessage[];
    };
}

interface PostMessageResponse {
    data: {
        message: ThreadMessage;
    };
}

function formatTime(value: string | null) {
    if (!value) return 'No messages yet';
    return new Date(value).toLocaleString();
}

export function ClientTherapistMessagesPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const requestedTherapistId = searchParams.get('therapistId') ?? '';
    const [threads, setThreads] = useState<TherapistThread[]>([]);
    const [selectedTherapistId, setSelectedTherapistId] = useState(requestedTherapistId);
    const [messages, setMessages] = useState<ThreadMessage[]>([]);
    const [draft, setDraft] = useState('');
    const [loadingThreads, setLoadingThreads] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        setLoadingThreads(true);
        setError(null);
        void http
            .get<ThreadsResponse>('/client/therapist-messages', { signal: controller.signal })
            .then((response) => {
                const items = response.data.items;
                setThreads(items);
                const requestedExists = items.some((item) => item.therapistId === requestedTherapistId);
                const nextId = requestedExists ? requestedTherapistId : items[0]?.therapistId ?? '';
                setSelectedTherapistId(nextId);
                if (nextId && nextId !== requestedTherapistId) {
                    setSearchParams({ therapistId: nextId }, { replace: true });
                }
            })
            .catch((err: unknown) => {
                if ((err as { name?: string }).name === 'AbortError') return;
                setError((err as { message?: string }).message ?? 'Failed to load therapist messages.');
            })
            .finally(() => setLoadingThreads(false));
        return () => controller.abort();
    }, [requestedTherapistId, setSearchParams]);

    useEffect(() => {
        if (!selectedTherapistId) {
            setMessages([]);
            return;
        }

        const controller = new AbortController();
        setLoadingMessages(true);
        setError(null);
        void http
            .get<MessagesResponse>(`/client/therapists/${selectedTherapistId}/messages`, { signal: controller.signal })
            .then((response) => setMessages(response.data.items))
            .catch((err: unknown) => {
                if ((err as { name?: string }).name === 'AbortError') return;
                setError((err as { message?: string }).message ?? 'Failed to load this secure therapist conversation.');
            })
            .finally(() => setLoadingMessages(false));

        return () => controller.abort();
    }, [selectedTherapistId]);

    const selectedThread = useMemo(
        () => threads.find((thread) => thread.therapistId === selectedTherapistId) ?? null,
        [threads, selectedTherapistId]
    );

    const chooseThread = (therapistId: string) => {
        setSelectedTherapistId(therapistId);
        setSearchParams({ therapistId });
    };

    const sendMessage = async () => {
        const text = draft.trim();
        if (!text || !selectedTherapistId) return;

        setSending(true);
        setError(null);
        try {
            const response = await http.post<PostMessageResponse>(
                `/client/therapists/${selectedTherapistId}/messages`,
                { text }
            );
            setMessages((prev) => [...prev, response.data.message]);
            setThreads((prev) =>
                prev.map((thread) =>
                    thread.therapistId === selectedTherapistId
                        ? {
                            ...thread,
                            latestMessage: response.data.message,
                            latestAt: response.data.message.createdAt,
                        }
                        : thread
                )
            );
            setDraft('');
        } catch (err: unknown) {
            setError((err as { message?: string }).message ?? 'Failed to send therapist message.');
        } finally {
            setSending(false);
        }
    };

    return (
        <main style={{ maxWidth: '1040px', margin: '0 auto', padding: '2rem 1.5rem', fontFamily: 'inherit' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.4rem' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.7rem', color: '#111827' }}>Therapist Messages</h1>
                    <p style={{ margin: '0.35rem 0 0', color: '#6b7280', fontSize: '0.92rem' }}>
                        Secure therapist conversation for your booked care relationships.
                    </p>
                </div>
            </div>

            {error && (
                <p role="alert" style={{ margin: '0 0 1rem', color: '#b91c1c', fontSize: '0.875rem' }}>
                    {error}
                </p>
            )}

            {loadingThreads ? (
                <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Loading therapist message threads...</div>
            ) : threads.length === 0 ? (
                <section style={{ border: '1px solid #e5e7eb', borderRadius: '0.75rem', background: '#fff', padding: '3rem 1rem', textAlign: 'center' }}>
                    <Stethoscope size={44} aria-hidden="true" style={{ color: '#d1d5db', marginBottom: '0.8rem' }} />
                    <h2 style={{ margin: 0, fontSize: '1.05rem', color: '#374151' }}>No therapist messages yet</h2>
                    <p style={{ margin: '0.45rem auto 0', color: '#6b7280', fontSize: '0.9rem', maxWidth: '36rem' }}>
                        Secure therapist messaging becomes available after a therapist confirms your booking.
                    </p>
                </section>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '300px minmax(0, 1fr)', gap: '1rem' }}>
                    <section style={{ border: '1px solid #e5e7eb', borderRadius: '0.75rem', background: '#fff', padding: '0.8rem', minHeight: '560px' }}>
                        <h2 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', color: '#111827' }}>Booked therapists</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                            {threads.map((thread) => (
                                <button
                                    key={thread.therapistId}
                                    type="button"
                                    onClick={() => chooseThread(thread.therapistId)}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '2.25rem minmax(0, 1fr)',
                                        gap: '0.6rem',
                                        width: '100%',
                                        textAlign: 'left',
                                        padding: '0.65rem',
                                        borderRadius: '0.6rem',
                                        border: '1px solid #e5e7eb',
                                        background: selectedTherapistId === thread.therapistId ? '#ecfdf5' : '#fff',
                                        color: '#111827',
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    <span style={{ width: '2.25rem', height: '2.25rem', borderRadius: '999px', background: '#059669', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>
                                        {thread.therapistInitials}
                                    </span>
                                    <span style={{ minWidth: 0 }}>
                                        <span style={{ display: 'block', fontWeight: 650, fontSize: '0.88rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                            {thread.therapistName}
                                        </span>
                                        <span style={{ display: 'block', color: '#6b7280', fontSize: '0.75rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', marginTop: '0.15rem' }}>
                                            {thread.latestMessage?.text ?? 'Secure conversation available'}
                                        </span>
                                        <span style={{ display: 'block', color: '#9ca3af', fontSize: '0.7rem', marginTop: '0.2rem' }}>
                                            {formatTime(thread.latestAt)}
                                        </span>
                                    </span>
                                </button>
                            ))}
                        </div>
                    </section>

                    <section style={{ border: '1px solid #e5e7eb', borderRadius: '0.75rem', background: '#fff', display: 'flex', flexDirection: 'column', minHeight: '560px', minWidth: 0 }}>
                        <div style={{ padding: '0.8rem 1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <MessageCircle size={17} aria-hidden="true" style={{ color: '#059669' }} />
                            <strong style={{ color: '#111827' }}>
                                {selectedThread ? selectedThread.therapistName : 'Select a therapist'}
                            </strong>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '0.9rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {loadingMessages ? (
                                <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>Loading secure therapist conversation...</p>
                            ) : messages.length === 0 ? (
                                <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>No therapist messages in this conversation yet.</p>
                            ) : (
                                messages.map((message) => {
                                    const mine = message.senderRole === 'client';
                                    return (
                                        <div key={message.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                                            <div style={{ maxWidth: '72%', background: mine ? '#059669' : '#f8fafc', color: mine ? '#fff' : '#111827', border: `1px solid ${mine ? '#059669' : '#e2e8f0'}`, borderRadius: '0.75rem', padding: '0.55rem 0.7rem' }}>
                                                <div style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: '0.9rem' }}>{message.text}</div>
                                                <div style={{ marginTop: '0.25rem', fontSize: '0.7rem', opacity: 0.78 }}>
                                                    {new Date(message.createdAt).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div style={{ borderTop: '1px solid #f1f5f9', padding: '0.75rem 0.85rem', display: 'flex', gap: '0.55rem' }}>
                            <textarea
                                value={draft}
                                onChange={(event) => setDraft(event.target.value)}
                                rows={2}
                                placeholder={selectedTherapistId ? 'Write a secure therapist message...' : 'Select a therapist first'}
                                disabled={!selectedTherapistId || sending}
                                style={{ flex: 1, resize: 'vertical', borderRadius: '0.55rem', border: '1px solid #d1d5db', padding: '0.55rem 0.65rem', fontFamily: 'inherit', fontSize: '0.875rem', minWidth: 0 }}
                            />
                            <button
                                type="button"
                                onClick={() => void sendMessage()}
                                disabled={!selectedTherapistId || !draft.trim() || sending}
                                aria-label="Send secure therapist message"
                                style={{ border: 'none', borderRadius: '0.55rem', padding: '0 0.95rem', background: '#059669', color: '#fff', fontWeight: 650, cursor: 'pointer', opacity: !selectedTherapistId || !draft.trim() || sending ? 0.6 : 1, display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'inherit' }}
                            >
                                <Send size={16} aria-hidden="true" />
                                {sending ? 'Sending...' : 'Send'}
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </main>
    );
}
