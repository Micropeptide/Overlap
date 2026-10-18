// The sample poll at /p/example: a team of seven has already answered, so a
// visitor can see what Overlap does before asking anyone. It runs entirely in
// this browser. Nothing is sent to the server; the visitor's own answer is
// kept in localStorage ("overlap.sample") until they delete it.
//
// api() hands every /api/polls/example… request to sampleApi(), which answers
// with the same shapes as the real API.

import { pollSlots, todayIn, addDays, weekdayOf } from '/shared/time.js';
import { t } from './i18n.js';

export const SAMPLE_ID = 'example';
const KEY = 'overlap.sample';
const H = 60;

// Who answered and when they're free, per day (0–4 = the five weekdays shown),
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

/** The stored state: which dates and zone the sample uses, and the visitor's own answer. */
function state() {
  let s = memory || read();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  // A sample whose days have passed starts over, so it always lies ahead.
  if (!s || s.timezone !== timezone || s.dates[0] <= todayIn(timezone)) s = { timezone, dates: upcomingWeekdays(timezone), mine: null };
  memory = s;
  return s;
}

function save(s) { memory = s; write(s); }

function poll() {
  const s = state();
  const base = { dates: s.dates, startMinute: 9 * H, endMinute: 17 * H, slotMinutes: 30, timezone: s.timezone };
  const slots = pollSlots(base);
  const at = (day, minute) => pollSlots({ ...base, dates: [s.dates[day]], startMinute: minute, endMinute: minute + 30 })[0];
  const pick = (ranges = {}) => Object.entries(ranges).flatMap(([day, list]) =>
    list.flatMap(([from, to]) => { const out = []; for (let m = from; m < to; m += 30) out.push(at(Number(day), m)); return out; }));
  const now = Date.now();
  const responses = TEAM.map((p, i) => {
    const preferred = pick(p.preferred);
    return {
      id: `sample${i}`, name: p.name,
      available: pick(p.days).filter((x) => !preferred.includes(x)), ifNeeded: pick(p.ifNeeded), preferred,
      note: '', answered: null, createdAt: now - p.hoursAgo * 3600e3, updatedAt: now - p.hoursAgo * 3600e3,
    };
  });
  if (s.mine) responses.push(publicPart(s.mine));
  return {
    id: SAMPLE_ID, kind: 'dates', title: t('sample.title'), description: t('sample.description'), location: '',
    closesOn: null, closesAt: null, ...base, durationMinutes: null, resultsVisibility: 'everyone', allowEdits: true,
    status: 'open', final: null, slots, createdAt: now - 30 * 3600e3, updatedAt: now,
    hasOrganizerPassword: false, responseCount: responses.length, responses, isOrganizer: false, isSample: true,
  };
}

function publicPart({ key, ...rest }) { return rest; }

class SampleError extends Error {
  constructor(status, message, field) { super(message); this.status = status; this.field = field; }
}

function checkAnswer(body, slots) {
  const name = String(body?.name ?? '').trim();
  if (!name) throw new SampleError(400, t('errors.name_required'), 'name');
  if (name.length > 80) throw new SampleError(400, t('errors.name_too_long', { count: 80 }), 'name');
  const s = state();
  if (TEAM.some((p) => p.name.toLowerCase() === name.toLowerCase()) && s.mine?.name !== name) {
    throw new SampleError(409, t('errors.name_taken_other', { name }), 'name');
  }
  const valid = new Set(slots);
  const list = (v) => [...new Set((Array.isArray(v) ? v : []).filter((x) => valid.has(x)))];
  return { name, available: list(body.available), ifNeeded: list(body.ifNeeded), preferred: list(body.preferred), note: String(body.note || '').slice(0, 500) };
}

function randomKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_');
}

/** Answers like the API for the sample poll. Throws errors with .status and .field. */
export async function sampleApi(method, path, { body, token } = {}) {
  const rest = path.slice(`/api/polls/${SAMPLE_ID}`.length).split('?')[0];
  const s = state();
  const mineByToken = () => {
    if (!s.mine || token !== s.mine.key) throw new SampleError(404, t('sample.notFound'));
    return s.mine;
  };
  if (method === 'GET' && (rest === '' || rest === '/')) return { poll: poll() };
  if (method === 'GET' && rest === '/my-response') return { response: { ...publicPart(mineByToken()), hasPassword: false } };
  if (method === 'POST' && rest === '/responses') {
    const answer = checkAnswer(body, poll().slots);
    const now = Date.now();
    const key = randomKey();
    s.mine = { id: 'sampleyou', ...answer, answered: null, createdAt: now, updatedAt: now, key };
    save(s);
    return { response: { ...publicPart(s.mine), hasPassword: false }, editToken: key };
  }
  if (method === 'PUT' && rest === `/responses/${s.mine?.id}`) {
    const mine = mineByToken();
    Object.assign(mine, checkAnswer(body, poll().slots), { updatedAt: Date.now() });
    save(s);
    return { response: { ...publicPart(mine), hasPassword: false } };
  }
  if (method === 'DELETE' && rest === `/responses/${s.mine?.id}`) {
    mineByToken();
    s.mine = null;
    save(s);
    return null;
  }
  throw new SampleError(400, t('sample.unavailable'));
}
