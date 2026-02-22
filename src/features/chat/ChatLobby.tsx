import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Headphones, Shield, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../app/AuthContext';
import { connectSocket, emitQueueJoin } from '../../api/socket';
import type { MatchedPayload, QueueStatusPayload } from '../../api/socket';
import styles from './Chat.module.css';

type QueueRole = 'user' | 'listener';

interface QueueState {
    active: boolean;
    position: number;
    estimatedWaitSecs: number;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ChatLobby() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Default role: listeners pick "listener", everyone else picks "user"
    const defaultRole: QueueRole = user?.role === 'listener' ? 'listener' : 'user';
    const [selectedRole, setSelectedRole] = useState<QueueRole>(defaultRole);
    const [queue, setQueue] = useState<QueueState>({ active: false, position: 0, estimatedWaitSecs: 0 });
    const [socketError, setSocketError] = useState<string | null>(null);
    const socketRef = useRef(connectSocket());

    useEffect(() => {
        const s = socketRef.current;

        s.on('chat:matched', ({ roomId }: MatchedPayload) => {
            navigate(`/chat/${roomId}`, { replace: true });
        });

        s.on('chat:queue:status', ({ position, estimatedWaitSecs }: QueueStatusPayload) => {
            setQueue(q => ({ ...q, position, estimatedWaitSecs }));
        });

        s.on('connect_error', (err: Error) => {
            setSocketError(`Connection error: ${err.message}`);
        });

        return () => {
            s.off('chat:matched');
            s.off('chat:queue:status');
            s.off('connect_error');
        };
    }, [navigate]);

    const handleJoinQueue = () => {
        setSocketError(null);
        emitQueueJoin({ role: selectedRole });
        setQueue({ active: true, position: 1, estimatedWaitSecs: 30 });
    };

    const handleLeaveQueue = () => {
        socketRef.current.emit('chat:queue:leave');
        setQueue({ active: false, position: 0, estimatedWaitSecs: 0 });
    };

    const waitMins = Math.ceil(queue.estimatedWaitSecs / 60);

    return (
        <div className={styles.lobby}>
            <div className={styles.lobbyCard}>
                {/* Icon */}
                <div className={styles.lobbyIcon}>
                    <MessageCircle size={32} aria-hidden="true" strokeWidth={1.75} />
                </div>

                {/* Heading */}
                <div>
                    <h1 className={styles.lobbyTitle}>Anonymous Support Chat</h1>
                    <p className={styles.lobbySubtitle}>
                        Connect with a trained listener or therapist — privately and anonymously.
                        No names, no history saved.
                    </p>
                </div>

                {/* Role picker */}
                {!queue.active && (
                    <div role="group" aria-labelledby="role-label" style={{ width: '100%' }}>
                        <p id="role-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                            Join as
                        </p>
                        <div className={styles.roleGrid}>
                            <button
                                type="button"
                                className={`${styles.roleBtn} ${selectedRole === 'user' ? styles.selected : ''}`}
                                onClick={() => setSelectedRole('user')}
                                aria-pressed={selectedRole === 'user'}
                            >
                                <span className={styles.roleBtnIcon}>
                                    <MessageCircle size={18} aria-hidden="true" />
                                </span>
                                <span>Seeking support</span>
                                <span style={{ fontSize: '0.72rem', color: 'inherit', opacity: 0.75 }}>Talk to a listener</span>
                            </button>
                            <button
                                type="button"
                                className={`${styles.roleBtn} ${selectedRole === 'listener' ? styles.selected : ''}`}
                                onClick={() => setSelectedRole('listener')}
                                aria-pressed={selectedRole === 'listener'}
                            >
                                <span className={styles.roleBtnIcon}>
                                    <Headphones size={18} aria-hidden="true" />
                                </span>
                                <span>Listener</span>
                                <span style={{ fontSize: '0.72rem', color: 'inherit', opacity: 0.75 }}>Support someone</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Queue status (aria-live so screen readers announce updates) */}
                <div aria-live="polite" aria-atomic="true" style={{ width: '100%' }}>
                    {queue.active && (
                        <div className={styles.queueStatus}>
                            <span className={styles.queueDot} aria-hidden="true" />
                            <Loader2 size={16} aria-hidden="true" style={{ animation: 'spin 1s linear infinite' }} />
                            Searching for a match… position #{queue.position}
                            {queue.estimatedWaitSecs > 0 && ` (~${waitMins} min)`}
                        </div>
                    )}
                </div>

                {/* Error */}
                {socketError && (
                    <p role="alert" style={{ fontSize: '0.875rem', color: '#dc2626', background: '#fef2f2', padding: '0.625rem 1rem', borderRadius: '0.5rem', margin: 0, width: '100%', textAlign: 'center' }}>
                        {socketError}
                    </p>
                )}

                {/* CTA */}
                {!queue.active ? (
                    <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        onClick={handleJoinQueue}
                        style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)', boxShadow: '0 4px 18px rgba(109,40,217,0.35)' }}
                    >
                        <MessageCircle size={18} aria-hidden="true" style={{ marginRight: '0.375rem' }} />
                        Start anonymous chat
                    </Button>
                ) : (
                    <Button variant="ghost" fullWidth onClick={handleLeaveQueue}>
                        Cancel — leave queue
                    </Button>
                )}

                {/* Privacy note */}
                <p className={styles.privacy}>
                    <Shield size={13} aria-hidden="true" />
                    End-to-end encrypted · No personal data stored
                </p>
            </div>
        </div>
    );
}
