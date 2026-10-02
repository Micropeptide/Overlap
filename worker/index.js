// Cloudflare Workers entry point: the same API as the Node server
// (server/api.js), storing data in Cloudflare D1. The pages themselves are
// served separately (GitHub Pages), so this answers only /api/* and allows
// cross-origin calls from the configured page origins.
//
// Settings (wrangler.toml [vars]): ALLOWED_ORIGINS (comma-separated),
// PUBLIC_URL, RETENTION_DAYS, RATE_LIMIT_CREATE / _WRITE / _READ.

import { createApi } from '../server/api.js';
import { createStore } from '../server/store-core.js';
import { createRateLimiter } from '../server/ratelimit.js';

const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow',
  'Cache-Control': 'no-store',
};

let instance = null; // one per Worker isolate

function setup(env) {
  if (instance) return instance;
  const db = env.DB;
  const store = createStore({
    run: async (sql, params = []) => {
      const result = await db.prepare(sql).bind(...params).run();
      return { changes: result.meta?.changes ?? 0 };
    },
    get: async (sql, params = []) => (await db.prepare(sql).bind(...params).first()) ?? null,
    all: async (sql, params = []) => (await db.prepare(sql).bind(...params).all()).results,
  }, { retentionDays: Number(env.RETENTION_DAYS || 0) || 0 });
  const int = (v, d) => (Number.isInteger(Number(v)) && Number(v) > 0 ? Number(v) : d);
  const limiter = createRateLimiter({
    create: { max: int(env.RATE_LIMIT_CREATE, 30), windowMs: 60 * 60e3 },
    write: { max: int(env.RATE_LIMIT_WRITE, 300), windowMs: 10 * 60e3 },
    read: { max: int(env.RATE_LIMIT_READ, 1200), windowMs: 10 * 60e3 },
  });
  // Tells the privacy page which hosting facts apply to this copy.
  const info = { hosting: 'cloudflare', restoreDays: Number(env.D1_RESTORE_DAYS) || 7 };
  instance = { store, api: createApi({ store, limiter, publicUrl: env.PUBLIC_URL || '', info }) };
  return instance;
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin');
  const allowed = String(env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!origin || !allowed.includes(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Expose-Headers': 'Retry-After, Content-Disposition',
    'Access-Control-Max-Age': '600',
    Vary: 'Origin',
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...cors, ...SECURITY_HEADERS } });
    if (!url.pathname.startsWith('/api/')) {
      return new Response('Overlap API. The app lives at the page address, not here.\n', {
        status: 404, headers: { ...SECURITY_HEADERS, 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    const { api } = setup(env);
    const result = await api.handle({
      method: request.method,
      pathname: url.pathname,
      header: (name) => request.headers.get(name),
      readText: async (limit) => {
        if (Number(request.headers.get('Content-Length') || 0) > limit) return null;
        const text = await request.text();
        return new TextEncoder().encode(text).length > limit ? null : text;
      },
      // Set by Cloudflare itself; clients can't forge it.
      ip: request.headers.get('CF-Connecting-IP') || 'unknown',
      origin: url.origin,
    });
    const isJson = typeof result.body !== 'string';
    return new Response(result.status === 204 ? null : isJson ? JSON.stringify(result.body) : result.body, {
      status: result.status,
      headers: {
        ...SECURITY_HEADERS,
        'Content-Type': isJson ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8',
        ...cors,
        ...result.headers,
      },
    });
  },

  // Only used if RETENTION_DAYS > 0 and a cron trigger is added in wrangler.toml:
  // deletes polls (and their responses) past their retention date.
  async scheduled(event, env, ctx) {
    ctx.waitUntil(setup(env).store.deleteExpired());
  },
};
