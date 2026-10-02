import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { openStore } from '../server/store.js';
import { createApp } from '../server/app.js';

let server;
let base;
let store;

before(async () => {
  store = openStore(':memory:', { retentionDays: 30 });
  server = createServer(createApp({ store, rateLimits: { create: { max: 1000, windowMs: 60e3 }, write: { max: 1000, windowMs: 60e3 }, read: { max: 10000, windowMs: 60e3 } } }));
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.close();
  store.close();
});

async function api(method, path, { body, token } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* not json */ }
  return { status: res.status, json, text, headers: res.headers };
}

const POLL = {
  title: 'Book club',
  dates: ['2026-10-07', '2026-10-08'],
  startMinute: 9 * 60,
  endMinute: 12 * 60,
  timezone: 'America/New_York',
};

async function newPoll(extra = {}) {
  const r = await api('POST', '/api/polls', { body: { ...POLL, ...extra } });
  assert.equal(r.status, 201, r.text);
  return r.json;
}

test('creating a poll returns a guest id, a private key and the slots', async () => {
  const { poll, adminToken } = await newPoll();
  assert.match(poll.id, /^[a-z0-9]{12}$/);
  assert.ok(adminToken.length >= 32);
  assert.equal(poll.slotMinutes, 30); // sensible default
  assert.equal(poll.resultsVisibility, 'everyone'); // default
  assert.equal(poll.slots.length, 12); // 6 half hours × 2 days
  assert.equal(new Date(poll.slots[0]).toISOString(), '2026-10-07T13:00:00.000Z');
  assert.equal(poll.status, 'open');
  // The key is stored only as a hash.
  const row = store.db.prepare('SELECT admin_hash FROM polls WHERE id = ?').get(poll.id);
  assert.notEqual(row.admin_hash, adminToken);
  assert.equal(row.admin_hash.length, 64);
});

test('poll creation rejects bad input with a helpful message', async () => {
  const cases = [
    [{ title: '' }, 'title'],
    [{ dates: [] }, 'dates'],
    [{ dates: ['2026-02-30'] }, 'dates'],
    [{ timezone: 'Nowhere/City' }, 'timezone'],
    [{ startMinute: 600, endMinute: 540 }, 'endMinute'],
    [{ startMinute: 545 }, 'startMinute'],
    [{ durationMinutes: 5 }, 'durationMinutes'],
  ];
  for (const [patch, field] of cases) {
    const r = await api('POST', '/api/polls', { body: { ...POLL, ...patch } });
    assert.equal(r.status, 400, JSON.stringify(patch));
    assert.equal(r.json.field, field);
    assert.ok(r.json.error.length > 5);
  }
});

test('a guest submits, sees their response, and edits it with their private key', async () => {
  const { poll } = await newPoll();
  const [a, b, c] = poll.slots;
  const sent = await api('POST', `/api/polls/${poll.id}/responses`, { body: { name: 'Sam', available: [a, b], ifNeeded: [c] } });
  assert.equal(sent.status, 201, sent.text);
  const { response, editToken } = sent.json;
  assert.deepEqual(response.available, [a, b]);
  assert.deepEqual(response.ifNeeded, [c]);

  const mine = await api('GET', `/api/polls/${poll.id}/my-response`, { token: editToken });
  assert.equal(mine.json.response.id, response.id);

  const edited = await api('PUT', `/api/polls/${poll.id}/responses/${response.id}`, { token: editToken, body: { name: 'Sam P', available: [c] } });
  assert.equal(edited.status, 200, edited.text);
  assert.equal(edited.json.response.name, 'Sam P');
  assert.deepEqual(edited.json.response.available, [c]);
  assert.deepEqual(edited.json.response.ifNeeded, []);

  const view = await api('GET', `/api/polls/${poll.id}`);
  assert.equal(view.json.poll.responses.length, 1);
  assert.equal(view.json.poll.responses[0].name, 'Sam P');
});

test('the same name cannot overwrite someone else\'s response', async () => {
  const { poll } = await newPoll();
  const first = await api('POST', `/api/polls/${poll.id}/responses`, { body: { name: 'Alex', available: [poll.slots[0]] } });
  const clash = await api('POST', `/api/polls/${poll.id}/responses`, { body: { name: '  alex ', available: [poll.slots[5]] } });
  assert.equal(clash.status, 409);
  assert.equal(clash.json.field, 'name');
  const view = await api('GET', `/api/polls/${poll.id}`);
  assert.deepEqual(view.json.poll.responses[0].available, [poll.slots[0]]);

  // Another guest's key, or no key, cannot edit or delete Alex's response.
  const other = await api('POST', `/api/polls/${poll.id}/responses`, { body: { name: 'Blake', available: [] } });
  const rid = first.json.response.id;
  const withOther = await api('PUT', `/api/polls/${poll.id}/responses/${rid}`, { token: other.json.editToken, body: { name: 'Alex', available: [] } });
  assert.equal(withOther.status, 403);
  const noKey = await api('PUT', `/api/polls/${poll.id}/responses/${rid}`, { body: { name: 'Alex', available: [] } });
  assert.equal(noKey.status, 403);
  const del = await api('DELETE', `/api/polls/${poll.id}/responses/${rid}`, { token: other.json.editToken });
  assert.equal(del.status, 403);

  // Renaming into an existing name is refused too.
  const rename = await api('PUT', `/api/polls/${poll.id}/responses/${other.json.response.id}`, { token: other.json.editToken, body: { name: 'ALEX', available: [] } });
  assert.equal(rename.status, 409);
});

test('guest keys and the guest link never grant organizer access', async () => {
  const { poll } = await newPoll();
  const guest = await api('POST', `/api/polls/${poll.id}/responses`, { body: { name: 'Riley', available: [] } });
  const guestToken = guest.json.editToken;
  for (const token of [undefined, guestToken, 'x'.repeat(32)]) {
    assert.equal((await api('GET', `/api/polls/${poll.id}/manage`, { token })).status, 403);
    assert.equal((await api('PATCH', `/api/polls/${poll.id}`, { token, body: { status: 'closed' } })).status, 403);
    assert.equal((await api('PATCH', `/api/polls/${poll.id}`, { token, body: { title: 'Hijacked' } })).status, 403);
    assert.equal((await api('POST', `/api/polls/${poll.id}/private-link`, { token })).status, 403);
    assert.equal((await api('DELETE', `/api/polls/${poll.id}`, { token })).status, 403);
  }
  const view = await api('GET', `/api/polls/${poll.id}`);
  assert.equal(view.json.poll.isOrganizer, false);
  assert.equal(view.json.poll.title, 'Book club');
  assert.equal(view.json.poll.status, 'open');
  assert.equal('adminHash' in view.json.poll, false);
  assert.equal(JSON.stringify(view.json).includes('editHash'), false);
});

test('a key from one poll does not unlock another poll', async () => {
  const one = await newPoll();
  const two = await newPoll();
  assert.equal((await api('GET', `/api/polls/${two.poll.id}/manage`, { token: one.adminToken })).status, 403);
});

test('replacing the private link revokes the old one', async () => {
  const { poll, adminToken } = await newPoll();
  assert.equal((await api('GET', `/api/polls/${poll.id}/manage`, { token: adminToken })).status, 200);
  const rotated = await api('POST', `/api/polls/${poll.id}/private-link`, { token: adminToken });
  assert.equal(rotated.status, 200);
  const fresh = rotated.json.adminToken;
  assert.notEqual(fresh, adminToken);
  assert.equal((await api('GET', `/api/polls/${poll.id}/manage`, { token: adminToken })).status, 403);
  assert.equal((await api('GET', `/api/polls/${poll.id}/manage`, { token: fresh })).status, 200);
});

test('hiding responses keeps them from guests but not the organizer', async () => {
  const { poll, adminToken } = await newPoll({ resultsVisibility: 'organizer' });
  const g = await api('POST', `/api/polls/${poll.id}/responses`, { body: { name: 'Jo', available: [poll.slots[0]] } });
  const pub = await api('GET', `/api/polls/${poll.id}`);
  assert.equal(pub.json.poll.responses, null);
  assert.equal(pub.json.poll.responseCount, 1);
  assert.equal(JSON.stringify(pub.json).includes('Jo'), false);
  const own = await api('GET', `/api/polls/${poll.id}/my-response`, { token: g.json.editToken });
  assert.equal(own.json.response.name, 'Jo');
  const mgr = await api('GET', `/api/polls/${poll.id}/manage`, { token: adminToken });
  assert.equal(mgr.json.poll.responses[0].name, 'Jo');
});

test('closing, finalizing and reopening a poll', async () => {
  const { poll, adminToken } = await newPoll();
  const g = await api('POST', `/api/polls/${poll.id}/responses`, { body: { name: 'Kit', available: [poll.slots[0]] } });

  const closed = await api('PATCH', `/api/polls/${poll.id}`, { token: adminToken, body: { status: 'closed' } });
  assert.equal(closed.json.poll.status, 'closed');
  assert.equal((await api('POST', `/api/polls/${poll.id}/responses`, { body: { name: 'Late', available: [] } })).status, 409);
  assert.equal((await api('PUT', `/api/polls/${poll.id}/responses/${g.json.response.id}`, { token: g.json.editToken, body: { name: 'Kit', available: [] } })).status, 409);

  const final = { start: poll.slots[0], end: poll.slots[0] + 3600e3 };
  const fin = await api('PATCH', `/api/polls/${poll.id}`, { token: adminToken, body: { final } });
  assert.equal(fin.json.poll.status, 'finalized');
  const guestView = await api('GET', `/api/polls/${poll.id}`);
  assert.deepEqual(guestView.json.poll.final, final);

  const ics = await api('GET', `/api/polls/${poll.id}/invite.ics`);
  assert.equal(ics.status, 200);
  assert.match(ics.headers.get('content-type'), /text\/calendar/);
  assert.match(ics.text, /DTSTART:20261007T130000Z\r\n/);
  assert.match(ics.text, /DTEND:20261007T140000Z\r\n/);
  assert.match(ics.text, /SUMMARY:Book club\r\n/);

  const reopened = await api('PATCH', `/api/polls/${poll.id}`, { token: adminToken, body: { status: 'open' } });
  assert.equal(reopened.json.poll.status, 'open');
  assert.equal(reopened.json.poll.final, null);
  assert.equal((await api('GET', `/api/polls/${poll.id}/invite.ics`)).status, 404);
});

test('editing the dates marks new times as unanswered for earlier guests', async () => {
  const { poll, adminToken } = await newPoll();
  await api('POST', `/api/polls/${poll.id}/responses`, { body: { name: 'Lee', available: [poll.slots[0]] } });
  const edited = await api('PATCH', `/api/polls/${poll.id}`, { token: adminToken, body: { dates: [...POLL.dates, '2026-10-09'] } });
  assert.equal(edited.status, 200, edited.text);
  assert.equal(edited.json.poll.slots.length, 18);
  const lee = edited.json.poll.responses[0];
  assert.equal(lee.answered.length, 12);
});

test('guests delete their own response; organizers can remove any response; deleting a poll removes everything', async () => {
  const { poll, adminToken } = await newPoll();
  const a = await api('POST', `/api/polls/${poll.id}/responses`, { body: { name: 'Mo', available: [] } });
  const b = await api('POST', `/api/polls/${poll.id}/responses`, { body: { name: 'Nia', available: [] } });
  assert.equal((await api('DELETE', `/api/polls/${poll.id}/responses/${a.json.response.id}`, { token: a.json.editToken })).status, 204);
  assert.equal((await api('DELETE', `/api/polls/${poll.id}/responses/${b.json.response.id}`, { token: adminToken })).status, 204);
  await api('POST', `/api/polls/${poll.id}/responses`, { body: { name: 'Oz', available: [] } });
  assert.equal((await api('DELETE', `/api/polls/${poll.id}`, { token: adminToken })).status, 204);
  assert.equal((await api('GET', `/api/polls/${poll.id}`)).status, 404);
  const left = store.db.prepare('SELECT COUNT(*) AS n FROM responses WHERE poll_id = ?').get(poll.id).n;
  assert.equal(left, 0);
});

test('expired polls are deleted with their responses', async () => {
  const { poll } = await newPoll();
  await api('POST', `/api/polls/${poll.id}/responses`, { body: { name: 'Old', available: [] } });
  assert.ok(await store.deleteExpired(Date.parse('2027-12-01')) >= 1); // well past 8 October 2026 + 30 days
  assert.equal((await api('GET', `/api/polls/${poll.id}`)).status, 404);
});

test('responses ignore times that are not part of the poll', async () => {
  const { poll } = await newPoll();
  const r = await api('POST', `/api/polls/${poll.id}/responses`, { body: { name: 'Pat', available: [poll.slots[0], 12345], ifNeeded: [poll.slots[0], poll.slots[1]] } });
  assert.deepEqual(r.json.response.available, [poll.slots[0]]);
  assert.deepEqual(r.json.response.ifNeeded, [poll.slots[1]]);
});

test('pages are served with strict security headers and no cookies', async () => {
  const home = await api('GET', '/');
  assert.equal(home.status, 200);
  assert.match(home.headers.get('content-security-policy'), /default-src 'self'/);
  assert.equal(home.headers.get('referrer-policy'), 'no-referrer');
  assert.equal(home.headers.get('set-cookie'), null);
  assert.equal((await api('GET', '/p/abcdefghjkmn')).status, 200);
  assert.equal((await api('GET', '/shared/time.js')).status, 200);
  assert.equal((await api('GET', '/../server/store.js')).status, 404);
  assert.equal((await api('GET', '/shared/..%2fserver%2fstore.js')).status, 404);
});

test('weekly polls use days of the week instead of dates', async () => {
  const r = await api('POST', '/api/polls', { body: { title: 'Standup', kind: 'weekly', weekdays: [1, 3, 5], startMinute: 540, endMinute: 600, timezone: 'Europe/Berlin' } });
  assert.equal(r.status, 201, r.text);
  const { poll, adminToken } = r.json;
  assert.equal(poll.kind, 'weekly');
  assert.deepEqual(poll.weekdays, [1, 3, 5]);
  assert.equal(poll.dates.length, 3);
  assert.equal(poll.slots.length, 6);
  // The reference dates sit in one Monday-to-Sunday week.
  const days = poll.dates.map((d) => new Date(`${d}T12:00:00Z`).getUTCDay());
  assert.deepEqual(days, [1, 3, 5]);
  assert.ok(Date.parse(poll.dates[2]) - Date.parse(poll.dates[0]) === 4 * 86400e3);
  // Kept for 30 days after the last change rather than after a last date.
  assert.ok(Math.abs(poll.expiresAt - (Date.now() + 30 * 86400e3)) < 60e3);

  // Adding a day keeps the same week, so existing answers keep their meaning.
  await api('POST', `/api/polls/${poll.id}/responses`, { body: { name: 'Ida', available: [poll.slots[0]] } });
  const edited = await api('PATCH', `/api/polls/${poll.id}`, { token: adminToken, body: { weekdays: [1, 2, 3, 5] } });
  assert.equal(edited.status, 200, edited.text);
  assert.ok(edited.json.poll.slots.includes(poll.slots[0]));
  assert.deepEqual(edited.json.poll.weekdays, [1, 2, 3, 5]);

  assert.equal((await api('PATCH', `/api/polls/${poll.id}`, { token: adminToken, body: { dates: ['2027-01-01'] } })).status, 400);
  assert.equal((await api('PATCH', `/api/polls/${poll.id}`, { token: adminToken, body: { kind: 'dates' } })).status, 400);

  const fin = await api('PATCH', `/api/polls/${poll.id}`, { token: adminToken, body: { final: { start: poll.slots[0], end: poll.slots[0] + 3600e3 } } });
  assert.equal(fin.json.poll.status, 'finalized');
  const ics = await api('GET', `/api/polls/${poll.id}/invite.ics`);
  assert.match(ics.text, /DTSTART;TZID=Europe\/Berlin:\d{8}T090000\r\n/);
  assert.match(ics.text, /RRULE:FREQ=WEEKLY/);
});

test('weekly polls need at least one valid weekday', async () => {
  for (const weekdays of [[], [7], ['mon'], undefined]) {
    const r = await api('POST', '/api/polls', { body: { title: 'X', kind: 'weekly', weekdays, startMinute: 540, endMinute: 600, timezone: 'UTC' } });
    assert.equal(r.status, 400);
    assert.equal(r.json.field, 'weekdays');
  }
});

test('databases from before weekly polls are upgraded in place', async () => {
  const { DatabaseSync } = await import('node:sqlite');
  const { mkdtempSync } = await import('node:fs');
  const { join } = await import('node:path');
  const { tmpdir } = await import('node:os');
  const file = join(mkdtempSync(join(tmpdir(), 'overlap-')), 'old.db');
  const old = new DatabaseSync(file);
  old.exec(`CREATE TABLE polls (id TEXT PRIMARY KEY, admin_hash TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
    timezone TEXT NOT NULL, dates TEXT NOT NULL, start_minute INTEGER NOT NULL, end_minute INTEGER NOT NULL, slot_minutes INTEGER NOT NULL,
    duration_minutes INTEGER, results_visibility TEXT NOT NULL DEFAULT 'everyone', closed INTEGER NOT NULL DEFAULT 0, final_start INTEGER,
    final_end INTEGER, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, expires_at INTEGER NOT NULL)`);
  old.prepare(`INSERT INTO polls VALUES ('oldpoll', 'h', 'Old', '', 'UTC', '["2027-01-04"]', 540, 600, 30, NULL, 'everyone', 0, NULL, NULL, 1, 1, 9999999999999)`).run();
  old.close();
  const upgraded = openStore(file);
  assert.equal((await upgraded.getPoll('oldpoll')).kind, 'dates');
  upgraded.close();
});

test('responses carry preferred times and an optional note', async () => {
  const { poll } = await newPoll();
  const [a, b, c] = poll.slots;
  const r = await api('POST', `/api/polls/${poll.id}/responses`, { body: { name: 'Uma', preferred: [a, b], available: [b, c], ifNeeded: [a, c], note: 'Remote only\nplease' } });
  assert.equal(r.status, 201, r.text);
  assert.deepEqual(r.json.response.preferred, [a, b]);
  assert.deepEqual(r.json.response.available, [c]);
  assert.deepEqual(r.json.response.ifNeeded, []);
  assert.equal(r.json.response.note, 'Remote only please');
  const long = await api('POST', `/api/polls/${poll.id}/responses`, { body: { name: 'Vic', note: 'x'.repeat(201) } });
  assert.equal(long.status, 400);
  assert.equal(long.json.field, 'note');
});

test('a closing date stops responses after that day, and reopening clears it', async () => {
  const { poll, adminToken } = await newPoll({ location: 'Room 4, Main St' });
  store.db.prepare("UPDATE polls SET closes_on = '2026-01-01' WHERE id = ?").run(poll.id); // a deadline that has since passed
  assert.equal(poll.location, 'Room 4, Main St');
  assert.equal((await api('GET', `/api/polls/${poll.id}`)).json.poll.status, 'closed');
  assert.equal((await api('POST', `/api/polls/${poll.id}/responses`, { body: { name: 'Late' } })).status, 409);
  const reopened = await api('PATCH', `/api/polls/${poll.id}`, { token: adminToken, body: { status: 'open' } });
  assert.equal(reopened.json.poll.status, 'open');
  assert.equal(reopened.json.poll.closesOn, null);
  const future = await api('PATCH', `/api/polls/${poll.id}`, { token: adminToken, body: { closesOn: '2028-12-31' } });
  assert.equal(future.json.poll.status, 'open');
  assert.equal(new Date(future.json.poll.closesAt).toISOString(), '2029-01-01T05:00:00.000Z');
  assert.equal((await api('POST', '/api/polls', { body: { ...POLL, closesOn: 'soon' } })).json.field, 'closesOn');
  // The location goes into the calendar invite.
  await api('PATCH', `/api/polls/${poll.id}`, { token: adminToken, body: { final: { start: poll.slots[0], end: poll.slots[1] } } });
  const ics = await api('GET', `/api/polls/${poll.id}/invite.ics`);
  assert.match(ics.text, /\r\nLOCATION:Room 4\\, Main St\r\n/);
});

test('review fixes: dates window, time zone names, final time on a slot, nulls in edits', async () => {
  for (const patch of [{ dates: ['9999-12-31'] }, { closesOn: '9999-12-31' }, { dates: ['2001-01-01'] }, { timezone: '+05:00' }, { durationMinutes: 600 }]) {
    const r = await api('POST', '/api/polls', { body: { ...POLL, ...patch } });
    assert.equal(r.status, 400, JSON.stringify(patch));
  }
  const tz = await api('POST', '/api/polls', { body: { ...POLL, timezone: 'america/new_york' } });
  assert.equal(tz.json.poll.timezone, 'America/New_York');

  const { poll, adminToken } = await newPoll({ resultsVisibility: 'organizer' });
  const off = await api('PATCH', `/api/polls/${poll.id}`, { token: adminToken, body: { final: { start: poll.slots[0] + 7, end: poll.slots[0] + 3600e3 } } });
  assert.equal(off.status, 400);
  assert.equal((await api('PATCH', `/api/polls/${poll.id}`, { token: adminToken, body: { resultsVisibility: null } })).status, 400);
  assert.equal((await api('PATCH', `/api/polls/${poll.id}`, { token: adminToken, body: { slotMinutes: null } })).status, 400);

  // A final time whose date is removed by an edit is cleared.
  await api('PATCH', `/api/polls/${poll.id}`, { token: adminToken, body: { final: { start: poll.slots[0], end: poll.slots[0] + 3600e3 } } });
  const moved = await api('PATCH', `/api/polls/${poll.id}`, { token: adminToken, body: { dates: ['2026-10-08'] } });
  assert.equal(moved.json.poll.final, null);
  assert.equal(moved.json.poll.status, 'closed');

  // Guests can't see when a hidden poll expires, or probe names.
  const pub = await api('GET', `/api/polls/${poll.id}`);
  assert.equal(pub.json.poll.expiresAt, undefined);
});

test('hidden-results polls do not reveal names through duplicates', async () => {
  const { poll } = await newPoll({ resultsVisibility: 'organizer' });
  assert.equal((await api('POST', `/api/polls/${poll.id}/responses`, { body: { name: 'Alice' } })).status, 201);
  assert.equal((await api('POST', `/api/polls/${poll.id}/responses`, { body: { name: 'alice' } })).status, 201);
  // On a public-results poll the same name is refused, including look-alikes with invisible characters.
  const { poll: open } = await newPoll();
  await api('POST', `/api/polls/${open.id}/responses`, { body: { name: 'Alice' } });
  assert.equal((await api('POST', `/api/polls/${open.id}/responses`, { body: { name: 'Alice​' } })).status, 409);
});

test('text is cleaned of carriage returns and direction overrides', async () => {
  const { poll, adminToken } = await newPoll({ title: 'Meet\rATTACH:http://evil.example/x', description: 'a‮b' });
  assert.equal(poll.title, 'Meet\nATTACH:http://evil.example/x');
  assert.equal(poll.description, 'ab');
  await api('PATCH', `/api/polls/${poll.id}`, { token: adminToken, body: { final: { start: poll.slots[0], end: poll.slots[1] } } });
  const ics = await api('GET', `/api/polls/${poll.id}/invite.ics`);
  assert.match(ics.text, /\r\nSUMMARY:Meet\\nATTACH:http:\/\/evil\.example\/x\r\n/);
  assert.equal(/\r(?!\n)/.test(ics.text), false);
});

test('expiry survives zones whose midnight can be skipped', async () => {
  const r = await api('POST', '/api/polls', { body: { ...POLL, timezone: 'America/Santiago', dates: ['2027-09-04'] } });
  assert.equal(r.status, 201, r.text);
  assert.ok(r.json.poll.expiresAt > Date.parse('2027-10-01'));
});

test('a deleted poll is overwritten in the database file', async () => {
  const { DatabaseSync } = await import('node:sqlite');
  const { mkdtempSync, readFileSync, existsSync } = await import('node:fs');
  const { join } = await import('node:path');
  const { tmpdir } = await import('node:os');
  const file = join(mkdtempSync(join(tmpdir(), 'overlap-')), 'del.db');
  const s = openStore(file);
  const { poll } = await s.createPoll({ kind: 'dates', title: 'SECRET_TITLE_QQ', description: '', location: '', closesOn: null, timezone: 'UTC', dates: ['2026-12-01'], startMinute: 540, endMinute: 600, slotMinutes: 30, durationMinutes: null, resultsVisibility: 'everyone' });
  await s.createResponse(poll, { name: 'SECRET_NAME_QQ', available: [], ifNeeded: [], note: 'SECRET_NOTE_QQ' });
  await s.deletePoll(poll.id);
  s.close();
  const bytes = readFileSync(file).toString('latin1') + (existsSync(`${file}-wal`) ? readFileSync(`${file}-wal`).toString('latin1') : '');
  for (const secret of ['SECRET_TITLE_QQ', 'SECRET_NAME_QQ', 'SECRET_NOTE_QQ']) assert.equal(bytes.includes(secret), false, secret);
  void DatabaseSync;
});

test('changing a weekly poll’s time zone picks a week without a clock change there', async () => {
  const r = await api('POST', '/api/polls', { body: { title: 'W', kind: 'weekly', weekdays: [0, 1], startMinute: 540, endMinute: 600, timezone: 'Asia/Tokyo' } });
  const { poll, adminToken } = r.json;
  const edited = await api('PATCH', `/api/polls/${poll.id}`, { token: adminToken, body: { timezone: 'Europe/London' } });
  assert.equal(edited.status, 200, edited.text);
  assert.deepEqual(edited.json.poll.weekdays, [1, 0]);
  const offsets = edited.json.poll.slots.map((s) => new Date(s).getUTCHours());
  assert.equal(new Set(offsets).size, 1); // 9:00 London is the same UTC hour on both days
});

test('switching hidden results to public keeps names unique and lets the original guest edit', async () => {
  const { poll, adminToken } = await newPoll({ resultsVisibility: 'organizer' });
  const sam = await api('POST', `/api/polls/${poll.id}/responses`, { body: { name: 'Sam' } });
  await api('PATCH', `/api/polls/${poll.id}`, { token: adminToken, body: { resultsVisibility: 'everyone' } });
  assert.equal((await api('POST', `/api/polls/${poll.id}/responses`, { body: { name: 'SAM' } })).status, 409);
  const edit = await api('PUT', `/api/polls/${poll.id}/responses/${sam.json.response.id}`, { token: sam.json.editToken, body: { name: 'Sam', available: [poll.slots[0]] } });
  assert.equal(edit.status, 200, edit.text);
});

test('closing dates in the past are refused, and invisible names too', async () => {
  assert.equal((await api('POST', '/api/polls', { body: { ...POLL, closesOn: '2026-01-01' } })).json.field, 'closesOn');
  const { poll, adminToken } = await newPoll();
  assert.equal((await api('PATCH', `/api/polls/${poll.id}`, { token: adminToken, body: { closesOn: '2026-01-01' } })).status, 400);
  assert.equal((await api('POST', `/api/polls/${poll.id}/responses`, { body: { name: '​​' } })).json.field, 'name');
  const view = await api('GET', `/api/polls/${poll.id}`);
  assert.equal(typeof view.json.poll.updatedAt, 'number');
});

test('by default nothing is deleted automatically', async () => {
  const keep = openStore(':memory:'); // no retentionDays: polls stay until deleted
  const { poll } = await keep.createPoll({ kind: 'dates', title: 'Kept', description: '', location: '', closesOn: null, timezone: 'UTC', dates: ['2026-10-10'], startMinute: 540, endMinute: 600, slotMinutes: 30, durationMinutes: null, resultsVisibility: 'everyone' });
  assert.equal(await keep.deleteExpired(Date.parse('2099-01-01')), 0);
  assert.ok(await keep.getPoll(poll.id));
  const app = createServer(createApp({ store: keep }));
  await new Promise((r) => app.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${app.address().port}`;
  const cfg = await (await fetch(`${url}/api/config`)).json();
  assert.equal(cfg.retentionDays, 0);
  const created = await (await fetch(`${url}/api/polls`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(POLL) })).json();
  assert.equal(created.poll.expiresAt, null);
  app.close();
  keep.close();
});
