// Entry point. Configuration comes from environment variables; see README.

import { createServer } from 'node:http';
import { resolve, join } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { openStore } from './store.js';
import { createApp } from './app.js';
import { createResendMailer, sendDueDigests } from './email.js';

/** Read a whole-number setting, refusing to start on nonsense rather than guessing. */
function intSetting(name, fallback, min, max) {
  const raw = process.env[name];
  if (raw == null || raw === '') return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < min || n > max) {
    console.error(`Overlap: ${name} must be a whole number from ${min} to ${max} (got "${raw}").`);
    process.exit(1);
  }
  return n;
}

const PORT = intSetting('PORT', 3000, 1, 65535);
const HOST = process.env.HOST || '127.0.0.1';
const DATA_DIR = resolve(process.env.DATA_DIR || 'data');
// 0 (the default) keeps polls until the organizer deletes them.
const RETENTION_DAYS = intSetting('RETENTION_DAYS', 0, 0, 3650);
const TRUST_PROXY = intSetting('TRUST_PROXY', 0, 0, 10);
const PUBLIC_URL = process.env.PUBLIC_URL || '';
if (PUBLIC_URL && !/^https?:\/\/[^/\s]+\/?$/.test(PUBLIC_URL)) {
  console.error(`Overlap: PUBLIC_URL must look like https://overlap.example.com (got "${PUBLIC_URL}").`);
  process.exit(1);
}

const store = openStore(resolve(DATA_DIR, 'overlap.db'), { retentionDays: RETENTION_DAYS });
// Optional email through Resend: both settings are needed, or email stays off.
// For development, EMAIL_OUTBOX=<folder> writes each email there as JSON instead.
const outbox = process.env.EMAIL_OUTBOX ? resolve(process.env.EMAIL_OUTBOX) : null;
const mailer = outbox
  ? {
      async send(msg) {
        mkdirSync(outbox, { recursive: true });
        writeFileSync(join(outbox, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`), JSON.stringify(msg, null, 2));
      },
    }
  : createResendMailer({ apiKey: process.env.RESEND_API_KEY, from: process.env.EMAIL_FROM });
const app = createApp({
  store,
  mailer,
  trustProxy: TRUST_PROXY,
  publicUrl: PUBLIC_URL,
  rateLimits: {
    create: { max: intSetting('RATE_LIMIT_CREATE', 30, 1, 1e7), windowMs: 60 * 60e3 },
    write: { max: intSetting('RATE_LIMIT_WRITE', 300, 1, 1e7), windowMs: 10 * 60e3 },
    read: { max: intSetting('RATE_LIMIT_READ', 1200, 1, 1e7), windowMs: 10 * 60e3 },
    email: { max: intSetting('RATE_LIMIT_EMAIL', 10, 1, 1e7), windowMs: 60 * 60e3 },
  },
});

async function cleanup() {
  const n = await store.deleteExpired();
  if (n) console.log(`Deleted ${n} expired poll${n === 1 ? '' : 's'}.`);
}
if (RETENTION_DAYS) {
  cleanup();
  setInterval(cleanup, 60 * 60e3).unref();
}

if (mailer) {
  const base = (PUBLIC_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
  const digests = () => sendDueDigests({ store, mailer, publicUrl: base, apiUrl: base }).catch((err) => console.error(err));
  setInterval(digests, 2 * 60e3).unref();
}

const server = createServer(app);
server.listen(PORT, HOST, () => {
  console.log(`Overlap is running at http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log(`Data: ${DATA_DIR}  ·  ${RETENTION_DAYS ? `polls are deleted ${RETENTION_DAYS} days after their last date` : 'polls are kept until the organizer deletes them'}`);
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    server.close(() => {
      store.close();
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 3000).unref();
  });
}
