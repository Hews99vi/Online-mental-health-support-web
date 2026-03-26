import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { fail } from '../utils/responses.js';

export async function verifyToken(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return fail(res, 'Missing auth token', 401, 'UNAUTHORIZED');
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.sub).lean();
    if (!user) {
      return fail(res, 'User not found', 401, 'UNAUTHORIZED');
    }
    if (user.status === 'suspended') {
      return fail(res, 'Account suspended', 403, 'FORBIDDEN');
    }
    req.user = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      roles: user.roles,
      status: user.status || 'active'
    };
    return next();
  } catch (err) {
    return fail(res, 'Invalid or expired token', 401, 'UNAUTHORIZED');
  }
}
