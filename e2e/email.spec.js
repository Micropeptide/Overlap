import { test, expect } from '@playwright/test';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { createPoll, respond } from './helpers.js';

const OUTBOX = 'data-test/outbox';
const mailTo = (address) => (existsSync(OUTBOX) ? readdirSync(OUTBOX).sort() : [])
  .map((f) => JSON.parse(readFileSync(`${OUTBOX}/${f}`, 'utf8')))
  .filter((m) => m.to === address);

test.beforeEach(async ({ request }) => {
  const cfg = await (await request.get('/api/config')).json();
  test.skip(!cfg.emails, 'Email is not set up on this server.');
});

test('the organizer emails themselves their link and confirms updates', async ({ page, request }, info) => {
  const address = `org-${info.project.name}@example.com`;
  const { poll, adminToken, managePath } = await createPoll(request);
  await page.goto(managePath);
  const row = page.locator('.email-row');
  await expect(row).toContainText('Get your private link by email');
  await row.getByRole('button', { name: 'Email me' }).click();
  const dlg = page.getByRole('dialog', { name: 'Email me' });
  await expect(dlg).toContainText('Nobody else sees it');
  await dlg.getByLabel('Email address').fill(address);
  await dlg.getByRole('button', { name: 'Send' }).click();
  await expect(dlg).toHaveCount(0);
  await expect(row).toContainText(`Waiting for you to confirm ${address}`);

  const [mail] = mailTo(address);
  expect(mail.text).toContain(`/m/${poll.id}#k=${adminToken}`);
  const confirm = /(\/e\/confirm#t=[A-Za-z0-9_-]+)/.exec(mail.text)[1];
  await page.goto(confirm);
  await expect(page.getByRole('heading', { name: 'Emails are on' })).toBeVisible();
  await expect(page).toHaveURL(/\/e\/confirm$/); // the key is dropped from the address bar

  await page.goto(managePath);
  await expect(row).toContainText(`Updates go to ${address}`);
  await row.getByRole('button', { name: 'Stop emails' }).click();
  await expect(row).toContainText('Get your private link by email');
  const left = await (await request.get(`/api/polls/${poll.id}/email`, { headers: { Authorization: `Bearer ${adminToken}` } })).json();
  expect(left.email).toBeNull();
});

test('a guest asks for their edit link by email without staying subscribed', async ({ page, request }, info) => {
  const address = `guest-${info.project.name}@example.com`;
  const { poll, guestPath } = await createPoll(request);
  const { editToken, response } = await respond(request, poll.id, { name: 'Tess', available: [poll.slots[0]] });
  await page.goto(`${guestPath}#r=${editToken}`);
  const control = page.locator('.email-control');
  await control.getByRole('button', { name: 'Email me' }).click();
  const dlg = page.getByRole('dialog', { name: 'Email me' });
  await dlg.getByLabel('Email address').fill(address);
  await dlg.getByText(/Email me when the organizer picks a time/).click(); // untick updates
  await dlg.getByRole('button', { name: 'Send' }).click();
  await expect(dlg).toHaveCount(0);
  await expect(control).toContainText('Get your edit link by email');
  const [mail] = mailTo(address);
  expect(mail.subject).toBe('Your link for “Garden planning”');
  expect(mail.text).toContain(`/p/${poll.id}#r=${editToken}`);
  const sub = await (await request.get(`/api/polls/${poll.id}/responses/${response.id}/email`, { headers: { Authorization: `Bearer ${editToken}` } })).json();
  expect(sub.email).toBeNull();
});

test('a stale unsubscribe link changes nothing and says so', async ({ page, request }, info) => {
  const address = `unsub-${info.project.name}@example.com`;
  const { poll, adminToken } = await createPoll(request);
  const auth = { Authorization: `Bearer ${adminToken}` };
  await request.put(`/api/polls/${poll.id}/email`, { headers: auth, data: { email: address, updates: true } });
  const [mail] = mailTo(address);
  await request.post('/api/email/confirm', { data: { token: /confirm#t=([A-Za-z0-9_-]+)/.exec(mail.text)[1] } });
  // A wrong key changes nothing.
  await page.goto('/e/unsubscribe#t=not-a-real-token');
  await expect(page.getByRole('heading', { name: 'Emails were already stopped' })).toBeVisible();
  expect((await (await request.get(`/api/polls/${poll.id}/email`, { headers: auth })).json()).email).toBe(address);

  // A made-up confirmation key is refused too.
  expect((await request.post('/api/email/confirm', { data: { token: 'nope' } })).status()).toBe(404);
});
