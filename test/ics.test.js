import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildInvite, escapeText, fold } from '../server/ics.js';

test('escapes special characters in calendar text', () => {
  assert.equal(escapeText('Lunch; bring snacks, maybe\\drinks\nRoom 2'), 'Lunch\\; bring snacks\\, maybe\\\\drinks\\nRoom 2');
});

test('folds long lines at 75 octets without splitting characters', () => {
  const line = `SUMMARY:${'Planungsbesprechung für das Frühjahr '.repeat(4)}`;
  const folded = fold(line).split('\r\n');
  assert.ok(folded.length > 1);
  for (const part of folded) assert.ok(Buffer.byteLength(part, 'utf8') <= 75);
  assert.equal(folded.map((p, i) => (i ? p.slice(1) : p)).join(''), line);
});

test('builds a valid single-event invite in UTC', () => {
  const ics = buildInvite({
    poll: { id: 'abc', title: 'Book club', description: '', final: { start: Date.parse('2027-03-03T15:00:00Z'), end: Date.parse('2027-03-03T16:00:00Z') } },
    guestUrl: 'https://overlap.example/p/abc',
    now: Date.parse('2027-01-01T00:00:00Z'),
  });
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /\r\nDTSTART:20270303T150000Z\r\n/);
  assert.match(ics, /\r\nDTEND:20270303T160000Z\r\n/);
  assert.match(ics, /\r\nDTSTAMP:20270101T000000Z\r\n/);
  assert.match(ics, /END:VCALENDAR\r\n$/);
});

test('a weekly final time becomes a repeating event in the organizer zone', () => {
  // Monday 10:00–11:00 New York in the reference week (EDT), downloaded on Thursday 29 October 2026.
  const start = Date.parse('2026-10-05T14:00:00Z');
  const ics = buildInvite({
    poll: { id: 'wk', kind: 'weekly', title: 'Standup', description: '', timezone: 'America/New_York', final: { start, end: start + 3600e3 } },
    guestUrl: '',
    now: Date.parse('2026-10-29T15:00:00Z'),
  });
  // Next Monday is 2 November, after the clocks change; it is still 10:00 local.
  assert.match(ics, /\r\nDTSTART;TZID=America\/New_York:20261102T100000\r\n/);
  assert.match(ics, /\r\nDTEND;TZID=America\/New_York:20261102T110000\r\n/);
  assert.match(ics, /\r\nRRULE:FREQ=WEEKLY\r\n/);
});

test('a weekly invite keeps its length when the next occurrence lands on a clock change', () => {
  // Sunday 2:30–3:30 New York, downloaded the Wednesday before clocks spring forward.
  const start = Date.parse('2026-10-04T06:30:00Z'); // Sunday 4 Oct 2026, 2:30 EDT
  const ics = buildInvite({
    poll: { id: 'wk', kind: 'weekly', title: 'Early', description: '', timezone: 'America/New_York', final: { start, end: start + 3600e3 } },
    guestUrl: '',
    now: Date.parse('2027-03-10T15:00:00Z'),
  });
  assert.match(ics, /DTSTART;TZID=America\/New_York:20270314T023000\r\n/);
  assert.match(ics, /DTEND;TZID=America\/New_York:20270314T033000\r\n/);
  assert.match(ics, /BEGIN:VTIMEZONE\r\nTZID:America\/New_York/);
});
