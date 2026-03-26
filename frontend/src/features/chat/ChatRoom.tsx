import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PhoneOff, Flag, AlertTriangle, ChevronLeft } from 'lucide-react';
import { http } from '../../api/http';
import { useAuth } from '../../app/AuthContext';
import {
    connectSocket,
    joinSession,
    onReceiveMessage,
    onSessionClosed,
    onTyping,
    sendMessageRealtime,
    emitTypingRealtime,
    type SocketChatMessage,
} from '../../api/socket';
import { ChatMessageList } from './components/ChatMessageList';
import { ChatComposer } from './components/ChatComposer';
import { TypingIndicator } from './components/TypingIndicator';
import { ReportConversationModal } from './components/ReportConversationModal';
import type { ChatUiMessage } from './types';
import styles from './Chat.module.css';

interface SessionPayload {
    id: string;
    status: 'queued' | 'active' | 'closed';
    userId: string | null;
    listenerId: string | null;
    createdAt: string;
    closedAt: string | null;
}

interface MessagePayload {
    id: string;
    sessionId: string;
    senderRole: 'user' | 'listener';
    text: string;
    createdAt: string;
}

interface HistoryResponse {
    data: {
        session: SessionPayload;
        items: MessagePayload[];
    };
}

interface MessageResponse {
    data: {
        message: MessagePayload;
    };
}

interface SessionResponse {
    data: {
        session: SessionPayload;
    };
}

async function fetchHistory(sessionId: string): Promise<HistoryResponse['data']> {
    const response = await http.get<HistoryResponse>(`/chat/${sessionId}/messages`);
    return response.data;
}

async function sendMessageRest(sessionId: string, text: string): Promise<MessagePayload> {
    const response = await http.post<MessageResponse>(`/chat/${sessionId}/messages`, { text });
    return response.data.message;
}

async function closeSession(sessionId: string): Promise<SessionPayload> {
    const response = await http.post<SessionResponse>(`/chat/${sessionId}/close`);
    return response.data.session;
}

function initials(alias: string): string {
    return alias.split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase();
}

function mapUiMessage(message: MessagePayload, myRole: 'user' | 'listener'): ChatUiMessage {
    return {
        id: message.id,
        senderId: message.senderRole === myRole ? 'me' : message.senderRole,
        plaintext: message.text,
        sentAt: message.createdAt,
        status: 'delivered',
    };
}

function mapSocketMessage(message: SocketChatMessage, myRole: 'user' | 'listener'): ChatUiMessage {
    return {
        id: message.id,
        senderId: message.senderRole === myRole ? 'me' : message.senderRole,
        plaintext: message.text,
        sentAt: message.createdAt,
        status: 'delivered',
    };
}

function sortByTime(messages: ChatUiMessage[]): ChatUiMessage[] {
    return [...messages].sort((a, b) => {
        const delta = new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime();
        if (delta !== 0) return delta;
        return a.id.localeCompare(b.id);
    });
}

function mergeUniqueMessages(current: ChatUiMessage[], incoming: ChatUiMessage[]): ChatUiMessage[] {
    const byId = new Map(current.map((item) => [item.id, item]));
    for (const item of incoming) {
        byId.set(item.id, item);
    }
    const merged = sortByTime(Array.from(byId.values()));
    const deliveredByText = new Map<string, number[]>();
    for (const message of merged) {
        if (message.status !== 'delivered' || message.senderId !== 'me') continue;
        const ts = new Date(message.sentAt).getTime();
        if (!Number.isFinite(ts)) continue;
        const existing = deliveredByText.get(message.plaintext) ?? [];
        existing.push(ts);
        deliveredByText.set(message.plaintext, existing);
    }

    return merged.filter((message) => {
        if (message.status !== 'sending' || message.senderId !== 'me') return true;
        const candidates = deliveredByText.get(message.plaintext);
        if (!candidates || candidates.length === 0) return true;

        const pendingTime = new Date(message.sentAt).getTime();
        if (!Number.isFinite(pendingTime)) return true;

        return !candidates.some((deliveredTime) =>
            deliveredTime >= pendingTime && deliveredTime - pendingTime <= 30_000
        );
    });
}

let pendingCounter = 0;
function pendingId(): string {
    pendingCounter += 1;
    return `pending-${Date.now()}-${pendingCounter}`;
}

export function ChatRoom() {
    const { roomId } = useParams<{ roomId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [messages, setMessages] = useState<ChatUiMessage[]>([]);
    const [session, setSession] = useState<SessionPayload | null>(null);
    const [sessionEnded, setSessionEnded] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [reportOpen, setReportOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [peerTyping, setPeerTyping] = useState(false);
    const [realtimeReady, setRealtimeReady] = useState(false);

    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const myRole: 'user' | 'listener' = user?.role === 'listener' ? 'listener' : 'user';

    const loadHistory = useCallback(async () => {
        if (!roomId) return;
        try {
            const data = await fetchHistory(roomId);
            setSession(data.session);
            setSessionEnded(data.session.status === 'closed');
            const mapped = data.items.map((item) => mapUiMessage(item, myRole));
            setMessages((prev) => mergeUniqueMessages(prev, mapped));
            setError(null);
        } catch (err: unknown) {
            setError((err as { message?: string }).message ?? 'Failed to load chat history.');
        } finally {
            setIsLoadingHistory(false);
        }
    }, [roomId, myRole]);

    useEffect(() => {
        if (!roomId) return;
        setIsLoadingHistory(true);
        void loadHistory();

        pollRef.current = setInterval(() => {
            void loadHistory();
        }, 5000);

        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [roomId, loadHistory]);

    useEffect(() => {
        if (!roomId) return;
        const socket = connectSocket();
        setRealtimeReady(false);

        const handleConnect = async () => {
            try {
                const ack = await joinSession(roomId);
                setRealtimeReady(Boolean(ack.ok));
                if (!ack.ok) {
                    setError(ack.message ?? 'Realtime chat join denied. Using polling fallback.');
                }
            } catch {
                setRealtimeReady(false);
            }
        };

        socket.on('connect', handleConnect);
        if (socket.connected) {
            void handleConnect();
        }

        const offMessage = onReceiveMessage((message) => {
            if (message.sessionId !== roomId) return;
            const incoming = mapSocketMessage(message, myRole);
            setMessages((prev) => {
                const pendingIndex = prev.findIndex((item) =>
                    item.status === 'sending'
                    && item.senderId === 'me'
                    && item.plaintext === incoming.plaintext
                );
                if (pendingIndex >= 0) {
                    const next = [...prev];
                    next[pendingIndex] = incoming;
                    return mergeUniqueMessages([], next);
                }
                return mergeUniqueMessages(prev, [incoming]);
            });
        });

        const offTyping = onTyping((payload) => {
            if (payload.sessionId !== roomId) return;
            const fromPeer = payload.senderRole && payload.senderRole !== myRole;
            if (!fromPeer) return;
            setPeerTyping(Boolean(payload.isTyping));
        });

        const offSessionClosed = onSessionClosed((payload) => {
            if (payload.id !== roomId) return;
            setSession((prev) => (prev ? { ...prev, status: 'closed', closedAt: new Date().toISOString() } : prev));
            setSessionEnded(true);
        });

        return () => {
            socket.off('connect', handleConnect);
            offMessage();
            offTyping();
            offSessionClosed();
        };
    }, [roomId, myRole]);

    const handleSend = useCallback(async (text: string) => {
        if (!roomId || !text.trim()) return;
        const cleanText = text.trim();
        const tempId = pendingId();
        const optimistic: ChatUiMessage = {
            id: tempId,
            senderId: 'me',
            plaintext: cleanText,
            sentAt: new Date().toISOString(),
            status: 'sending',
        };
        setMessages((prev) => [...prev, optimistic]);

        try {
            if (realtimeReady) {
                const ack = await sendMessageRealtime(roomId, cleanText, tempId);
                if (!ack.ok) {
                    throw new Error(ack.message ?? 'Realtime send failed');
                }
            } else {
                const saved = await sendMessageRest(roomId, cleanText);
                setMessages((prev) => prev.map((item) => (
                    item.id === tempId ? mapUiMessage(saved, myRole) : item
                )));
            }
        } catch {
            setMessages((prev) => prev.map((item) => (
                item.id === tempId ? { ...item, status: 'failed' } : item
            )));
        }
    }, [roomId, myRole, realtimeReady]);

    const handleTypingChange = useCallback((isTyping: boolean) => {
        if (!roomId || !realtimeReady) return;
        emitTypingRealtime(roomId, isTyping);
        if (typingRef.current) clearTimeout(typingRef.current);
        if (isTyping) {
            typingRef.current = setTimeout(() => {
                emitTypingRealtime(roomId, false);
            }, 1200);
        }
    }, [roomId, realtimeReady]);

    useEffect(() => {
        return () => {
            if (typingRef.current) clearTimeout(typingRef.current);
        };
    }, []);

    const handleEndChat = async () => {
        if (!roomId) return;
        if (!window.confirm('End this chat session? This cannot be undone.')) return;
        try {
            const updated = await closeSession(roomId);
            setSession(updated);
            setSessionEnded(true);
        } catch (err: unknown) {
            setError((err as { message?: string }).message ?? 'Failed to close chat session.');
        }
    };

    const handleBackToLobby = () => navigate('/chat', { replace: true });

    const peerAlias = myRole === 'listener' ? 'Anonymous User' : 'Anonymous Listener';
    const peerInitials = initials(peerAlias);

    return (
        <div className={styles.room}>
            <header className={styles.roomHeader}>
                <button
                    type="button"
                    onClick={handleBackToLobby}
                    aria-label="Back to lobby"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', padding: '0.25rem', borderRadius: '0.375rem' }}
                >
                    <ChevronLeft size={20} aria-hidden="true" />
                </button>

                <div className={styles.peerAvatar} aria-hidden="true">{peerInitials}</div>

                <div className={styles.peerInfo}>
                    <div className={styles.peerName}>{peerAlias}</div>
                    <div className={styles.peerRole}>
                        <span className={styles.onlineDot} aria-hidden="true" />
                        {session?.status ?? 'queued'} {realtimeReady ? '- realtime connected' : '- polling fallback'}
                    </div>
                </div>

                <div className={styles.roomActions}>
                    <button
                        type="button"
                        className={`${styles.roomActionBtn} ${styles.crisis}`}
                        onClick={() => window.open('/crisis', '_blank')}
                        aria-label="Get crisis help"
                    >
                        <AlertTriangle size={14} aria-hidden="true" />
                        <span>Help</span>
                    </button>

                    <button
                        type="button"
                        className={styles.roomActionBtn}
                        onClick={() => setReportOpen(true)}
                        aria-label="Report this conversation"
                    >
                        <Flag size={14} aria-hidden="true" />
                        <span>Report</span>
                    </button>

                    <button
                        type="button"
                        className={`${styles.roomActionBtn} ${styles.danger}`}
                        onClick={() => void handleEndChat()}
                        disabled={sessionEnded}
                        aria-label="End chat session"
                    >
                        <PhoneOff size={14} aria-hidden="true" />
                        <span>End</span>
                    </button>
                </div>
            </header>

            <div className={styles.messageArea} role="log" aria-live="polite" aria-label="Chat messages">
                {isLoadingHistory && (
                    <p className={styles.systemMsg}>Loading history...</p>
                )}
                {error && (
                    <p className={styles.systemMsg} role="alert">{error}</p>
                )}
                {!isLoadingHistory && session?.status === 'queued' && (
                    <p className={styles.systemMsg}>Waiting for a listener to join this session.</p>
                )}
                <ChatMessageList messages={messages} />
                <TypingIndicator peerAlias={peerAlias} isTyping={peerTyping} />
            </div>

            {sessionEnded && (
                <div className={styles.endedBanner} role="status">
                    <AlertTriangle size={16} aria-hidden="true" />
                    This session has ended.{' '}
                    <button
                        type="button"
                        onClick={handleBackToLobby}
                        style={{ fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', color: '#b45309', textDecoration: 'underline', padding: 0 }}
                    >
                        Start a new chat
                    </button>
                </div>
            )}

            {!sessionEnded && (
                <ChatComposer
                    onSend={handleSend}
                    onTypingChange={handleTypingChange}
                    disabled={sessionEnded}
                />
            )}

            <ReportConversationModal
                isOpen={reportOpen}
                roomId={roomId ?? ''}
                onClose={() => setReportOpen(false)}
            />
        </div>
    );
}
