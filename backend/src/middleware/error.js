import { fail } from '../utils/responses.js';

export function notFound(req, res) {
  return fail(res, 'Route not found', 404, 'NOT_FOUND');
}

export function errorHandler(err, req, res, next) {
  const message = err && err.message ? err.message : 'Server error';
  return fail(res, message, 500, 'SERVER_ERROR');
}
