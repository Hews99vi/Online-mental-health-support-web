import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { UserConsent } from '../models/UserConsent.js';
import { ok, fail } from '../utils/responses.js';

const router = Router();

function buildDefaultConsent() {
  return {
    termsAccepted: true,
    privacyAccepted: true,
    biometricConsent: false,
    aiConsent: true,
    analyticsConsent: true,
    updatedAt: new Date().toISOString()
  };
}

function sanitizeConsent(consent) {
  return {
    termsAccepted: consent.termsAccepted,
    privacyAccepted: consent.privacyAccepted,
    biometricConsent: consent.biometricConsent,
    aiConsent: consent.aiConsent,
    analyticsConsent: consent.analyticsConsent,
    updatedAt: consent.updatedAt instanceof Date ? consent.updatedAt.toISOString() : consent.updatedAt
  };
}

router.get('/consent/me', verifyToken, async (req, res, next) => {
  try {
    const consent = await UserConsent.findOne({ userId: req.user.id }).lean();
    return ok(res, { consent: consent ? sanitizeConsent(consent) : buildDefaultConsent() });
  } catch (err) {
    return next(err);
  }
});

router.put('/consent/me', verifyToken, async (req, res, next) => {
  try {
    const {
      termsAccepted,
      privacyAccepted,
      biometricConsent,
      aiConsent,
      analyticsConsent
    } = req.body;

    const update = {};

    if (termsAccepted !== undefined) update.termsAccepted = Boolean(termsAccepted);
    if (privacyAccepted !== undefined) update.privacyAccepted = Boolean(privacyAccepted);
    if (biometricConsent !== undefined) update.biometricConsent = Boolean(biometricConsent);
    if (aiConsent !== undefined) update.aiConsent = Boolean(aiConsent);
    if (analyticsConsent !== undefined) update.analyticsConsent = Boolean(analyticsConsent);

    if (Object.keys(update).length === 0) {
      return fail(res, 'No consent fields to update', 400, 'VALIDATION_ERROR');
    }

    const consent = await UserConsent.findOneAndUpdate(
      { userId: req.user.id },
      { $set: update },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    return ok(res, { consent: sanitizeConsent(consent) }, 'Consent preferences updated');
  } catch (err) {
    return next(err);
  }
});

export default router;
