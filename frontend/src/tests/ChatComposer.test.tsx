/**
 * src/tests/ChatComposer.test.tsx
 *
 * Behaviour tests for the ChatComposer component:
 *  - Enter key fires onSend and clears the textarea
 *  - Shift+Enter inserts a newline (does NOT fire onSend)
 *  - Send button is disabled when textarea is empty
 *  - Send button click fires onSend
 *  - onTypingChange is called with true when typing, false after send
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatComposer } from '../features/chat/components/ChatComposer';

// ChatComposer imports Chat.module.css — Vitest/happy-dom ignores CSS modules
// automatically (they resolve to empty objects), so no extra mock needed.

describe('ChatComposer', () => {
    let onSend: ReturnType<typeof vi.fn>;
    let onTypingChange: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        onSend = vi.fn();
        onTypingChange = vi.fn();
    });

    function mount(disabled = false) {
        render(
            <ChatComposer
                onSend={onSend}
                onTypingChange={onTypingChange}
                disabled={disabled}
            />
        );
    }

    // ── Baseline ───────────────────────────────────────────────────────────────

    it('renders the message textarea with aria-label', () => {
        mount();
        expect(screen.getByRole('textbox', { name: /message input/i })).toBeInTheDocument();
    });

    it('Send button is initially disabled (empty textarea)', () => {
        mount();
        expect(screen.getByRole('button', { name: /send message/i })).toBeDisabled();
    });

    // ── Enter → send ───────────────────────────────────────────────────────────

    it('Enter fires onSend with trimmed text and clears the textarea', async () => {
        const user = userEvent.setup();
        mount();
        const textarea = screen.getByRole<HTMLTextAreaElement>('textbox', { name: /message input/i });

        await user.type(textarea, 'Hello world');
        expect(textarea.value).toBe('Hello world');

        await user.keyboard('{Enter}');

        expect(onSend).toHaveBeenCalledOnce();
        expect(onSend).toHaveBeenCalledWith('Hello world');
        expect(textarea.value).toBe('');
    });

    it('Enter with only whitespace does NOT fire onSend', async () => {
        const user = userEvent.setup();
        mount();
        const textarea = screen.getByRole('textbox', { name: /message input/i });

        await user.type(textarea, '   ');
        await user.keyboard('{Enter}');

        expect(onSend).not.toHaveBeenCalled();
    });

    // ── Shift+Enter → newline ──────────────────────────────────────────────────

    it('Shift+Enter inserts a newline instead of sending', async () => {
        const user = userEvent.setup();
        mount();
        const textarea = screen.getByRole<HTMLTextAreaElement>('textbox', { name: /message input/i });

        await user.type(textarea, 'Line one');
        await user.keyboard('{Shift>}{Enter}{/Shift}');
        await user.type(textarea, 'Line two');

        expect(onSend).not.toHaveBeenCalled();
        expect(textarea.value).toContain('Line one');
        expect(textarea.value).toContain('Line two');
    });

    // ── Send button click ──────────────────────────────────────────────────────

    it('clicking the Send button fires onSend', async () => {
        const user = userEvent.setup();
        mount();
        const textarea = screen.getByRole('textbox', { name: /message input/i });
        const sendBtn = screen.getByRole('button', { name: /send message/i });

        await user.type(textarea, 'Click send');
        expect(sendBtn).not.toBeDisabled();

        await user.click(sendBtn);
        expect(onSend).toHaveBeenCalledWith('Click send');
    });

    // ── Typing callbacks ───────────────────────────────────────────────────────

    it('fires onTypingChange(true) when typing and (false) after sending', async () => {
        const user = userEvent.setup();
        mount();
        const textarea = screen.getByRole('textbox', { name: /message input/i });

        await user.type(textarea, 'typing…');
        expect(onTypingChange).toHaveBeenCalledWith(true);

        await user.keyboard('{Enter}');
        expect(onTypingChange).toHaveBeenCalledWith(false);
    });

    // ── Disabled state ─────────────────────────────────────────────────────────

    it('does not fire onSend when the composer is disabled', () => {
        mount(true /* disabled */);
        const textarea = screen.getByRole('textbox', { name: /message input/i });

        // Fire the keydown directly — userEvent.type won't allow input on disabled
        fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
        expect(onSend).not.toHaveBeenCalled();
    });
});
