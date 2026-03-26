export function ok(res, data = null, message = null, status = 200) {
  const payload = { ok: true };
  if (message) payload.message = message;
  if (data !== null) payload.data = data;
  return res.status(status).json(payload);
}

export function fail(res, message, status = 400, code = 'BAD_REQUEST', details = null) {
  const payload = { ok: false, error: { message, code } };
  if (details) payload.error.details = details;
  return res.status(status).json(payload);
}
