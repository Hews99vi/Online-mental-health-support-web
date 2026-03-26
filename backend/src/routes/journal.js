import mongoose from 'mongoose';
import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { JournalEntry } from '../models/JournalEntry.js';
import { ok, fail } from '../utils/responses.js';

const router = Router();

function sanitizeEntry(entry) {
  return {
    id: entry._id.toString(),
    userId: entry.userId.toString(),
    title: entry.title || '',
    content: entry.content,
    createdAt: entry.createdAt instanceof Date ? entry.createdAt.toISOString() : entry.createdAt,
    updatedAt: entry.updatedAt instanceof Date ? entry.updatedAt.toISOString() : entry.updatedAt
  };
}

function normalizePayload(body) {
  return {
    title: typeof body.title === 'string' ? body.title.trim() : '',
    content: typeof body.content === 'string' ? body.content.trim() : ''
  };
}

function ensureValidId(id, res) {
  if (!mongoose.isValidObjectId(id)) {
    fail(res, 'Journal entry not found', 404, 'NOT_FOUND');
    return false;
  }
  return true;
}

router.post('/journal', verifyToken, async (req, res, next) => {
  try {
    const { title, content } = normalizePayload(req.body);

    if (!content) {
      return fail(res, 'Content is required', 400, 'VALIDATION_ERROR');
    }

    const entry = await JournalEntry.create({
      userId: req.user.id,
      title,
      content
    });

    return ok(res, { entry: sanitizeEntry(entry) }, 'Journal entry created', 201);
  } catch (err) {
    return next(err);
  }
});

router.get('/journal', verifyToken, async (req, res, next) => {
  try {
    const items = await JournalEntry.find({ userId: req.user.id }).sort({ updatedAt: -1 }).lean();
    return ok(res, { items: items.map(sanitizeEntry) });
  } catch (err) {
    return next(err);
  }
});

router.get('/journal/:id', verifyToken, async (req, res, next) => {
  try {
    if (!ensureValidId(req.params.id, res)) return;
    const entry = await JournalEntry.findOne({ _id: req.params.id, userId: req.user.id }).lean();
    if (!entry) {
      return fail(res, 'Journal entry not found', 404, 'NOT_FOUND');
    }
    return ok(res, { entry: sanitizeEntry(entry) });
  } catch (err) {
    return next(err);
  }
});

router.put('/journal/:id', verifyToken, async (req, res, next) => {
  try {
    if (!ensureValidId(req.params.id, res)) return;
    const { title, content } = normalizePayload(req.body);

    if (!content) {
      return fail(res, 'Content is required', 400, 'VALIDATION_ERROR');
    }

    const entry = await JournalEntry.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { title, content },
      { new: true, runValidators: true }
    );

    if (!entry) {
      return fail(res, 'Journal entry not found', 404, 'NOT_FOUND');
    }

    return ok(res, { entry: sanitizeEntry(entry) }, 'Journal entry updated');
  } catch (err) {
    return next(err);
  }
});

router.delete('/journal/:id', verifyToken, async (req, res, next) => {
  try {
    if (!ensureValidId(req.params.id, res)) return;
    const entry = await JournalEntry.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!entry) {
      return fail(res, 'Journal entry not found', 404, 'NOT_FOUND');
    }
    return ok(res, null, 'Journal entry deleted');
  } catch (err) {
    return next(err);
  }
});

export default router;
