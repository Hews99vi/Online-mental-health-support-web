import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { TherapistProfile } from '../models/TherapistProfile.js';
import { ListenerProfile } from '../models/ListenerProfile.js';
import { User } from '../models/User.js';
import { Appointment } from '../models/Appointment.js';
import { MoodEntry } from '../models/MoodEntry.js';
import { LibraryItem } from '../models/LibraryItem.js';
import { Report } from '../models/Report.js';
import { ok, fail } from '../utils/responses.js';

const router = Router();

const REVIEW_STATUSES = new Set(['pending', 'approved', 'rejected']);
const USER_ROLE_PRIORITY = ['admin', 'therapist', 'listener', 'user'];

function primaryRole(roles = []) {
  for (const role of USER_ROLE_PRIORITY) {
    if (roles.includes(role)) return role;
  }
  return 'user';
}

function mapProfile(profile) {
  return {
    id: profile._id.toString(),
    userId: profile.userId?._id ? profile.userId._id.toString() : profile.userId?.toString?.() ?? null,
    name: profile.fullName,
    email: profile.userId?.email ?? null,
    username: profile.userId?.username ?? null,
    title: profile.title ?? '',
    licenseNo: profile.licenseNo,
    licenseBody: profile.licenseBody ?? '',
    specialization: Array.isArray(profile.specialization) ? profile.specialization : [],
    languages: Array.isArray(profile.languages) ? profile.languages : [],
    bio: profile.bio ?? '',
    yearsExperience: Number.isFinite(profile.yearsExperience) ? profile.yearsExperience : 0,
    ratePerHour: Number.isFinite(profile.ratePerHour) ? profile.ratePerHour : 0,
    currency: profile.currency ?? 'USD',
    documents: Array.isArray(profile.documents) ? profile.documents.map((doc) => ({
      name: doc?.name ?? '',
      mimeType: doc?.mimeType ?? '',
      size: Number.isFinite(doc?.size) ? doc.size : 0,
      lastModified: Number.isFinite(doc?.lastModified) ? doc.lastModified : 0,
      source: doc?.source ?? 'metadata'
    })) : [],
    status: profile.verificationStatus,
    submittedAt: profile.createdAt instanceof Date ? profile.createdAt.toISOString() : new Date(profile.createdAt).toISOString(),
    approvedAt: profile.approvedAt ? new Date(profile.approvedAt).toISOString() : null,
    rejectedAt: profile.rejectedAt ? new Date(profile.rejectedAt).toISOString() : null,
    rejectedReason: profile.rejectedReason ?? null,
    reviewedBy: profile.reviewedBy?._id ? {
      id: profile.reviewedBy._id.toString(),
      email: profile.reviewedBy.email ?? null,
      username: profile.reviewedBy.username ?? null
    } : null
  };
}

function mapListenerProfile(profile) {
  return {
    id: profile._id.toString(),
    userId: profile.userId?._id ? profile.userId._id.toString() : profile.userId?.toString?.() ?? null,
    name: profile.fullName,
    email: profile.userId?.email ?? null,
    username: profile.userId?.username ?? null,
    bio: profile.bio ?? '',
    languages: Array.isArray(profile.languages) ? profile.languages : [],
    status: profile.verificationStatus,
    submittedAt: profile.createdAt instanceof Date ? profile.createdAt.toISOString() : new Date(profile.createdAt).toISOString(),
    approvedAt: profile.approvedAt ? new Date(profile.approvedAt).toISOString() : null,
    rejectedAt: profile.rejectedAt ? new Date(profile.rejectedAt).toISOString() : null,
    rejectedReason: profile.rejectedReason ?? null,
    reviewedBy: profile.reviewedBy?._id
      ? {
          id: profile.reviewedBy._id.toString(),
          email: profile.reviewedBy.email ?? null,
          username: profile.reviewedBy.username ?? null
        }
      : null
  };
}

function mapReport(report) {
  return {
    id: report._id.toString(),
    reporterUserId: report.reporterUserId?._id ? report.reporterUserId._id.toString() : report.reporterUserId?.toString?.() ?? null,
    reporter: report.reporterUserId?._id ? {
      id: report.reporterUserId._id.toString(),
      username: report.reporterUserId.username ?? null,
      email: report.reporterUserId.email ?? null
    } : null,
    targetType: report.targetType,
    targetId: report.targetId,
    reason: report.reason,
    status: report.status,
    createdAt: report.createdAt instanceof Date ? report.createdAt.toISOString() : new Date(report.createdAt).toISOString()
  };
}

function mapUser(user) {
  return {
    id: user._id.toString(),
    name: user.username,
    email: user.email,
    role: primaryRole(Array.isArray(user.roles) ? user.roles : []),
    roles: Array.isArray(user.roles) ? user.roles : [],
    status: user.status || 'active',
    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : new Date(user.createdAt).toISOString()
  };
}

function dayRange(days) {
  const end = new Date();
  const start = new Date(end);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  return { start, end };
}

function makeDayLabels(start, days) {
  const labels = [];
  const keys = [];
  for (let i = 0; i < days; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
    keys.push(d.toISOString().slice(0, 10));
  }
  return { labels, keys };
}

function mapSeries(keys, grouped) {
  const byKey = new Map(grouped.map((item) => [item._id, item.count]));
  return keys.map((key) => byKey.get(key) || 0);
}

router.get('/admin/analytics', verifyToken, requireRole('admin'), async (req, res, next) => {
  try {
    const { start, end } = dayRange(7);
    const { labels, keys } = makeDayLabels(start, 7);

    const [
      totalUsers,
      approvedTherapists,
      pendingTherapistApplications,
      approvedListeners,
      totalBookings,
      cancelledBookings,
      totalMoodEntries,
      openReports,
      libraryItems,
      libraryItemCount,
      usersByDay,
      bookingsByDay,
      cancelledBookingsByDay,
      moodByDay,
      reportsByDay,
      libraryByType,
      therapistApplicationsByStatus
    ] = await Promise.all([
      User.countDocuments(),
      TherapistProfile.countDocuments({ verificationStatus: 'approved' }),
      TherapistProfile.countDocuments({ verificationStatus: 'pending' }),
      ListenerProfile.countDocuments({ verificationStatus: 'approved' }),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: 'cancelled' }),
      MoodEntry.countDocuments(),
      Report.countDocuments({ status: 'open' }),
      LibraryItem.countDocuments({ status: 'published' }),
      LibraryItem.countDocuments(),
      User.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } }
      ]),
      Appointment.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } }
      ]),
      Appointment.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end }, status: 'cancelled' } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } }
      ]),
      MoodEntry.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } }
      ]),
      Report.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } }
      ]),
      LibraryItem.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      TherapistProfile.aggregate([
        { $group: { _id: '$verificationStatus', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
    ]);

    return ok(res, {
      totalUsers,
      approvedTherapists,
      pendingTherapistApplications,
      approvedListeners,
      bookingsCount: totalBookings,
      totalBookings,
      cancelledBookings,
      moodEntriesCount: totalMoodEntries,
      totalMoodEntries,
      openReports,
      libraryItems,
      libraryItemCount,
      trends: {
        labels,
        newUsers: mapSeries(keys, usersByDay),
        bookings: mapSeries(keys, bookingsByDay),
        cancelledBookings: mapSeries(keys, cancelledBookingsByDay),
        moodEntries: mapSeries(keys, moodByDay),
        reportsOpened: mapSeries(keys, reportsByDay)
      },
      grouped: {
        libraryByType: libraryByType.map((item) => ({ type: item._id || 'unknown', count: item.count })),
        therapistApplicationsByStatus: therapistApplicationsByStatus.map((item) => ({ status: item._id || 'unknown', count: item.count }))
      }
    });
  } catch (err) {
    return next(err);
  }
});

router.get('/admin/listeners', verifyToken, requireRole('admin'), async (req, res, next) => {
  try {
    const status = req.query.status ? String(req.query.status) : null;
    const filter = {};
    if (status) {
      if (!REVIEW_STATUSES.has(status)) {
        return fail(res, 'Invalid status filter', 400, 'VALIDATION_ERROR');
      }
      filter.verificationStatus = status;
    }

    const items = await ListenerProfile.find(filter)
      .sort({ createdAt: -1 })
      .populate('userId', 'username email roles')
      .populate('reviewedBy', 'username email')
      .lean();

    return ok(res, { items: items.map(mapListenerProfile), total: items.length });
  } catch (err) {
    return next(err);
  }
});

router.post('/admin/listeners/:id/approve', verifyToken, requireRole('admin'), async (req, res, next) => {
  try {
    const profile = await ListenerProfile.findById(req.params.id);
    if (!profile) {
      return fail(res, 'Listener profile not found', 404, 'NOT_FOUND');
    }

    profile.verificationStatus = 'approved';
    profile.approvedAt = new Date();
    profile.rejectedAt = null;
    profile.rejectedReason = null;
    profile.reviewedBy = req.user.id;
    await profile.save();

    await User.updateOne({ _id: profile.userId }, { $addToSet: { roles: 'listener' } });

    const updated = await ListenerProfile.findById(profile._id)
      .populate('userId', 'username email roles')
      .populate('reviewedBy', 'username email')
      .lean();
    return ok(res, { profile: mapListenerProfile(updated) }, 'Listener approved');
  } catch (err) {
    return next(err);
  }
});

router.post('/admin/listeners/:id/reject', verifyToken, requireRole('admin'), async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      return fail(res, 'Rejection reason is required', 400, 'VALIDATION_ERROR');
    }

    const profile = await ListenerProfile.findById(req.params.id);
    if (!profile) {
      return fail(res, 'Listener profile not found', 404, 'NOT_FOUND');
    }

    profile.verificationStatus = 'rejected';
    profile.rejectedAt = new Date();
    profile.rejectedReason = reason;
    profile.reviewedBy = req.user.id;
    await profile.save();

    await User.updateOne({ _id: profile.userId }, { $pull: { roles: 'listener' } });

    const updated = await ListenerProfile.findById(profile._id)
      .populate('userId', 'username email roles')
      .populate('reviewedBy', 'username email')
      .lean();
    return ok(res, { profile: mapListenerProfile(updated) }, 'Listener rejected');
  } catch (err) {
    return next(err);
  }
});

router.get('/admin/users', verifyToken, requireRole('admin'), async (req, res, next) => {
  try {
    const role = req.query.role ? String(req.query.role).trim().toLowerCase() : '';
    const q = req.query.q ? String(req.query.q).trim().toLowerCase() : '';

    const filter = {};
    if (role && role !== 'all') {
      filter.roles = role;
    }

    let users = await User.find(filter).sort({ createdAt: -1 }).lean();
    if (q) {
      users = users.filter((user) =>
        user.username.toLowerCase().includes(q) || user.email.toLowerCase().includes(q)
      );
    }

    return ok(res, { items: users.map(mapUser), total: users.length });
  } catch (err) {
    return next(err);
  }
});

router.post('/admin/users/:id/suspend', verifyToken, requireRole('admin'), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return fail(res, 'User not found', 404, 'NOT_FOUND');
    }
    if (Array.isArray(user.roles) && user.roles.includes('admin')) {
      return fail(res, 'Admin users cannot be suspended', 400, 'INVALID_STATE');
    }

    user.status = 'suspended';
    await user.save();
    return ok(res, { user: mapUser(user) }, 'User suspended');
  } catch (err) {
    return next(err);
  }
});

router.post('/admin/users/:id/unsuspend', verifyToken, requireRole('admin'), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return fail(res, 'User not found', 404, 'NOT_FOUND');
    }

    user.status = 'active';
    await user.save();
    return ok(res, { user: mapUser(user) }, 'User unsuspended');
  } catch (err) {
    return next(err);
  }
});

router.post('/reports', verifyToken, async (req, res, next) => {
  try {
    const targetType = String(req.body.targetType || '').trim();
    const targetId = String(req.body.targetId || '').trim();
    const reason = String(req.body.reason || '').trim();

    if (!targetType || !targetId || !reason) {
      return fail(res, 'targetType, targetId and reason are required', 400, 'VALIDATION_ERROR');
    }

    const report = await Report.create({
      reporterUserId: req.user.id,
      targetType,
      targetId,
      reason,
      status: 'open'
    });

    const populated = await Report.findById(report._id).populate('reporterUserId', 'username email').lean();
    return ok(res, { report: mapReport(populated) }, 'Report submitted', 201);
  } catch (err) {
    return next(err);
  }
});

router.get('/admin/reports', verifyToken, requireRole('admin'), async (req, res, next) => {
  try {
    const status = req.query.status ? String(req.query.status).trim().toLowerCase() : '';
    const filter = {};
    if (status) {
      if (!['open', 'closed'].includes(status)) {
        return fail(res, 'Invalid status filter', 400, 'VALIDATION_ERROR');
      }
      filter.status = status;
    }

    const items = await Report.find(filter)
      .sort({ createdAt: -1 })
      .populate('reporterUserId', 'username email')
      .lean();

    return ok(res, { items: items.map(mapReport), total: items.length });
  } catch (err) {
    return next(err);
  }
});

router.post('/admin/reports/:id/close', verifyToken, requireRole('admin'), async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return fail(res, 'Report not found', 404, 'NOT_FOUND');
    }

    report.status = 'closed';
    await report.save();

    const populated = await Report.findById(report._id).populate('reporterUserId', 'username email').lean();
    return ok(res, { report: mapReport(populated) }, 'Report closed');
  } catch (err) {
    return next(err);
  }
});

router.get('/admin/therapists', verifyToken, requireRole('admin'), async (req, res, next) => {
  try {
    const status = req.query.status ? String(req.query.status) : null;
    const filter = {};
    if (status) {
      if (!REVIEW_STATUSES.has(status)) {
        return fail(res, 'Invalid status filter', 400, 'VALIDATION_ERROR');
      }
      filter.verificationStatus = status;
    }
    const items = await TherapistProfile.find(filter)
      .sort({ createdAt: -1 })
      .populate('userId', 'username email roles')
      .populate('reviewedBy', 'username email')
      .lean();
    return ok(res, { items: items.map(mapProfile), total: items.length });
  } catch (err) {
    return next(err);
  }
});

router.post('/admin/therapists/:id/approve', verifyToken, requireRole('admin'), async (req, res, next) => {
  try {
    const profile = await TherapistProfile.findById(req.params.id);
    if (!profile) {
      return fail(res, 'Therapist profile not found', 404, 'NOT_FOUND');
    }

    profile.verificationStatus = 'approved';
    profile.approvedAt = new Date();
    profile.rejectedAt = null;
    profile.rejectedReason = null;
    profile.reviewedBy = req.user.id;
    await profile.save();

    await User.updateOne(
      { _id: profile.userId },
      { $addToSet: { roles: 'therapist' } }
    );

    const updated = await TherapistProfile.findById(profile._id)
      .populate('userId', 'username email roles')
      .populate('reviewedBy', 'username email')
      .lean();
    return ok(res, { profile: mapProfile(updated) }, 'Therapist approved');
  } catch (err) {
    return next(err);
  }
});

router.post('/admin/therapists/:id/reject', verifyToken, requireRole('admin'), async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      return fail(res, 'Rejection reason is required', 400, 'VALIDATION_ERROR');
    }

    const profile = await TherapistProfile.findById(req.params.id);
    if (!profile) {
      return fail(res, 'Therapist profile not found', 404, 'NOT_FOUND');
    }

    profile.verificationStatus = 'rejected';
    profile.rejectedAt = new Date();
    profile.rejectedReason = reason;
    profile.reviewedBy = req.user.id;
    await profile.save();

    const updated = await TherapistProfile.findById(profile._id)
      .populate('userId', 'username email roles')
      .populate('reviewedBy', 'username email')
      .lean();
    return ok(res, { profile: mapProfile(updated) }, 'Therapist rejected');
  } catch (err) {
    return next(err);
  }
});

export default router;
