export function requireFields(body, fields) {
  const missing = [];
  for (const field of fields) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      missing.push(field);
    }
  }
  return missing;
}

export function isEmail(value) {
  return typeof value === 'string' && /.+@.+\..+/.test(value);
}

export function isStrongPassword(value) {
  return typeof value === 'string' && value.length >= 8;
}
