import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { ok } from '../utils/responses.js';

const router = Router();

router.get('/secure/admin', verifyToken, requireRole('admin'), (req, res) => {
  return ok(res, { message: 'admin ok' });
});

router.get('/secure/therapist', verifyToken, requireRole('therapist'), (req, res) => {
  return ok(res, { message: 'therapist ok' });
});

router.get('/secure/listener', verifyToken, requireRole('listener'), (req, res) => {
  return ok(res, { message: 'listener ok' });
});

router.get('/secure/user', verifyToken, requireRole('user'), (req, res) => {
  return ok(res, { message: 'user ok' });
});

export default router;
