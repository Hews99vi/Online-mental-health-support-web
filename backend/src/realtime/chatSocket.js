import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { ChatSession } from '../models/ChatSession.js';
import { ChatMessage } from '../models/ChatMessage.js';

function roomName(sessionId) {
  return `chat:${sessionId}`;
}

function mapMessage(message) {
  return {
    id: message._id.toString(),
    sessionId: message.sessionId.toString(),
    senderRole: message.senderRole,
    text: message.text,
    createdAt: message.createdAt instanceof Date ? message.createdAt.toISOString() : new Date(message.createdAt).toISOString()
  };
}

function isParticipant(session, userId) {
  return (
    (session.userId && session.userId.toString() === userId) ||
    (session.listenerId && session.listenerId.toString() === userId)
  );
}

function resolveSenderRole(session, userId) {
  if (session.listenerId && session.listenerId.toString() === userId) return 'listener';
  if (session.userId && session.userId.toString() === userId) return 'user';
  return null;
}

export function registerChatSocket(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('UNAUTHORIZED'));
      const payload = jwt.verify(token, env.jwtSecret);
      const user = await User.findById(payload.sub).lean();
      if (!user || user.status === 'suspended') return next(new Error('UNAUTHORIZED'));
      socket.data.user = {
        id: user._id.toString(),
        roles: Array.isArray(user.roles) ? user.roles : [],
        username: user.username
      };
      return next();
    } catch {
      return next(new Error('UNAUTHORIZED'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('joinSession', async (payload, ack) => {
      try {
        const sessionId = String(payload?.sessionId || '').trim();
        if (!mongoose.isValidObjectId(sessionId)) {
          ack?.({ ok: false, code: 'NOT_FOUND', message: 'Session not found' });
          return;
        }

        const session = await ChatSession.findById(sessionId).lean();
        if (!session) {
          ack?.({ ok: false, code: 'NOT_FOUND', message: 'Session not found' });
          return;
        }
        if (!isParticipant(session, socket.data.user.id)) {
          ack?.({ ok: false, code: 'FORBIDDEN', message: 'Forbidden' });
          return;
        }

        await socket.join(roomName(sessionId));
        ack?.({
          ok: true,
          session: {
            id: session._id.toString(),
            status: session.status
          }
        });
      } catch {
        ack?.({ ok: false, code: 'SERVER_ERROR', message: 'Failed to join session' });
      }
    });

    socket.on('sendMessage', async (payload, ack) => {
      try {
        const sessionId = String(payload?.sessionId || '').trim();
        const text = String(payload?.text || '').trim();
        if (!mongoose.isValidObjectId(sessionId)) {
          ack?.({ ok: false, code: 'NOT_FOUND', message: 'Session not found' });
          return;
        }
        if (!text) {
          ack?.({ ok: false, code: 'VALIDATION_ERROR', message: 'text is required' });
          return;
        }

        const session = await ChatSession.findById(sessionId);
        if (!session) {
          ack?.({ ok: false, code: 'NOT_FOUND', message: 'Session not found' });
          return;
        }
        if (!isParticipant(session, socket.data.user.id)) {
          ack?.({ ok: false, code: 'FORBIDDEN', message: 'Forbidden' });
          return;
        }
        if (session.status === 'closed') {
          ack?.({ ok: false, code: 'INVALID_STATE', message: 'Session already closed' });
          return;
        }

        const senderRole = resolveSenderRole(session, socket.data.user.id);
        if (!senderRole) {
          ack?.({ ok: false, code: 'FORBIDDEN', message: 'Forbidden' });
          return;
        }

        const message = await ChatMessage.create({
          sessionId: session._id,
          senderRole,
          text
        });

        if (session.status === 'queued' && session.listenerId) {
          session.status = 'active';
          await session.save();
        }

        const mapped = mapMessage(message);
        io.to(roomName(sessionId)).emit('receiveMessage', mapped);
        ack?.({ ok: true, serverMessage: mapped, clientMessageId: payload?.clientMessageId || null });
      } catch {
        ack?.({ ok: false, code: 'SERVER_ERROR', message: 'Failed to send message' });
      }
    });

    socket.on('typing', async (payload) => {
      try {
        const sessionId = String(payload?.sessionId || '').trim();
        if (!mongoose.isValidObjectId(sessionId)) return;
        const session = await ChatSession.findById(sessionId).lean();
        if (!session) return;
        if (!isParticipant(session, socket.data.user.id)) return;
        socket.to(roomName(sessionId)).emit('typing', {
          sessionId,
          isTyping: Boolean(payload?.isTyping),
          senderRole: resolveSenderRole(session, socket.data.user.id)
        });
      } catch {
        // ignore typing failures
      }
    });
  });
}
