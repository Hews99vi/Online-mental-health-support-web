import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { MoodEntry } from '../models/MoodEntry.js';
import { JournalEntry } from '../models/JournalEntry.js';
import { Appointment } from '../models/Appointment.js';
import { AvailabilitySlot } from '../models/AvailabilitySlot.js';
import { TherapistProfile } from '../models/TherapistProfile.js';
import { ListenerProfile } from '../models/ListenerProfile.js';
import { ChatSession } from '../models/ChatSession.js';
import { ok } from '../utils/responses.js';

const router = Router();
const ROLE_PRIORITY = ['admin', 'therapist', 'listener', 'user'];

function primaryRole(roles = []) {
  for (const role of ROLE_PRIORITY) {
    if (roles.includes(role)) return role;
  }
  return 'user';
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfMonth(date) {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function userSummary(userId) {
  const now = new Date();
  const thisWeekStart = startOfDay(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));
  const lastWeekStart = startOfDay(new Date(thisWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000));
  const thisWeekEnd = endOfDay(now);
  const lastWeekEnd = endOfDay(new Date(thisWeekStart.getTime() - 1));

  const [thisWeekEntries, lastWeekEntries, upcomingAppointments, journalCountMonth, therapists, listeners] = await Promise.all([
    MoodEntry.find({ userId, createdAt: { $gte: thisWeekStart, $lte: thisWeekEnd } }).sort({ createdAt: 1 }).lean(),
    MoodEntry.find({ userId, createdAt: { $gte: lastWeekStart, $lte: lastWeekEnd } }).lean(),
    Appointment.find({ userId, status: { $in: ['requested', 'confirmed'] } }).sort({ createdAt: -1 }).limit(5).lean(),
    JournalEntry.countDocuments({ userId, createdAt: { $gte: startOfMonth(now) } }),
    TherapistProfile.find({ verificationStatus: 'approved' }).sort({ createdAt: -1 }).limit(8).lean(),
    ListenerProfile.find({ verificationStatus: 'approved' }).sort({ createdAt: -1 }).limit(8).lean()
  ]);

  const avgThis = thisWeekEntries.length
    ? thisWeekEntries.reduce((sum, entry) => sum + entry.moodScore, 0) / thisWeekEntries.length
    : 0;
  const avgLast = lastWeekEntries.length
    ? lastWeekEntries.reduce((sum, entry) => sum + entry.moodScore, 0) / lastWeekEntries.length
    : 0;

  const deltaPct = avgLast > 0 ? Math.round(((avgThis - avgLast) / avgLast) * 100) : 0;
  const moodSeries = thisWeekEntries.map((entry) => ({
    value: entry.moodScore,
    at: entry.createdAt instanceof Date ? entry.createdAt.toISOString() : new Date(entry.createdAt).toISOString()
  }));

  const slotIds = upcomingAppointments.map((item) => item.slotId);
  const slots = await AvailabilitySlot.find({ _id: { $in: slotIds } }).lean();
  const slotById = new Map(slots.map((slot) => [slot._id.toString(), slot]));

  const therapistIds = [...new Set(upcomingAppointments.map((item) => item.therapistUserId.toString()))];
  const profiles = await TherapistProfile.find({ userId: { $in: therapistIds } }).lean();
  const profileById = new Map(profiles.map((profile) => [profile.userId.toString(), profile]));

  const upcoming = upcomingAppointments.map((item) => {
    const slot = slotById.get(item.slotId.toString());
    const profile = profileById.get(item.therapistUserId.toString());
    return {
      id: item._id.toString(),
      therapistName: profile?.fullName || 'Therapist',
      start: slot?.startTime?.toISOString() || null,
      end: slot?.endTime?.toISOString() || null,
      status: item.status
    };
  });

  return {
    role: 'user',
    stats: {
      avgMoodWeek: Number(avgThis.toFixed(1)),
      avgMoodDeltaPct: deltaPct,
      upcomingSessions: upcoming.length,
      journalsThisMonth: journalCountMonth
    },
    moodSeries,
    upcoming,
    verifiedTherapists: therapists.map((profile) => ({
      id: profile.userId.toString(),
      name: profile.fullName,
      specialty: Array.isArray(profile.specialization) && profile.specialization.length > 0 ? profile.specialization[0] : 'General therapy'
    })),
    verifiedListeners: listeners.map((profile) => ({
      id: profile.userId.toString(),
      name: profile.fullName,
      bio: profile.bio || ''
    }))
  };
}

async function therapistSummary(userId) {
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  const monthStart = startOfMonth(new Date());

  const [appointments, therapistProfile] = await Promise.all([
    Appointment.find({ therapistUserId: userId }).sort({ createdAt: -1 }).lean(),
    TherapistProfile.findOne({ userId }).lean()
  ]);

  const slotIds = appointments.map((item) => item.slotId);
  const slots = await AvailabilitySlot.find({ _id: { $in: slotIds } }).lean();
  const slotById = new Map(slots.map((slot) => [slot._id.toString(), slot]));

  const sessionsToday = appointments.filter((item) => {
    const slot = slotById.get(item.slotId.toString());
    if (!slot?.startTime) return false;
    return slot.startTime >= todayStart && slot.startTime <= todayEnd;
  });

  const activeClientSet = new Set(
    appointments
      .filter((item) => item.status !== 'cancelled')
      .map((item) => item.userId.toString())
  );

  const confirmedThisMonth = appointments.filter((item) => {
    const slot = slotById.get(item.slotId.toString());
    return item.status === 'confirmed' && slot?.startTime && slot.startTime >= monthStart;
  }).length;

  const pendingNotes = appointments
    .filter((item) => item.status === 'completed' && !item.therapistNotes)
    .slice(0, 5)
    .map((item) => {
      const slot = slotById.get(item.slotId.toString());
      return {
        id: item._id.toString(),
        userId: item.userId.toString(),
        at: slot?.startTime?.toISOString() || null
      };
    });

  return {
    role: 'therapist',
    profileStatus: therapistProfile?.verificationStatus || null,
    stats: {
      activeClients: activeClientSet.size,
      sessionsToday: sessionsToday.length,
      confirmedThisMonth,
      pendingNotes: pendingNotes.length
    },
    todaySessions: sessionsToday.slice(0, 5).map((item) => {
      const slot = slotById.get(item.slotId.toString());
      return {
        id: item._id.toString(),
        userId: item.userId.toString(),
        start: slot?.startTime?.toISOString() || null,
        end: slot?.endTime?.toISOString() || null,
        status: item.status
      };
    }),
    pendingNotes
  };
}

async function listenerSummary(userId) {
  const [mySessions, queueCount, activeCount] = await Promise.all([
    ChatSession.find({ listenerId: userId }).sort({ createdAt: -1 }).limit(20).lean(),
    ChatSession.countDocuments({ status: 'queued', listenerId: null }),
    ChatSession.countDocuments({ status: 'active', listenerId: userId })
  ]);

  const completed = mySessions.filter((session) => session.status === 'closed');
  const sessionsThisWeek = mySessions.filter((session) => {
    const created = session.createdAt instanceof Date ? session.createdAt : new Date(session.createdAt);
    return created >= startOfDay(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000));
  }).length;

  return {
    role: 'listener',
    stats: {
      totalSessions: mySessions.length,
      sessionsThisWeek,
      currentlyActive: activeCount,
      queueCount
    },
    recentSessions: completed.slice(0, 5).map((session) => ({
      id: session._id.toString(),
      userId: session.userId ? session.userId.toString() : null,
      createdAt: session.createdAt instanceof Date ? session.createdAt.toISOString() : new Date(session.createdAt).toISOString(),
      closedAt: session.closedAt ? new Date(session.closedAt).toISOString() : null
    }))
  };
}

router.get('/dashboard/me', verifyToken, async (req, res, next) => {
  try {
    const role = primaryRole(req.user.roles || []);

    if (role === 'therapist') {
      return ok(res, { summary: await therapistSummary(req.user.id) });
    }
    if (role === 'listener') {
      return ok(res, { summary: await listenerSummary(req.user.id) });
    }

    return ok(res, { summary: await userSummary(req.user.id) });
  } catch (err) {
    return next(err);
  }
});

export default router;
