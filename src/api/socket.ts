/**
 * socket.ts — Typed Socket.IO client singleton
 *
 * Adds strongly-typed emit / on helpers for every chat event so callers
 * get full IntelliSense without casting.
 *
 * Chat protocol:
 *   emit  chat:queue:join   { role }
 *   on    chat:matched      { roomId, counterpart }
 *   emit  chat:room:join    { roomId }
 *   emit  chat:message:send { roomId, clientMsgId, ciphertext }
 *   on    chat:message:new  { roomId, message }
 *   emit  chat:typing       { roomId, isTyping }
 *   on    chat:typing       { peerId, isTyping }
 *   on    chat:peer:left    { roomId }
 *   emit  chat:room:leave   { roomId }
 */

import { io, Socket } from 'socket.io-client';

// ── Protocol types ────────────────────────────────────────────────────────────

export interface ChatMessage {
    id: string;
    clientMsgId: string;
    roomId: string;
    senderId: string;          // anon alias or 'me' on the client side
    ciphertext: string;        // placeholder — replace with real decrypted text
    plaintext?: string;        // populated client-side after (stub) decryption
    sentAt: string;            // ISO8601
    status: 'sending' | 'delivered' | 'failed';
}

export interface ChatCounterpart {
    alias: string;             // e.g. "Generous Fox"
    role: 'user' | 'listener' | 'therapist';
}

// Emit payloads
export interface QueueJoinPayload { role: 'user' | 'listener'; }
export interface RoomJoinPayload { roomId: string; }
export interface RoomLeavePayload { roomId: string; }
export interface MessageSendPayload { roomId: string; clientMsgId: string; ciphertext: string; }
export interface TypingPayload { roomId: string; isTyping: boolean; }

// Receive payloads
export interface MatchedPayload { roomId: string; counterpart: ChatCounterpart; }
export interface MessageNewPayload { roomId: string; message: ChatMessage; }
export interface PeerTypingPayload { peerId: string; isTyping: boolean; }
export interface PeerLeftPayload { roomId: string; }
export interface QueueStatusPayload { position: number; estimatedWaitSecs: number; }

// ── Singleton ─────────────────────────────────────────────────────────────────

const SOCKET_URL = 'http://localhost:4000';

let socket: Socket | null = null;

export function getSocket(): Socket {
    if (!socket) {
        const token = localStorage.getItem('accessToken');
        socket = io(SOCKET_URL, {
            autoConnect: false,
            auth: { token },
            transports: ['websocket', 'polling'],
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
    if (socket) { socket.disconnect(); socket = null; }
}

// ── Typed emit helpers ────────────────────────────────────────────────────────

export function emitQueueJoin(payload: QueueJoinPayload) { getSocket().emit('chat:queue:join', payload); }
export function emitRoomJoin(payload: RoomJoinPayload) { getSocket().emit('chat:room:join', payload); }
export function emitRoomLeave(payload: RoomLeavePayload) { getSocket().emit('chat:room:leave', payload); }
export function emitTyping(payload: TypingPayload) { getSocket().emit('chat:typing', payload); }

export function emitMessageSend(
    payload: MessageSendPayload
): Promise<{ ok: boolean; serverMsgId?: string }> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('ACK timeout')), 8000);
        getSocket().emit(
            'chat:message:send',
            payload,
            (ack: { ok: boolean; serverMsgId?: string }) => {
                clearTimeout(timer);
                resolve(ack);
            }
        );
    });
}

// ── Generic ack helper (kept for backwards compat) ────────────────────────────

export function emitWithAck<TPayload, TAck>(
    event: string,
    payload: TPayload,
    timeoutMs = 5000
): Promise<TAck> {
    return new Promise((resolve, reject) => {
        const s = getSocket();
        const timer = setTimeout(() => reject(new Error('Socket ACK timeout')), timeoutMs);
        s.emit(event, payload, (ack: TAck) => { clearTimeout(timer); resolve(ack); });
    });
}
