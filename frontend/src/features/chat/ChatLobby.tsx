import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Headphones, Shield, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../app/AuthContext';
import { http } from '../../api/http';
import styles from './Chat.module.css';

type QueueRole = 'user' | 'listener';

interface QueueSession {
    id: string;
    status: 'queued' | 'active' | 'closed';
    userId: string | null;
    listenerId: string | null;
    createdAt: string;
    closedAt: string | null;
}

interface QueueResponse {
    data: {
        session: QueueSession;
    };
}

interface OpenSessionResponse {
    data: {
        session: QueueSession | null;
    };
}

async function joinQueue(role: QueueRole): Promise<QueueSession> {
    const response = await http.post<QueueResponse>('/chat/queue', { role });
    return response.data.session;
}

export function ChatLobby() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const defaultRole: QueueRole = user?.role === 'listener' ? 'listener' : 'user';
    const [selectedRole, setSelectedRole] = useState<QueueRole>(defaultRole);
    const [isJoining, setIsJoining] = useState(false);
    const [isCheckingSession, setIsCheckingSession] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        void http
            .get<OpenSessionResponse>('/chat/me/open')
            .then((response) => {
                if (response.data.session) {
                    navigate(`/chat/${response.data.session.id}`, { replace: true });
                }
            })
            .catch(() => {
                // Ignore resume failures and let user start a new session manually
            })
            .finally(() => setIsCheckingSession(false));
    }, [navigate]);

    const handleJoinQueue = async () => {
        setError(null);
        setIsJoining(true);
        try {
            const session = await joinQueue(selectedRole);
            navigate(`/chat/${session.id}`, { replace: true });
        } catch (err: unknown) {
            setError((err as { message?: string }).message ?? 'Failed to start chat session.');
        } finally {
            setIsJoining(false);
        }
    };

    return (
        <div className={styles.lobby}>
            <div className={styles.lobbyCard}>
                <div className={styles.lobbyIcon}>
                    <MessageCircle size={32} aria-hidden="true" strokeWidth={1.75} />
                </div>

                <div>
                    <h1 className={styles.lobbyTitle}>Anonymous Support Chat</h1>
                    <p className={styles.lobbySubtitle}>
                        Connect with a trained listener. Messages are stored on the server for this baseline release.
                    </p>
                </div>

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
                            disabled={isJoining}
                        >
                            <span className={styles.roleBtnIcon}>
                                <MessageCircle size={18} aria-hidden="true" />
                            </span>
                            <span>Seeking support</span>
                            <span style={{ fontSize: '0.72rem', color: 'inherit', opacity: 0.75 }}>Join the queue</span>
                        </button>
                        <button
                            type="button"
                            className={`${styles.roleBtn} ${selectedRole === 'listener' ? styles.selected : ''}`}
                            onClick={() => setSelectedRole('listener')}
                            aria-pressed={selectedRole === 'listener'}
                            disabled={isJoining || user?.role !== 'listener'}
                            title={user?.role === 'listener' ? undefined : 'Only approved listeners can join as listener'}
                        >
                            <span className={styles.roleBtnIcon}>
                                <Headphones size={18} aria-hidden="true" />
                            </span>
                            <span>Listener</span>
                            <span style={{ fontSize: '0.72rem', color: 'inherit', opacity: 0.75 }}>Pick a queued session</span>
                        </button>
                    </div>
                </div>

                {error && (
                    <p role="alert" style={{ fontSize: '0.875rem', color: '#dc2626', background: '#fef2f2', padding: '0.625rem 1rem', borderRadius: '0.5rem', margin: 0, width: '100%', textAlign: 'center' }}>
                        {error}
                    </p>
                )}

                <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={() => void handleJoinQueue()}
                    disabled={isJoining || isCheckingSession}
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)', boxShadow: '0 4px 18px rgba(109,40,217,0.35)' }}
                >
                    {isCheckingSession ? (
                        <>
                            <Loader2 size={18} aria-hidden="true" style={{ marginRight: '0.375rem', animation: 'spin 1s linear infinite' }} />
                            Checking session...
                        </>
                    ) : isJoining ? (
                        <>
                            <Loader2 size={18} aria-hidden="true" style={{ marginRight: '0.375rem', animation: 'spin 1s linear infinite' }} />
                            Starting...
                        </>
                    ) : (
                        <>
                            <MessageCircle size={18} aria-hidden="true" style={{ marginRight: '0.375rem' }} />
                            Start chat
                        </>
                    )}
                </Button>

                <p className={styles.privacy}>
                    <Shield size={13} aria-hidden="true" />
                    Baseline mode: plain text messages are stored in MongoDB.
                </p>
            </div>
        </div>
    );
}
