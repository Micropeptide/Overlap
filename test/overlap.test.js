import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rankWindows, tallySlots } from '../shared/overlap.js';

const T0 = Date.parse('2026-10-07T13:00:00Z');
const slot = (i) => T0 + i * 30 * 60000;
const slots = [0, 1, 2, 3, 4, 5].map(slot); // 9:00–12:00 New York, 30-minute steps

test('finds the time everyone can make before partial matches', () => {
  const responses = [
    { id: 'a', name: 'Ana', available: [slot(0), slot(1), slot(2), slot(3)] },
    { id: 'b', name: 'Ben', available: [slot(2), slot(3), slot(4)] },
    { id: 'c', name: 'Cy', available: [slot(1), slot(2), slot(3), slot(5)] },
  ];
  const r = rankWindows({ slots, slotMinutes: 30, responses });
  assert.equal(r.total, 3);
  assert.equal(r.everyone.length, 1);
  assert.equal(r.everyone[0].start, slot(2));
  assert.equal(r.everyone[0].end, slot(4));
  assert.deepEqual(r.everyone[0].yes, ['a', 'b', 'c']);
  assert.ok(r.partial.length > 0);
  assert.ok(r.partial.every((w) => w.count < 3));
});

test('"if needed" counts toward attendance but ranks below a clean yes', () => {
  const responses = [
    { id: 'a', name: 'Ana', available: [slot(0), slot(4)] },
    { id: 'b', name: 'Ben', available: [slot(4)], ifNeeded: [slot(0)] },
  ];
  const r = rankWindows({ slots, slotMinutes: 30, responses });
  assert.equal(r.everyone.length, 2);
  assert.equal(r.everyone[0].start, slot(4)); // both say yes
  assert.deepEqual(r.everyone[1].maybe, ['b']); // Ben only if needed
});

test('a meeting length requires the whole block to be free', () => {
  const responses = [
    { id: 'a', name: 'Ana', available: [slot(0), slot(1), slot(3), slot(4), slot(5)] },
    { id: 'b', name: 'Ben', available: [slot(0), slot(3), slot(4), slot(5)] },
  ];
  const r = rankWindows({ slots, slotMinutes: 30, durationMinutes: 60, responses });
  // 9:00–10:00 fails for Ben (no 9:30); 10:30–12:00 fits a one-hour meeting.
  assert.equal(r.everyone.length, 1);
  assert.equal(r.everyone[0].start, slot(3));
  assert.equal(r.everyone[0].end, slot(6));
  assert.equal(r.need, 2);
});

test('blocks never span a gap between days', () => {
  const split = [slot(0), slot(1), slot(0) + 24 * 3600e3];
  const responses = [{ id: 'a', name: 'Ana', available: split }];
  const r = rankWindows({ slots: split, slotMinutes: 30, durationMinutes: 60, responses });
  assert.equal(r.everyone.length, 1);
  assert.equal(r.everyone[0].start, slot(0));
});

test('times added after someone answered are unanswered, not unavailable', () => {
  const responses = [
    { id: 'a', name: 'Ana', available: [slot(0)], answered: [slot(0), slot(1)] },
  ];
  const tally = tallySlots(slots, responses);
  assert.deepEqual(tally.get(slot(0)).yes, ['a']);
  assert.deepEqual(tally.get(slot(1)).no, ['a']);
  assert.deepEqual(tally.get(slot(2)).unanswered, ['a']);
});

test('no responses means nothing to rank', () => {
  const r = rankWindows({ slots, slotMinutes: 30, responses: [] });
  assert.deepEqual(r.everyone, []);
  assert.deepEqual(r.partial, []);
});

test('preferred times count as available and break ties', () => {
  const responses = [
    { id: 'a', name: 'Ana', available: [slot(0)], preferred: [slot(4)] },
    { id: 'b', name: 'Ben', available: [slot(0), slot(4)] },
  ];
  const r = rankWindows({ slots, slotMinutes: 30, responses });
  assert.equal(r.everyone.length, 2);
  assert.equal(r.everyone[0].start, slot(4)); // same attendance, but Ana prefers it
  assert.deepEqual(r.everyone[0].pref, ['a']);
  const tally = tallySlots(slots, responses);
  assert.deepEqual(tally.get(slot(4)).yes, ['a', 'b']);
  assert.deepEqual(tally.get(slot(4)).pref, ['a']);
});

test('partial matches that only repeat a better option are left out', () => {
  // Ana 9:00–12:00, Ben 9:30–10:30, a one-hour meeting, and Cy who can't come.
  const responses = [
    { id: 'a', name: 'Ana', available: slots.slice(0, 6) },
    { id: 'b', name: 'Ben', available: [slot(1), slot(2)] },
    { id: 'c', name: 'Cy', available: [] },
  ];
  const r = rankWindows({ slots, slotMinutes: 30, durationMinutes: 60, responses });
  assert.equal(r.partial[0].start, slot(1));
  assert.deepEqual(r.partial[0].yes, ['a', 'b']);
  // Ana-only windows overlapping 9:30–10:30 add nothing; only the non-overlapping one remains.
  for (const w of r.partial.slice(1)) assert.ok(w.start >= slot(3) || w.end <= slot(1));
});
