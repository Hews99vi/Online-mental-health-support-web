import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { UserProfile } from '../models/UserProfile.js';
import { ok, fail } from '../utils/responses.js';
import { requireFields } from '../utils/validate.js';

const router = Router();

function sanitizeProfile(profile) {
  return {
    id: profile._id.toString(),
    userId: profile.userId.toString(),
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl ?? null,
    preferences: profile.preferences ?? {},
    createdAt: profile.createdAt instanceof Date ? profile.createdAt.toISOString() : profile.createdAt,
    updatedAt: profile.updatedAt instanceof Date ? profile.updatedAt.toISOString() : profile.updatedAt
  };
}

router.get('/profile/me', verifyToken, async (req, res, next) => {
  try {
    const profile = await UserProfile.findOne({ userId: req.user.id }).lean();
    if (!profile) {
      return ok(res, { profile: null });
    }
    return ok(res, { profile: sanitizeProfile(profile) });
  } catch (err) {
    return next(err);
  }
});

router.put('/profile/me', verifyToken, async (req, res, next) => {
  try {
    const { displayName, avatarUrl, preferences } = req.body;

    if (displayName !== undefined && displayName !== null && displayName === '') {
      return fail(res, 'displayName cannot be empty', 400, 'VALIDATION_ERROR');
    }

    const update = {};
    if (displayName !== undefined) update.displayName = displayName;
    if (avatarUrl !== undefined) update.avatarUrl = avatarUrl;
    if (preferences !== undefined) update.preferences = preferences;

    if (Object.keys(update).length === 0) {
      return fail(res, 'No fields to update', 400, 'VALIDATION_ERROR');
    }

    const existing = await UserProfile.findOne({ userId: req.user.id });
    if (!existing) {
      const missing = requireFields({ displayName }, ['displayName']);
      if (missing.length) {
        return fail(res, 'Missing required fields', 400, 'VALIDATION_ERROR', { missing });
      }
      const created = await UserProfile.create({
        userId: req.user.id,
        displayName,
        avatarUrl: avatarUrl ?? null,
        preferences: preferences ?? {}
      });
      return ok(res, { profile: sanitizeProfile(created) }, 'Profile created');
    }

    const updated = await UserProfile.findOneAndUpdate(
      { userId: req.user.id },
      { $set: update },
      { new: true }
    );
    return ok(res, { profile: sanitizeProfile(updated) }, 'Profile updated');
  } catch (err) {
    return next(err);
  }
});

export default router;
