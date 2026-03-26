import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UserConsent } from '../models/UserConsent.js';
import { fail } from '../utils/responses.js';

const REQUIRED_FIELDS = ['termsAccepted', 'privacyAccepted'];

function hasRequiredConsent(consentDoc) {
  if (!consentDoc) return true;
  return REQUIRED_FIELDS.every((field) => consentDoc[field] === true);
}

export async function enforceRequiredConsent(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const userId = payload?.sub;
    if (!userId) return next();

    const consent = await UserConsent.findOne({ userId }).lean();
    if (hasRequiredConsent(consent)) return next();

    return fail(
      res,
      'Required consent missing. Re-accept Terms and Privacy Policy to continue.',
      403,
      'CONSENT_REQUIRED',
      { required: REQUIRED_FIELDS }
    );
  } catch {
    // Invalid/expired token handling stays in verifyToken.
    return next();
  }
}

