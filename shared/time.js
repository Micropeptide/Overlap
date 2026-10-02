// Time zone helpers built only on Intl, shared by the server and the browser.
//
// Vocabulary used throughout Overlap:
//   - a "date key" is a calendar date string, "2026-10-07"
//   - a "minute of day" is minutes after local midnight, 0..1440
//   - a "slot" is a UTC instant in epoch milliseconds marking the start of a
//     bookable block. Slots are what responses store, so they mean the same
//     moment no matter which time zone someone views them in.

const formatterCache = new Map();

function partsFormatter(timeZone) {
  let f = formatterCache.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatterCache.set(timeZone, f);
  }
  return f;
}

export function isValidTimeZone(timeZone) {
  if (typeof timeZone !== 'string' || !timeZone || timeZone.length > 64) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** Wall-clock fields of an instant as seen in a time zone. */
export function wallClock(ms, timeZone) {
  const out = {};
  for (const p of partsFormatter(timeZone).formatToParts(new Date(ms))) {
    if (p.type !== 'literal') out[p.type] = Number(p.value);
  }
  if (out.hour === 24) out.hour = 0; // some engines report midnight as 24
  return {
    year: out.year,
    month: out.month,
    day: out.day,
    hour: out.hour,
    minute: out.minute,
    second: out.second,
    dateKey: toDateKey(out.year, out.month, out.day),
    minuteOfDay: out.hour * 60 + out.minute,
  };
}

/** Offset of the zone from UTC at an instant, in minutes (New York in summer = -240). */
export function offsetMinutes(ms, timeZone) {
  const w = wallClock(ms, timeZone);
  const asUtc = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second);
  const truncated = Math.floor(ms / 1000) * 1000;
  return Math.round((asUtc - truncated) / 60000);
}

/**
 * Convert a wall-clock time in a zone to a UTC instant.
 * Returns null when the time does not exist (skipped by a daylight saving jump).
 * When the time happens twice (clocks fall back) the earlier instant is returned.
 */
export function zonedTimeToUtc(dateKey, minuteOfDay, timeZone) {
  const { year, month, day } = parseDateKey(dateKey);
  const naive = Date.UTC(year, month - 1, day, 0, minuteOfDay);
  const offsets = new Set([
    offsetMinutes(naive - 36 * 3600e3, timeZone),
    offsetMinutes(naive, timeZone),
    offsetMinutes(naive + 36 * 3600e3, timeZone),
  ]);
  const target = wallClock(naive, 'UTC');
  const matches = [];
  for (const off of offsets) {
    const candidate = naive - off * 60000;
    const w = wallClock(candidate, timeZone);
    if (w.dateKey === target.dateKey && w.minuteOfDay === target.minuteOfDay) matches.push(candidate);
  }
  if (!matches.length) return null;
  return Math.min(...matches);
}

export function toDateKey(year, month, day) {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function parseDateKey(dateKey) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!m) throw new Error(`Invalid date: ${dateKey}`);
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

export function isValidDateKey(dateKey) {
  if (typeof dateKey !== 'string') return false;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!m) return false;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.getUTCFullYear() === Number(m[1]) && d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3]);
}

export function addDays(dateKey, n) {
  const { year, month, day } = parseDateKey(dateKey);
  const d = new Date(Date.UTC(year, month - 1, day + n));
  return toDateKey(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/** 0 = Sunday … 6 = Saturday */
export function weekdayOf(dateKey) {
  const { year, month, day } = parseDateKey(dateKey);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function todayIn(timeZone) {
  return wallClock(Date.now(), timeZone).dateKey;
}

/**
 * Every slot of a poll, as sorted UTC instants. Slots are laid out on the
 * organizer's wall clock: "9:00 to 17:00 in Europe/London" means 9:00 local on
 * every chosen date, even across a daylight saving change. Times skipped by a
 * spring-forward jump are left out; a repeated fall-back hour is offered once.
 */
export function pollSlots({ dates, startMinute, endMinute, slotMinutes, timezone }) {
  const seen = new Set();
  for (const dateKey of dates) {
    const { year, month, day } = parseDateKey(dateKey);
    const first = Date.UTC(year, month - 1, day, 0, startMinute);
    const last = Date.UTC(year, month - 1, day, 0, endMinute);
    // Fast path: if the zone's offset is the same well before, during and well
    // after the day's range, no clock change is near and every slot shares that
    // offset. Only days near a change take the exact (slower) route.
    const off = offsetMinutes(first, timezone);
    const steady = off === offsetMinutes(first - 36 * 3600e3, timezone)
      && off === offsetMinutes(last, timezone)
      && off === offsetMinutes(last + 36 * 3600e3, timezone);
    for (let m = startMinute; m + slotMinutes <= endMinute; m += slotMinutes) {
      const t = steady ? Date.UTC(year, month - 1, day, 0, m) - off * 60000 : zonedTimeToUtc(dateKey, m, timezone);
      if (t !== null) seen.add(t);
    }
  }
  return [...seen].sort((a, b) => a - b);
}

/**
 * Arrange slots for display in the viewer's time zone. Columns are the
 * viewer's local dates that contain at least one slot; rows are the local
 * times of day. A slot that lands on a repeated local time (the viewer's own
 * fall-back hour) gets its own row so no two slots ever share a cell.
 */
export function layoutSlots(slots, timeZone) {
  const cells = [];
  const columnKeys = new Set();
  const occurrence = new Map();
  for (const slot of slots) {
    const w = wallClock(slot, timeZone);
    const k = `${w.dateKey}|${w.minuteOfDay}`;
    const occ = occurrence.get(k) || 0;
    occurrence.set(k, occ + 1);
    columnKeys.add(w.dateKey);
    cells.push({ slot, dateKey: w.dateKey, minuteOfDay: w.minuteOfDay, occ, rowKey: `${w.minuteOfDay}:${occ}` });
  }
  const columns = [...columnKeys].sort();
  const rowMap = new Map();
  for (const c of cells) {
    if (!rowMap.has(c.rowKey)) rowMap.set(c.rowKey, { key: c.rowKey, minuteOfDay: c.minuteOfDay, occ: c.occ, sample: c.slot });
  }
  const rows = orderRows([...rowMap.values()], cells);
  const byCell = new Map();
  for (const c of cells) byCell.set(`${c.dateKey}|${c.rowKey}`, c);
  return { columns, rows, cells, byCell };
}

/**
 * Order rows so that, within every column, rows run in real time order. Usually
 * that is just clock order, but on a viewer's own fall-back day 1:00, 1:30,
 * 1:00 (again), 1:30 (again) must stay in that order rather than 1:00, 1:00, ….
 * A topological sort over "comes right after, in some column", with clock order
 * breaking ties; if columns ever disagree, fall back to plain clock order.
 */
function orderRows(rows, cells) {
  const byClock = (a, b) => a.minuteOfDay - b.minuteOfDay || a.occ - b.occ;
  const next = new Map(rows.map((r) => [r.key, new Set()]));
  const indegree = new Map(rows.map((r) => [r.key, 0]));
  const lastInColumn = new Map();
  for (const c of cells) { // cells arrive in time order
    const prev = lastInColumn.get(c.dateKey);
    if (prev && prev !== c.rowKey && !next.get(prev).has(c.rowKey)) {
      next.get(prev).add(c.rowKey);
      indegree.set(c.rowKey, indegree.get(c.rowKey) + 1);
    }
    lastInColumn.set(c.dateKey, c.rowKey);
  }
  const byKey = new Map(rows.map((r) => [r.key, r]));
  const ready = rows.filter((r) => indegree.get(r.key) === 0);
  const out = [];
  while (ready.length) {
    ready.sort(byClock);
    const r = ready.shift();
    out.push(r);
    for (const k of next.get(r.key)) {
      indegree.set(k, indegree.get(k) - 1);
      if (indegree.get(k) === 0) ready.push(byKey.get(k));
    }
  }
  return out.length === rows.length ? out : [...rows].sort(byClock);
}

/** Human time zone label: "New York (EDT, UTC−4)". */
export function describeTimeZone(timeZone, atMs = Date.now(), locale) {
  const city = timeZone.split('/').pop().replace(/_/g, ' ');
  let abbr = '';
  try {
    abbr = new Intl.DateTimeFormat(locale || 'en-US', { timeZone, timeZoneName: 'short' })
      .formatToParts(new Date(atMs))
      .find((p) => p.type === 'timeZoneName')?.value || '';
  } catch { /* ignore */ }
  const off = offsetMinutes(atMs, timeZone);
  const sign = off < 0 ? '−' : '+';
  const abs = Math.abs(off);
  const utc = `UTC${sign}${Math.floor(abs / 60)}${abs % 60 ? ':' + String(abs % 60).padStart(2, '0') : ''}`;
  const parts = [abbr, utc].filter((v, i, a) => v && a.indexOf(v) === i && !(i === 0 && /^GMT[+-]/.test(v)));
  return `${timeZone === 'UTC' ? 'UTC' : city} (${parts.join(', ')})`;
}

// ---------- weekly polls ----------
//
// A weekly poll ("Mondays and Wednesdays, 9 to 5") has no real dates. We pin
// the chosen weekdays to one reference week, Monday to Sunday, so every slot is
// still a real UTC instant and the rest of Overlap works unchanged. The week is
// picked near the poll's creation, so conversions to other time zones use the
// offsets people are living with now, and it is a week with no daylight saving
// change in the organizer's zone, so every day has the same hours.

export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Monday first

/** The Monday on or before a date. */
export function mondayOf(dateKey) {
  return addDays(dateKey, -((weekdayOf(dateKey) + 6) % 7));
}

/** Monday of the first week, from `fromDateKey` on, with no DST change in `timeZone`. */
export function referenceMonday(timeZone, fromDateKey) {
  let monday = mondayOf(fromDateKey);
  for (let i = 0; i < 8; i++, monday = addDays(monday, 7)) {
    const start = dayStartUtc(monday, timeZone);
    const end = dayStartUtc(addDays(monday, 7), timeZone);
    if (offsetMinutes(start, timeZone) === offsetMinutes(end, timeZone)) {
      return monday;
    }
  }
  return mondayOf(fromDateKey);
}

/** The reference-week dates for a set of weekdays (0 = Sunday … 6 = Saturday). */
export function weeklyDates(monday, weekdays) {
  return WEEK_ORDER.filter((d) => weekdays.includes(d)).map((d) => addDays(monday, (d + 6) % 7));
}

/**
 * The first moment of a calendar day in a zone. Usually midnight, but in zones
 * whose clocks jump forward at midnight (e.g. America/Santiago, Asia/Beirut)
 * that day starts at 01:00.
 */
export function dayStartUtc(dateKey, timeZone) {
  for (let m = 0; m <= 180; m += 15) {
    const t = zonedTimeToUtc(dateKey, m, timeZone);
    if (t !== null) return t;
  }
  const { year, month, day } = parseDateKey(dateKey);
  return Date.UTC(year, month - 1, day);
}

/** The IANA name Intl uses for a zone ("america/new_york" -> "America/New_York"), or null. */
export function canonicalTimeZone(timeZone) {
  if (!isValidTimeZone(timeZone)) return null;
  const name = new Intl.DateTimeFormat('en-US', { timeZone }).resolvedOptions().timeZone;
  // Bare offsets like "+05:00" aren't places and can't carry daylight saving rules.
  return /^[+-]\d/.test(name) ? null : name;
}
