import mongoose from 'mongoose';
import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { ChatSession } from '../models/ChatSession.js';
import { ChatMessage } from '../models/ChatMessage.js';
import { User } from '../models/User.js';
import { ok, fail } from '../utils/responses.js';

const router = Router();

function isListener(user) {
  return Array.isArray(user.roles) && user.roles.includes('listener');
}

function mapSession(session) {
  return {
    id: session._id.toString(),
    status: session.status,
    userId: session.userId ? session.userId.toString() : null,
    listenerId: session.listenerId ? session.listenerId.toString() : null,
    createdAt: session.createdAt instanceof Date ? session.createdAt.toISOString() : new Date(session.createdAt).toISOString(),
    closedAt: session.closedAt ? new Date(session.closedAt).toISOString() : null
  };
}

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

function resolveSenderRole(session, user) {
  if (session.listenerId && session.listenerId.toString() === user.id) return 'listener';
  if (session.userId && session.userId.toString() === user.id) return 'user';
  return null;
}

async function findOnlineListenerId(excludeUserId = null) {
  const onlineListeners = await User.find({
    roles: 'listener',
    listenerOnline: true,
    status: { $ne: 'suspended' },
    ...(excludeUserId ? { _id: { $ne: excludeUserId } } : {})
  })
    .select('_id')
    .lean();

  if (onlineListeners.length === 0) return null;

  const listenerIds = onlineListeners.map((listener) => listener._id.toString());
  const activeCounts = await ChatSession.aggregate([
    {
      $match: {
        listenerId: { $in: onlineListeners.map((listener) => listener._id) },
        status: { $in: ['queued', 'active'] }
      }
    },
    {
      $group: {
        _id: '$listenerId',
        count: { $sum: 1 }
      }
    }
  ]);

  const countByListener = new Map(
    activeCounts.map((row) => [row._id.toString(), Number(row.count || 0)])
  );

  let selectedId = listenerIds[0];
  let selectedCount = countByListener.get(selectedId) ?? 0;
  for (const listenerId of listenerIds.slice(1)) {
    const count = countByListener.get(listenerId) ?? 0;
    if (count < selectedCount) {
      selectedId = listenerId;
      selectedCount = count;
    }
  }

  return selectedId;
}

async function assignNextQueuedSessionToListener(listenerId) {
  if (!mongoose.isValidObjectId(listenerId)) return null;

  const assigned = await ChatSession.findOneAndUpdate(
    {
      status: 'queued',
      listenerId: null,
      userId: { $ne: listenerId }
    },
    {
      $set: {
        listenerId,
        status: 'active'
      }
    },
    {
      sort: { createdAt: 1 },
      new: true
    }
  );

  return assigned;
}

async function findOpenSessionForUser(user) {
  if (isListener(user)) {
    return ChatSession.findOne({
      listenerId: user.id,
      status: { $in: ['queued', 'active'] }
    })
      .sort({ createdAt: -1 })
      .lean();
  }

  return ChatSession.findOne({
    userId: user.id,
    status: { $in: ['queued', 'active'] }
  })
    .sort({ createdAt: -1 })
    .lean();
}

router.get('/chat/me/open', verifyToken, async (req, res, next) => {
  try {
    const session = await findOpenSessionForUser(req.user);
    return ok(res, { session: session ? mapSession(session) : null });
  } catch (err) {
    return next(err);
  }
});

router.get('/listener/online', verifyToken, async (req, res, next) => {
  try {
    if (!isListener(req.user)) {
      return fail(res, 'Only listeners can access listener availability', 403, 'FORBIDDEN');
    }

    const user = await User.findById(req.user.id).lean();
    if (!user) {
      return fail(res, 'User not found', 404, 'NOT_FOUND');
    }

    return ok(res, { isOnline: Boolean(user.listenerOnline) });
  } catch (err) {
    return next(err);
  }
});

router.put('/listener/online', verifyToken, async (req, res, next) => {
  try {
    if (!isListener(req.user)) {
      return fail(res, 'Only listeners can update listener availability', 403, 'FORBIDDEN');
    }

    const isOnline = Boolean(req.body.isOnline);
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { listenerOnline: isOnline } },
      { new: true }
    ).lean();

    if (!user) {
      return fail(res, 'User not found', 404, 'NOT_FOUND');
    }

    let assignedSession = null;
    if (Boolean(user.listenerOnline)) {
      const assigned = await assignNextQueuedSessionToListener(req.user.id);
      assignedSession = assigned ? mapSession(assigned) : null;
    }

    return ok(
      res,
      { isOnline: Boolean(user.listenerOnline), assignedSession },
      'Availability updated'
    );
  } catch (err) {
    return next(err);
  }
});

router.get('/listener/chats/active', verifyToken, async (req, res, next) => {
  try {
    if (!isListener(req.user)) {
      return fail(res, 'Only listeners can access active chats', 403, 'FORBIDDEN');
    }

    const sessions = await ChatSession.find({
      listenerId: req.user.id,
      status: { $in: ['active', 'queued'] }
    })
      .sort({ createdAt: -1 })
      .lean();

    return ok(res, { items: sessions.map(mapSession) });
  } catch (err) {
    return next(err);
  }
});

router.get('/listener/chats/history', verifyToken, async (req, res, next) => {
  try {
    if (!isListener(req.user)) {
      return fail(res, 'Only listeners can access chat history', 403, 'FORBIDDEN');
    }

    const sessions = await ChatSession.find({
      listenerId: req.user.id,
      status: 'closed'
    })
      .sort({ closedAt: -1, createdAt: -1 })
      .lean();

    return ok(res, { items: sessions.map(mapSession) });
  } catch (err) {
    return next(err);
  }
});

router.post('/chat/queue', verifyToken, async (req, res, next) => {
  try {
    const role = String(req.body.role || 'user').trim().toLowerCase();

    if (role === 'listener') {
      if (!isListener(req.user)) {
        return fail(res, 'Only listeners can assign queued chats', 403, 'FORBIDDEN');
      }

      const existing = await findOpenSessionForUser(req.user);
      if (existing) {
        return ok(res, { session: mapSession(existing) }, 'Resumed active chat session');
      }

      const assigned = await assignNextQueuedSessionToListener(req.user.id);
      if (!assigned) {
        return fail(res, 'No queued chat sessions available', 404, 'NOT_FOUND');
      }

      return ok(res, { session: mapSession(assigned) }, 'Chat session assigned');
    }

    const existing = await findOpenSessionForUser(req.user);
    if (existing) {
      return ok(res, { session: mapSession(existing) }, 'Resumed active chat session');
    }

    const session = await ChatSession.create({
      status: 'queued',
      userId: req.user.id,
      listenerId: null
    });

    let assignedSession = session;
    const onlineListenerId = await findOnlineListenerId(req.user.id);
    if (onlineListenerId) {
      const updated = await ChatSession.findOneAndUpdate(
        { _id: session._id, status: 'queued', listenerId: null },
        { $set: { listenerId: onlineListenerId, status: 'active' } },
        { new: true }
      );
      if (updated) assignedSession = updated;
    }

    return ok(res, { session: mapSession(assignedSession) }, 'Chat session queued', 201);
  } catch (err) {
    return next(err);
  }
});

router.post('/chat/:sessionId/assign', verifyToken, async (req, res, next) => {
  try {
    if (!isListener(req.user)) {
      return fail(res, 'Only listeners can assign sessions', 403, 'FORBIDDEN');
    }
    if (!mongoose.isValidObjectId(req.params.sessionId)) {
      return fail(res, 'Session not found', 404, 'NOT_FOUND');
    }

    const session = await ChatSession.findById(req.params.sessionId);
    if (!session) {
      return fail(res, 'Session not found', 404, 'NOT_FOUND');
    }
    if (session.status === 'closed') {
      return fail(res, 'Session already closed', 400, 'INVALID_STATE');
    }
    if (session.listenerId && session.listenerId.toString() !== req.user.id) {
      return fail(res, 'Session already assigned', 409, 'CONFLICT');
    }

    session.listenerId = req.user.id;
    session.status = 'active';
    await session.save();

    return ok(res, { session: mapSession(session) }, 'Chat session assigned');
  } catch (err) {
    return next(err);
  }
});

router.get('/chat/:sessionId/messages', verifyToken, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.sessionId)) {
      return fail(res, 'Session not found', 404, 'NOT_FOUND');
    }
    const session = await ChatSession.findById(req.params.sessionId).lean();
    if (!session) {
      return fail(res, 'Session not found', 404, 'NOT_FOUND');
    }
    if (!isParticipant(session, req.user.id)) {
      return fail(res, 'Forbidden', 403, 'FORBIDDEN');
    }

    const items = await ChatMessage.find({ sessionId: req.params.sessionId }).sort({ createdAt: 1 }).lean();
    return ok(res, { session: mapSession(session), items: items.map(mapMessage) });
  } catch (err) {
    return next(err);
  }
});

router.post('/chat/:sessionId/messages', verifyToken, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.sessionId)) {
      return fail(res, 'Session not found', 404, 'NOT_FOUND');
    }

    const text = String(req.body.text || '').trim();
    if (!text) {
      return fail(res, 'text is required', 400, 'VALIDATION_ERROR');
    }

    const session = await ChatSession.findById(req.params.sessionId);
    if (!session) {
      return fail(res, 'Session not found', 404, 'NOT_FOUND');
    }
    if (!isParticipant(session, req.user.id)) {
      return fail(res, 'Forbidden', 403, 'FORBIDDEN');
    }
    if (session.status === 'closed') {
      return fail(res, 'Session already closed', 400, 'INVALID_STATE');
    }

    const senderRole = resolveSenderRole(session, req.user);
    if (!senderRole) {
      return fail(res, 'Forbidden', 403, 'FORBIDDEN');
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

    req.app.locals.io?.to(roomName(session._id.toString())).emit('receiveMessage', mapMessage(message));

    return ok(res, { message: mapMessage(message) }, 'Message sent', 201);
  } catch (err) {
    return next(err);
  }
});

router.post('/chat/:sessionId/close', verifyToken, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.sessionId)) {
      return fail(res, 'Session not found', 404, 'NOT_FOUND');
    }
    const session = await ChatSession.findById(req.params.sessionId);
    if (!session) {
      return fail(res, 'Session not found', 404, 'NOT_FOUND');
    }
    if (!isParticipant(session, req.user.id)) {
      return fail(res, 'Forbidden', 403, 'FORBIDDEN');
    }

    session.status = 'closed';
    session.closedAt = new Date();
    await session.save();

    req.app.locals.io?.to(roomName(session._id.toString())).emit('sessionClosed', mapSession(session));

    return ok(res, { session: mapSession(session) }, 'Chat session closed');
  } catch (err) {
    return next(err);
  }
});

export default router;
