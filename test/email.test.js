import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { openStore } from '../server/store.js';
import { createApp } from '../server/app.js';
import { sendDueDigests, cleanEmail } from '../server/email.js';

let server;
let base;
let store;
const outbox = [];
const mailer = { async send(msg) { outbox.push(msg); } };

before(async () => {
  store = openStore(':memory:');
  server = createServer(createApp({ store, mailer, rateLimits: { create: { max: 1000, windowMs: 60e3 }, write: { max: 1000, windowMs: 60e3 }, read: { max: 10000, windowMs: 60e3 }, email: { max: 1000, windowMs: 60e3 } } }));
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.close();
  store.close();
});

async function api(method, path, { body, auth, headers = {} } = {}) {
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) headers.Authorization = auth;
  const res = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* not json */ }
  return { status: res.status, json, text };
}

const POLL = { title: 'Lab retreat', dates: ['2027-03-03'], startMinute: 540, endMinute: 660, timezone: 'America/New_York' };
const later = () => Date.now() + 3 * 3600e3; // past the settle time and the 30-minute gap
const tokenIn = (msg, path) => new RegExp(`${path}#t=([A-Za-z0-9_-]+)`).exec(msg.text)?.[1];

test('addresses are checked loosely and the domain lowercased', () => {
  assert.equal(cleanEmail('  Ana@Example.COM '), 'Ana@example.com');
  assert.equal(cleanEmail('not an email'), null);
  assert.equal(cleanEmail('a@b'), null);
  assert.equal(cleanEmail('a b@c.com'), null);
});

test('the organizer gets their link, confirms, and then hears about responses', async () => {
  outbox.length = 0;
  assert.equal((await api('GET', '/api/config')).json.emails, true);
  const { poll, adminToken } = (await api('POST', '/api/polls', { body: POLL })).json;
  const auth = `Bearer ${adminToken}`;

  // Only the organizer can set it up, and only with the poll's real link.
  assert.equal((await api('PUT', `/api/polls/${poll.id}/email`, { body: { email: 'org@example.com', updates: true } })).status, 403);
  assert.equal((await api('PUT', `/api/polls/${poll.id}/email`, { auth, body: { email: 'org@example.com', link: 'x'.repeat(32) } })).json.field, 'link');
  assert.equal((await api('PUT', `/api/polls/${poll.id}/email`, { auth, body: { email: 'nope', updates: true } })).json.field, 'email');

  const put = await api('PUT', `/api/polls/${poll.id}/email`, { auth, body: { email: 'org@example.com', updates: true, link: adminToken } });
  assert.equal(put.status, 200, put.text);
  assert.deepEqual(put.json, { email: 'org@example.com', confirmed: false, sent: true });
  assert.equal(outbox.length, 1);
  const welcome = outbox[0];
  assert.equal(welcome.to, 'org@example.com');
  assert.match(welcome.subject, /Confirm emails about “Lab retreat”/);
  assert.ok(welcome.text.includes(`/m/${poll.id}#k=${adminToken}`));
  assert.ok(welcome.html.includes('Confirm email updates'));

  // Unconfirmed: responses don't produce emails.
  await api('POST', `/api/polls/${poll.id}/responses`, { body: { name: 'Early', available: [], ifNeeded: [] } });
  assert.equal(await sendDueDigests({ store, mailer, publicUrl: 'https://o.test', apiUrl: 'https://api.o.test', now: later() }), 0);

  const confirm = await api('POST', '/api/email/confirm', { body: { token: tokenIn(welcome, '/e/confirm') } });
  assert.equal(confirm.status, 200, confirm.text);
  assert.deepEqual(confirm.json, { poll: { id: poll.id, title: 'Lab retreat' }, role: 'organizer' });
  assert.equal((await api('GET', `/api/polls/${poll.id}/email`, { auth })).json.confirmed, true);

  // Two guests answer, one changes their mind, one leaves.
  const ana = (await api('POST', `/api/polls/${poll.id}/responses`, { body: { name: 'Ana', available: [poll.slots[0]], ifNeeded: [] } })).json;
  const ben = (await api('POST', `/api/polls/${poll.id}/responses`, { body: { name: 'Ben', available: [], ifNeeded: [] } })).json;
  await api('PUT', `/api/polls/${poll.id}/responses/${ana.response.id}`, { auth: `Bearer ${ana.editToken}`, body: { name: 'Ana', available: [], ifNeeded: [] } });
  await api('DELETE', `/api/polls/${poll.id}/responses/${ben.response.id}`, { auth: `Bearer ${ben.editToken}` });

  // Not yet: changes settle for a few minutes first.
  assert.equal(await sendDueDigests({ store, mailer, publicUrl: 'https://o.test', apiUrl: 'https://api.o.test' }), 0);
  outbox.length = 0;
  assert.equal(await sendDueDigests({ store, mailer, publicUrl: 'https://o.test', apiUrl: 'https://api.o.test', now: later() }), 1);
  const digest = outbox[0];
  assert.equal(digest.subject, 'Updates to “Lab retreat”');
  assert.match(digest.text, /New response: Ana\./);
  assert.doesNotMatch(digest.text, /Ben/); // came and went
  assert.match(digest.text, /2 people have responded so far/);
  assert.ok(digest.text.includes(`https://o.test/m/${poll.id}`));
  assert.ok(!digest.text.includes(adminToken)); // update emails never carry the private key
  assert.match(digest.headers['List-Unsubscribe'], /^<https:\/\/api\.o\.test\/api\/email\/unsubscribe\?t=/);
  assert.equal(digest.headers['List-Unsubscribe-Post'], 'List-Unsubscribe=One-Click');

  // Nothing new, nothing sent.
  assert.equal(await sendDueDigests({ store, mailer, publicUrl: 'https://o.test', apiUrl: 'https://api.o.test', now: later() + 3600e3 }), 0);

  // One-click unsubscribe from the mail app removes the address.
  const oneClick = /\?t=([A-Za-z0-9_-]+)>/.exec(digest.headers['List-Unsubscribe'])[1];
  const res = await fetch(`${base}/api/email/unsubscribe?t=${oneClick}`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'List-Unsubscribe=One-Click' });
  assert.equal(res.status, 200);
  assert.deepEqual((await api('GET', `/api/polls/${poll.id}/email`, { auth })).json, { email: null, confirmed: false });
  assert.equal(store.db.prepare('SELECT COUNT(*) AS n FROM email_subs WHERE email = ?').get('org@example.com').n, 0);
});

test('the first update after confirming goes out within minutes, not after the 30-minute gap', async () => {
  outbox.length = 0;
  const { poll, adminToken } = (await api('POST', '/api/polls', { body: POLL })).json;
  const auth = `Bearer ${adminToken}`;
  await api('PUT', `/api/polls/${poll.id}/email`, { auth, body: { email: 'quick@example.com', updates: true } });
  await api('POST', '/api/email/confirm', { body: { token: tokenIn(outbox[0], '/e/confirm') } });
  await api('POST', `/api/polls/${poll.id}/responses`, { body: { name: 'Prompt', available: [], ifNeeded: [] } });
  outbox.length = 0;
  assert.equal(await sendDueDigests({ store, mailer, publicUrl: 'https://o.test', apiUrl: 'https://api.o.test', now: Date.now() + 3 * 60e3 }), 1);
  assert.match(outbox[0].text, /New response: Prompt\./);
});

test('guests hear about the final time, not about their own changes', async () => {
  outbox.length = 0;
  const { poll, adminToken } = (await api('POST', '/api/polls', { body: POLL })).json;
  const ana = (await api('POST', `/api/polls/${poll.id}/responses`, { body: { name: 'Ana', available: [poll.slots[0]], ifNeeded: [] } })).json;
  const auth = `Bearer ${ana.editToken}`;
  const path = `/api/polls/${poll.id}/responses/${ana.response.id}/email`;
  // Someone else's key can't manage Ana's email.
  const cy = (await api('POST', `/api/polls/${poll.id}/responses`, { body: { name: 'Cy', available: [], ifNeeded: [] } })).json;
  assert.equal((await api('PUT', path, { auth: `Bearer ${cy.editToken}`, body: { email: 'ana@example.com', updates: true } })).status, 403);

  await api('PUT', path, { auth, body: { email: 'ana@example.com', updates: true } });
  assert.match(outbox[0].text, /when the organizer picks a time or changes the poll, or when people respond/);
  assert.ok(!outbox[0].text.includes(ana.editToken)); // no link asked for
  await api('POST', '/api/email/confirm', { body: { token: tokenIn(outbox[0], '/e/confirm') } });

  // Ana's own edit: no email for Ana.
  await api('PUT', `/api/polls/${poll.id}/responses/${ana.response.id}`, { auth, body: { name: 'Ana', available: [poll.slots[1]], ifNeeded: [] } });
  outbox.length = 0;
  assert.equal(await sendDueDigests({ store, mailer, publicUrl: 'https://o.test', apiUrl: 'https://api.o.test', now: later() }), 0);

  const final = { start: poll.slots[0], end: poll.slots[0] + 3600e3 };
  await api('PATCH', `/api/polls/${poll.id}`, { auth: `Bearer ${adminToken}`, body: { final } });
  assert.equal(await sendDueDigests({ store, mailer, publicUrl: 'https://o.test', apiUrl: 'https://api.o.test', now: later() + 3600e3 }), 1);
  assert.match(outbox[0].text, /The organizer picked a time: Wednesday, Mar 3, 9:00 AM – 10:00 AM \(America\/New York time\)\./);
  assert.ok(outbox[0].text.includes(`https://o.test/p/${poll.id}`));

  // Deleting the response deletes the subscription with it.
  await api('DELETE', `/api/polls/${poll.id}/responses/${ana.response.id}`, { auth });
  assert.equal(store.db.prepare('SELECT COUNT(*) AS n FROM email_subs WHERE poll_id = ?').get(poll.id).n, 0);
});

test('"email me my link" alone stores no address, and sending is limited per address', async () => {
  outbox.length = 0;
  const { poll, adminToken } = (await api('POST', '/api/polls', { body: POLL })).json;
  const auth = `Bearer ${adminToken}`;
  const once = await api('PUT', `/api/polls/${poll.id}/email`, { auth, body: { email: 'links@example.com', link: adminToken } });
  assert.deepEqual(once.json, { email: null, confirmed: false, sent: true });
  assert.match(outbox[0].subject, /Your link for “Lab retreat”/);
  assert.equal(store.db.prepare('SELECT COUNT(*) AS n FROM email_subs WHERE email = ?').get('links@example.com').n, 0);
  assert.equal((await api('PUT', `/api/polls/${poll.id}/email`, { auth, body: { email: 'links@example.com' } })).status, 400);
  for (let i = 0; i < 4; i++) assert.equal((await api('PUT', `/api/polls/${poll.id}/email`, { auth, body: { email: 'links@example.com', link: adminToken } })).status, 200);
  assert.equal((await api('PUT', `/api/polls/${poll.id}/email`, { auth, body: { email: 'LINKS@example.com', link: adminToken } })).status, 429);
  // The stored counter is a hash, not the address.
  assert.equal(store.db.prepare("SELECT COUNT(*) AS n FROM throttle WHERE key LIKE '%links%'").get().n, 0);
});

test('deleting a poll deletes its email subscriptions and change records', async () => {
  outbox.length = 0;
  const { poll, adminToken } = (await api('POST', '/api/polls', { body: POLL })).json;
  const auth = `Bearer ${adminToken}`;
  await api('PUT', `/api/polls/${poll.id}/email`, { auth, body: { email: 'gone@example.com', updates: true } });
  await api('POST', '/api/email/confirm', { body: { token: tokenIn(outbox[0], '/e/confirm') } });
  await api('POST', `/api/polls/${poll.id}/responses`, { body: { name: 'Ana', available: [], ifNeeded: [] } });
  assert.equal(store.db.prepare('SELECT COUNT(*) AS n FROM poll_events WHERE poll_id = ?').get(poll.id).n, 1);
  await api('DELETE', `/api/polls/${poll.id}`, { auth });
  assert.equal(store.db.prepare('SELECT COUNT(*) AS n FROM email_subs WHERE poll_id = ?').get(poll.id).n, 0);
  assert.equal(store.db.prepare('SELECT COUNT(*) AS n FROM poll_events WHERE poll_id = ?').get(poll.id).n, 0);
});

test('polls nobody follows by email keep no change records', async () => {
  const { poll } = (await api('POST', '/api/polls', { body: POLL })).json;
  await api('POST', `/api/polls/${poll.id}/responses`, { body: { name: 'Quiet', available: [], ifNeeded: [] } });
  assert.equal(store.db.prepare('SELECT COUNT(*) AS n FROM poll_events WHERE poll_id = ?').get(poll.id).n, 0);
});
