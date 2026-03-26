import { createHash, randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { env } from '../config/env.js';
import { Appointment } from '../models/Appointment.js';
import { AvailabilitySlot } from '../models/AvailabilitySlot.js';
import { TherapistProfile } from '../models/TherapistProfile.js';
import { User } from '../models/User.js';
import { ok, fail } from '../utils/responses.js';

const router = Router();
const JOIN_WINDOW_MS = 10 * 60 * 1000;

function initials(name) {
  return String(name || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'TH';
}

function normalizeProviderBaseUrl() {
  return env.sessionBaseUrl.replace(/\/+$/, '');
}

function buildSessionRoomName(appointment) {
  const fingerprint = createHash('sha256')
    .update(`${appointment._id.toString()}:${appointment.userId.toString()}:${appointment.therapistUserId.toString()}:${env.jwtSecret}`)
    .digest('hex')
    .slice(0, 12);
  return `mindbridge-${fingerprint}-${randomUUID().slice(0, 8)}`;
}

async function ensureSessionRoom(appointment) {
  if (appointment.sessionProvider && appointment.sessionRoomName) {
    return appointment;
  }

  appointment.sessionProvider = 'jitsi';
  appointment.sessionRoomName = buildSessionRoomName(appointment);
  appointment.sessionCreatedAt = new Date();
  await appointment.save();
  return appointment;
}

function buildJoinInfo(appointment, slot) {
  const availableAt = new Date(new Date(slot.startTime).getTime() - JOIN_WINDOW_MS).toISOString();
  const withinJoinWindow = Date.now() >= new Date(availableAt).getTime();
  const joinUrl = withinJoinWindow ? `${normalizeProviderBaseUrl()}/${appointment.sessionRoomName}` : null;

  return {
    appointmentId: appointment._id.toString(),
    joinUrl,
    provider: appointment.sessionProvider || 'jitsi',
    roomName: withinJoinWindow ? appointment.sessionRoomName : null,
    availableAt
  };
}

function sanitizeAppointment(appointment, slot, profile, user) {
  return {
    id: appointment._id.toString(),
    therapistId: appointment.therapistUserId.toString(),
    therapistName: profile?.fullName || 'Therapist',
    therapistInitials: initials(profile?.fullName),
    userId: appointment.userId.toString(),
    userName: user?.username || `User ${appointment.userId.toString().slice(-6)}`,
    userEmail: user?.email || null,
    slotId: appointment.slotId.toString(),
    start: slot?.startTime?.toISOString(),
    end: slot?.endTime?.toISOString(),
    status: appointment.status,
    sessionType: 'video',
    userNotes: appointment.notes || undefined,
    therapistNotes: appointment.therapistNotes || undefined
  };
}

async function hydrateAppointments(items) {
  const slotIds = items.map((item) => item.slotId);
  const therapistIds = items.map((item) => item.therapistUserId);
  const userIds = items.map((item) => item.userId);
  const [slots, profiles, users] = await Promise.all([
    AvailabilitySlot.find({ _id: { $in: slotIds } }).lean(),
    TherapistProfile.find({ userId: { $in: therapistIds } }).lean(),
    User.find({ _id: { $in: userIds } }).lean()
  ]);

  const slotById = new Map(slots.map((slot) => [slot._id.toString(), slot]));
  const profileByUser = new Map(profiles.map((profile) => [profile.userId.toString(), profile]));
  const userById = new Map(users.map((user) => [user._id.toString(), user]));

  return items.map((item) =>
    sanitizeAppointment(
      item,
      slotById.get(item.slotId.toString()),
      profileByUser.get(item.therapistUserId.toString()),
      userById.get(item.userId.toString())
    )
  );
}

router.post('/appointments', verifyToken, async (req, res, next) => {
  try {
    const therapistId = String(req.body.therapistId || '').trim();
    const slotId = String(req.body.slotId || '').trim();
    const notes = typeof req.body.userNotes === 'string' ? req.body.userNotes.trim() : '';

    if (!mongoose.isValidObjectId(therapistId) || !mongoose.isValidObjectId(slotId)) {
      return fail(res, 'Invalid booking payload', 400, 'VALIDATION_ERROR');
    }

    const therapist = await TherapistProfile.findOne({
      userId: therapistId,
      verificationStatus: 'approved'
    }).lean();
    if (!therapist) {
      return fail(res, 'Therapist not available for booking', 404, 'NOT_FOUND');
    }

    const reserved = await AvailabilitySlot.findOneAndUpdate(
      {
        _id: slotId,
        therapistUserId: therapistId,
        isBooked: false,
        startTime: { $gte: new Date() }
      },
      { $set: { isBooked: true } },
      { new: true }
    );

    if (!reserved) {
      return fail(res, 'Selected slot is no longer available', 409, 'CONFLICT');
    }

    try {
      const appointment = await Appointment.create({
        userId: req.user.id,
        therapistUserId: therapistId,
        slotId: slotId,
        status: 'requested',
        notes
      });

      const user = await User.findById(req.user.id).lean();
      return ok(res, { appointment: sanitizeAppointment(appointment, reserved, therapist, user) }, 'Appointment requested', 201);
    } catch (err) {
      if (err?.code === 11000) {
        await AvailabilitySlot.updateOne({ _id: slotId }, { $set: { isBooked: true } });
        return fail(res, 'Selected slot is no longer available', 409, 'CONFLICT');
      }
      throw err;
    }
  } catch (err) {
    return next(err);
  }
});

router.get('/appointments/me', verifyToken, async (req, res, next) => {
  try {
    const items = await Appointment.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
    const appointments = await hydrateAppointments(items);
    return ok(res, { items: appointments });
  } catch (err) {
    return next(err);
  }
});

router.get('/appointments', verifyToken, async (req, res, next) => {
  try {
    const items = await Appointment.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
    const appointments = await hydrateAppointments(items);
    return ok(res, { items: appointments });
  } catch (err) {
    return next(err);
  }
});

router.get('/appointments/therapist', verifyToken, requireRole('therapist'), async (req, res, next) => {
  try {
    const profile = await TherapistProfile.findOne({
      userId: req.user.id,
      verificationStatus: 'approved'
    }).lean();
    if (!profile) {
      return fail(res, 'Only approved therapists can access therapist appointments', 403, 'FORBIDDEN');
    }

    const items = await Appointment.find({ therapistUserId: req.user.id }).sort({ createdAt: -1 }).lean();
    const appointments = await hydrateAppointments(items);
    return ok(res, { items: appointments });
  } catch (err) {
    return next(err);
  }
});

router.get('/therapist/clients', verifyToken, requireRole('therapist'), async (req, res, next) => {
  try {
    const profile = await TherapistProfile.findOne({
      userId: req.user.id,
      verificationStatus: 'approved'
    }).lean();
    if (!profile) {
      return fail(res, 'Only approved therapists can access clients', 403, 'FORBIDDEN');
    }

    const appointments = await Appointment.find({
      therapistUserId: req.user.id,
      status: { $in: ['requested', 'confirmed', 'completed'] }
    })
      .sort({ createdAt: -1 })
      .lean();

    const clientMap = new Map();
    for (const item of appointments) {
      const key = item.userId.toString();
      if (!clientMap.has(key)) {
        clientMap.set(key, {
          userId: key,
          sessions: 0,
          lastAppointmentAt: item.createdAt
        });
      }
      const existing = clientMap.get(key);
      existing.sessions += 1;
      if (!existing.lastAppointmentAt || item.createdAt > existing.lastAppointmentAt) {
        existing.lastAppointmentAt = item.createdAt;
      }
    }

    const userIds = Array.from(clientMap.keys());
    const users = await User.find({ _id: { $in: userIds } }).lean();
    const userById = new Map(users.map((user) => [user._id.toString(), user]));

    const items = userIds.map((userId) => {
      const user = userById.get(userId);
      const aggregate = clientMap.get(userId);
      return {
        id: userId,
        name: user?.username || `User ${userId.slice(-6)}`,
        email: user?.email || null,
        sessions: aggregate.sessions,
        lastSessionAt: aggregate.lastAppointmentAt
          ? (aggregate.lastAppointmentAt instanceof Date ? aggregate.lastAppointmentAt.toISOString() : new Date(aggregate.lastAppointmentAt).toISOString())
          : null
      };
    });

    return ok(res, { items, total: items.length });
  } catch (err) {
    return next(err);
  }
});

router.get('/therapist/clients/:clientId/appointments', verifyToken, requireRole('therapist'), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.clientId)) {
      return fail(res, 'Client not found', 404, 'NOT_FOUND');
    }

    const profile = await TherapistProfile.findOne({
      userId: req.user.id,
      verificationStatus: 'approved'
    }).lean();
    if (!profile) {
      return fail(res, 'Only approved therapists can access client appointments', 403, 'FORBIDDEN');
    }

    const items = await Appointment.find({
      therapistUserId: req.user.id,
      userId: req.params.clientId
    })
      .sort({ createdAt: -1 })
      .lean();

    const appointments = await hydrateAppointments(items);
    return ok(res, { items: appointments, total: appointments.length });
  } catch (err) {
    return next(err);
  }
});

router.post('/appointments/:id/confirm', verifyToken, requireRole('therapist'), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return fail(res, 'Appointment not found', 404, 'NOT_FOUND');
    }

    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, therapistUserId: req.user.id, status: 'requested' },
      { $set: { status: 'confirmed' } },
      { new: true }
    );

    if (!appointment) {
      return fail(res, 'Appointment not found or not confirmable', 404, 'NOT_FOUND');
    }

    await ensureSessionRoom(appointment);

    const [slot, profile] = await Promise.all([
      AvailabilitySlot.findById(appointment.slotId).lean(),
      TherapistProfile.findOne({ userId: appointment.therapistUserId }).lean()
    ]);

    const user = await User.findById(appointment.userId).lean();
    return ok(res, { appointment: sanitizeAppointment(appointment, slot, profile, user) }, 'Appointment confirmed');
  } catch (err) {
    return next(err);
  }
});

router.post('/appointments/:id/cancel', verifyToken, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return fail(res, 'Appointment not found', 404, 'NOT_FOUND');
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return fail(res, 'Appointment not found', 404, 'NOT_FOUND');
    }

    const isOwner =
      appointment.userId.toString() === req.user.id || appointment.therapistUserId.toString() === req.user.id;
    if (!isOwner) {
      return fail(res, 'Forbidden', 403, 'FORBIDDEN');
    }

    if (!['requested', 'confirmed'].includes(appointment.status)) {
      return fail(res, 'Appointment not found or not cancellable', 404, 'NOT_FOUND');
    }

    appointment.status = 'cancelled';
    await appointment.save();

    await AvailabilitySlot.updateOne(
      { _id: appointment.slotId, therapistUserId: appointment.therapistUserId },
      { $set: { isBooked: false } }
    );

    const [slot, profile] = await Promise.all([
      AvailabilitySlot.findById(appointment.slotId).lean(),
      TherapistProfile.findOne({ userId: appointment.therapistUserId }).lean()
    ]);

    const user = await User.findById(appointment.userId).lean();
    return ok(res, { appointment: sanitizeAppointment(appointment, slot, profile, user) }, 'Appointment cancelled');
  } catch (err) {
    return next(err);
  }
});

router.post('/appointments/:id/reschedule', verifyToken, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return fail(res, 'Appointment not found', 404, 'NOT_FOUND');
    }

    const newSlotId = String(req.body.slotId || '').trim();
    if (!mongoose.isValidObjectId(newSlotId)) {
      return fail(res, 'slotId is required', 400, 'VALIDATION_ERROR');
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return fail(res, 'Appointment not found', 404, 'NOT_FOUND');
    }

    const isOwner = appointment.userId.toString() === req.user.id;
    if (!isOwner) {
      return fail(res, 'Only the booking owner can reschedule', 403, 'FORBIDDEN');
    }

    if (!['requested', 'confirmed'].includes(appointment.status)) {
      return fail(res, 'Appointment not found or not reschedulable', 404, 'NOT_FOUND');
    }

    const currentSlotId = appointment.slotId.toString();
    if (currentSlotId === newSlotId) {
      return fail(res, 'Please select a different slot', 400, 'VALIDATION_ERROR');
    }

    const reserved = await AvailabilitySlot.findOneAndUpdate(
      {
        _id: newSlotId,
        therapistUserId: appointment.therapistUserId,
        isBooked: false,
        startTime: { $gte: new Date() }
      },
      { $set: { isBooked: true } },
      { new: true }
    );

    if (!reserved) {
      return fail(res, 'Selected slot is no longer available', 409, 'CONFLICT');
    }

    try {
      appointment.slotId = newSlotId;
      await appointment.save();
    } catch (err) {
      await AvailabilitySlot.updateOne({ _id: newSlotId }, { $set: { isBooked: false } });
      throw err;
    }

    await AvailabilitySlot.updateOne(
      { _id: currentSlotId, therapistUserId: appointment.therapistUserId },
      { $set: { isBooked: false } }
    );

    const [profile, user] = await Promise.all([
      TherapistProfile.findOne({ userId: appointment.therapistUserId }).lean(),
      User.findById(appointment.userId).lean()
    ]);

    return ok(
      res,
      { appointment: sanitizeAppointment(appointment, reserved, profile, user) },
      'Appointment rescheduled'
    );
  } catch (err) {
    return next(err);
  }
});

async function saveTherapistNote(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return fail(res, 'Appointment not found', 404, 'NOT_FOUND');
    }

    const therapistNotes = String(req.body.therapistNotes || '').trim();
    if (!therapistNotes) {
      return fail(res, 'therapistNotes is required', 400, 'VALIDATION_ERROR');
    }

    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, therapistUserId: req.user.id },
      { $set: { therapistNotes } },
      { new: true }
    );
    if (!appointment) {
      return fail(res, 'Appointment not found', 404, 'NOT_FOUND');
    }

    const [slot, profile] = await Promise.all([
      AvailabilitySlot.findById(appointment.slotId).lean(),
      TherapistProfile.findOne({ userId: appointment.therapistUserId }).lean()
    ]);
    const user = await User.findById(appointment.userId).lean();

    return ok(res, { appointment: sanitizeAppointment(appointment, slot, profile, user) }, 'Therapist note saved');
  } catch (err) {
    return next(err);
  }
}

router.post('/appointments/:id/notes', verifyToken, requireRole('therapist'), saveTherapistNote);
router.put('/appointments/:id/notes', verifyToken, requireRole('therapist'), saveTherapistNote);

router.delete('/appointments/:id/notes', verifyToken, requireRole('therapist'), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return fail(res, 'Appointment not found', 404, 'NOT_FOUND');
    }

    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, therapistUserId: req.user.id },
      { $set: { therapistNotes: '' } },
      { new: true }
    );
    if (!appointment) {
      return fail(res, 'Appointment not found', 404, 'NOT_FOUND');
    }

    const [slot, profile, user] = await Promise.all([
      AvailabilitySlot.findById(appointment.slotId).lean(),
      TherapistProfile.findOne({ userId: appointment.therapistUserId }).lean(),
      User.findById(appointment.userId).lean()
    ]);

    return ok(res, { appointment: sanitizeAppointment(appointment, slot, profile, user) }, 'Therapist note deleted');
  } catch (err) {
    return next(err);
  }
});

router.get('/appointments/:id', verifyToken, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return fail(res, 'Appointment not found', 404, 'NOT_FOUND');
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return fail(res, 'Appointment not found', 404, 'NOT_FOUND');
    }

    const isOwner =
      appointment.userId.toString() === req.user.id || appointment.therapistUserId.toString() === req.user.id;
    if (!isOwner) {
      return fail(res, 'Forbidden', 403, 'FORBIDDEN');
    }

    const [slot, profile] = await Promise.all([
      AvailabilitySlot.findById(appointment.slotId).lean(),
      TherapistProfile.findOne({ userId: appointment.therapistUserId }).lean()
    ]);

    const user = await User.findById(appointment.userId).lean();
    return ok(res, { appointment: sanitizeAppointment(appointment, slot, profile, user) });
  } catch (err) {
    return next(err);
  }
});

router.get('/appointments/:id/join', verifyToken, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return fail(res, 'Appointment not found', 404, 'NOT_FOUND');
    }

    const appointment = await Appointment.findById(req.params.id).lean();
    if (!appointment) {
      return fail(res, 'Appointment not found', 404, 'NOT_FOUND');
    }

    const isOwner =
      appointment.userId.toString() === req.user.id || appointment.therapistUserId.toString() === req.user.id;
    if (!isOwner) {
      return fail(res, 'Forbidden', 403, 'FORBIDDEN');
    }

    if (appointment.status !== 'confirmed') {
      return fail(res, 'Join info unavailable until appointment is confirmed', 409, 'INVALID_STATE');
    }

    const slot = await AvailabilitySlot.findById(appointment.slotId).lean();
    if (!slot) {
      return fail(res, 'Appointment slot not found', 404, 'NOT_FOUND');
    }

    await ensureSessionRoom(appointment);
    const joinInfo = buildJoinInfo(appointment, slot);

    return ok(res, joinInfo);
  } catch (err) {
    return next(err);
  }
});

export default router;
