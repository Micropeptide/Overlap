import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  zonedTimeToUtc, wallClock, pollSlots, layoutSlots, describeTimeZone,
  isValidTimeZone, isValidDateKey, addDays, offsetMinutes, referenceMonday, weeklyDates, mondayOf,
} from '../shared/time.js';

const iso = (ms) => new Date(ms).toISOString();

test('converts organizer wall time to the right UTC instant', () => {
  assert.equal(iso(zonedTimeToUtc('2026-07-01', 9 * 60, 'America/New_York')), '2026-07-01T13:00:00.000Z');
  assert.equal(iso(zonedTimeToUtc('2026-12-01', 9 * 60, 'America/New_York')), '2026-12-01T14:00:00.000Z');
  assert.equal(iso(zonedTimeToUtc('2026-07-01', 9 * 60, 'Asia/Kolkata')), '2026-07-01T03:30:00.000Z');
  assert.equal(iso(zonedTimeToUtc('2026-07-01', 0, 'UTC')), '2026-07-01T00:00:00.000Z');
});

test('a time skipped by spring-forward does not exist', () => {
  // New York jumps from 2:00 to 3:00 on 8 March 2026.
  assert.equal(zonedTimeToUtc('2026-03-08', 2 * 60 + 30, 'America/New_York'), null);
  assert.equal(iso(zonedTimeToUtc('2026-03-08', 3 * 60, 'America/New_York')), '2026-03-08T07:00:00.000Z');
});

test('a repeated fall-back time resolves to the earlier instant', () => {
  // 1:30 happens twice in New York on 1 November 2026: first in EDT (UTC-4).
  assert.equal(iso(zonedTimeToUtc('2026-11-01', 90, 'America/New_York')), '2026-11-01T05:30:00.000Z');
});

test('poll slots follow the organizer wall clock across a DST change', () => {
  const slots = pollSlots({
    dates: ['2026-10-23', '2026-10-26'], // London leaves BST on 25 October
    startMinute: 9 * 60, endMinute: 10 * 60, slotMinutes: 30, timezone: 'Europe/London',
  });
  assert.deepEqual(slots.map(iso), [
    '2026-10-23T08:00:00.000Z', '2026-10-23T08:30:00.000Z',
    '2026-10-26T09:00:00.000Z', '2026-10-26T09:30:00.000Z',
  ]);
});

test('poll slots skip times that do not exist on a spring-forward day', () => {
  const slots = pollSlots({
    dates: ['2026-03-08'], startMinute: 60, endMinute: 4 * 60, slotMinutes: 30, timezone: 'America/New_York',
  });
  assert.deepEqual(slots.map((s) => wallClock(s, 'America/New_York').minuteOfDay), [60, 90, 180, 210]);
});

test('slots are shown in the viewer time zone, including date changes', () => {
  const slots = pollSlots({
    dates: ['2026-10-07'], startMinute: 9 * 60, endMinute: 10 * 60, slotMinutes: 30, timezone: 'America/New_York',
  });
  const tokyo = layoutSlots(slots, 'Asia/Tokyo');
  assert.deepEqual(tokyo.columns, ['2026-10-07']);
  assert.deepEqual(tokyo.rows.map((r) => r.minuteOfDay), [22 * 60, 22 * 60 + 30]);

  const kolkata = layoutSlots(slots, 'Asia/Kolkata');
  assert.deepEqual(kolkata.rows.map((r) => r.minuteOfDay), [18 * 60 + 30, 19 * 60]);

  // A late evening in Los Angeles is the next morning in Sydney.
  const late = pollSlots({
    dates: ['2026-10-07'], startMinute: 22 * 60, endMinute: 24 * 60, slotMinutes: 60, timezone: 'America/Los_Angeles',
  });
  const sydney = layoutSlots(late, 'Australia/Sydney');
  assert.deepEqual(sydney.columns, ['2026-10-08']);
  assert.deepEqual(sydney.rows.map((r) => r.minuteOfDay), [16 * 60, 17 * 60]);
});

test('a viewer fall-back hour never puts two slots in one cell', () => {
  const start = Date.parse('2026-11-01T05:00:00Z'); // 1:00 EDT
  const slots = [0, 1, 2, 3].map((i) => start + i * 30 * 60000); // 1:00, 1:30 EDT, 1:00, 1:30 EST
  const layout = layoutSlots(slots, 'America/New_York');
  assert.equal(layout.cells.length, 4);
  assert.equal(layout.byCell.size, 4);
  assert.equal(layout.rows.length, 4);
});

test('describes time zones with their current offset', () => {
  assert.match(describeTimeZone('Asia/Kolkata', Date.parse('2026-07-01T00:00:00Z')), /^Kolkata \(.*UTC\+5:30\)$/);
  assert.match(describeTimeZone('America/New_York', Date.parse('2026-07-01T00:00:00Z')), /New York \(EDT, UTC−4\)/);
  assert.match(describeTimeZone('America/New_York', Date.parse('2026-12-01T00:00:00Z')), /New York \(EST, UTC−5\)/);
  assert.equal(offsetMinutes(Date.parse('2026-07-01T00:00:00Z'), 'Australia/Adelaide'), 570);
});

test('validates time zones and dates', () => {
  assert.equal(isValidTimeZone('Europe/Berlin'), true);
  assert.equal(isValidTimeZone('Mars/Olympus'), false);
  assert.equal(isValidDateKey('2026-02-29'), false);
  assert.equal(isValidDateKey('2028-02-29'), true);
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
});

test('weekly polls pin weekdays to one Monday-to-Sunday week', () => {
  assert.equal(mondayOf('2026-10-07'), '2026-10-05'); // Wednesday -> Monday
  assert.equal(mondayOf('2026-10-11'), '2026-10-05'); // Sunday belongs to the week before
  assert.deepEqual(weeklyDates('2026-10-05', [0, 1, 3]), ['2026-10-05', '2026-10-07', '2026-10-11']);
});

test('the reference week avoids a daylight saving change in the organizer zone', () => {
  // London changes clocks on Sunday 25 October 2026, inside the week of 19 October.
  assert.equal(referenceMonday('Europe/London', '2026-10-21'), '2026-10-26');
  assert.equal(referenceMonday('Europe/London', '2026-10-07'), '2026-10-05');
  // Zones without DST keep the current week.
  assert.equal(referenceMonday('Asia/Tokyo', '2026-10-21'), '2026-10-19');
});

test('rows stay in real time order on the viewer’s fall-back day', () => {
  // 04:00–08:00 UTC on 1 November 2026 is 0:00–3:00 in New York, where 1:00–2:00 happens twice.
  const slots = pollSlots({ dates: ['2026-11-01'], startMinute: 240, endMinute: 480, slotMinutes: 30, timezone: 'UTC' });
  const layout = layoutSlots(slots, 'America/New_York');
  const order = layout.rows.map((r) => layout.byCell.get(`2026-11-01|${r.key}`).slot);
  assert.deepEqual(order, [...order].sort((a, b) => a - b));
  assert.deepEqual(layout.rows.map((r) => r.key), ['0:0', '30:0', '60:0', '90:0', '60:1', '90:1', '120:0', '150:0']);
});

test('fast slot generation matches the exact method in every zone around clock changes', () => {
  const exact = ({ dates, startMinute, endMinute, slotMinutes, timezone }) => {
    const out = new Set();
    for (const d of dates) for (let m = startMinute; m + slotMinutes <= endMinute; m += slotMinutes) {
      const t = zonedTimeToUtc(d, m, timezone);
      if (t !== null) out.add(t);
    }
    return [...out].sort((a, b) => a - b);
  };
  let zones = [];
  try { zones = Intl.supportedValuesOf('timeZone'); } catch { zones = ['America/New_York', 'Europe/London', 'Australia/Lord_Howe']; }
  // Dates around the common change weekends, plus whole-day ranges.
  const dates = ['2027-03-12', '2027-03-13', '2027-03-14', '2027-03-15', '2027-03-27', '2027-03-28', '2027-03-29',
    '2027-04-03', '2027-04-04', '2027-09-05', '2027-09-26', '2027-10-03', '2027-10-30', '2027-10-31', '2027-11-07'];
  for (const timezone of zones) {
    for (const [startMinute, endMinute, slotMinutes] of [[0, 1440, 15], [540, 1020, 30]]) {
      const cfg = { dates, startMinute, endMinute, slotMinutes, timezone };
      assert.deepEqual(pollSlots(cfg), exact(cfg), timezone);
    }
  }
});
