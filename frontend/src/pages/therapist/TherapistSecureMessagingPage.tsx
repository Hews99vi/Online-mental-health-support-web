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

interface ThreadMessage {
    id: string;
    therapistUserId: string;
    clientUserId: string;
    appointmentId: string | null;
    senderRole: 'therapist' | 'client';
    text: string;
    createdAt: string;
}

interface ThreadResponse {
    data: {
        items: ThreadMessage[];
    };
}

interface PostThreadResponse {
    data: {
        message: ThreadMessage;
    };
}

export function TherapistSecureMessagingPage() {
    const [clients, setClients] = useState<TherapistClient[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [messages, setMessages] = useState<ThreadMessage[]>([]);
    const [draft, setDraft] = useState('');
    const [loadingClients, setLoadingClients] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        void http
            .get<ClientsResponse>('/therapist/clients', { signal: controller.signal })
            .then((response) => {
                setClients(response.data.items);
                if (response.data.items.length > 0) {
                    setSelectedClientId(response.data.items[0].id);
                }
            })
            .catch((err: unknown) => {
                if ((err as { name?: string }).name === 'AbortError') return;
                setError((err as { message?: string }).message ?? 'Failed to load clients.');
            })
            .finally(() => setLoadingClients(false));
        return () => controller.abort();
    }, []);

    useEffect(() => {
        if (!selectedClientId) {
            setMessages([]);
            return;
        }
        const controller = new AbortController();
        setLoadingMessages(true);
        setError(null);
        void http
            .get<ThreadResponse>(`/therapist/clients/${selectedClientId}/messages`, { signal: controller.signal })
            .then((response) => setMessages(response.data.items))
            .catch((err: unknown) => {
                if ((err as { name?: string }).name === 'AbortError') return;
                setError((err as { message?: string }).message ?? 'Failed to load secure thread.');
            })
            .finally(() => setLoadingMessages(false));
        return () => controller.abort();
    }, [selectedClientId]);

    const selectedClient = useMemo(
        () => clients.find((client) => client.id === selectedClientId) ?? null,
        [clients, selectedClientId]
    );

    const sendMessage = async () => {
        const text = draft.trim();
        if (!text || !selectedClientId) return;
        setSending(true);
        setError(null);
        try {
            const response = await http.post<PostThreadResponse>(
                `/therapist/clients/${selectedClientId}/messages`,
                { text }
            );
            setMessages((prev) => [...prev, response.data.message]);
            setDraft('');
        } catch (err: unknown) {
            setError((err as { message?: string }).message ?? 'Failed to send message.');
        } finally {
            setSending(false);
        }
    };

    return (
        <main style={{ maxWidth: '980px', margin: '0 auto', padding: '2rem 1.5rem', fontFamily: 'inherit' }}>
            <h1 style={{ margin: 0, fontSize: '1.6rem', color: '#111827' }}>Secure Client Messaging</h1>
            <p style={{ margin: '0.4rem 0 1.2rem', color: '#6b7280', fontSize: '0.9rem' }}>
                Appointment-linked therapist-client communication thread.
            </p>

            {error && (
                <p role="alert" style={{ margin: '0 0 1rem', color: '#b91c1c', fontSize: '0.875rem' }}>
                    {error}
                </p>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1rem' }}>
                <section style={{ border: '1px solid #e5e7eb', borderRadius: '0.875rem', background: '#fff', padding: '0.8rem' }}>
                    <h2 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', color: '#111827' }}>Clients</h2>
                    {loadingClients ? (
                        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.85rem' }}>Loading clients...</p>
                    ) : clients.length === 0 ? (
                        <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.85rem' }}>No clients available.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                            {clients.map((client) => (
                                <button
                                    key={client.id}
                                    type="button"
                                    onClick={() => setSelectedClientId(client.id)}
                                    style={{
                                        textAlign: 'left',
                                        padding: '0.55rem 0.65rem',
                                        borderRadius: '0.55rem',
                                        border: '1px solid #e5e7eb',
                                        background: selectedClientId === client.id ? '#eef2ff' : '#fff',
                                        color: '#111827',
                                        fontSize: '0.85rem',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <div style={{ fontWeight: 600 }}>{client.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{client.email ?? 'No email'}</div>
                                </button>
                            ))}
                        </div>
                    )}
                </section>

                <section style={{ border: '1px solid #e5e7eb', borderRadius: '0.875rem', background: '#fff', display: 'flex', flexDirection: 'column', minHeight: '520px' }}>
                    <div style={{ padding: '0.8rem 1rem', borderBottom: '1px solid #f1f5f9' }}>
                        <strong style={{ color: '#111827' }}>
                            {selectedClient ? selectedClient.name : 'Select a client'}
                        </strong>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                        {loadingMessages ? (
                            <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>Loading thread...</p>
                        ) : messages.length === 0 ? (
                            <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>No messages yet.</p>
                        ) : (
                            messages.map((message) => {
                                const mine = message.senderRole === 'therapist';
                                return (
                                    <div key={message.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                                        <div style={{ maxWidth: '70%', background: mine ? '#4f46e5' : '#f8fafc', color: mine ? '#fff' : '#111827', border: `1px solid ${mine ? '#4f46e5' : '#e2e8f0'}`, borderRadius: '0.8rem', padding: '0.5rem 0.7rem' }}>
                                            <div style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: '0.88rem' }}>{message.text}</div>
                                            <div style={{ marginTop: '0.2rem', fontSize: '0.7rem', opacity: 0.8 }}>
                                                {new Date(message.createdAt).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                    <div style={{ borderTop: '1px solid #f1f5f9', padding: '0.7rem 0.8rem', display: 'flex', gap: '0.55rem' }}>
                        <textarea
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            rows={2}
                            placeholder={selectedClientId ? 'Write a secure message...' : 'Select a client first'}
                            disabled={!selectedClientId || sending}
                            style={{ flex: 1, resize: 'vertical', borderRadius: '0.55rem', border: '1px solid #d1d5db', padding: '0.55rem 0.65rem', fontFamily: 'inherit', fontSize: '0.875rem' }}
                        />
                        <button
                            type="button"
                            onClick={() => void sendMessage()}
                            disabled={!selectedClientId || !draft.trim() || sending}
                            style={{ border: 'none', borderRadius: '0.55rem', padding: '0 1rem', background: '#4f46e5', color: '#fff', fontWeight: 600, cursor: 'pointer', opacity: !selectedClientId || !draft.trim() || sending ? 0.6 : 1 }}
                        >
                            {sending ? 'Sending...' : 'Send'}
                        </button>
                    </div>
                </section>
            </div>
        </main>
    );
}
