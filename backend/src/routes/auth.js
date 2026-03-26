import crypto from 'node:crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { PasswordResetToken } from '../models/PasswordResetToken.js';
import { Role } from '../models/Role.js';
import { env } from '../config/env.js';
import { ok, fail } from '../utils/responses.js';
import { requireFields, isEmail, isStrongPassword } from '../utils/validate.js';
import { verifyToken } from '../middleware/auth.js';
import { ensureMailerConfigured, sendPasswordResetEmail } from '../services/mailer.js';

const router = Router();
const ROLE_PRIORITY = ['admin', 'therapist', 'listener', 'user'];

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), roles: user.roles },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn || '7d' }
  );
}

function getPrimaryRole(roles = []) {
  for (const role of ROLE_PRIORITY) {
    if (roles.includes(role)) {
      return role;
    }
  }
  return 'user';
}

function sanitizeUser(user) {
  return {
    id: user._id.toString(),
    name: user.username,
    email: user.email,
    role: getPrimaryRole(user.roles),
    status: user.status || 'active',
    listenerOnline: Boolean(user.listenerOnline),
    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt
  };
}

function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function buildResetLink(rawToken) {
  const base = env.appBaseUrl.replace(/\/+$/, '');
  return `${base}/reset-password?token=${encodeURIComponent(rawToken)}`;
}

async function getValidRoles(roles) {
  const roleDocs = await Role.find({ name: { $in: roles } }).lean();
  return roleDocs.map((r) => r.name);
}

async function registerHandler(req, res, next) {
  try {
    const username = String(req.body.username ?? req.body.name ?? '').trim();
    const email = String(req.body.email ?? '').trim();
    const password = String(req.body.password ?? '');
    const role = req.body.role;
    const roles = req.body.roles;

    req.body.username = username;
    req.body.email = email;
    req.body.password = password;

    const missing = requireFields(req.body, ['username', 'email', 'password']);
    if (missing.length) {
      return fail(res, 'Missing required fields', 400, 'VALIDATION_ERROR', { missing });
    }

    if (!isEmail(email)) {
      return fail(res, 'Invalid email', 400, 'VALIDATION_ERROR');
    }
    if (!isStrongPassword(password)) {
      return fail(res, 'Password must be at least 8 characters', 400, 'VALIDATION_ERROR');
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase() }).lean();
    if (existingEmail) {
      return fail(res, 'Email already registered', 409, 'CONFLICT');
    }
    const existingUsername = await User.findOne({ username }).lean();
    if (existingUsername) {
      return fail(res, 'Username already taken', 409, 'CONFLICT');
    }

    let assignedRoles = Array.isArray(roles) && roles.length ? roles : role ? [role] : ['user'];
    assignedRoles = assignedRoles.map((r) => String(r).toLowerCase());
    if (assignedRoles.length !== 1 || assignedRoles[0] !== 'user') {
      return fail(res, 'Signup only supports user accounts', 400, 'VALIDATION_ERROR');
    }

    const validRoles = await getValidRoles(assignedRoles);
    if (validRoles.length !== assignedRoles.length) {
      return fail(res, 'Invalid roles provided', 400, 'VALIDATION_ERROR');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email: email.toLowerCase(),
      passwordHash,
      roles: validRoles
    });

    const accessToken = signToken(user);
    return ok(res, { accessToken, user: sanitizeUser(user) }, 'Registration successful', 201);
  } catch (err) {
    return next(err);
  }
}

async function loginHandler(req, res, next) {
  try {
    const email = String(req.body.email ?? '').trim().toLowerCase();
    const username = String(req.body.username ?? '').trim();
    const password = String(req.body.password ?? '');
    const identifier = email || username;

    const missing = requireFields({ identifier, password }, ['identifier', 'password']);
    if (missing.length) {
      return fail(res, 'Missing required fields', 400, 'VALIDATION_ERROR', { missing });
    }

    const query = email ? { email } : { username };
    const user = await User.findOne(query);
    if (!user) {
      return fail(res, 'Invalid credentials', 401, 'UNAUTHORIZED');
    }

    const okPassword = await bcrypt.compare(password, user.passwordHash);
    if (!okPassword) {
      return fail(res, 'Invalid credentials', 401, 'UNAUTHORIZED');
    }
    if (user.status === 'suspended') {
      return fail(res, 'Account suspended', 403, 'FORBIDDEN');
    }

    const accessToken = signToken(user);
    return ok(res, { accessToken, user: sanitizeUser(user) }, 'Login successful');
  } catch (err) {
    return next(err);
  }
}

async function meHandler(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return fail(res, 'User not found', 401, 'UNAUTHORIZED');
    }
    return ok(res, { user: sanitizeUser(user) });
  } catch (err) {
    return next(err);
  }
}

router.post('/auth/register', registerHandler);
router.post('/auth/signup', registerHandler);

router.post('/auth/login', loginHandler);
router.post('/auth/signin', loginHandler);

router.get('/auth/me', verifyToken, meHandler);
router.get('/users/me', verifyToken, meHandler);

router.post('/auth/logout', verifyToken, async (req, res) => {
  return res.status(204).end();
});

router.post('/auth/forgot-password', async (req, res, next) => {
  try {
    const email = String(req.body.email ?? '').trim().toLowerCase();
    if (!email) {
      return fail(res, 'Email is required', 400, 'VALIDATION_ERROR');
    }

    if (!isEmail(email)) {
      return fail(res, 'Invalid email', 400, 'VALIDATION_ERROR');
    }

    try {
      ensureMailerConfigured();
    } catch (err) {
      return fail(res, 'Password reset email delivery is not configured', 503, 'EMAIL_UNAVAILABLE');
    }

    const genericMessage = 'If an account exists for that email, password reset instructions have been generated.';
    const user = await User.findOne({ email });

    if (user && user.status !== 'suspended') {
      await PasswordResetToken.deleteMany({ userId: user._id });

      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = hashResetToken(rawToken);
      const expiresAt = new Date(Date.now() + env.passwordResetTtlMinutes * 60 * 1000);

      await PasswordResetToken.create({
        userId: user._id,
        tokenHash,
        expiresAt
      });

      const resetLink = buildResetLink(rawToken);
      await sendPasswordResetEmail({ to: email, resetLink });
    }

    return ok(res, { delivery: 'email' }, genericMessage);
  } catch (err) {
    if (err?.code === 'EMAIL_NOT_CONFIGURED') {
      return fail(res, 'Password reset email delivery is not configured', 503, 'EMAIL_UNAVAILABLE');
    }
    if (err?.code === 'EAUTH' || err?.code === 'ECONNECTION' || err?.code === 'EMESSAGE') {
      return fail(res, 'Password reset email could not be sent', 502, 'EMAIL_SEND_FAILED');
    }
    return next(err);
  }
});

router.post('/auth/reset-password', async (req, res, next) => {
  try {
    const token = String(req.body.token ?? '').trim();
    const password = String(req.body.password ?? '');

    const missing = requireFields({ token, password }, ['token', 'password']);
    if (missing.length) {
      return fail(res, 'Missing required fields', 400, 'VALIDATION_ERROR', { missing });
    }

    if (!isStrongPassword(password)) {
      return fail(res, 'Password must be at least 8 characters', 400, 'VALIDATION_ERROR');
    }

    const tokenHash = hashResetToken(token);
    const resetRecord = await PasswordResetToken.findOne({
      tokenHash,
      usedAt: null,
      expiresAt: { $gt: new Date() }
    });

    if (!resetRecord) {
      return fail(res, 'Reset link is invalid or has expired', 400, 'INVALID_RESET_TOKEN');
    }

    const user = await User.findById(resetRecord.userId);
    if (!user) {
      await PasswordResetToken.deleteOne({ _id: resetRecord._id });
      return fail(res, 'Reset link is invalid or has expired', 400, 'INVALID_RESET_TOKEN');
    }

    user.passwordHash = await bcrypt.hash(password, 10);
    await user.save();

    resetRecord.usedAt = new Date();
    await resetRecord.save();
    await PasswordResetToken.deleteMany({ userId: user._id });

    return ok(res, null, 'Password reset successful');
  } catch (err) {
    return next(err);
  }
});

export default router;
