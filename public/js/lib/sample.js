// The sample poll: a team of seven has already answered, so a visitor can see
// what Overlap does before asking anyone. It has both sides:
//   /p/example           the guest's view (add your own times)
//   /m/example#k=sample  the organizer's view (pick the final time, edit, close…)
// It runs entirely in this browser. Nothing is sent to the server; what the
// visitor changes is kept in localStorage ("overlap.sample"), shared by both
// views, until they delete the poll (which starts the sample over).
//
// api() hands every /api/polls/example… request to sampleApi(), which answers
// with the same shapes as the real API.

import { pollSlots, todayIn, addDays, weekdayOf, isValidDateKey } from '/shared/time.js';
import { t } from './i18n.js';

export const SAMPLE_ID = 'example';
export const SAMPLE_KEY = 'sample';
export const SAMPLE_MANAGE = `/m/${SAMPLE_ID}#k=${SAMPLE_KEY}`;
const KEY = 'overlap.sample';
const H = 60;

// Who answered and when they're free, per day (0–4 = the first five days shown),
// as [from, to) in minutes after midnight. Everyone overlaps on day 2, 13:00–14:30.
const TEAM = [
  { name: 'Ana', hoursAgo: 26, days: { 0: [[9 * H, 12 * H]], 1: [[13 * H, 17 * H]], 2: [[9 * H, 11 * H], [12.5 * H, 16 * H]], 3: [[9 * H, 17 * H]], 4: [[9 * H, 12 * H]] }, preferred: { 2: [[13 * H, 14.5 * H]] } },
  { name: 'Ben', hoursAgo: 22, days: { 0: [[10 * H, 17 * H]], 2: [[13 * H, 17 * H]], 3: [[10 * H, 12 * H]], 4: [[9 * H, 17 * H]] }, ifNeeded: { 1: [[9 * H, 11 * H]] } },
  { name: 'Chen Wei', hoursAgo: 19, days: { 1: [[9 * H, 15 * H]], 2: [[11 * H, 15 * H]], 3: [[9 * H, 11 * H], [14 * H, 17 * H]] }, ifNeeded: { 0: [[15 * H, 17 * H]] } },
  { name: 'Diego', hoursAgo: 9, days: { 0: [[9 * H, 11 * H]], 2: [[12 * H, 14.5 * H]], 3: [[10 * H, 16 * H]], 4: [[13 * H, 17 * H]] }, ifNeeded: { 2: [[14.5 * H, 16 * H]] } },
  { name: 'Fatima', hoursAgo: 7, days: { 2: [[9 * H, 17 * H]], 3: [[9 * H, 12 * H]], 4: [[9 * H, 11 * H]] }, preferred: { 2: [[13 * H, 14.5 * H]] } },
  { name: 'Kenji', hoursAgo: 4, days: { 0: [[13 * H, 17 * H]], 1: [[9 * H, 17 * H]], 2: [[13 * H, 15 * H]], 3: [[10 * H, 11.5 * H]] }, ifNeeded: { 4: [[9 * H, 12 * H]] } },
  { name: 'Priya', hoursAgo: 1, days: { 1: [[14 * H, 17 * H]], 2: [[13 * H, 14.5 * H]] }, ifNeeded: { 3: [[10 * H, 11 * H]] } },
];

const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; } };
const write = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* this visit only */ } };
let memory = null;

/** The next five weekdays after today, in the visitor's own time zone. */
function upcomingWeekdays(timezone) {
  const out = [];
  for (let d = addDays(todayIn(timezone), 1); out.length < 5; d = addDays(d, 1)) {
    if (weekdayOf(d) !== 0 && weekdayOf(d) !== 6) out.push(d);
  }
  return out;
}

function fresh(timezone) {
  const dates = upcomingWeekdays(timezone);
  return { timezone, teamDates: dates, mine: null, edits: {}, removed: [], status: 'open', final: null, updatedAt: Date.now() };
}

/** The stored state, started over when its days have passed or the zone changed. */
function state() {
  let s = memory || read();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  if (!s || !s.teamDates || s.timezone !== timezone || s.teamDates[0] <= todayIn(timezone)) s = fresh(timezone);
  memory = s;
  return s;
}

function save(s) { s.updatedAt = Date.now(); memory = s; write(s); }

function poll(s = state(), { organizer = false } = {}) {
  const e = s.edits;
  const base = {
    dates: e.dates || s.teamDates, startMinute: e.startMinute ?? 9 * H, endMinute: e.endMinute ?? 17 * H,
    slotMinutes: e.slotMinutes ?? 30, timezone: s.timezone,
  };
  const slots = pollSlots(base);
  const valid = new Set(slots);
  // The team answered for the original five days; their times follow those
  // dates, and count only where the poll (as edited) still has those times.
  const at = (day, minute) => pollSlots({ dates: [s.teamDates[day]], startMinute: minute, endMinute: minute + 30, slotMinutes: 30, timezone: s.timezone })[0];
  const pick = (ranges = {}) => Object.entries(ranges).flatMap(([day, list]) =>
    list.flatMap(([from, to]) => { const out = []; for (let m = from; m < to; m += 30) out.push(at(Number(day), m)); return out; }))
    .filter((x) => valid.has(x));
  const now = Date.now();
  const responses = TEAM.map((p, i) => {
    const preferred = pick(p.preferred);
    return {
      id: `sample${i}`, name: p.name,
      available: pick(p.days).filter((x) => !preferred.includes(x)), ifNeeded: pick(p.ifNeeded), preferred,
      note: '', answered: null, createdAt: now - p.hoursAgo * 3600e3, updatedAt: now - p.hoursAgo * 3600e3,
    };
  }).filter((r) => !s.removed.includes(r.id));
  if (s.mine) {
    const { key, ...mine } = s.mine;
    responses.push({ ...mine, available: mine.available.filter((x) => valid.has(x)), ifNeeded: mine.ifNeeded.filter((x) => valid.has(x)), preferred: mine.preferred.filter((x) => valid.has(x)) });
  }
  return {
    id: SAMPLE_ID, kind: 'dates', title: e.title ?? t('sample.title'), description: e.description ?? t('sample.description'),
    location: e.location ?? '', closesOn: e.closesOn ?? null, closesAt: null, ...base,
    durationMinutes: e.durationMinutes ?? null, resultsVisibility: e.resultsVisibility ?? 'everyone', allowEdits: e.allowEdits ?? true,
    status: s.status, final: s.final, slots, createdAt: now - 30 * 3600e3, updatedAt: s.updatedAt,
    hasOrganizerPassword: false, responseCount: responses.length, responses, isOrganizer: organizer, isSample: true,
    ...(organizer ? { expiresAt: null } : {}),
  };
}

class SampleError extends Error {
  constructor(status, message, field) { super(message); this.status = status; this.field = field; }
}
const unavailable = () => new SampleError(400, t('sample.unavailable'));

function checkAnswer(body, slots) {
  const name = String(body?.name ?? '').trim();
  if (!name) throw new SampleError(400, t('errors.name_required'), 'name');
  if (name.length > 80) throw new SampleError(400, t('errors.name_too_long', { count: 80 }), 'name');
  const s = state();
  if (TEAM.some((p, i) => p.name.toLowerCase() === name.toLowerCase() && !s.removed.includes(`sample${i}`))) {
    throw new SampleError(409, t('errors.name_taken_other', { name }), 'name');
  }
  const valid = new Set(slots);
  const list = (v) => [...new Set((Array.isArray(v) ? v : []).filter((x) => valid.has(x)))];
  return { name, available: list(body.available), ifNeeded: list(body.ifNeeded), preferred: list(body.preferred), note: String(body.note || '').slice(0, 500) };
}

/** The organizer's changes. Only what the sample can show; the rest says so. */
function applyPatch(s, body = {}) {
  const current = poll(s, { organizer: true });
  if ('organizerPassword' in body && body.organizerPassword) throw unavailable();
  if ((body.kind && body.kind !== 'dates') || (body.timezone && body.timezone !== s.timezone)) throw unavailable();
  if ('final' in body && 'status' in body) throw new SampleError(400, t('errors.reopen_with_final'), 'status');
  if ('final' in body) {
    if (body.final === null) { s.final = null; s.status = 'open'; return; }
    // One session ({start, end}) or several ({sessions}), as the real API takes them.
    const list = Array.isArray(body.final?.sessions) ? body.final.sessions : [body.final || {}];
    if (!list.length) throw new SampleError(400, t('errors.final_required'), 'final');
    if (list.length > 10) throw new SampleError(400, t('errors.final_too_many', { count: 10 }), 'final');
    const sessions = list.map(({ start, end } = {}) => {
      if (!Number.isFinite(start) || !Number.isFinite(end)) throw new SampleError(400, t('errors.final_required'), 'final');
      if (end <= start) throw new SampleError(400, t('errors.final_end_before_start'), 'final');
      if (end - start > 14 * 86400e3) throw new SampleError(400, t('errors.final_too_long', { count: 14 }), 'final');
      if (!current.slots.includes(start)) throw new SampleError(400, t('errors.final_not_a_time'), 'final');
      return { start, end };
    }).sort((x, y) => x.start - y.start);
    if (sessions.some((x, i) => i && x.start < sessions[i - 1].end)) throw new SampleError(400, t('errors.final_overlap'), 'final');
    s.final = { start: sessions[0].start, end: sessions[0].end, sessions };
    s.status = 'finalized';
    return;
  }
  if ('status' in body) {
    if (!['open', 'closed'].includes(body.status)) throw new SampleError(400, t('errors.status_invalid'), 'status');
    s.status = body.status;
    if (body.status === 'open') s.final = null;
  }
  const e = { ...s.edits };
  if ('title' in body) {
    const title = String(body.title ?? '').trim();
    if (!title) throw new SampleError(400, t('errors.title_required'), 'title');
    e.title = title.slice(0, 120);
  }
  for (const k of ['description', 'location']) if (k in body) e[k] = String(body[k] ?? '').slice(0, 2000);
  if ('dates' in body && Array.isArray(body.dates)) {
    const dates = [...new Set(body.dates.filter(isValidDateKey))].sort();
    if (!dates.length) throw new SampleError(400, t('errors.dates_required'), 'dates');
    if (dates.length > 92) throw new SampleError(400, t('errors.too_many_dates', { count: 92 }), 'dates');
    e.dates = dates;
  }
  for (const k of ['startMinute', 'endMinute', 'slotMinutes']) if (Number.isFinite(body[k])) e[k] = body[k];
  if ((e.endMinute ?? 17 * H) <= (e.startMinute ?? 9 * H)) throw new SampleError(400, t('errors.end_before_start'), 'endMinute');
  if ('durationMinutes' in body) e.durationMinutes = Number.isFinite(body.durationMinutes) ? body.durationMinutes : null;
  if ('closesOn' in body) e.closesOn = body.closesOn || null;
  if (body.resultsVisibility === 'everyone' || body.resultsVisibility === 'organizer') e.resultsVisibility = body.resultsVisibility;
  if (typeof body.allowEdits === 'boolean') e.allowEdits = body.allowEdits;
  s.edits = e;
}

function randomKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_');
}

/** Answers like the API for the sample poll. Throws errors with .status and .field. */
export async function sampleApi(method, path, { body, token } = {}) {
  const rest = path.slice(`/api/polls/${SAMPLE_ID}`.length).split('?')[0];
  const s = state();
  const organizer = () => { if (token !== SAMPLE_KEY) throw new SampleError(403, t('sample.notFound')); };
  const mineByToken = () => {
    if (!s.mine || token !== s.mine.key) throw new SampleError(404, t('sample.notFound'));
    return s.mine;
  };
  const open = () => { if (s.status !== 'open') throw new SampleError(409, t('errors.poll_closed')); };
  const publicPart = ({ key, ...rest }) => ({ ...rest, hasPassword: false });

  if (method === 'GET' && (rest === '' || rest === '/')) return { poll: poll(s) };
  if (method === 'GET' && rest === '/manage') { organizer(); return { poll: poll(s, { organizer: true }) }; }
  if (method === 'PATCH' && rest === '') {
    organizer();
    applyPatch(s, body);
    save(s);
    return { poll: poll(s, { organizer: true }) };
  }
  if (method === 'DELETE' && rest === '') {
    organizer();
    memory = null;
    try { localStorage.removeItem(KEY); } catch { /* nothing stored */ }
    return null;
  }
  if (method === 'GET' && rest === '/my-response') return { response: publicPart(mineByToken()) };
  if (method === 'POST' && rest === '/responses') {
    open();
    const answer = checkAnswer(body, poll(s).slots);
    const now = Date.now();
    s.mine = { id: 'sampleyou', ...answer, answered: null, createdAt: now, updatedAt: now, key: randomKey() };
    save(s);
    return { response: publicPart(s.mine), editToken: s.mine.key };
  }
  const responseId = rest.match(/^\/responses\/([^/]+)$/)?.[1];
  if (responseId && method === 'PUT' && responseId === s.mine?.id) {
    const mine = mineByToken();
    open();
    if (!poll(s).allowEdits) throw new SampleError(403, t('sample.unavailable'));
    Object.assign(mine, checkAnswer(body, poll(s).slots), { updatedAt: Date.now() });
    save(s);
    return { response: publicPart(mine) };
  }
  if (responseId && method === 'DELETE') {
    if (token === SAMPLE_KEY) {
      if (responseId === s.mine?.id) s.mine = null;
      else if (/^sample\d$/.test(responseId)) s.removed = [...new Set([...s.removed, responseId])];
      else throw new SampleError(404, t('sample.notFound'));
    } else {
      mineByToken();
      s.mine = null;
    }
    save(s);
    return null;
  }
  throw unavailable();
}

/** A sample poll's calendar invite is built here too, since the server doesn't know it. */
export async function sampleInvite(pollData) {
  const { buildInvite } = await import('/shared/ics.js');
  return buildInvite({ poll: pollData, guestUrl: `${location.origin}/p/${SAMPLE_ID}` });
}
