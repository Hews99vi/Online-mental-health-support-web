import styles from '../Chat.module.css';

interface Props {
    peerAlias: string;
    isTyping: boolean;
}

/**
 * TypingIndicator
 *
 * Animated three-dot bubble that appears when the peer is typing.
 * Uses aria-hidden so screen readers don't constantly announce it —
 * the message list's aria-live="polite" handles content updates.
 */
export function TypingIndicator({ peerAlias, isTyping }: Props) {
    if (!isTyping) return null;

    return (
        <div className={styles.typingRow} aria-hidden="true">
            <div className={styles.typingBubble}>
                <span className={styles.typingDot} />
                <span className={styles.typingDot} />
                <span className={styles.typingDot} />
            </div>
            <span className={styles.typingLabel}>{peerAlias} is typing…</span>
        </div>
    );
}
