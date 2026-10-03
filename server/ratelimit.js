// In-memory, fixed-window rate limiting. Addresses are held in memory only for
// the length of the window (at most about an hour) and are never written to disk or logs.

import { HttpError } from './validate.js';

const DEFAULTS = {
  create: { max: 30, windowMs: 60 * 60e3 }, // new polls per hour
  write: { max: 300, windowMs: 10 * 60e3 }, // other changes per 10 minutes
  read: { max: 1200, windowMs: 10 * 60e3 }, // page data per 10 minutes
  email: { max: 10, windowMs: 60 * 60e3 }, // emails asked for per hour
};
const MAX_ENTRIES = 100_000;

export function createRateLimiter(overrides = {}) {
  const rules = { ...DEFAULTS, ...overrides };
  const hits = new Map();
  let lastSweep = Date.now();

  // Forget expired entries about once a minute, as part of normal requests
  // (no background timer, which some hosts such as Cloudflare Workers forbid).
  function sweep(now) {
    if (now - lastSweep < 60e3) return;
    lastSweep = now;
    for (const [k, v] of hits) if (v.reset <= now) hits.delete(k);
  }

  return {
    check(ip, kind) {
      const rule = rules[kind];
      if (!rule) return;
      const key = `${kind}:${ip}`;
      const now = Date.now();
      sweep(now);
      let entry = hits.get(key);
      if (!entry || entry.reset <= now) {
        if (hits.size >= MAX_ENTRIES) {
          // Bound memory: drop expired entries, then the oldest ones.
          for (const [k, v] of hits) if (v.reset <= now) hits.delete(k);
          for (const k of hits.keys()) { if (hits.size < MAX_ENTRIES * 0.9) break; hits.delete(k); }
        }
        entry = { count: 0, reset: now + rule.windowMs };
        hits.set(key, entry);
      }
      entry.count += 1;
      if (entry.count > rule.max) {
        const err = new HttpError(429, 'Too many requests from this connection. Wait a few minutes and try again.', undefined, 'too_many_requests');
        err.retryAfter = Math.ceil((entry.reset - now) / 1000);
        throw err;
      }
    },
  };
}
