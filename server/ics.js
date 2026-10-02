// A minimal RFC 5545 calendar file for the final time: a single event in UTC for
// date polls, or an event repeating every week for weekly polls.

import { wallClock, weekdayOf, addDays, offsetMinutes } from '../shared/time.js';

const stamp = (ms) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

export function escapeText(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r\n|\r|\n/g, '\\n');
}

/** Fold lines longer than 75 octets, as the spec requires. */
const utf8Length = (text) => new TextEncoder().encode(text).length;

export function fold(line) {
  if (utf8Length(line) <= 75) return line;
  const out = [];
  let chunk = '';
  let size = 0;
  for (const ch of line) {
    const n = utf8Length(ch);
    if (size + n > (out.length ? 74 : 75)) {
      out.push(chunk);
      chunk = '';
      size = 0;
    }
    chunk += ch;
    size += n;
  }
  out.push(chunk);
  return out.join('\r\n ');
}

const DAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
const fmtOffset = (min) => `${min < 0 ? '-' : '+'}${String(Math.floor(Math.abs(min) / 60)).padStart(2, '0')}${String(Math.abs(min) % 60).padStart(2, '0')}`;

/** Instants in [from, to) where the zone's UTC offset changes, to the minute. */
function transitions(timeZone, from, to) {
  const out = [];
  let prev = offsetMinutes(from, timeZone);
  for (let t = from + 86400e3; t <= to; t += 86400e3) {
    const off = offsetMinutes(t, timeZone);
    if (off === prev) continue;
    let lo = t - 86400e3;
    let hi = t;
    while (hi - lo > 60e3) {
      const mid = lo + Math.floor((hi - lo) / 2 / 60e3) * 60e3 || lo + 60e3;
      if (offsetMinutes(mid, timeZone) === prev) lo = mid; else hi = mid;
    }
    out.push({ at: hi, from: prev, to: off });
    prev = off;
  }
  return out;
}

/**
 * A VTIMEZONE block describing the zone's yearly rules, derived from its
 * transitions the year before the event. Calendar apps need it to place a
 * repeating event correctly when the clocks change.
 */
export function vtimezone(timeZone, eventMs) {
  const year = new Date(eventMs).getUTCFullYear() - 1;
  const changes = transitions(timeZone, Date.UTC(year, 0, 1), Date.UTC(year + 1, 0, 1));
  const name = (ms) => new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'short' }).formatToParts(ms).find((p) => p.type === 'timeZoneName')?.value || '';
  const lines = ['BEGIN:VTIMEZONE', `TZID:${timeZone}`];
  if (!changes.length) {
    const off = offsetMinutes(eventMs, timeZone);
    lines.push('BEGIN:STANDARD', 'DTSTART:19700101T000000', `TZOFFSETFROM:${fmtOffset(off)}`, `TZOFFSETTO:${fmtOffset(off)}`, `TZNAME:${name(eventMs)}`, 'END:STANDARD');
  }
  for (const c of changes) {
    // Onset is written in the local time that was in force just before the change.
    const before = new Date(c.at + c.from * 60e3);
    const local = `${before.getUTCFullYear()}${String(before.getUTCMonth() + 1).padStart(2, '0')}${String(before.getUTCDate()).padStart(2, '0')}T${String(before.getUTCHours()).padStart(2, '0')}${String(before.getUTCMinutes()).padStart(2, '0')}00`;
    const day = before.getUTCDate();
    const daysInMonth = new Date(Date.UTC(before.getUTCFullYear(), before.getUTCMonth() + 1, 0)).getUTCDate();
    const nth = day + 7 > daysInMonth ? -1 : Math.ceil(day / 7);
    const kind = c.to > c.from ? 'DAYLIGHT' : 'STANDARD';
    lines.push(`BEGIN:${kind}`, `DTSTART:${local}`,
      `RRULE:FREQ=YEARLY;BYMONTH=${before.getUTCMonth() + 1};BYDAY=${nth}${DAYS[before.getUTCDay()]}`,
      `TZOFFSETFROM:${fmtOffset(c.from)}`, `TZOFFSETTO:${fmtOffset(c.to)}`, `TZNAME:${name(c.at + 60e3)}`, `END:${kind}`);
  }
  lines.push('END:VTIMEZONE');
  return lines;
}

const localStamp = (dateKey, minuteOfDay) =>
  `${dateKey.replace(/-/g, '')}T${String(Math.floor(minuteOfDay / 60)).padStart(2, '0')}${String(minuteOfDay % 60).padStart(2, '0')}00`;

/**
 * Start and end lines for the event. A one-off time is written in UTC. A weekly
 * time repeats every week at the same wall-clock time in the organizer's zone
 * (so it doesn't drift by an hour when clocks change), starting from its next
 * occurrence. The zone is named by its IANA id, which Google, Apple and Outlook
 * calendars all understand.
 */
function timing(poll, now) {
  const { start, end } = poll.final;
  if (poll.kind !== 'weekly') return [`DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`];
  const tz = poll.timezone;
  const first = wallClock(start, tz);
  let day = wallClock(now, tz).dateKey;
  while (weekdayOf(day) !== weekdayOf(first.dateKey)) day = addDays(day, 1);
  // The end is the same wall-clock offset from the start as in the poll, so a
  // first occurrence that lands on a clock change doesn't stretch every repeat.
  const last = wallClock(end, tz);
  const dayGap = Math.round((Date.parse(last.dateKey) - Date.parse(first.dateKey)) / 86400e3);
  return [
    `DTSTART;TZID=${tz}:${localStamp(day, first.minuteOfDay)}`,
    `DTEND;TZID=${tz}:${localStamp(addDays(day, dayGap), last.minuteOfDay)}`,
    'RRULE:FREQ=WEEKLY',
  ];
}

export function buildInvite({ poll, guestUrl, now = Date.now() }) {
  const description = [poll.description, guestUrl ? `Scheduled with Overlap: ${guestUrl}` : ''].filter(Boolean).join('\n\n');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Overlap//Overlap scheduling//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...(poll.kind === 'weekly' ? vtimezone(poll.timezone, poll.final.start) : []),
    'BEGIN:VEVENT',
    `UID:${poll.id}-${poll.final.start}@overlap`,
    `DTSTAMP:${stamp(now)}`,
    ...timing(poll, now),
    `SUMMARY:${escapeText(poll.title)}`,
    description ? `DESCRIPTION:${escapeText(description)}` : null,
    poll.location ? `LOCATION:${escapeText(poll.location)}` : null,
    guestUrl ? `URL:${guestUrl}` : null,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);
  return lines.map(fold).join('\r\n') + '\r\n';
}
