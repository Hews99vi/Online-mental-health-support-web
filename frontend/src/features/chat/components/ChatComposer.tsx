import { useRef, useState, useCallback } from 'react';
import { Send } from 'lucide-react';
import styles from '../Chat.module.css';

interface Props {
    onSend: (text: string) => void;
    onTypingChange?: (isTyping: boolean) => void;
    disabled?: boolean;
    placeholder?: string;
}

/**
 * ChatComposer
 *
 * - Textarea that grows up to 9 rem (controlled by CSS max-height + overflow-y)
 * - Enter → send; Shift+Enter → newline
 * - Fires onTypingChange(true/false) on keystroke  
 * - Disabled when session has ended
 */
export function ChatComposer({
    onSend,
    onTypingChange,
    disabled = false,
    placeholder = 'Write a message… (Enter to send, Shift+Enter for newline)',
}: Props) {
    const [draft, setDraft] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    const resize = () => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 144)}px`; // max ~9rem
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setDraft(val);
        resize();
        onTypingChange?.(val.length > 0);
    };

    const submit = useCallback(() => {
        const text = draft.trim();
        if (!text || disabled) return;
        onSend(text);
        setDraft('');
        onTypingChange?.(false);
        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.focus();
        }
    }, [draft, disabled, onSend, onTypingChange]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
        }
    };

    const canSend = draft.trim().length > 0 && !disabled;

    return (
        <div className={styles.composerWrap}>
            <div className={styles.composerRow}>
                <textarea
                    ref={textareaRef}
                    className={styles.composerTextarea}
                    value={draft}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder={disabled ? 'Session has ended.' : placeholder}
                    disabled={disabled}
                    rows={1}
                    aria-label="Message input"
                    aria-multiline="true"
                />
                <button
                    type="button"
                    className={styles.sendBtn}
                    onClick={submit}
                    disabled={!canSend}
                    aria-label="Send message"
                >
                    <Send size={16} aria-hidden="true" strokeWidth={2} />
                </button>
            </div>
            <p className={styles.composerHint} aria-hidden="true">
                Enter&nbsp;→&nbsp;send &nbsp;·&nbsp; Shift+Enter&nbsp;→&nbsp;newline
            </p>
        </div>
    );
}
