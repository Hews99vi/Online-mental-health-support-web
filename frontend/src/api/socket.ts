import { io, Socket } from 'socket.io-client';

export interface SocketChatMessage {
    id: string;
    sessionId: string;
    senderRole: 'user' | 'listener';
    text: string;
    createdAt: string;
}

interface JoinSessionAck {
    ok: boolean;
    code?: string;
    message?: string;
}

interface SendMessageAck {
    ok: boolean;
    code?: string;
    message?: string;
    clientMessageId?: string | null;
}

let socket: Socket | null = null;

function resolveSocketUrl(): string | undefined {
    const configured = import.meta.env.VITE_SOCKET_URL?.trim();
    if (configured) return configured;
    // Default to same-origin so Vite proxy (/socket.io) works in dev and reverse proxies work in prod.
    return undefined;
}

export function getSocket(): Socket {
    if (!socket) {
        const token = localStorage.getItem('accessToken');
        socket = io(resolveSocketUrl(), {
            autoConnect: false,
            auth: { token },
            transports: ['websocket', 'polling'],
            path: '/socket.io',
        });
    }
    return socket;
}

export function connectSocket(): Socket {
    const s = getSocket();
    if (!s.connected) {
        const token = localStorage.getItem('accessToken');
        s.auth = { token };
        s.connect();
    }
    return s;
}

export function disconnectSocket(): void {
    socket?.connected && socket.disconnect();
}

export function destroySocket(): void {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}

export function joinSession(sessionId: string): Promise<JoinSessionAck> {
    return new Promise((resolve, reject) => {
        const s = getSocket();
        const timer = setTimeout(() => reject(new Error('Socket ACK timeout')), 8000);
        s.emit('joinSession', { sessionId }, (ack: JoinSessionAck) => {
            clearTimeout(timer);
            resolve(ack);
        });
    });
}

export function sendMessageRealtime(sessionId: string, text: string, clientMessageId: string): Promise<SendMessageAck> {
    return new Promise((resolve, reject) => {
        const s = getSocket();
        const timer = setTimeout(() => reject(new Error('Socket ACK timeout')), 8000);
        s.emit('sendMessage', { sessionId, text, clientMessageId }, (ack: SendMessageAck) => {
            clearTimeout(timer);
            resolve(ack);
        });
    });
}

export function emitTypingRealtime(sessionId: string, isTyping: boolean): void {
    getSocket().emit('typing', { sessionId, isTyping });
}

export function onReceiveMessage(handler: (message: SocketChatMessage) => void): () => void {
    const s = getSocket();
    s.on('receiveMessage', handler);
    return () => s.off('receiveMessage', handler);
}

export function onTyping(handler: (payload: { sessionId: string; isTyping: boolean; senderRole?: 'user' | 'listener' | null }) => void): () => void {
    const s = getSocket();
    s.on('typing', handler);
    return () => s.off('typing', handler);
}

export function onSessionClosed(handler: (payload: { id: string; status: 'queued' | 'active' | 'closed' }) => void): () => void {
    const s = getSocket();
    s.on('sessionClosed', handler);
    return () => s.off('sessionClosed', handler);
}
