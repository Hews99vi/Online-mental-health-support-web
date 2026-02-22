import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PhoneOff, Flag, AlertTriangle, ChevronLeft } from 'lucide-react';
import { connectSocket, emitRoomJoin, emitRoomLeave, emitMessageSend, emitTyping } from '../../api/socket';
import type { ChatMessage, ChatCounterpart, MatchedPayload, MessageNewPayload, PeerTypingPayload, PeerLeftPayload } from '../../api/socket';
import { http } from '../../api/http';
import { ChatMessageList } from './components/ChatMessageList';
import { ChatComposer } from './components/ChatComposer';
import { TypingIndicator } from './components/TypingIndicator';
import { ReportConversationModal } from './components/ReportConversationModal';
import styles from './Chat.module.css';

// ── Crypto stub ────────────────────────────────────────────────────────────────
/**
 * encryptDraft — placeholder encryption.
 * TODO: replace with libsodium / Web Crypto API once keys are exchanged.
 * For now returns the plaintext wrapped in a base64 envelope so the
 * server shape is correct from day one.
 */
function encryptDraft(plaintext: string): string {
    return btoa(unescape(encodeURIComponent(`plain:${plaintext}`)));
}

function decryptCipher(ciphertext: string): string {
    try {
        const decoded = decodeURIComponent(escape(atob(ciphertext)));
        if (decoded.startsWith('plain:')) return decoded.slice(6);
    } catch { /* fall through */ }
    return ciphertext;
}

// ── REST: history pagination ──────────────────────────────────────────────────

interface HistoryPage {
    messages: ChatMessage[];
    nextCursor?: string;
}

async function fetchHistory(roomId: string, cursor?: string): Promise<HistoryPage> {
    const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
    return http.get<HistoryPage>(`/chat/rooms/${roomId}/messages${qs}`);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

let msgCounter = 0;
function mkClientMsgId(): string { return `c${++msgCounter}-${Date.now()}`; }

function initials(alias: string): string {
    return alias.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ChatRoom() {
    const { roomId } = useParams<{ roomId: string }>();
    const navigate = useNavigate();

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [peerTyping, setPeerTyping] = useState(false);
    // Counterpart info: restored from router state (lobby → room navigation)
    // or hydrated via socket if user enters room URL directly.
    const [counterpart, setCounterpart] = useState<ChatCounterpart | null>(
        (history.state?.usr?.counterpart as ChatCounterpart | undefined) ?? null
    );
    const [sessionEnded, setSessionEnded] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [reportOpen, setReportOpen] = useState(false);

    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const myTypingRef = useRef(false);

    // ── Socket setup ───────────────────────────────────────────────────────────

    useEffect(() => {
        if (!roomId) return;
        const s = connectSocket();

        // Fetch REST history then join socket room
        setIsLoadingHistory(true);
        fetchHistory(roomId)
            .then(({ messages: hist }) => {
                const decrypted = hist.map(m => ({ ...m, plaintext: decryptCipher(m.ciphertext) }));
                setMessages(decrypted);
            })
            .catch(() => { /* server might not exist yet — that's fine */ })
            .finally(() => {
                setIsLoadingHistory(false);
                emitRoomJoin({ roomId });
            });

        s.on('chat:matched', ({ counterpart: cp }: MatchedPayload) => {
            setCounterpart(cp);
        });

        s.on('chat:message:new', ({ message }: MessageNewPayload) => {
            setMessages(prev => [
                ...prev,
                { ...message, plaintext: decryptCipher(message.ciphertext) },
            ]);
        });

        s.on('chat:typing', ({ isTyping }: PeerTypingPayload) => {
            setPeerTyping(isTyping);
        });

        s.on('chat:peer:left', ({ roomId: rid }: PeerLeftPayload) => {
            if (rid === roomId) setSessionEnded(true);
        });

        return () => {
            s.off('chat:message:new');
            s.off('chat:typing');
            s.off('chat:peer:left');
            emitRoomLeave({ roomId });
        };
    }, [roomId]);

    // ── Send message ───────────────────────────────────────────────────────────

    const handleSend = useCallback(async (text: string) => {
        if (!roomId || !text.trim()) return;
        const clientMsgId = mkClientMsgId();
        const ciphertext = encryptDraft(text.trim());

        // Optimistic insert
        const optimistic: ChatMessage = {
            id: clientMsgId,
            clientMsgId,
            roomId,
            senderId: 'me',
            ciphertext,
            plaintext: text.trim(),
            sentAt: new Date().toISOString(),
            status: 'sending',
        };
        setMessages(prev => [...prev, optimistic]);

        // Stop "typing" indicator
        if (myTypingRef.current) {
            emitTyping({ roomId, isTyping: false });
            myTypingRef.current = false;
        }

        try {
            const ack = await emitMessageSend({ roomId, clientMsgId, ciphertext });
            setMessages(prev =>
                prev.map(m => m.clientMsgId === clientMsgId
                    ? { ...m, status: ack.ok ? 'delivered' : 'failed', id: ack.serverMsgId ?? m.id }
                    : m
                )
            );
        } catch {
            setMessages(prev =>
                prev.map(m => m.clientMsgId === clientMsgId ? { ...m, status: 'failed' } : m)
            );
        }
    }, [roomId]);

    // ── Typing signal ──────────────────────────────────────────────────────────

    const handleTypingChange = useCallback((isTyping: boolean) => {
        if (!roomId) return;
        if (isTyping && !myTypingRef.current) {
            myTypingRef.current = true;
            emitTyping({ roomId, isTyping: true });
        }
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (isTyping) {
            typingTimeoutRef.current = setTimeout(() => {
                emitTyping({ roomId, isTyping: false });
                myTypingRef.current = false;
            }, 3000);
        } else if (myTypingRef.current) {
            emitTyping({ roomId, isTyping: false });
            myTypingRef.current = false;
        }
    }, [roomId]);

    // ── End session ────────────────────────────────────────────────────────────

    const handleEndChat = () => {
        if (!window.confirm('End this chat session? This cannot be undone.')) return;
        if (roomId) emitRoomLeave({ roomId });
        setSessionEnded(true);
    };

    const handleBackToLobby = () => navigate('/chat', { replace: true });

    const peerAlias = counterpart?.alias ?? 'Anonymous';
    const peerInitials = initials(peerAlias);

    return (
        <div className={styles.room}>
            {/* ── Header ─── */}
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
                        {counterpart?.role ?? 'listener'} · anonymous session
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
                        onClick={handleEndChat}
                        disabled={sessionEnded}
                        aria-label="End chat session"
                    >
                        <PhoneOff size={14} aria-hidden="true" />
                        <span>End</span>
                    </button>
                </div>
            </header>

            {/* ── Messages ─── */}
            <div className={styles.messageArea} role="log" aria-live="polite" aria-label="Chat messages">
                {isLoadingHistory && (
                    <p className={styles.systemMsg}>Loading history…</p>
                )}
                <ChatMessageList messages={messages} />
                <TypingIndicator peerAlias={peerAlias} isTyping={peerTyping} />
            </div>

            {/* ── Session ended banner ─── */}
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

            {/* ── Composer ─── */}
            {!sessionEnded && (
                <ChatComposer
                    onSend={handleSend}
                    onTypingChange={handleTypingChange}
                    disabled={sessionEnded}
                />
            )}

            {/* ── Report modal ─── */}
            <ReportConversationModal
                isOpen={reportOpen}
                roomId={roomId ?? ''}
                onClose={() => setReportOpen(false)}
            />
        </div>
    );
}
