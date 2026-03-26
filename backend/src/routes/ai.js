import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { UserConsent } from '../models/UserConsent.js';
import { MoodEntry } from '../models/MoodEntry.js';
import { ok, fail } from '../utils/responses.js';
import { detectEmotionFromImage, generateMoodSummary } from '../services/gemini.js';

const router = Router();

async function ensureAiConsent(userId) {
  const consent = await UserConsent.findOne({ userId }).lean();
  return consent?.aiConsent === true;
}

async function ensureBiometricConsent(userId) {
  const consent = await UserConsent.findOne({ userId }).lean();
  return consent?.biometricConsent === true;
}

function normalizeMoodSummary(result) {
  if (!result || typeof result !== 'object') {
    return { value: null, reason: 'result_not_object' };
  }
  const summaryText = typeof result.summaryText === 'string' ? result.summaryText.trim() : '';
  const suggestions = Array.isArray(result.suggestions) ? result.suggestions.filter((s) => typeof s === 'string') : [];
  const disclaimer = typeof result.disclaimer === 'string' ? result.disclaimer.trim() : '';
  if (!summaryText) {
    return { value: null, reason: 'missing_summary_text' };
  }
  if (!disclaimer) {
    return { value: null, reason: 'missing_disclaimer' };
  }
  return {
    value: {
      summaryText,
      suggestions: suggestions.slice(0, 5),
      disclaimer
    },
    reason: null
  };
}

function normalizeEmotionResult(result) {
  if (!result || typeof result !== 'object') return null;
  const dominantEmotion = typeof result.dominantEmotion === 'string' ? result.dominantEmotion.trim() : '';
  const emotions = Array.isArray(result.emotions) ? result.emotions : [];
  const disclaimer = typeof result.disclaimer === 'string' ? result.disclaimer.trim() : '';

  const cleaned = emotions
    .map((item) => ({
      label: typeof item?.label === 'string' ? item.label.trim() : '',
      confidence: typeof item?.confidence === 'number' ? item.confidence : Number(item?.confidence)
    }))
    .filter((item) => item.label && Number.isFinite(item.confidence) && item.confidence >= 0 && item.confidence <= 1)
    .slice(0, 6);

  if (!dominantEmotion || cleaned.length === 0 || !disclaimer) return null;

  return {
    dominantEmotion,
    emotions: cleaned,
    disclaimer
  };
}

router.post('/ai/mood-summary', verifyToken, async (req, res, next) => {
  try {
    const hasConsent = await ensureAiConsent(req.user.id);
    if (!hasConsent) {
      return fail(res, 'AI consent required for mood summaries', 403, 'CONSENT_REQUIRED', {
        requiredConsent: 'aiConsent'
      });
    }

    const entries = Array.isArray(req.body.entries) ? req.body.entries : [];
    const safeEntries = entries
      .filter((item) => item && typeof item.moodScore === 'number')
      .map((item) => ({
        date: typeof item.date === 'string' ? item.date : undefined,
        moodScore: Number(item.moodScore),
        tags: Array.isArray(item.tags) ? item.tags : []
      }));

    let sourceEntries = safeEntries;
    if (sourceEntries.length === 0) {
      const recent = await MoodEntry.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(14).lean();
      sourceEntries = recent.map((item) => ({
        date: item.createdAt instanceof Date ? item.createdAt.toISOString().slice(0, 10) : undefined,
        moodScore: item.moodScore,
        tags: item.tags || []
      }));
    }

    if (sourceEntries.length === 0) {
      return res.status(204).end();
    }

    const weekStart = typeof req.body.weekStart === 'string' ? req.body.weekStart : '';
    const aiResult = await generateMoodSummary({
      weekStart,
      entries: sourceEntries
    });
    const normalized = normalizeMoodSummary(aiResult);
    if (!normalized.value) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[ai] mood-summary returning 204', {
          reason: normalized.reason,
          aiResult
        });
      }
      return res.status(204).end();
    }

    return ok(res, normalized.value);
  } catch (err) {
    if (err?.code === 'GEMINI_NOT_CONFIGURED') {
      return fail(res, 'AI service is not configured', 503, 'AI_UNAVAILABLE');
    }
    if (err?.code === 'GEMINI_ERROR') {
      return fail(res, 'AI service failed to respond', 502, 'AI_PROVIDER_ERROR');
    }
    return next(err);
  }
});

router.post('/ai/emotion-detect', verifyToken, async (req, res, next) => {
  try {
    const hasConsent = await ensureBiometricConsent(req.user.id);
    if (!hasConsent) {
      return fail(res, 'Biometric consent required for emotion detection', 403, 'CONSENT_REQUIRED', {
        requiredConsent: 'biometricConsent'
      });
    }

    const imageBase64 = String(req.body.imageBase64 || '').trim();
    if (!imageBase64) {
      return fail(res, 'imageBase64 is required', 400, 'VALIDATION_ERROR');
    }
    const context = typeof req.body.context === 'string' ? req.body.context : 'mood check-in';
    const aiResult = await detectEmotionFromImage({ imageBase64, context });
    const normalized = normalizeEmotionResult(aiResult);
    if (!normalized) {
      return fail(res, 'AI response was invalid', 502, 'AI_PROVIDER_ERROR');
    }

    return ok(res, normalized);
  } catch (err) {
    if (err?.code === 'GEMINI_NOT_CONFIGURED') {
      return fail(res, 'AI service is not configured', 503, 'AI_UNAVAILABLE');
    }
    if (err?.code === 'GEMINI_ERROR') {
      return fail(res, 'AI service failed to respond', 502, 'AI_PROVIDER_ERROR');
    }
    return next(err);
  }
});

export default router;
