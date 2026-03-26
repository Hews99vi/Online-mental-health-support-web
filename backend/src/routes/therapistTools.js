import mongoose from 'mongoose';
import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { Appointment } from '../models/Appointment.js';
import { TherapistProfile } from '../models/TherapistProfile.js';
import { MoodEntry } from '../models/MoodEntry.js';
import { LibraryItem } from '../models/LibraryItem.js';
import { TherapistClientMessage } from '../models/TherapistClientMessage.js';
import { ClientResourceAssignment } from '../models/ClientResourceAssignment.js';
import { User } from '../models/User.js';
import { ok, fail } from '../utils/responses.js';

const router = Router();

async function ensureApprovedTherapist(therapistUserId) {
  return TherapistProfile.findOne({
    userId: therapistUserId,
    verificationStatus: 'approved'
  }).lean();
}

async function ensureTherapistClientRelation(therapistUserId, clientUserId) {
  if (!mongoose.isValidObjectId(clientUserId)) return false;
  const relation = await Appointment.exists({
    therapistUserId,
    userId: clientUserId,
    status: { $in: ['requested', 'confirmed', 'completed'] }
  });
  return Boolean(relation);
}

function mapMessage(message) {
  return {
    id: message._id.toString(),
    therapistUserId: message.therapistUserId.toString(),
    clientUserId: message.clientUserId.toString(),
    appointmentId: message.appointmentId ? message.appointmentId.toString() : null,
    senderRole: message.senderRole,
    text: message.text,
    createdAt: message.createdAt instanceof Date ? message.createdAt.toISOString() : new Date(message.createdAt).toISOString()
  };
}

function mapMoodEntry(entry) {
  return {
    id: entry._id.toString(),
    moodScore: entry.moodScore,
    tags: Array.isArray(entry.tags) ? entry.tags : [],
    note: entry.note || '',
    createdAt: entry.createdAt instanceof Date ? entry.createdAt.toISOString() : new Date(entry.createdAt).toISOString()
  };
}

function mapResource(item) {
  return {
    id: item._id.toString(),
    title: item.title,
    category: item.category,
    tags: Array.isArray(item.tags) ? item.tags : [],
    status: item.status
  };
}

function mapAssignment(assignment, item) {
  return {
    id: assignment._id.toString(),
    therapistUserId: assignment.therapistUserId.toString(),
    clientUserId: assignment.clientUserId.toString(),
    libraryItemId: assignment.libraryItemId.toString(),
    appointmentId: assignment.appointmentId ? assignment.appointmentId.toString() : null,
    note: assignment.note || '',
    status: assignment.status,
    completedAt: assignment.completedAt ? new Date(assignment.completedAt).toISOString() : null,
    createdAt: assignment.createdAt instanceof Date ? assignment.createdAt.toISOString() : new Date(assignment.createdAt).toISOString(),
    updatedAt: assignment.updatedAt instanceof Date ? assignment.updatedAt.toISOString() : new Date(assignment.updatedAt).toISOString(),
    item: item
      ? {
          id: item._id.toString(),
          title: item.title,
          category: item.category
        }
      : null
  };
}

router.get('/therapist/resources/catalog', verifyToken, requireRole('therapist'), async (req, res, next) => {
  try {
    const profile = await ensureApprovedTherapist(req.user.id);
    if (!profile) {
      return fail(res, 'Only approved therapists can browse assignable resources', 403, 'FORBIDDEN');
    }

    const q = String(req.query.q || '').trim().toLowerCase();
    const filter = { status: 'published' };
    const items = await LibraryItem.find(filter).sort({ createdAt: -1 }).lean();
    const mapped = items
      .map(mapResource)
      .filter((item) =>
        !q
          || item.title.toLowerCase().includes(q)
          || item.category.toLowerCase().includes(q)
          || item.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    return ok(res, { items: mapped, total: mapped.length });
  } catch (err) {
    return next(err);
  }
});

router.get('/therapist/clients/:clientId/messages', verifyToken, requireRole('therapist'), async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const appointmentId = req.query.appointmentId ? String(req.query.appointmentId).trim() : '';

    const profile = await ensureApprovedTherapist(req.user.id);
    if (!profile) {
      return fail(res, 'Only approved therapists can access client messages', 403, 'FORBIDDEN');
    }
    const hasRelation = await ensureTherapistClientRelation(req.user.id, clientId);
    if (!hasRelation) {
      return fail(res, 'Client not found for this therapist', 404, 'NOT_FOUND');
    }
    if (appointmentId && !mongoose.isValidObjectId(appointmentId)) {
      return fail(res, 'Invalid appointment id', 400, 'VALIDATION_ERROR');
    }

    const filter = {
      therapistUserId: req.user.id,
      clientUserId: clientId
    };
    if (appointmentId) {
      filter.appointmentId = appointmentId;
    }

    const items = await TherapistClientMessage.find(filter).sort({ createdAt: 1 }).lean();
    return ok(res, { items: items.map(mapMessage), total: items.length });
  } catch (err) {
    return next(err);
  }
});

router.post('/therapist/clients/:clientId/messages', verifyToken, requireRole('therapist'), async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const text = String(req.body.text || '').trim();
    const appointmentId = req.body.appointmentId ? String(req.body.appointmentId).trim() : '';

    if (!text) return fail(res, 'text is required', 400, 'VALIDATION_ERROR');
    if (appointmentId && !mongoose.isValidObjectId(appointmentId)) {
      return fail(res, 'Invalid appointment id', 400, 'VALIDATION_ERROR');
    }

    const profile = await ensureApprovedTherapist(req.user.id);
    if (!profile) {
      return fail(res, 'Only approved therapists can send client messages', 403, 'FORBIDDEN');
    }

    const hasRelation = await ensureTherapistClientRelation(req.user.id, clientId);
    if (!hasRelation) {
      return fail(res, 'Client not found for this therapist', 404, 'NOT_FOUND');
    }

    if (appointmentId) {
      const ownsAppointment = await Appointment.exists({
        _id: appointmentId,
        therapistUserId: req.user.id,
        userId: clientId
      });
      if (!ownsAppointment) {
        return fail(res, 'Appointment not found for this therapist-client pair', 404, 'NOT_FOUND');
      }
    }

    const message = await TherapistClientMessage.create({
      therapistUserId: req.user.id,
      clientUserId: clientId,
      appointmentId: appointmentId || null,
      senderRole: 'therapist',
      text
    });

    return ok(res, { message: mapMessage(message) }, 'Message saved', 201);
  } catch (err) {
    return next(err);
  }
});

router.get('/therapist/clients/:clientId/mood', verifyToken, requireRole('therapist'), async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const from = req.query.from ? new Date(String(req.query.from)) : null;
    const to = req.query.to ? new Date(String(req.query.to)) : null;

    const profile = await ensureApprovedTherapist(req.user.id);
    if (!profile) {
      return fail(res, 'Only approved therapists can access client mood insights', 403, 'FORBIDDEN');
    }
    const hasRelation = await ensureTherapistClientRelation(req.user.id, clientId);
    if (!hasRelation) {
      return fail(res, 'Client not found for this therapist', 404, 'NOT_FOUND');
    }
    if (from && Number.isNaN(from.getTime())) return fail(res, 'Invalid from date', 400, 'VALIDATION_ERROR');
    if (to && Number.isNaN(to.getTime())) return fail(res, 'Invalid to date', 400, 'VALIDATION_ERROR');

    const filter = { userId: clientId };
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = from;
      if (to) filter.createdAt.$lte = to;
    }

    const items = await MoodEntry.find(filter).sort({ createdAt: -1 }).lean();
    const mapped = items.map(mapMoodEntry);
    const average = mapped.length
      ? Number((mapped.reduce((sum, item) => sum + item.moodScore, 0) / mapped.length).toFixed(2))
      : 0;

    return ok(res, {
      items: mapped,
      total: mapped.length,
      stats: {
        averageMood: average,
        latestMood: mapped[0]?.moodScore ?? null
      }
    });
  } catch (err) {
    return next(err);
  }
});

router.get('/therapist/clients/:clientId/resources', verifyToken, requireRole('therapist'), async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const profile = await ensureApprovedTherapist(req.user.id);
    if (!profile) {
      return fail(res, 'Only approved therapists can access resource assignments', 403, 'FORBIDDEN');
    }
    const hasRelation = await ensureTherapistClientRelation(req.user.id, clientId);
    if (!hasRelation) {
      return fail(res, 'Client not found for this therapist', 404, 'NOT_FOUND');
    }

    const assignments = await ClientResourceAssignment.find({
      therapistUserId: req.user.id,
      clientUserId: clientId
    })
      .sort({ createdAt: -1 })
      .lean();

    const libraryItems = await LibraryItem.find({
      _id: { $in: assignments.map((item) => item.libraryItemId) }
    }).lean();
    const itemById = new Map(libraryItems.map((item) => [item._id.toString(), item]));

    return ok(res, {
      items: assignments.map((assignment) =>
        mapAssignment(assignment, itemById.get(assignment.libraryItemId.toString()))
      ),
      total: assignments.length
    });
  } catch (err) {
    return next(err);
  }
});

router.post('/therapist/clients/:clientId/resources', verifyToken, requireRole('therapist'), async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const libraryItemId = String(req.body.libraryItemId || '').trim();
    const appointmentId = req.body.appointmentId ? String(req.body.appointmentId).trim() : '';
    const note = String(req.body.note || '').trim();

    if (!mongoose.isValidObjectId(libraryItemId)) {
      return fail(res, 'libraryItemId is required', 400, 'VALIDATION_ERROR');
    }
    if (appointmentId && !mongoose.isValidObjectId(appointmentId)) {
      return fail(res, 'Invalid appointment id', 400, 'VALIDATION_ERROR');
    }

    const profile = await ensureApprovedTherapist(req.user.id);
    if (!profile) {
      return fail(res, 'Only approved therapists can assign resources', 403, 'FORBIDDEN');
    }
    const hasRelation = await ensureTherapistClientRelation(req.user.id, clientId);
    if (!hasRelation) {
      return fail(res, 'Client not found for this therapist', 404, 'NOT_FOUND');
    }

    const resource = await LibraryItem.findOne({ _id: libraryItemId, status: 'published' }).lean();
    if (!resource) {
      return fail(res, 'Published resource not found', 404, 'NOT_FOUND');
    }

    if (appointmentId) {
      const ownsAppointment = await Appointment.exists({
        _id: appointmentId,
        therapistUserId: req.user.id,
        userId: clientId
      });
      if (!ownsAppointment) {
        return fail(res, 'Appointment not found for this therapist-client pair', 404, 'NOT_FOUND');
      }
    }

    const assignment = await ClientResourceAssignment.create({
      therapistUserId: req.user.id,
      clientUserId: clientId,
      libraryItemId,
      appointmentId: appointmentId || null,
      note,
      status: 'assigned',
      completedAt: null
    });

    return ok(res, { assignment: mapAssignment(assignment, resource) }, 'Resource assigned', 201);
  } catch (err) {
    return next(err);
  }
});

router.put('/therapist/resource-assignments/:id', verifyToken, requireRole('therapist'), async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return fail(res, 'Assignment not found', 404, 'NOT_FOUND');
    }

    const profile = await ensureApprovedTherapist(req.user.id);
    if (!profile) {
      return fail(res, 'Only approved therapists can update assignments', 403, 'FORBIDDEN');
    }

    const update = {};
    if (req.body.status !== undefined) {
      const status = String(req.body.status).trim();
      if (!['assigned', 'in_progress', 'completed'].includes(status)) {
        return fail(res, 'Invalid assignment status', 400, 'VALIDATION_ERROR');
      }
      update.status = status;
      update.completedAt = status === 'completed' ? new Date() : null;
    }
    if (req.body.note !== undefined) {
      update.note = String(req.body.note || '').trim();
    }
    if (Object.keys(update).length === 0) {
      return fail(res, 'No assignment fields to update', 400, 'VALIDATION_ERROR');
    }

    const assignment = await ClientResourceAssignment.findOneAndUpdate(
      { _id: id, therapistUserId: req.user.id },
      { $set: update },
      { new: true }
    ).lean();

    if (!assignment) {
      return fail(res, 'Assignment not found', 404, 'NOT_FOUND');
    }

    const item = await LibraryItem.findById(assignment.libraryItemId).lean();
    return ok(res, { assignment: mapAssignment(assignment, item) }, 'Assignment updated');
  } catch (err) {
    return next(err);
  }
});

router.get('/therapist/clients/:clientId/summary', verifyToken, requireRole('therapist'), async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const profile = await ensureApprovedTherapist(req.user.id);
    if (!profile) {
      return fail(res, 'Only approved therapists can access client summary', 403, 'FORBIDDEN');
    }
    const hasRelation = await ensureTherapistClientRelation(req.user.id, clientId);
    if (!hasRelation) {
      return fail(res, 'Client not found for this therapist', 404, 'NOT_FOUND');
    }

    const [client, appointmentsCount] = await Promise.all([
      User.findById(clientId).lean(),
      Appointment.countDocuments({ therapistUserId: req.user.id, userId: clientId })
    ]);

    if (!client) {
      return fail(res, 'Client not found', 404, 'NOT_FOUND');
    }

    return ok(res, {
      client: {
        id: client._id.toString(),
        name: client.username,
        email: client.email
      },
      appointmentsCount
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
