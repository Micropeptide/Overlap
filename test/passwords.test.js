import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { openStore } from '../server/store.js';
import { createApp } from '../server/app.js';
import { passwordKey, passwordProblem } from '../shared/password.js';

let server;
let base;
let store;

before(async () => {
  store = openStore(':memory:');
  server = createServer(createApp({ store, rateLimits: { create: { max: 1000, windowMs: 60e3 }, write: { max: 1000, windowMs: 60e3 }, read: { max: 10000, windowMs: 60e3 } } }));
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.close();
  store.close();
});

async function api(method, path, { body, auth } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) headers.Authorization = auth;
  const res = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* not json */ }
  return { status: res.status, json, text };
}

const POLL = { title: 'Retreat', dates: ['2027-03-03'], startMinute: 540, endMinute: 660, timezone: 'Europe/London' };

test('keys depend on the password, the poll and the role, and are never the password', async () => {
  const a = await passwordKey('correct horse', 'poll1', 'organizer');
  assert.match(a, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(a, await passwordKey('correct horse', 'poll1', 'organizer'));
  assert.notEqual(a, await passwordKey('correct horse', 'poll2', 'organizer'));
  assert.notEqual(a, await passwordKey('correct horse', 'poll1', 'guest'));
  assert.notEqual(a, await passwordKey('correct horsf', 'poll1', 'organizer'));
  assert.equal(passwordProblem('short'), 'Use at least 8 characters.');
  assert.equal(passwordProblem('long enough'), null);
});

test('an organizer password manages the poll alongside the private link', async () => {
  const created = await api('POST', '/api/polls', { body: POLL });
  const { poll, adminToken } = created.json;
  assert.equal(poll.hasOrganizerPassword, false);
  const key = await passwordKey('tea and biscuits', poll.id, 'organizer');

  // Without a password set, the key does nothing.
  assert.equal((await api('GET', `/api/polls/${poll.id}/manage`, { auth: `Bearer ${key}` })).status, 403);

  const set = await api('PATCH', `/api/polls/${poll.id}`, { auth: `Bearer ${adminToken}`, body: { organizerPassword: key } });
  assert.equal(set.status, 200, set.text);
  assert.equal(set.json.poll.hasOrganizerPassword, true);
  assert.equal((await api('GET', `/api/polls/${poll.id}`)).json.poll.hasOrganizerPassword, true);

  // Only a hash is stored.
  const row = store.db.prepare('SELECT admin_pw_hash FROM polls WHERE id = ?').get(poll.id);
  assert.equal(row.admin_pw_hash.length, 64);
  assert.ok(!row.admin_pw_hash.includes(key));

  assert.equal((await api('GET', `/api/polls/${poll.id}/manage`, { auth: `Bearer ${key}` })).status, 200);
  assert.equal((await api('GET', `/api/polls/${poll.id}/manage`, { auth: `Bearer ${adminToken}` })).status, 200);
  const wrong = await passwordKey('tea and crumpets', poll.id, 'organizer');
  assert.equal((await api('GET', `/api/polls/${poll.id}/manage`, { auth: `Bearer ${wrong}` })).status, 403);

  // Replacing the private link leaves the password working; removing the password stops it.
  const rotated = await api('POST', `/api/polls/${poll.id}/private-link`, { auth: `Bearer ${key}` });
  assert.equal(rotated.status, 200);
  assert.equal((await api('GET', `/api/polls/${poll.id}/manage`, { auth: `Bearer ${key}` })).status, 200);
  const removed = await api('PATCH', `/api/polls/${poll.id}`, { auth: `Bearer ${key}`, body: { organizerPassword: null } });
  assert.equal(removed.json.poll.hasOrganizerPassword, false);
  assert.equal((await api('GET', `/api/polls/${poll.id}/manage`, { auth: `Bearer ${key}` })).status, 403);
});

test('malformed password keys are refused', async () => {
  const { poll, adminToken } = (await api('POST', '/api/polls', { body: POLL })).json;
  const bad = await api('PATCH', `/api/polls/${poll.id}`, { auth: `Bearer ${adminToken}`, body: { organizerPassword: 'plain text password' } });
  assert.equal(bad.status, 400);
  assert.equal(bad.json.field, 'password');
  const guest = await api('POST', `/api/polls/${poll.id}/responses`, { body: { name: 'Cy', available: [], ifNeeded: [], password: 'hunter22' } });
  assert.equal(guest.status, 400);
});

test('guests sign in on another device with their name and password', async () => {
  const { poll } = (await api('POST', '/api/polls', { body: POLL })).json;
  const key = await passwordKey('my own secret', poll.id, 'guest');
  const sent = await api('POST', `/api/polls/${poll.id}/responses`, { body: { name: 'Ana Lee', available: [poll.slots[0]], ifNeeded: [], password: key } });
  assert.equal(sent.status, 201, sent.text);
  assert.equal(sent.json.response.hasPassword, true);
  const rid = sent.json.response.id;
  // Others don't learn who set a password.
  assert.equal((await api('GET', `/api/polls/${poll.id}`)).json.poll.responses[0].hasPassword, undefined);

  // Names match loosely, like elsewhere.
  const signIn = await api('POST', `/api/polls/${poll.id}/sign-in`, { body: { name: '  ana   LEE ', password: key } });
  assert.equal(signIn.status, 200, signIn.text);
  assert.equal(signIn.json.response.id, rid);

  const auth = `Password ${rid}:${key}`;
  assert.equal((await api('GET', `/api/polls/${poll.id}/my-response`, { auth })).json.response.id, rid);
  const edit = await api('PUT', `/api/polls/${poll.id}/responses/${rid}`, { auth, body: { name: 'Ana L.', available: [poll.slots[1]], ifNeeded: [] } });
  assert.equal(edit.status, 200, edit.text);
  // A rename keeps the password.
  assert.equal(edit.json.response.hasPassword, true);
  assert.equal((await api('POST', `/api/polls/${poll.id}/sign-in`, { body: { name: 'Ana L.', password: key } })).status, 200);

  // Wrong password, wrong name, someone else's response id.
  const wrong = await passwordKey('not my secret', poll.id, 'guest');
  assert.equal((await api('POST', `/api/polls/${poll.id}/sign-in`, { body: { name: 'Ana L.', password: wrong } })).status, 403);
  assert.equal((await api('POST', `/api/polls/${poll.id}/sign-in`, { body: { name: 'Nobody', password: key } })).status, 403);
  const other = await api('POST', `/api/polls/${poll.id}/responses`, { body: { name: 'Ben', available: [], ifNeeded: [] } });
  assert.equal((await api('PUT', `/api/polls/${poll.id}/responses/${other.json.response.id}`, { auth: `Password ${other.json.response.id}:${key}`, body: { name: 'Ben', available: [], ifNeeded: [] } })).status, 403);
  // Without a password, sign-in can't find a response at all.
  assert.equal((await api('POST', `/api/polls/${poll.id}/sign-in`, { body: { name: 'Ben', password: key } })).status, 403);

  // Removing the password stops sign-in; the edit link still works.
  const off = await api('PUT', `/api/polls/${poll.id}/responses/${rid}`, { auth: `Bearer ${sent.json.editToken}`, body: { name: 'Ana L.', available: [], ifNeeded: [], password: null } });
  assert.equal(off.json.response.hasPassword, false);
  assert.equal((await api('GET', `/api/polls/${poll.id}/my-response`, { auth })).status, 403);
  assert.equal((await api('DELETE', `/api/polls/${poll.id}/responses/${rid}`, { auth: `Bearer ${sent.json.editToken}` })).status, 204);
});

test('too many wrong passwords pause password sign-in for that poll, even the right one', async () => {
  const { poll, adminToken } = (await api('POST', '/api/polls', { body: POLL })).json;
  const key = await passwordKey('the right one', poll.id, 'organizer');
  await api('PATCH', `/api/polls/${poll.id}`, { auth: `Bearer ${adminToken}`, body: { organizerPassword: key } });
  const wrong = await passwordKey('a wrong one!', poll.id, 'organizer');
  for (let i = 0; i < 30; i++) assert.equal((await api('GET', `/api/polls/${poll.id}/manage`, { auth: `Bearer ${wrong}` })).status, 403);
  assert.equal((await api('GET', `/api/polls/${poll.id}/manage`, { auth: `Bearer ${wrong}` })).status, 429);
  assert.equal((await api('GET', `/api/polls/${poll.id}/manage`, { auth: `Bearer ${key}` })).status, 429);
  // The private link is unaffected, and guests are counted separately.
  assert.equal((await api('GET', `/api/polls/${poll.id}/manage`, { auth: `Bearer ${adminToken}` })).status, 200);
  assert.equal((await api('POST', `/api/polls/${poll.id}/sign-in`, { body: { name: 'X', password: key } })).status, 403);
  // Deleting the poll clears its counters.
  await api('DELETE', `/api/polls/${poll.id}`, { auth: `Bearer ${adminToken}` });
  assert.equal(store.db.prepare('SELECT COUNT(*) AS n FROM throttle WHERE key LIKE ?').get(`%${poll.id}`).n, 0);
});
