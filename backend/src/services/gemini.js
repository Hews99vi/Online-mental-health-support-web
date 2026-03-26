import { env } from '../config/env.js';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_TIMEOUT_MS = 15000;

function ensureApiKey() {
  if (!env.geminiApiKey) {
    const err = new Error('Gemini API key is not configured');
    err.code = 'GEMINI_NOT_CONFIGURED';
    throw err;
  }
}

function extractJson(text) {
  if (typeof text !== 'string') return null;
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return null;
    }
  }
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function stripMarkdownCodeFences(text) {
  const trimmed = text.trim();
  const fencedMatch = trimmed.match(/^```[a-zA-Z0-9_-]*\s*([\s\S]*?)\s*```$/);
  if (fencedMatch) {
    return fencedMatch[1].trim();
  }
  return trimmed;
}

function extractFirstJsonObject(text) {
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === '{') {
      if (depth === 0) {
        start = i;
      }
      depth += 1;
      continue;
    }

    if (ch === '}') {
      if (depth === 0) {
        continue;
      }
      depth -= 1;
      if (depth === 0 && start !== -1) {
        return text.slice(start, i + 1);
      }
    }
  }

  return null;
}

async function callGemini({ model, parts, timeoutMs = DEFAULT_TIMEOUT_MS, generationConfig, diagnosticTag }) {
  ensureApiKey();
  const url = `${GEMINI_BASE_URL}/${model}:generateContent?key=${env.geminiApiKey}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const resolvedGenerationConfig = {
    temperature: 0.2,
    maxOutputTokens: 1024,
    ...generationConfig
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: resolvedGenerationConfig
      })
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      if (env.nodeEnv !== 'production') {
        console.error('[gemini] upstream request failed', {
          model,
          status: response.status,
          body
        });
      }
      const err = new Error(`Gemini request failed (${response.status})`);
      err.code = 'GEMINI_ERROR';
      err.details = body;
      throw err;
    }

    const payload = await response.json();
    const candidate = payload?.candidates?.[0] ?? null;
    const text = candidate?.content?.parts?.map((part) => part?.text ?? '').join('') ?? '';

    if (env.nodeEnv !== 'production') {
      console.log('[gemini] candidate diagnostics', {
        tag: diagnosticTag ?? 'generic',
        model,
        generationConfig: resolvedGenerationConfig,
        finishReason: candidate?.finishReason ?? null,
        safetyRatings: candidate?.safetyRatings ?? null,
        usageMetadata: payload?.usageMetadata ?? null,
        textLength: text.length
      });
    }

    return {
      text,
      finishReason: candidate?.finishReason ?? null,
      safetyRatings: candidate?.safetyRatings ?? null,
      usageMetadata: payload?.usageMetadata ?? null
    };
  } catch (err) {
    if (env.nodeEnv !== 'production' && err?.name === 'AbortError') {
      console.error('[gemini] upstream request timed out', {
        model,
        timeoutMs
      });
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

function extractJsonWithDiagnostics(text) {
  if (typeof text !== 'string') {
    return { parsed: null, reason: 'non_string_text' };
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return { parsed: null, reason: 'empty_text' };
  }

  const unfenced = stripMarkdownCodeFences(trimmed);

  if (unfenced.startsWith('{') && unfenced.endsWith('}')) {
    try {
      return { parsed: JSON.parse(unfenced), reason: null };
    } catch {
      return { parsed: null, reason: 'direct_json_parse_failed' };
    }
  }

  const candidate = extractFirstJsonObject(unfenced);
  if (!candidate) {
    return { parsed: null, reason: 'no_json_object_found' };
  }

  try {
    return { parsed: JSON.parse(candidate), reason: null };
  } catch {
    return { parsed: null, reason: 'embedded_json_parse_failed' };
  }
}

export async function generateMoodSummary({ weekStart, entries }) {
  const prompt = `
You are a mental health support assistant. Return ONLY a single valid JSON object for a weekly summary based on mood check-ins.
Do not wrap the JSON in markdown fences. Do not add any commentary before or after the JSON.
Use this exact shape:
{
  "summaryText": "string, 1-3 sentences",
  "suggestions": ["string", "string", "string"],
  "disclaimer": "string"
}
Constraints:
- Do NOT provide medical diagnosis.
- Use supportive, neutral language.
- If data is insufficient, return an empty JSON object {}.

Week start: ${weekStart || 'unknown'}
Entries (date, moodScore 1-5, tags):
${entries.map((e) => `- ${e.date || 'unknown'} | ${e.moodScore} | ${Array.isArray(e.tags) ? e.tags.join(', ') : ''}`).join('\n')}
`.trim();

  const { text, finishReason, safetyRatings, usageMetadata } = await callGemini({
    model: env.geminiModelText,
    parts: [{ text: prompt }],
    diagnosticTag: 'mood-summary',
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json'
    }
  });

  const { parsed, reason } = extractJsonWithDiagnostics(text);
  if (env.nodeEnv !== 'production') {
    console.log('[gemini] mood-summary raw text', {
      model: env.geminiModelText,
      text
    });
    console.log('[gemini] mood-summary parsed json', {
      model: env.geminiModelText,
      parsed
    });
    if (reason) {
      console.warn('[gemini] mood-summary parse rejected', {
        model: env.geminiModelText,
        reason,
        finishReason,
        safetyRatings,
        usageMetadata
      });
    }
  }

  return parsed;
}

export async function detectEmotionFromImage({ imageBase64, context }) {
  const prompt = `
You are an assistant that estimates emotions from a user-provided selfie for a wellness app.
Return ONLY valid JSON with the following shape:
{
  "dominantEmotion": "string",
  "emotions": [
    { "label": "string", "confidence": 0.0-1.0 }
  ],
  "disclaimer": "string"
}
Constraints:
- Provide 3 to 6 emotion items, confidence values should sum to roughly 1.0.
- Avoid medical claims.
- Use neutral emotion labels (e.g., Calm, Neutral, Happy, Sad, Anxious, Stressed, Concerned, Tired, Angry).
Context: ${context || 'mood check-in'}
`.trim();

  const { text } = await callGemini({
    model: env.geminiModelVision,
    diagnosticTag: 'emotion-detect',
    parts: [
      { text: prompt },
      {
        inline_data: {
          mime_type: 'image/jpeg',
          data: imageBase64
        }
      }
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json'
    }
  });

  return extractJson(stripMarkdownCodeFences(text));
}
