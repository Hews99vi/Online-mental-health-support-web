import { useEffect, useRef } from 'react';
import type { ChatMessage } from '../../../api/socket';
import styles from '../Chat.module.css';

interface Props {
    messages: ChatMessage[];
}

function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string): string {
    const d = new Date(iso);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * ChatMessageList
 *
 * Renders a list of chat messages with:
 *  - Day dividers between message groups
 *  - Own vs peer bubble styling
 *  - Delivery status indicator (sending / delivered / failed)
 *  - Auto-scroll to bottom on new messages
 */
export function ChatMessageList({ messages }: Props) {
    const bottomRef = useRef<HTMLDivElement>(null);

    // Scroll-to-bottom whenever messages array grows
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

    if (messages.length === 0) {
        return (
            <div className={styles.empty} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem' }}>
                <p className={styles.systemMsg}>No messages yet. Say hello 👋</p>
            </div>
        );
    }

    // Group messages by day for date dividers
    let lastDateLabel = '';

    return (
        <>
            {messages.map((msg) => {
                const isMine = msg.senderId === 'me';
                const text = msg.plaintext ?? msg.ciphertext;
                const dateLabel = formatDate(msg.sentAt);
                const showDivider = dateLabel !== lastDateLabel;
                lastDateLabel = dateLabel;

                // Avatar initials — "me" or first letter of senderId
                const avatarLetter = isMine ? 'Me' : msg.senderId.slice(0, 2).toUpperCase();

                return (
                    <div key={msg.id ?? msg.clientMsgId}>
                        {showDivider && (
                            <div className={styles.dateDivider} aria-hidden="true">
                                {dateLabel}
                            </div>
                        )}

                        <div className={`${styles.messageRow} ${isMine ? styles.mine : ''}`}>
                            <div className={styles.msgAvatar} aria-hidden="true">
                                {avatarLetter}
                            </div>

                            <div>
                                <div
                                    className={`${styles.bubble} ${isMine ? styles.mine : styles.theirs} ${msg.status === 'failed' ? styles.failed : ''}`}
                                >
                                    {text}
                                    {msg.status === 'failed' && (
                                        <div>
                                            <button
                                                type="button"
                                                className={styles.retryBtn}
                                                aria-label="Retry sending message"
                                                title="Failed to send — retry"
                                            >
                                                ↩ Retry
                                            </button>
                                        </div>
                                    )}
                                    {isMine && msg.status === 'sending' && (
                                        <span className={styles.msgStatus} aria-label="Sending">⏳</span>
                                    )}
                                    {isMine && msg.status === 'delivered' && (
                                        <span className={styles.msgStatus} aria-label="Delivered">✓✓</span>
                                    )}
                                </div>
                                <div className={`${styles.msgTime} ${isMine ? styles.mine : ''}`}>
                                    {formatTime(msg.sentAt)}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Invisible scroll anchor */}
            <div ref={bottomRef} aria-hidden="true" />
        </>
    );
}
