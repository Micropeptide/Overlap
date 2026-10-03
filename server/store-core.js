// Storage logic shared by every deployment. It talks to SQLite through a tiny
// async driver, so the same code runs on Node (a local SQLite file) and on
// Cloudflare Workers (D1). Secrets (management keys, guest edit keys) are
// stored only as SHA-256 hashes, so a copy of the database can't be used to
// take over polls. Uses Web Crypto, available on both platforms.
//
// A driver has: run(sql, params) -> { changes }, get(sql, params) -> row | null,
// all(sql, params) -> rows, and optionally afterDelete() to flush deletions.

import { pollSlots, addDays, weekdayOf, dayStartUtc } from '../shared/time.js';

const parseList = (text) => { try { const v = JSON.parse(text); return Array.isArray(v) ? v : []; } catch { return []; } };

const ID_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
const SEP = '\u001f'; // separates a name from a response id in hidden-results name keys
const encoder = new TextEncoder();

export function randomId(length = 12) {
  // Rejection sampling keeps every character equally likely.
  const limit = 256 - (256 % ID_ALPHABET.length);
  let s = '';
  while (s.length < length) {
    for (const b of crypto.getRandomValues(new Uint8Array(length * 2))) {
      if (b < limit && s.length < length) s += ID_ALPHABET[b % ID_ALPHABET.length];
    }
  }
  return s;
}

export function newSecret() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export const hashText = (text) => hashSecret(text);

export async function hashSecret(secret) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(String(secret)));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Compare a presented key with a stored hash without leaking timing. */
export async function secretMatches(secret, storedHash) {
  if (typeof secret !== 'string' || !secret || typeof storedHash !== 'string' || storedHash.length !== 64) return false;
  const actual = await hashSecret(secret);
  let diff = 0;
  for (let i = 0; i < 64; i++) diff |= actual.charCodeAt(i) ^ storedHash.charCodeAt(i);
  return diff === 0;
}

/**
 * Names compare case- and spacing-insensitively, so "Sam" and " sam " clash,
 * and invisible characters are ignored, so "Sam" plus a zero-width space does too.
 */
export function nameKey(name) {
  return name.normalize('NFKC').replace(/\p{Default_Ignorable_Code_Point}/gu, '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-US');
}

// Slot lists are derived from a poll's settings and cost a few thousand Intl
// calls to build, so they are cached by those settings.
const slotCache = new Map();
export function slotsFor(config) {
  const key = JSON.stringify([config.timezone, config.dates, config.startMinute, config.endMinute, config.slotMinutes]);
  let slots = slotCache.get(key);
  if (!slots) {
    slots = pollSlots(config);
    slotCache.set(key, slots);
    if (slotCache.size > 500) slotCache.delete(slotCache.keys().next().value);
  }
  return slots;
}
const slotConfig = (p) => JSON.stringify({ timezone: p.timezone, dates: p.dates, startMinute: p.startMinute, endMinute: p.endMinute, slotMinutes: p.slotMinutes });

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS polls (
  id TEXT PRIMARY KEY,
  admin_hash TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'dates',
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  timezone TEXT NOT NULL,
  dates TEXT NOT NULL,
  start_minute INTEGER NOT NULL,
  end_minute INTEGER NOT NULL,
  slot_minutes INTEGER NOT NULL,
  duration_minutes INTEGER,
  results_visibility TEXT NOT NULL DEFAULT 'everyone',
  location TEXT NOT NULL DEFAULT '',
  closes_on TEXT,
  closed INTEGER NOT NULL DEFAULT 0,
  final_start INTEGER,
  final_end INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  admin_pw_hash TEXT,
  allow_edits INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS responses (
  id TEXT PRIMARY KEY,
  poll_id TEXT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_key TEXT NOT NULL,
  edit_hash TEXT NOT NULL,
  available TEXT NOT NULL,
  if_needed TEXT NOT NULL,
  preferred TEXT NOT NULL DEFAULT '[]',
  note TEXT NOT NULL DEFAULT '',
  answered TEXT NOT NULL,
  answered_config TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  pw_hash TEXT,
  UNIQUE (poll_id, name_key)
);
CREATE INDEX IF NOT EXISTS responses_poll ON responses(poll_id);
CREATE INDEX IF NOT EXISTS responses_edit ON responses(poll_id, edit_hash);
CREATE INDEX IF NOT EXISTS polls_expiry ON polls(expires_at);
CREATE TABLE IF NOT EXISTS throttle (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  reset_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS email_subs (
  id TEXT PRIMARY KEY,
  poll_id TEXT NOT NULL,
  response_id TEXT,
  email TEXT NOT NULL,
  confirmed INTEGER NOT NULL DEFAULT 0,
  confirm_hash TEXT NOT NULL,
  unsub_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  last_sent_at INTEGER,
  pending_at INTEGER
);
CREATE UNIQUE INDEX IF NOT EXISTS email_subs_owner ON email_subs(poll_id, IFNULL(response_id, ''));
CREATE INDEX IF NOT EXISTS email_subs_pending ON email_subs(pending_at);
CREATE TABLE IF NOT EXISTS poll_events (
  poll_id TEXT NOT NULL,
  at INTEGER NOT NULL,
  kind TEXT NOT NULL,
  response_id TEXT
);
CREATE INDEX IF NOT EXISTS poll_events_poll ON poll_events(poll_id, at);
`;

/** Columns added after the first release, for upgrading older databases in place. */
export const MIGRATIONS = [
  ['polls', 'kind', "TEXT NOT NULL DEFAULT 'dates'"],
  ['polls', 'location', "TEXT NOT NULL DEFAULT ''"],
  ['polls', 'closes_on', 'TEXT'],
  ['responses', 'preferred', "TEXT NOT NULL DEFAULT '[]'"],
  ['responses', 'note', "TEXT NOT NULL DEFAULT ''"],
  // Which times a response was given against, as the poll settings at the time.
  ['responses', 'answered_config', 'TEXT'],
  // Optional passwords, stored as hashes of keys derived in the browser.
  ['polls', 'admin_pw_hash', 'TEXT'],
  ['responses', 'pw_hash', 'TEXT'],
  // Whether guests may change an answer after submitting it.
  ['polls', 'allow_edits', 'INTEGER NOT NULL DEFAULT 1'],
];

/** Stored as the expiry of polls that are kept until someone deletes them. */
export const NEVER = Number.MAX_SAFE_INTEGER;

/**
 * retentionDays = 0 (the default) keeps polls until the organizer deletes
 * them. A positive value turns on automatic deletion: date polls go that many
 * days after their last date, weekly polls that many days after their last change.
 */
export function createStore(driver, { retentionDays = 0 } = {}) {
  const { run, get, all } = driver;
  const flush = async () => { await driver.afterDelete?.(); };

  function expiryFor({ kind, dates, timezone }) {
    if (!retentionDays) return NEVER;
    if (kind === 'weekly') return Date.now() + retentionDays * 86400e3;
    const last = [...dates].sort().at(-1);
    return dayStartUtc(addDays(last, 1), timezone) + retentionDays * 86400e3;
  }

  function hydratePoll(row) {
    if (!row) return null;
    const poll = {
      id: row.id,
      adminHash: row.admin_hash,
      adminPwHash: row.admin_pw_hash || null,
      kind: row.kind || 'dates',
      title: row.title,
      description: row.description,
      timezone: row.timezone,
      dates: JSON.parse(row.dates),
      startMinute: row.start_minute,
      endMinute: row.end_minute,
      slotMinutes: row.slot_minutes,
      durationMinutes: row.duration_minutes,
      resultsVisibility: row.results_visibility,
      allowEdits: row.allow_edits !== 0,
      location: row.location || '',
      closesOn: row.closes_on || null,
      manualClosed: !!row.closed,
      final: row.final_start != null ? { start: row.final_start, end: row.final_end } : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      expiresAt: row.expires_at,
    };
    poll.slots = slotsFor(poll);
    // A deadline closes the poll at the end of that day in the poll's time zone.
    poll.closesAt = poll.closesOn ? dayStartUtc(addDays(poll.closesOn, 1), poll.timezone) : null;
    poll.closed = poll.manualClosed || (poll.closesAt != null && Date.now() >= poll.closesAt);
    if (poll.kind === 'weekly') poll.weekdays = poll.dates.map(weekdayOf);
    return poll;
  }

  function hydrateResponse(row) {
    return {
      id: row.id,
      name: row.name,
      editHash: row.edit_hash,
      pwHash: row.pw_hash || null,
      available: parseList(row.available),
      ifNeeded: parseList(row.if_needed),
      preferred: parseList(row.preferred),
      note: row.note || '',
      answered: row.answered_config ? slotsFor(JSON.parse(row.answered_config)) : parseList(row.answered),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  function hydrateSub(row) {
    return {
      id: row.id,
      pollId: row.poll_id,
      responseId: row.response_id || null,
      email: row.email,
      confirmed: !!row.confirmed,
      createdAt: row.created_at,
      lastSentAt: row.last_sent_at ?? null,
      pendingAt: row.pending_at ?? null,
    };
  }

  const touchWeekly = async (pollId, now) => retentionDays && run("UPDATE polls SET expires_at = ? WHERE id = ? AND kind = 'weekly'", [now + retentionDays * 86400e3, pollId]);

  return {
    retentionDays,

    async createPoll(input) {
      const id = randomId(12);
      const adminToken = newSecret();
      const now = Date.now();
      await run(`INSERT INTO polls (id, admin_hash, kind, title, description, location, closes_on, timezone, dates, start_minute,
        end_minute, slot_minutes, duration_minutes, results_visibility, closed, final_start, final_end, created_at, updated_at, expires_at,
        allow_edits) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, NULL, ?, ?, ?, ?)`, [
        id, await hashSecret(adminToken), input.kind || 'dates', input.title, input.description, input.location || '',
        input.closesOn || null, input.timezone, JSON.stringify(input.dates),
        input.startMinute, input.endMinute, input.slotMinutes, input.durationMinutes ?? null, input.resultsVisibility,
        now, now, expiryFor(input), input.allowEdits === false ? 0 : 1]);
      return { poll: await this.getPoll(id), adminToken };
    },

    async getPoll(id) {
      return hydratePoll(await get('SELECT * FROM polls WHERE id = ?', [id]));
    },

    async updatePoll(id, changes) {
      const current = await this.getPoll(id);
      if (!current) return null;
      const next = { ...current, ...changes };
      await run(`UPDATE polls SET title = ?, description = ?, location = ?, closes_on = ?, timezone = ?, dates = ?, start_minute = ?,
        end_minute = ?, slot_minutes = ?, duration_minutes = ?, results_visibility = ?, closed = ?, final_start = ?, final_end = ?,
        updated_at = ?, expires_at = ?, allow_edits = ? WHERE id = ?`, [
        next.title, next.description, next.location || '', next.closesOn || null, next.timezone, JSON.stringify(next.dates),
        next.startMinute, next.endMinute, next.slotMinutes, next.durationMinutes ?? null, next.resultsVisibility, next.manualClosed ? 1 : 0,
        next.final ? next.final.start : null, next.final ? next.final.end : null,
        Date.now(), expiryFor(next), next.allowEdits === false ? 0 : 1, id]);
      return this.getPoll(id);
    },

    deadlinePassed(poll) {
      return !!poll.closesOn && Date.now() >= dayStartUtc(addDays(poll.closesOn, 1), poll.timezone);
    },

    async rotateAdmin(id) {
      const adminToken = newSecret();
      await run('UPDATE polls SET admin_hash = ?, updated_at = ? WHERE id = ?', [await hashSecret(adminToken), Date.now(), id]);
      return adminToken;
    },

    /** Set (a key) or remove (null) the organizer password. */
    async setAdminPassword(id, passwordKey) {
      await run('UPDATE polls SET admin_pw_hash = ?, updated_at = ? WHERE id = ?',
        [passwordKey ? await hashSecret(passwordKey) : null, Date.now(), id]);
    },

    async setResponsePassword(pollId, id, passwordKey) {
      await run('UPDATE responses SET pw_hash = ? WHERE poll_id = ? AND id = ?',
        [passwordKey ? await hashSecret(passwordKey) : null, pollId, id]);
    },

    /** Responses under this name: one when names are unique, possibly several when results are hidden. */
    async responsesNamed(pollId, name) {
      const key = nameKey(name);
      const rows = await all('SELECT * FROM responses WHERE poll_id = ? AND (name_key = ? OR (name_key >= ? AND name_key < ?))',
        [pollId, key, `${key}${SEP}`, `${key} `]);
      return rows.map(hydrateResponse);
    },

    /**
     * Wrong-password limits, kept in the database so they hold across every
     * server instance. `blocked` is checked before a password is compared and
     * `miss` records a wrong one; a key's count resets after its window.
     */
    async throttleBlocked(key, max) {
      const row = await get('SELECT count, reset_at FROM throttle WHERE key = ?', [key]);
      return !!row && row.reset_at > Date.now() && row.count >= max;
    },
    async throttleMiss(key, windowMs) {
      const now = Date.now();
      await run('DELETE FROM throttle WHERE reset_at <= ?', [now]);
      const { changes } = await run('UPDATE throttle SET count = count + 1 WHERE key = ?', [key]);
      if (!changes) await run('INSERT INTO throttle (key, count, reset_at) VALUES (?, 1, ?)', [key, now + windowMs]);
    },

    // Email updates. A subscription belongs to the organizer (responseId null)
    // or to one response. The address is kept only while the subscription exists.

    async getEmailSub(pollId, responseId = null) {
      const row = await get('SELECT * FROM email_subs WHERE poll_id = ? AND IFNULL(response_id, \'\') = ?', [pollId, responseId || '']);
      return row ? hydrateSub(row) : null;
    },

    /** Start (or restart) a subscription. Returns tokens for the confirm and unsubscribe links. */
    async putEmailSub(pollId, responseId, email) {
      const current = await this.getEmailSub(pollId, responseId);
      const confirmToken = newSecret();
      const unsubToken = newSecret();
      // Same address, already confirmed: keep it confirmed.
      const confirmed = current?.confirmed && current.email === email ? 1 : 0;
      await run('DELETE FROM email_subs WHERE poll_id = ? AND IFNULL(response_id, \'\') = ?', [pollId, responseId || '']);
      await run(`INSERT INTO email_subs (id, poll_id, response_id, email, confirmed, confirm_hash, unsub_hash, created_at, last_sent_at, pending_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`, [randomId(12), pollId, responseId, email, confirmed,
        await hashSecret(confirmToken), await hashSecret(unsubToken), Date.now(), confirmed ? current.lastSentAt : null]);
      return { confirmToken, unsubToken, confirmed: !!confirmed };
    },

    async deleteEmailSub(pollId, responseId = null) {
      await run('DELETE FROM email_subs WHERE poll_id = ? AND IFNULL(response_id, \'\') = ?', [pollId, responseId || '']);
      await flush();
    },

    async confirmEmailSub(token) {
      if (typeof token !== 'string' || !token) return null;
      const row = await get('SELECT * FROM email_subs WHERE confirm_hash = ?', [await hashSecret(token)]);
      if (!row) return null;
      if (row.confirmed) return hydrateSub(row);
      // Updates cover changes from now on. (created_at doubles as "following
      // since"; last_sent_at stays empty so the first update isn't held back
      // by the 30-minute gap between emails.)
      const now = Date.now();
      await run('UPDATE email_subs SET confirmed = 1, created_at = ? WHERE id = ?', [now, row.id]);
      return hydrateSub({ ...row, confirmed: 1, created_at: now });
    },

    async unsubscribe(token) {
      if (typeof token !== 'string' || !token) return null;
      const row = await get('SELECT * FROM email_subs WHERE unsub_hash = ?', [await hashSecret(token)]);
      if (!row) return null;
      await run('DELETE FROM email_subs WHERE id = ?', [row.id]);
      await flush();
      return hydrateSub(row);
    },

    /** A new unsubscribe token for each email sent, so every email's link works. */
    async newUnsubToken(subId) {
      const token = newSecret();
      await run('UPDATE email_subs SET unsub_hash = ? WHERE id = ?', [await hashSecret(token), subId]);
      return token;
    },

    /**
     * Note something subscribers may want to hear about, and mark them as
     * having news. Kinds: response_new, response_updated, response_deleted
     * (for the organizer, and for guests when results are public), and final,
     * closed, reopened, edited (for guests). Nobody hears about their own doing:
     * `byOrganizer` skips the organizer, and the response's own guest is skipped.
     */
    async recordEvent(poll, kind, responseId = null, { byOrganizer = false } = {}) {
      // Only polls someone follows by email keep a record of changes.
      if (!(await get('SELECT 1 AS x FROM email_subs WHERE poll_id = ? AND confirmed = 1 LIMIT 1', [poll.id]))) return;
      const now = Date.now();
      await run('INSERT INTO poll_events (poll_id, at, kind, response_id) VALUES (?, ?, ?, ?)', [poll.id, now, kind, responseId]);
      const aboutResponse = kind.startsWith('response_');
      const organizer = aboutResponse && !byOrganizer;
      const guests = !aboutResponse || poll.resultsVisibility === 'everyone';
      const who = [organizer ? 'response_id IS NULL' : null, guests ? '(response_id IS NOT NULL AND response_id <> ?)' : null].filter(Boolean);
      if (who.length) {
        await run(`UPDATE email_subs SET pending_at = COALESCE(pending_at, ?) WHERE poll_id = ? AND confirmed = 1 AND (${who.join(' OR ')})`,
          guests ? [now, poll.id, responseId || ''] : [now, poll.id]);
      }
      await run('DELETE FROM poll_events WHERE at < ?', [now - 30 * 86400e3]);
    },

    /** Subscriptions with news, settled for `settleMs` and not emailed within `gapMs`. */
    async dueEmailSubs({ now = Date.now(), settleMs = 2 * 60e3, gapMs = 30 * 60e3, limit = 20 } = {}) {
      const rows = await all(`SELECT * FROM email_subs WHERE confirmed = 1 AND pending_at IS NOT NULL AND pending_at <= ?
        AND (last_sent_at IS NULL OR last_sent_at <= ?) ORDER BY pending_at LIMIT ?`, [now - settleMs, now - gapMs, limit]);
      return rows.map(hydrateSub);
    },

    async eventsSince(pollId, since) {
      return all('SELECT at, kind, response_id AS responseId FROM poll_events WHERE poll_id = ? AND at > ? ORDER BY at', [pollId, since || 0]);
    },

    async markEmailed(subId, at = Date.now()) {
      // Anything that happened while this email was being put together stays pending.
      await run(`UPDATE email_subs SET last_sent_at = ?,
        pending_at = (SELECT MIN(e.at) FROM poll_events e WHERE e.poll_id = email_subs.poll_id AND e.at > ?) WHERE id = ?`, [at, at, subId]);
    },

    async deletePoll(id) {
      // Responses would go with the poll (ON DELETE CASCADE); deleting them
      // explicitly too doesn't rely on foreign keys being switched on.
      await run('DELETE FROM email_subs WHERE poll_id = ?', [id]);
      await run('DELETE FROM poll_events WHERE poll_id = ?', [id]);
      await run('DELETE FROM responses WHERE poll_id = ?', [id]);
      await run('DELETE FROM polls WHERE id = ?', [id]);
      await run('DELETE FROM throttle WHERE key IN (?, ?, ?)', [`organizer:${id}`, `guest:${id}`, `email-poll:${id}`]);
      await flush();
    },

    async listResponses(pollId) {
      return (await all('SELECT * FROM responses WHERE poll_id = ? ORDER BY created_at, id', [pollId])).map(hydrateResponse);
    },

    async countResponses(pollId) {
      return (await get('SELECT COUNT(*) AS n FROM responses WHERE poll_id = ?', [pollId])).n;
    },

    async getResponse(pollId, id) {
      const row = await get('SELECT * FROM responses WHERE poll_id = ? AND id = ?', [pollId, id]);
      return row ? hydrateResponse(row) : null;
    },

    /**
     * A name is taken by an exact key, or by a hidden-results response stored
     * as "key<US>id" (US = U+001F, which names can never contain).
     */
    async nameTaken(pollId, name, exceptId = null) {
      const key = nameKey(name);
      const rows = await all('SELECT id FROM responses WHERE poll_id = ? AND (name_key = ? OR (name_key >= ? AND name_key < ?))',
        [pollId, key, `${key}${SEP}`, `${key} `]);
      return rows.some((row) => row.id !== exceptId);
    },

    async findResponseByToken(pollId, token) {
      if (typeof token !== 'string' || !token) return null;
      const row = await get('SELECT * FROM responses WHERE poll_id = ? AND edit_hash = ?', [pollId, await hashSecret(token)]);
      return row ? hydrateResponse(row) : null;
    },

    /**
     * `poll` supplies the settings the guest answered against. When results are
     * hidden, names needn't be unique (each response has its own key anyway), so
     * the key gets a suffix and nobody can probe who responded by trying names.
     */
    async createResponse(poll, { name, available, ifNeeded, preferred = [], note = '' }, { passwordKey = null } = {}) {
      const id = randomId(12);
      const editToken = newSecret();
      const now = Date.now();
      const key = poll.resultsVisibility === 'organizer' ? `${nameKey(name)}${SEP}${id}` : nameKey(name);
      await run(`INSERT INTO responses (id, poll_id, name, name_key, edit_hash, available, if_needed, preferred, note,
        answered, answered_config, created_at, updated_at, pw_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', ?, ?, ?, ?)`, [
        id, poll.id, name, key, await hashSecret(editToken), JSON.stringify(available),
        JSON.stringify(ifNeeded), JSON.stringify(preferred), note, slotConfig(poll), now, now,
        passwordKey ? await hashSecret(passwordKey) : null]);
      await touchWeekly(poll.id, now);
      return { response: await this.getResponse(poll.id, id), editToken };
    },

    async updateResponse(poll, id, { name, available, ifNeeded, preferred = [], note = '' }) {
      const key = poll.resultsVisibility === 'organizer' ? `${nameKey(name)}${SEP}${id}` : nameKey(name);
      const { changes } = await run(`UPDATE responses SET name = ?, name_key = ?, available = ?, if_needed = ?, preferred = ?, note = ?,
        answered = '[]', answered_config = ?, updated_at = ? WHERE poll_id = ? AND id = ?`, [
        name, key, JSON.stringify(available), JSON.stringify(ifNeeded), JSON.stringify(preferred),
        note, slotConfig(poll), Date.now(), poll.id, id]);
      if (!changes) return null;
      await touchWeekly(poll.id, Date.now());
      return this.getResponse(poll.id, id);
    },

    async deleteResponse(pollId, id) {
      await run('DELETE FROM email_subs WHERE poll_id = ? AND response_id = ?', [pollId, id]);
      await run('DELETE FROM responses WHERE poll_id = ? AND id = ?', [pollId, id]);
      await flush();
    },

    async deleteExpired(now = Date.now()) {
      if (!retentionDays) return 0; // automatic deletion is off
      await run('DELETE FROM email_subs WHERE poll_id IN (SELECT id FROM polls WHERE expires_at < ?)', [now]);
      await run('DELETE FROM poll_events WHERE poll_id IN (SELECT id FROM polls WHERE expires_at < ?)', [now]);
      await run('DELETE FROM responses WHERE poll_id IN (SELECT id FROM polls WHERE expires_at < ?)', [now]);
      const { changes } = await run('DELETE FROM polls WHERE expires_at < ?', [now]);
      if (changes) await flush();
      return changes;
    },
  };
}
