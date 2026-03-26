import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { MoodEntry } from '../models/MoodEntry.js';
import { ok, fail } from '../utils/responses.js';

const router = Router();

function sanitizeEntry(entry) {
  return {
    id: entry._id.toString(),
    date: new Date(entry.createdAt).toISOString().slice(0, 10),
    moodScore: entry.moodScore,
    tags: Array.isArray(entry.tags) ? entry.tags : [],
    note: entry.note || undefined,
    createdAt: entry.createdAt instanceof Date ? entry.createdAt.toISOString() : entry.createdAt
  };
}

function parseDateValue(value, endOfDay = false) {
  if (!value) return null;
  const suffix = endOfDay ? 'T23:59:59.999Z' : 'T00:00:00.000Z';
  const date = new Date(`${value}${suffix}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function listEntries(req, res, next) {
  try {
    const from = typeof req.query.from === 'string' ? req.query.from : '';
    const to = typeof req.query.to === 'string' ? req.query.to : '';
    const filter = { userId: req.user.id };

    if (from || to) {
      filter.createdAt = {};
      const fromDate = parseDateValue(from);
      const toDate = parseDateValue(to, true);

      if (from && !fromDate) {
        return fail(res, 'Invalid from date', 400, 'VALIDATION_ERROR');
      }
      if (to && !toDate) {
        return fail(res, 'Invalid to date', 400, 'VALIDATION_ERROR');
      }

      if (fromDate) filter.createdAt.$gte = fromDate;
      if (toDate) filter.createdAt.$lte = toDate;
    }

    const items = await MoodEntry.find(filter).sort({ createdAt: 1 }).lean();
    return ok(res, { items: items.map(sanitizeEntry) });
  } catch (err) {
    return next(err);
  }
}

router.post('/mood', verifyToken, async (req, res, next) => {
  try {
    const moodScore = Number(req.body.moodScore);
    const tags = Array.isArray(req.body.tags) ? req.body.tags.map((tag) => String(tag)) : [];
    const note = typeof req.body.note === 'string' ? req.body.note.trim() : '';
    const requestedDate = typeof req.body.date === 'string' ? req.body.date : '';

    if (!Number.isInteger(moodScore) || moodScore < 1 || moodScore > 5) {
      return fail(res, 'moodScore must be an integer between 1 and 5', 400, 'VALIDATION_ERROR');
    }

    const createdAt = requestedDate ? parseDateValue(requestedDate) : new Date();
    if (requestedDate && !createdAt) {
      return fail(res, 'Invalid date', 400, 'VALIDATION_ERROR');
    }

    const entry = await MoodEntry.create({
      userId: req.user.id,
      moodScore,
      tags,
      note,
      createdAt: createdAt ?? new Date()
    });

    return ok(res, { entry: sanitizeEntry(entry) }, 'Mood entry saved', 201);
  } catch (err) {
    return next(err);
  }
});

router.get('/mood', verifyToken, listEntries);
router.get('/mood/history', verifyToken, listEntries);

export default router;
