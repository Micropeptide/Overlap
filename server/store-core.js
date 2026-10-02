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
  expires_at INTEGER NOT NULL
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
  UNIQUE (poll_id, name_key)
);
CREATE INDEX IF NOT EXISTS responses_poll ON responses(poll_id);
CREATE INDEX IF NOT EXISTS responses_edit ON responses(poll_id, edit_hash);
CREATE INDEX IF NOT EXISTS polls_expiry ON polls(expires_at);
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
      available: parseList(row.available),
      ifNeeded: parseList(row.if_needed),
      preferred: parseList(row.preferred),
      note: row.note || '',
      answered: row.answered_config ? slotsFor(JSON.parse(row.answered_config)) : parseList(row.answered),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
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
        end_minute, slot_minutes, duration_minutes, results_visibility, closed, final_start, final_end, created_at, updated_at, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, NULL, ?, ?, ?)`, [
        id, await hashSecret(adminToken), input.kind || 'dates', input.title, input.description, input.location || '',
        input.closesOn || null, input.timezone, JSON.stringify(input.dates),
        input.startMinute, input.endMinute, input.slotMinutes, input.durationMinutes ?? null, input.resultsVisibility,
        now, now, expiryFor(input)]);
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
        updated_at = ?, expires_at = ? WHERE id = ?`, [
        next.title, next.description, next.location || '', next.closesOn || null, next.timezone, JSON.stringify(next.dates),
        next.startMinute, next.endMinute, next.slotMinutes, next.durationMinutes ?? null, next.resultsVisibility, next.manualClosed ? 1 : 0,
        next.final ? next.final.start : null, next.final ? next.final.end : null,
        Date.now(), expiryFor(next), id]);
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

    async deletePoll(id) {
      // Responses would go with the poll (ON DELETE CASCADE); deleting them
      // explicitly too doesn't rely on foreign keys being switched on.
      await run('DELETE FROM responses WHERE poll_id = ?', [id]);
      await run('DELETE FROM polls WHERE id = ?', [id]);
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
    async createResponse(poll, { name, available, ifNeeded, preferred = [], note = '' }) {
      const id = randomId(12);
      const editToken = newSecret();
      const now = Date.now();
      const key = poll.resultsVisibility === 'organizer' ? `${nameKey(name)}${SEP}${id}` : nameKey(name);
      await run(`INSERT INTO responses (id, poll_id, name, name_key, edit_hash, available, if_needed, preferred, note,
        answered, answered_config, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', ?, ?, ?)`, [
        id, poll.id, name, key, await hashSecret(editToken), JSON.stringify(available),
        JSON.stringify(ifNeeded), JSON.stringify(preferred), note, slotConfig(poll), now, now]);
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
      await run('DELETE FROM responses WHERE poll_id = ? AND id = ?', [pollId, id]);
      await flush();
    },

    async deleteExpired(now = Date.now()) {
      if (!retentionDays) return 0; // automatic deletion is off
      await run('DELETE FROM responses WHERE poll_id IN (SELECT id FROM polls WHERE expires_at < ?)', [now]);
      const { changes } = await run('DELETE FROM polls WHERE expires_at < ?', [now]);
      if (changes) await flush();
      return changes;
    },
  };
}
