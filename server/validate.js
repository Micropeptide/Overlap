// Input validation. Every error names the field and says how to fix it.

import { isValidDateKey, canonicalTimeZone, pollSlots, referenceMonday, weeklyDates, mondayOf, todayIn, addDays } from '../shared/time.js';

export class HttpError extends Error {
  constructor(status, message, field) {
    super(message);
    this.status = status;
    this.field = field;
  }
}

const bad = (message, field) => new HttpError(400, message, field);

export const LIMITS = {
  title: 120,
  description: 1000,
  location: 300,
  note: 200,
  name: 40,
  dates: 60,
  slots: 2000,
  responses: 200,
};

const SLOT_SIZES = [15, 30, 60];

/** Dates must fall in a sensible window: a year back, three years ahead. */
function dateInWindow(d) {
  const today = todayIn('UTC');
  return d >= addDays(today, -366) && d <= addDays(today, 3 * 366);
}
const VISIBILITY = ['everyone', 'organizer'];

function cleanText(value, field, max, { required = false } = {}) {
  if (value == null) value = '';
  if (typeof value !== 'string') throw bad(`${field} must be text.`, field);
  const v = value
    .replace(/\r\n?/g, '\n') // carriage returns would let text break out of calendar invite lines
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '') // control characters except tab and newline
    .replace(/[\u202a-\u202e\u2066-\u2069]/g, '') // bidi overrides that make text display misleadingly
    .trim();
  if (required && !v) throw bad(`Add a ${field}.`, field);
  if (v.length > max) throw bad(`Keep the ${field} under ${max} characters.`, field);
  return v;
}

function int(value, field) {
  if (!Number.isInteger(value)) throw bad(`${field} must be a whole number.`, field);
  return value;
}

/**
 * Validate a full poll (on create) or a set of changes (on edit, partial = true).
 * Returns only the recognised, normalised fields.
 */
export function validatePollFields(body, current = null) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw bad('Send the poll as a JSON object.');
  const partial = !!current;
  const out = {};
  const has = (k) => Object.prototype.hasOwnProperty.call(body, k);

  if (!partial || has('title')) out.title = cleanText(body.title, 'title', LIMITS.title, { required: true });
  if (!partial || has('description')) out.description = cleanText(body.description, 'description', LIMITS.description);
  if (!partial || has('location')) out.location = cleanText(body.location, 'location', LIMITS.location).replace(/\s*\n\s*/g, ' ');
  if (!partial || has('closesOn')) {
    const c = body.closesOn;
    if (c == null || c === '') out.closesOn = null;
    else if (!isValidDateKey(c) || !dateInWindow(c)) throw bad('Choose a valid closing date within the next three years.', 'closesOn');
    else {
      // A new closing date must not have passed (an unchanged one may have).
      const tz = canonicalTimeZone(body.timezone) || current?.timezone || 'UTC';
      if (c !== current?.closesOn && c < todayIn(tz)) throw bad('That closing date has already passed. Pick today or later.', 'closesOn');
      out.closesOn = c;
    }
  }

  if (!partial || has('timezone')) {
    const tz = canonicalTimeZone(body.timezone);
    if (!tz) throw bad('Choose a valid time zone, such as Europe/London.', 'timezone');
    out.timezone = tz;
  }

  // An existing poll may switch between dates and days of the week; it then
  // needs the new dates or weekdays, as a new poll would.
  const switching = partial && has('kind') && body.kind !== current.kind;
  const kind = switching ? body.kind : current ? current.kind : (body.kind ?? 'dates');
  if (!['dates', 'weekly'].includes(kind)) throw bad('Choose specific dates or days of the week.', 'kind');
  if (!partial || switching) out.kind = kind;
  const fresh = !partial || switching; // dates/weekdays must be sent

  if (kind === 'weekly') {
    if (has('dates')) throw bad('This is a weekly poll. Send "weekdays" instead of "dates".', 'weekdays');
    const zoneChanged = partial && out.timezone && out.timezone !== current.timezone;
    if (fresh || has('weekdays') || zoneChanged) {
      const days = has('weekdays') || fresh ? body.weekdays : current.weekdays;
      if (!Array.isArray(days) || !days.length) throw bad('Pick at least one day of the week.', 'weekdays');
      if (!days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)) throw bad('Days of the week must be numbers from 0 (Sunday) to 6 (Saturday).', 'weekdays');
      const tz = out.timezone || current?.timezone;
      // Keep an existing poll on its reference week so existing answers keep their
      // meaning, unless the zone changed: then pick a week with no clock change there.
      const monday = !current || switching ? referenceMonday(tz, todayIn(tz))
        : zoneChanged ? referenceMonday(tz, mondayOf(current.dates[0])) : mondayOf(current.dates[0]);
      out.dates = weeklyDates(monday, [...new Set(days)]);
    }
  } else if (has('weekdays')) {
    throw bad('This poll uses specific dates. Send "dates" instead of "weekdays".', 'dates');
  }
  if (kind === 'dates' && (fresh || has('dates'))) {
    if (!Array.isArray(body.dates) || body.dates.length === 0) throw bad('Pick at least one date.', 'dates');
    const unique = [...new Set(body.dates)];
    if (unique.length > LIMITS.dates) throw bad(`Pick ${LIMITS.dates} dates or fewer.`, 'dates');
    for (const d of unique) if (!isValidDateKey(d)) throw bad(`"${String(d).slice(0, 20)}" is not a valid date.`, 'dates');
    for (const d of unique) if (!dateInWindow(d)) throw bad('Pick dates within the next three years.', 'dates');
    if (!partial && unique.every((d) => d < addDays(todayIn(out.timezone), -1))) throw bad('All of those dates have passed. Pick at least one upcoming date.', 'dates');
    out.dates = unique.sort();
  }

  if (!partial || has('slotMinutes')) {
    const s = partial ? body.slotMinutes : body.slotMinutes ?? 30;
    if (!SLOT_SIZES.includes(s)) throw bad('Time steps must be 15, 30 or 60 minutes.', 'slotMinutes');
    out.slotMinutes = s;
  }

  if (!partial || has('startMinute') || has('endMinute')) {
    const start = int(body.startMinute ?? current?.startMinute, 'startMinute');
    const end = int(body.endMinute ?? current?.endMinute, 'endMinute');
    if (start < 0 || end > 1440 || start >= end) throw bad('The end time must be after the start time.', 'endMinute');
    out.startMinute = start;
    out.endMinute = end;
  }

  if (!partial || has('durationMinutes')) {
    const d = body.durationMinutes;
    if (d == null || d === 0) out.durationMinutes = null;
    else if (!Number.isInteger(d) || d < 15 || d > 720) throw bad('Meeting length must be between 15 minutes and 12 hours.', 'durationMinutes');
    else out.durationMinutes = d;
  }

  if (!partial || has('allowEdits')) {
    const v = partial ? body.allowEdits : body.allowEdits ?? true;
    if (typeof v !== 'boolean') throw bad('Say whether guests can change their answers (true or false).', 'allowEdits');
    out.allowEdits = v;
  }
  if (!partial || has('resultsVisibility')) {
    const v = partial ? body.resultsVisibility : body.resultsVisibility ?? 'everyone';
    if (!VISIBILITY.includes(v)) throw bad('Choose who can see responses.', 'resultsVisibility');
    out.resultsVisibility = v;
  }

  // Cross-field checks on the combined result.
  const merged = { ...(current || {}), ...out };
  if ((merged.startMinute % merged.slotMinutes) || (merged.endMinute % merged.slotMinutes)) {
    throw bad(`Start and end times must line up with ${merged.slotMinutes}-minute steps.`, 'startMinute');
  }
  if (merged.endMinute - merged.startMinute < merged.slotMinutes) {
    throw bad('The time range is shorter than one time step.', 'endMinute');
  }
  if (merged.durationMinutes && merged.durationMinutes > merged.endMinute - merged.startMinute) {
    throw bad('The meeting is longer than the time range. Widen the times or shorten the meeting.', 'durationMinutes');
  }
  const count = (merged.endMinute - merged.startMinute) / merged.slotMinutes * merged.dates.length;
  if (count > LIMITS.slots) throw bad('That is too many times to choose from. Pick fewer dates or a shorter range.', 'dates');
  if (pollSlots(merged).length === 0) throw bad('None of those times exist in that time zone.', 'dates');
  return out;
}

/** Validate a guest response against the poll's current slots. */
export function validateResponse(body, poll) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw bad('Send the response as a JSON object.');
  const name = cleanText(body.name, 'name', LIMITS.name, { required: true });
  if (!name.replace(/[\p{Default_Ignorable_Code_Point}\s]/gu, '')) throw bad('Add a name people can see.', 'name');
  const valid = new Set(poll.slots);
  const pick = (arr, field) => {
    if (arr == null) return [];
    if (!Array.isArray(arr) || arr.length > poll.slots.length) throw bad(`${field} must be a list of times.`, field);
    const out = new Set();
    for (const v of arr) {
      if (!Number.isInteger(v)) throw bad(`${field} must be a list of times.`, field);
      if (valid.has(v)) out.add(v); // quietly ignore times that are no longer offered
    }
    return [...out].sort((a, b) => a - b);
  };
  // Each time has one state. If a time is sent in several lists, the
  // strongest wins: preferred, then available, then if needed.
  const preferred = pick(body.preferred, 'preferred');
  const pref = new Set(preferred);
  const available = pick(body.available, 'available').filter((s) => !pref.has(s));
  const yes = new Set(available);
  const ifNeeded = pick(body.ifNeeded, 'ifNeeded').filter((s) => !yes.has(s) && !pref.has(s));
  const note = cleanText(body.note, 'note', LIMITS.note).replace(/\s*\n\s*/g, ' ');
  return { name, available, ifNeeded, preferred, note };
}

/** A final time must start on one of the poll's times and last 5 minutes to 24 hours. */
export function validateFinal(body, slots) {
  if (body === null) return null;
  if (!body || typeof body !== 'object') throw bad('Choose a start and end time.', 'final');
  const { start, end } = body;
  if (!Number.isInteger(start) || !Number.isInteger(end) || end <= start) throw bad('The final time must end after it starts.', 'final');
  if (end - start > 24 * 3600e3) throw bad('The final time can be at most 24 hours long.', 'final');
  if ((end - start) % 300e3) throw bad('The final time’s length must be a whole number of 5-minute steps.', 'final');
  if (!slots.includes(start)) throw bad('The final time must start at one of the poll’s times.', 'final');
  return { start, end };
}
