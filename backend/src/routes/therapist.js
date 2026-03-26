import mongoose from 'mongoose';
import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { TherapistProfile } from '../models/TherapistProfile.js';
import { AvailabilitySlot } from '../models/AvailabilitySlot.js';
import { UserProfile } from '../models/UserProfile.js';
import { ok, fail } from '../utils/responses.js';
import { requireFields } from '../utils/validate.js';

const router = Router();

function canApply(user) {
  return Array.isArray(user.roles) && (user.roles.includes('user') || user.roles.includes('therapist'));
}

function initials(name) {
  return String(name || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'TH';
}

function parseDate(value) {
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeStringArray(values, fallback = []) {
  if (!Array.isArray(values)) return fallback;
  const cleaned = values.map((value) => String(value || '').trim()).filter(Boolean);
  return cleaned.length > 0 ? cleaned : fallback;
}

const MAX_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png'
]);
const ALLOWED_DOCUMENT_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

function hasAllowedDocumentExtension(name) {
  const lower = String(name || '').toLowerCase();
  return ALLOWED_DOCUMENT_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function normalizeDocuments(values) {
  if (!Array.isArray(values)) return { items: [], invalid: [] };

  const items = [];
  const invalid = [];

  for (const raw of values) {
    const name = String(raw?.name || '').trim();
    const mimeType = String(raw?.mimeType || '').trim().toLowerCase();
    const size = Number(raw?.size);
    const lastModified = Number(raw?.lastModified);

    if (!name) continue;

    const hasValidMime = mimeType && ALLOWED_DOCUMENT_MIME_TYPES.has(mimeType);
    const hasValidExt = hasAllowedDocumentExtension(name);
    const hasValidSize = Number.isFinite(size) && size > 0 && size <= MAX_DOCUMENT_SIZE_BYTES;
    const hasValidLastModified = Number.isFinite(lastModified) && lastModified > 0;

    if (!(hasValidMime || hasValidExt) || !hasValidSize) {
      invalid.push(name);
      continue;
    }

    items.push({
      name,
      mimeType: hasValidMime ? mimeType : '',
      size,
      lastModified: hasValidLastModified ? lastModified : 0,
      source: 'metadata'
    });
  }

  return { items, invalid };
}

async function isApprovedTherapist(userId) {
  const profile = await TherapistProfile.findOne({ userId, verificationStatus: 'approved' }).lean();
  return profile;
}

function mapTherapist(profile, nextAvailable, avatarUrl) {
  return {
    id: profile.userId.toString(),
    name: profile.fullName,
    title: profile.title || (profile.specialization?.[0] ? `${profile.specialization[0]} Therapist` : 'Licensed Therapist'),
    avatarUrl: profile.avatarUrl || avatarUrl || undefined,
    initials: initials(profile.fullName),
    bio: profile.bio || '',
    specialties: Array.isArray(profile.specialization) ? profile.specialization : [],
    languages: Array.isArray(profile.languages) && profile.languages.length > 0 ? profile.languages : ['English'],
    sessionTypes: ['video', 'audio'],
    ratePerHour: Number.isFinite(profile.ratePerHour) ? profile.ratePerHour : 7000,
    currency: profile.currency || 'USD',
    verified: profile.verificationStatus === 'approved',
    yearsExperience: Number.isFinite(profile.yearsExperience) ? profile.yearsExperience : 0,
    education: Array.isArray(profile.education) ? profile.education : [],
    certifications: Array.isArray(profile.certifications) ? profile.certifications : [],
    nextAvailable: nextAvailable ? nextAvailable.toISOString() : undefined
  };
}

function mapAvailability(slot) {
  return {
    id: slot._id.toString(),
    start: slot.startTime.toISOString(),
    end: slot.endTime.toISOString(),
    available: !slot.isBooked
  };
}

async function applyTherapist(req, res, next) {
  try {
    if (!canApply(req.user)) {
      return fail(res, 'Only users can apply for therapist verification', 403, 'FORBIDDEN');
    }

    const missing = requireFields(req.body, ['fullName', 'title', 'licenseNo', 'bio']);
    if (missing.length) {
      return fail(res, 'Missing required fields', 400, 'VALIDATION_ERROR', { missing });
    }

    const {
      fullName,
      title,
      avatarUrl,
      licenseNo,
      licenseBody,
      specialization,
      languages,
      bio,
      yearsExperience,
      ratePerHour,
      currency,
      education,
      certifications,
      documents
    } = req.body;

    const normalizedSpecialization = normalizeStringArray(specialization, []);
    if (normalizedSpecialization.length === 0) {
      return fail(res, 'At least one specialization is required', 400, 'VALIDATION_ERROR');
    }

    const existing = await TherapistProfile.findOne({ userId: req.user.id });
    if (existing) {
      return fail(res, 'Therapist profile already exists', 409, 'CONFLICT');
    }

    const { items: normalizedDocuments, invalid: invalidDocuments } = normalizeDocuments(documents);
    if (invalidDocuments.length > 0) {
      return fail(
        res,
        'Invalid document metadata. Allowed types: PDF, JPG, JPEG, PNG. Max size: 5 MB.',
        400,
        'VALIDATION_ERROR',
        { invalidDocuments }
      );
    }

    const profile = await TherapistProfile.create({
      userId: req.user.id,
      fullName: String(fullName || '').trim(),
      title: String(title || '').trim(),
      avatarUrl: avatarUrl ? String(avatarUrl || '').trim() : null,
      licenseNo: String(licenseNo || '').trim(),
      licenseBody: String(licenseBody || '').trim(),
      specialization: normalizedSpecialization,
      languages: normalizeStringArray(languages, ['English']),
      bio: String(bio || '').trim(),
      yearsExperience: Number.isFinite(Number(yearsExperience)) ? Math.max(0, Number(yearsExperience)) : 0,
      ratePerHour: Number.isFinite(Number(ratePerHour)) ? Math.max(0, Number(ratePerHour)) : 0,
      currency: String(currency || 'USD').trim() || 'USD',
      education: normalizeStringArray(education, []),
      certifications: normalizeStringArray(certifications, []),
      documents: normalizedDocuments,
      verificationStatus: 'pending'
    });

    return ok(res, { profile }, 'Therapist application submitted', 201);
  } catch (err) {
    return next(err);
  }
}

router.post('/therapist/apply', verifyToken, applyTherapist);
router.post('/therapists/apply', verifyToken, applyTherapist);

router.get('/therapist/me', verifyToken, async (req, res, next) => {
  try {
    const profile = await TherapistProfile.findOne({ userId: req.user.id }).lean();
    if (!profile) {
      return ok(res, { profile: null });
    }
    return ok(res, { profile });
  } catch (err) {
    return next(err);
  }
});

router.put('/therapist/me', verifyToken, async (req, res, next) => {
  try {
    const profile = await TherapistProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return fail(res, 'Therapist profile not found', 404, 'NOT_FOUND');
    }

    if (!['pending', 'approved'].includes(profile.verificationStatus)) {
      return fail(res, 'Profile cannot be edited in current status', 400, 'INVALID_STATE');
    }

    const { fullName, title, avatarUrl, licenseNo, licenseBody, specialization, languages, bio, yearsExperience, ratePerHour, currency, education, certifications, documents } = req.body;
    const update = {};

    if (fullName !== undefined) update.fullName = String(fullName).trim();
    if (title !== undefined) update.title = String(title).trim();
    if (avatarUrl !== undefined) update.avatarUrl = avatarUrl ? String(avatarUrl).trim() : null;
    if (licenseNo !== undefined) update.licenseNo = String(licenseNo).trim();
    if (licenseBody !== undefined) update.licenseBody = String(licenseBody).trim();
    if (specialization !== undefined) {
      update.specialization = normalizeStringArray(specialization, []);
    }
    if (languages !== undefined) {
      update.languages = normalizeStringArray(languages, ['English']);
    }
    if (education !== undefined) {
      update.education = normalizeStringArray(education, []);
    }
    if (certifications !== undefined) {
      update.certifications = normalizeStringArray(certifications, []);
    }
    if (bio !== undefined) update.bio = String(bio).trim();
    if (yearsExperience !== undefined) {
      const parsed = Number(yearsExperience);
      if (!Number.isFinite(parsed) || parsed < 0) {
        return fail(res, 'Invalid yearsExperience', 400, 'VALIDATION_ERROR');
      }
      update.yearsExperience = parsed;
    }
    if (ratePerHour !== undefined) {
      const parsed = Number(ratePerHour);
      if (!Number.isFinite(parsed) || parsed < 0) {
        return fail(res, 'Invalid ratePerHour', 400, 'VALIDATION_ERROR');
      }
      update.ratePerHour = parsed;
    }
    if (currency !== undefined) update.currency = String(currency).trim() || 'USD';
    if (documents !== undefined) {
      const { items: normalizedDocuments, invalid: invalidDocuments } = normalizeDocuments(documents);
      if (invalidDocuments.length > 0) {
        return fail(
          res,
          'Invalid document metadata. Allowed types: PDF, JPG, JPEG, PNG. Max size: 5 MB.',
          400,
          'VALIDATION_ERROR',
          { invalidDocuments }
        );
      }
      update.documents = normalizedDocuments;
    }

    if (Object.keys(update).length === 0) {
      return fail(res, 'No fields to update', 400, 'VALIDATION_ERROR');
    }

    const updated = await TherapistProfile.findOneAndUpdate(
      { userId: req.user.id },
      { $set: update },
      { new: true }
    );

    return ok(res, { profile: updated }, 'Therapist profile updated');
  } catch (err) {
    return next(err);
  }
});

router.post('/therapist/availability', verifyToken, requireRole('therapist'), async (req, res, next) => {
  try {
    const profile = await isApprovedTherapist(req.user.id);
    if (!profile) {
      return fail(res, 'Only approved therapists can publish availability', 403, 'FORBIDDEN');
    }

    const payload = Array.isArray(req.body.slots) ? req.body.slots : [req.body];
    if (payload.length === 0) {
      return fail(res, 'At least one slot is required', 400, 'VALIDATION_ERROR');
    }

    const docs = [];
    for (const slot of payload) {
      const startTime = parseDate(slot.startTime);
      const endTime = parseDate(slot.endTime);
      if (!startTime || !endTime || endTime <= startTime) {
        return fail(res, 'Invalid slot time range', 400, 'VALIDATION_ERROR');
      }
      docs.push({ therapistUserId: req.user.id, startTime, endTime, isBooked: false });
    }

    try {
      const created = await AvailabilitySlot.insertMany(docs, { ordered: false });
      return ok(res, { items: created.map(mapAvailability) }, 'Availability published', 201);
    } catch (err) {
      if (err?.code === 11000) {
        return fail(res, 'One or more slots already exist', 409, 'CONFLICT');
      }
      return next(err);
    }
  } catch (err) {
    return next(err);
  }
});

router.get('/therapist/availability', verifyToken, requireRole('therapist'), async (req, res, next) => {
  try {
    const profile = await isApprovedTherapist(req.user.id);
    if (!profile) {
      return fail(res, 'Only approved therapists can view availability', 403, 'FORBIDDEN');
    }

    const from = req.query.from ? parseDate(req.query.from) : null;
    const to = req.query.to ? parseDate(req.query.to) : null;
    if (req.query.from && !from) return fail(res, 'Invalid from date', 400, 'VALIDATION_ERROR');
    if (req.query.to && !to) return fail(res, 'Invalid to date', 400, 'VALIDATION_ERROR');

    const filter = { therapistUserId: req.user.id };
    if (from || to) {
      filter.startTime = {};
      if (from) filter.startTime.$gte = from;
      if (to) filter.startTime.$lte = to;
    }

    const items = await AvailabilitySlot.find(filter).sort({ startTime: 1 }).lean();
    return ok(res, { items: items.map(mapAvailability) });
  } catch (err) {
    return next(err);
  }
});

router.get('/therapists', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim().toLowerCase();
    const specialtyQuery = String(req.query.specialty || '').trim().toLowerCase();
    const specialtyFilter = specialtyQuery ? specialtyQuery.split(',').map((value) => value.trim()).filter(Boolean) : [];
    const languageQuery = String(req.query.language || '').trim().toLowerCase();
    const verified = req.query.verified === 'true';

    const filter = {};
    if (verified) filter.verificationStatus = 'approved';
    else filter.verificationStatus = { $in: ['approved'] };

    const profiles = await TherapistProfile.find(filter).lean();
    const avatarProfiles = await UserProfile.find({ userId: { $in: profiles.map((profile) => profile.userId) } })
      .select({ userId: 1, avatarUrl: 1 })
      .lean();
    const avatarByUser = new Map(avatarProfiles.map((item) => [item.userId.toString(), item.avatarUrl]));

    const therapistUserIds = profiles.map((profile) => profile.userId);
    const slots = await AvailabilitySlot.find({
      therapistUserId: { $in: therapistUserIds },
      isBooked: false,
      startTime: { $gte: new Date() }
    })
      .sort({ startTime: 1 })
      .lean();

    const nextByTherapist = new Map();
    for (const slot of slots) {
      const key = slot.therapistUserId.toString();
      if (!nextByTherapist.has(key)) nextByTherapist.set(key, slot.startTime);
    }

    let items = profiles.map((profile) =>
      mapTherapist(
        profile,
        nextByTherapist.get(profile.userId.toString()),
        avatarByUser.get(profile.userId.toString())
      )
    );

    if (specialtyFilter.length > 0) {
      items = items.filter((item) =>
        item.specialties.some((specialty) =>
          specialtyFilter.some((needle) => specialty.toLowerCase().includes(needle))
        )
      );
    }

    if (languageQuery) {
      items = items.filter((item) =>
        item.languages.some((language) => language.toLowerCase().includes(languageQuery))
      );
    }

    if (q) {
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.bio.toLowerCase().includes(q) ||
          item.specialties.some((specialty) => specialty.toLowerCase().includes(q))
      );
    }

    return ok(res, { items, total: items.length });
  } catch (err) {
    return next(err);
  }
});

router.get('/therapists/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return fail(res, 'Therapist not found', 404, 'NOT_FOUND');
    }

    const profile = await TherapistProfile.findOne({
      userId: req.params.id,
      verificationStatus: 'approved'
    }).lean();

    if (!profile) {
      return fail(res, 'Therapist not found', 404, 'NOT_FOUND');
    }

    const [nextSlot, avatarProfile] = await Promise.all([
      AvailabilitySlot.findOne({
        therapistUserId: req.params.id,
        isBooked: false,
        startTime: { $gte: new Date() }
      })
        .sort({ startTime: 1 })
        .lean(),
      UserProfile.findOne({ userId: req.params.id }).select({ avatarUrl: 1 }).lean()
    ]);

    return ok(res, { therapist: mapTherapist(profile, nextSlot?.startTime, avatarProfile?.avatarUrl) });
  } catch (err) {
    return next(err);
  }
});

router.get('/therapists/:id/availability', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return fail(res, 'Therapist not found', 404, 'NOT_FOUND');
    }

    const profile = await TherapistProfile.findOne({
      userId: req.params.id,
      verificationStatus: 'approved'
    }).lean();

    if (!profile) {
      return fail(res, 'Therapist not found', 404, 'NOT_FOUND');
    }

    const from = req.query.from ? parseDate(req.query.from) : new Date();
    const to = req.query.to ? parseDate(req.query.to) : null;

    if (req.query.from && !from) return fail(res, 'Invalid from date', 400, 'VALIDATION_ERROR');
    if (req.query.to && !to) return fail(res, 'Invalid to date', 400, 'VALIDATION_ERROR');

    const filter = { therapistUserId: req.params.id };
    if (from || to) {
      filter.startTime = {};
      if (from) filter.startTime.$gte = from;
      if (to) filter.startTime.$lte = to;
    }

    const items = await AvailabilitySlot.find(filter).sort({ startTime: 1 }).lean();
    return ok(res, { items: items.map(mapAvailability) });
  } catch (err) {
    return next(err);
  }
});

export default router;
