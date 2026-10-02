// Thin wrapper over the JSON API. Errors carry the server's message and field.

import { API_BASE } from '../config.js';

export class ApiError extends Error {
  constructor(status, message, field) {
    super(message);
    this.status = status;
    this.field = field;
  }
}

export async function api(method, path, { body, token } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(API_BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), cache: 'no-store' });
  } catch {
    throw new ApiError(0, 'Could not reach Overlap. Check your connection and try again.');
  }
  if (res.status === 204) return null;
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) throw new ApiError(res.status, data?.error || `Request failed (${res.status}).`, data?.field);
  return data;
}
