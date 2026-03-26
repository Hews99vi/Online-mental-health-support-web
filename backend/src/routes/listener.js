import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { ListenerProfile } from '../models/ListenerProfile.js';
import { ok, fail } from '../utils/responses.js';

const router = Router();

function mapListener(profile) {
  return {
    id: profile.userId?.toString?.() ?? profile.userId,
    profileId: profile._id.toString(),
    name: profile.fullName,
    bio: profile.bio || '',
    languages: Array.isArray(profile.languages) ? profile.languages : [],
    status: profile.verificationStatus,
    submittedAt: profile.createdAt instanceof Date ? profile.createdAt.toISOString() : new Date(profile.createdAt).toISOString()
  };
}

function canApply(user) {
  return Array.isArray(user.roles) && (user.roles.includes('user') || user.roles.includes('listener'));
}

router.post('/listener/apply', verifyToken, async (req, res, next) => {
  try {
    if (!canApply(req.user)) {
      return fail(res, 'Only support-seeker users can apply for listener verification', 403, 'FORBIDDEN');
    }

    const fullName = String(req.body.fullName || req.user.username || '').trim();
    const bio = String(req.body.bio || '').trim();
    const languages = Array.isArray(req.body.languages) ? req.body.languages.map((value) => String(value).trim()).filter(Boolean) : [];

    if (!fullName) {
      return fail(res, 'fullName is required', 400, 'VALIDATION_ERROR');
    }

    const existing = await ListenerProfile.findOne({ userId: req.user.id });
    if (existing) {
      return fail(res, 'Listener profile already exists', 409, 'CONFLICT');
    }

    const profile = await ListenerProfile.create({
      userId: req.user.id,
      fullName,
      bio,
      languages,
      verificationStatus: 'pending'
    });

    return ok(res, { profile: mapListener(profile) }, 'Listener application submitted', 201);
  } catch (err) {
    return next(err);
  }
});

router.get('/listener/me', verifyToken, async (req, res, next) => {
  try {
    const profile = await ListenerProfile.findOne({ userId: req.user.id }).lean();
    return ok(res, { profile: profile ? mapListener(profile) : null });
  } catch (err) {
    return next(err);
  }
});

router.get('/listeners', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim().toLowerCase();
    const profiles = await ListenerProfile.find({ verificationStatus: 'approved' }).sort({ createdAt: -1 }).lean();
    const items = profiles
      .map(mapListener)
      .filter((item) => {
        if (!q) return true;
        return (
          item.name.toLowerCase().includes(q) ||
          item.bio.toLowerCase().includes(q) ||
          item.languages.some((language) => language.toLowerCase().includes(q))
        );
      });

    return ok(res, { items, total: items.length });
  } catch (err) {
    return next(err);
  }
});

export default router;
