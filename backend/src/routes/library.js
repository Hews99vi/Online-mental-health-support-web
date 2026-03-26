import jwt from 'jsonwebtoken';
import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { LibraryItem } from '../models/LibraryItem.js';
import { ok, fail } from '../utils/responses.js';

const router = Router();

function excerpt(content) {
  const text = String(content || '').replace(/\s+/g, ' ').trim();
  return text.length > 180 ? `${text.slice(0, 177)}...` : text;
}

function readTimeMinutes(content) {
  const words = String(content || '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 180));
}

function initials(name) {
  return String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function mapItem(item, authorName) {
  return {
    id: item._id.toString(),
    type: item.type || 'article',
    title: item.title,
    excerpt: excerpt(item.content),
    body: item.content,
    author: authorName || 'Admin',
    authorInitials: initials(authorName || 'Admin'),
    category: item.category,
    readTimeMin: readTimeMinutes(item.content),
    publishedAt: (item.updatedAt instanceof Date ? item.updatedAt : new Date(item.updatedAt)).toISOString(),
    tags: Array.isArray(item.tags) ? item.tags : [],
    status: item.status
  };
}

async function resolveOptionalUser(req) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  if (!token) return null;

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.sub).lean();
    if (!user) return null;
    return {
      id: user._id.toString(),
      roles: Array.isArray(user.roles) ? user.roles : []
    };
  } catch {
    return null;
  }
}

router.get('/library', async (req, res, next) => {
  try {
    const query = String(req.query.query || '').trim().toLowerCase();
    const type = String(req.query.type || '').trim().toLowerCase();
    const category = String(req.query.category || '').trim();
    const status = String(req.query.status || '').trim().toLowerCase();
    const includeDraft = String(req.query.includeDraft || '').toLowerCase() === 'true';

    let statusFilter = { status: 'published' };
    if (includeDraft) {
      const maybeUser = await resolveOptionalUser(req);
      if (!maybeUser || !maybeUser.roles.includes('admin')) {
        return fail(res, 'Forbidden', 403, 'FORBIDDEN');
      }
      statusFilter = {};
    }

    const filter = { ...statusFilter };
    if (type && type !== 'all') {
      if (!['article', 'podcast', 'video', 'exercise', 'guide'].includes(type)) {
        return fail(res, 'Invalid type filter', 400, 'VALIDATION_ERROR');
      }
      filter.type = type;
    }
    if (category && category.toLowerCase() !== 'all') {
      filter.category = category;
    }
    if (status && status !== 'all') {
      if (!['draft', 'published'].includes(status)) {
        return fail(res, 'Invalid status filter', 400, 'VALIDATION_ERROR');
      }
      if (includeDraft) {
        filter.status = status;
      }
    }

    const items = await LibraryItem.find(filter).sort({ updatedAt: -1 }).populate('createdBy', 'username').lean();

    let mapped = items.map((item) => mapItem(item, item.createdBy?.username));
    if (query) {
      mapped = mapped.filter((item) => {
        const haystack = `${item.title} ${item.excerpt || ''} ${item.category} ${item.type} ${item.tags.join(' ')}`.toLowerCase();
        return haystack.includes(query);
      });
    }

    return ok(res, { items: mapped, total: mapped.length });
  } catch (err) {
    return next(err);
  }
});

router.get('/library/:id', async (req, res, next) => {
  try {
    const item = await LibraryItem.findById(req.params.id).populate('createdBy', 'username').lean();
    if (!item) {
      return fail(res, 'Library item not found', 404, 'NOT_FOUND');
    }

    if (item.status !== 'published') {
      const maybeUser = await resolveOptionalUser(req);
      if (!maybeUser || !maybeUser.roles.includes('admin')) {
        return fail(res, 'Library item not found', 404, 'NOT_FOUND');
      }
    }

    return ok(res, { item: mapItem(item, item.createdBy?.username) });
  } catch (err) {
    return next(err);
  }
});

router.post('/admin/library', verifyToken, requireRole('admin'), async (req, res, next) => {
  try {
    const type = String(req.body.type || 'article').trim().toLowerCase();
    const title = String(req.body.title || '').trim();
    const category = String(req.body.category || '').trim();
    const content = String(req.body.content || '').trim();
    const status = req.body.status === 'published' ? 'published' : 'draft';
    const tags = Array.isArray(req.body.tags) ? req.body.tags.map((tag) => String(tag).trim()).filter(Boolean) : [];

    if (!['article', 'podcast', 'video', 'exercise', 'guide'].includes(type)) {
      return fail(res, 'Invalid type', 400, 'VALIDATION_ERROR');
    }
    if (!title || !category || !content) {
      return fail(res, 'title, category and content are required', 400, 'VALIDATION_ERROR');
    }

    const item = await LibraryItem.create({
      type,
      title,
      category,
      content,
      tags,
      status,
      createdBy: req.user.id
    });

    const author = await User.findById(req.user.id).lean();
    return ok(res, { item: mapItem(item, author?.username) }, 'Library item created', 201);
  } catch (err) {
    return next(err);
  }
});

router.put('/admin/library/:id', verifyToken, requireRole('admin'), async (req, res, next) => {
  try {
    const update = {};
    if (req.body.type !== undefined) {
      const type = String(req.body.type).trim().toLowerCase();
      if (!['article', 'podcast', 'video', 'exercise', 'guide'].includes(type)) {
        return fail(res, 'Invalid type', 400, 'VALIDATION_ERROR');
      }
      update.type = type;
    }
    if (req.body.title !== undefined) update.title = String(req.body.title).trim();
    if (req.body.category !== undefined) update.category = String(req.body.category).trim();
    if (req.body.content !== undefined) update.content = String(req.body.content).trim();
    if (req.body.status !== undefined) {
      if (!['draft', 'published'].includes(String(req.body.status))) {
        return fail(res, 'Invalid status', 400, 'VALIDATION_ERROR');
      }
      update.status = String(req.body.status);
    }
    if (req.body.tags !== undefined) {
      update.tags = Array.isArray(req.body.tags)
        ? req.body.tags.map((tag) => String(tag).trim()).filter(Boolean)
        : [];
    }

    if (Object.keys(update).length === 0) {
      return fail(res, 'No fields to update', 400, 'VALIDATION_ERROR');
    }

    const item = await LibraryItem.findByIdAndUpdate(req.params.id, { $set: update }, { new: true }).lean();
    if (!item) {
      return fail(res, 'Library item not found', 404, 'NOT_FOUND');
    }

    const author = await User.findById(item.createdBy).lean();
    return ok(res, { item: mapItem(item, author?.username) }, 'Library item updated');
  } catch (err) {
    return next(err);
  }
});

router.delete('/admin/library/:id', verifyToken, requireRole('admin'), async (req, res, next) => {
  try {
    const item = await LibraryItem.findByIdAndDelete(req.params.id).lean();
    if (!item) {
      return fail(res, 'Library item not found', 404, 'NOT_FOUND');
    }
    return ok(res, null, 'Library item deleted');
  } catch (err) {
    return next(err);
  }
});

export default router;
