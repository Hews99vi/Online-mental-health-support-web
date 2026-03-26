import { fail } from '../utils/responses.js';

export function requireRole(roleName) {
  return (req, res, next) => {
    if (!req.user) {
      return fail(res, 'Unauthorized', 401, 'UNAUTHORIZED');
    }
    if (!Array.isArray(req.user.roles) || !req.user.roles.includes(roleName)) {
      return fail(res, 'Forbidden', 403, 'FORBIDDEN');
    }
    return next();
  };
}
