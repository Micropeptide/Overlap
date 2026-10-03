// Node HTTP layer: static files plus the shared JSON API (server/api.js).
// No framework, no cookies, no request logging.

import { readFile, stat } from 'node:fs/promises';
import { isIP } from 'node:net';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApi } from './api.js';
import { createRateLimiter } from './ratelimit.js';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const STATIC_DIRS = { '/shared/': join(ROOT, 'shared'), '/': join(ROOT, 'public') };
const APP_ROUTES = [/^\/$/, /^\/p\/[a-z0-9]{6,32}\/?$/, /^\/m\/[a-z0-9]{6,32}\/?$/, /^\/privacy\/?$/, /^\/about\/?$/, /^\/e\/(confirm|unsubscribe)\/?$/];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

const SECURITY_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; '),
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  // Polls are private by link; keep them out of search engines.
  'X-Robots-Tag': 'noindex, nofollow',
};

/**
 * trustProxy: how many reverse proxies sit in front of Overlap (0 = none). Each
 * proxy appends the address it saw to X-Forwarded-For, so the trustworthy entry
 * is that many places from the right; anything further left is client-supplied.
 */
export function createApp({ store, trustProxy = 0, publicUrl = '', rateLimits, mailer = null } = {}) {
  const hops = Number(trustProxy) || 0;
  const api = createApi({ store, limiter: createRateLimiter(rateLimits), publicUrl, mailer });

  function send(res, status, body, headers = {}) {
    const isJson = typeof body !== 'string' && !Buffer.isBuffer(body);
    const payload = isJson ? JSON.stringify(body) : body;
    res.writeHead(status, {
      ...SECURITY_HEADERS,
      'Content-Type': isJson ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      ...headers,
    });
    res.end(payload);
  }

  function clientIp(req) {
    if (hops > 0) {
      const entries = String(req.headers['x-forwarded-for'] || '').split(',').map((x) => x.trim()).filter(Boolean);
      const candidate = entries[entries.length - hops];
      if (candidate && isIP(candidate)) return candidate;
    }
    return req.socket.remoteAddress || 'unknown';
  }

  function originOf(req) {
    const fwdProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
    const proto = hops > 0 && (fwdProto === 'https' || fwdProto === 'http') ? fwdProto : 'http';
    return `${proto}://${req.headers.host}`;
  }

  /** Read at most `limit` bytes of the body; null if it is larger. */
  async function readText(req, limit) {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > limit) return null;
      chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString('utf8');
  }

  async function serveStatic(req, res, pathname) {
    let file = null;
    if (APP_ROUTES.some((r) => r.test(pathname))) file = join(STATIC_DIRS['/'], 'index.html');
    else {
      const prefix = pathname.startsWith('/shared/') ? '/shared/' : '/';
      const base = STATIC_DIRS[prefix];
      let rel;
      try { rel = decodeURIComponent(pathname.slice(prefix.length)); } catch { rel = null; }
      if (rel != null) {
        const candidate = normalize(join(base, rel));
        if (candidate.startsWith(base + sep) && !rel.split('/').some((p) => p.startsWith('.'))) file = candidate;
      }
    }
    let info = file && await stat(file).catch(() => null);
    let status = 200;
    if (!info || !info.isFile()) {
      // Unknown page: serve the app shell, which shows a friendly "not found".
      if (pathname.startsWith('/api/') || extname(pathname)) return send(res, 404, { error: 'Not found.' });
      file = join(STATIC_DIRS['/'], 'index.html');
      info = await stat(file);
      status = 404;
    }
    const etag = `"${info.size.toString(36)}-${Math.floor(info.mtimeMs).toString(36)}"`;
    const longCache = file.includes(`${sep}fonts${sep}`);
    const headers = {
      ...SECURITY_HEADERS,
      'Content-Type': MIME[extname(file)] || 'application/octet-stream',
      'Cache-Control': longCache ? 'public, max-age=31536000, immutable' : 'no-cache',
      ETag: etag,
    };
    if (status === 200 && req.headers['if-none-match'] === etag) {
      res.writeHead(304, headers);
      return res.end();
    }
    const data = await readFile(file);
    res.writeHead(status, { ...headers, 'Content-Length': data.length });
    res.end(req.method === 'HEAD' ? undefined : data);
  }

  return async function handler(req, res) {
    try {
      const { pathname, searchParams } = new URL(req.url, 'http://localhost');
      if (pathname.startsWith('/api/')) {
        const result = await api.handle({
          method: req.method,
          pathname,
          query: searchParams,
          header: (name) => req.headers[name.toLowerCase()] ?? null,
          readText: (limit) => readText(req, limit),
          ip: clientIp(req),
          origin: originOf(req),
        });
        return send(res, result.status, result.body, result.headers);
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'That method is not allowed here.' });
      return await serveStatic(req, res, pathname);
    } catch (err) {
      console.error(err);
      if (!res.headersSent) send(res, 500, { error: 'Something went wrong on our side. Please try again.' });
    }
  };
}
