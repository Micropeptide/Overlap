// Thin wrapper over the JSON API. Errors carry the server's message and field.

import { API_BASE } from '../config.js';
import { t } from './i18n.js';

export class ApiError extends Error {
  constructor(status, message, field) {
    super(message);
    this.status = status;
    this.field = field;
  }
}

/** The server's error in the page's language: by its code when we know it, else its own English text. */
function serverMessage(data, status) {
  if (data?.code) {
    const key = `errors.${data.code}`;
    const msg = t(key, data.vars || {});
    if (msg !== key) return msg;
  }
  return data?.error || t('api.failed', { status });
}

export async function api(method, path, { body, token } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  // A guest signed in with a password holds "<response id>:<key>"; link keys never contain ":".
  if (token) headers.Authorization = token.includes(':') ? `Password ${token}` : `Bearer ${token}`;
  let res;
  try {
    res = await fetch(API_BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), cache: 'no-store' });
  } catch {
    throw new ApiError(0, t('api.offline'));
  }
  if (res.status === 204) return null;
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) throw new ApiError(res.status, serverMessage(data, res.status), data?.field);
  return data;
}
