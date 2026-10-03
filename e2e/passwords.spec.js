import { test, expect } from '@playwright/test';
import { createPoll, isPhone, markFirstTimes } from './helpers.js';

test('a guest adds a password, then signs in on another device with their name', async ({ page, browser, request }, info) => {
  const phone = isPhone(info);
  const { poll, guestPath } = await createPoll(request);
  await page.goto(guestPath);
  await page.getByLabel('Your name').fill('Rosa');
  await markFirstTimes(page, phone, 2);
  await page.getByText('Add a password (optional)').click();
  await page.getByLabel('Password', { exact: true }).fill('short');
  await page.getByRole('button', { name: 'Submit availability' }).click();
  await expect(page.getByRole('alert')).toContainText('Use at least 8 characters.');
  await page.getByLabel('Password', { exact: true }).fill('marigold-42');
  await page.getByRole('button', { name: 'Submit availability' }).click();
  await expect(page.locator('.saved-notice')).toContainText('sign in with your name and password');
  await expect(page.locator('main')).not.toContainText(/\bnull\b|undefined/);

  // The password never reaches the server; only a hash of a derived key is stored.
  const stored = await (await request.get(`/api/polls/${poll.id}`)).text();
  expect(stored).not.toContain('marigold');

  // A fresh browser: no private link, just the guest link.
  const other = await browser.newContext({ ...(phone ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : {}), timezoneId: 'America/New_York' });
  const p2 = await other.newPage();
  await p2.goto(guestPath);
  await p2.getByRole('button', { name: 'Sign in with your name and password' }).click();
  const dialog = p2.getByRole('dialog', { name: 'Sign in to your response' });
  await dialog.getByLabel('Your name').fill('rosa');
  await dialog.getByLabel('Password').fill('wrong password');
  await dialog.getByRole('button', { name: 'Sign in' }).click();
  await expect(dialog.getByRole('alert')).toContainText('don’t match');
  await dialog.getByLabel('Password').fill('marigold-42');
  await dialog.getByRole('button', { name: 'Sign in' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(p2.getByRole('tab', { name: 'Your response' })).toBeVisible();
  await expect(p2.getByLabel('Your name')).toHaveValue('Rosa');
  await expect(p2.getByText('2 times available')).toBeVisible();

  // Edits from the second device save under the same response.
  await p2.getByLabel('Note').fill('From my phone');
  await p2.getByRole('button', { name: 'Save changes' }).click();
  await expect(p2.getByText('Saved your changes').first()).toBeAttached();
  const data = await (await request.get(`/api/polls/${poll.id}`)).json();
  expect(data.poll.responses).toHaveLength(1);
  expect(data.poll.responses[0].note).toBe('From my phone');
  await other.close();
});

test('the organizer sets a password and manages the poll from the guest link elsewhere', async ({ page, browser, request }) => {
  const { poll, managePath, guestPath } = await createPoll(request);
  await page.goto(managePath);
  await page.getByRole('button', { name: 'Set password' }).click();
  const dlg = page.getByRole('dialog', { name: 'Set an organizer password' });
  await dlg.getByLabel('New password').fill('lighthouse-keeper');
  await dlg.getByLabel('Type it again').fill('lighthouse-keepr');
  await dlg.getByRole('button', { name: 'Save password' }).click();
  await expect(dlg.getByRole('alert')).toContainText('don’t match');
  await dlg.getByLabel('Type it again').fill('lighthouse-keeper');
  await dlg.getByRole('button', { name: 'Save password' }).click();
  await expect(dlg).toHaveCount(0);
  await expect(page.locator('.settings-row').filter({ hasText: 'Organizer password' })).toContainText('On');

  const other = await browser.newContext({ timezoneId: 'America/New_York' });
  const p2 = await other.newPage();
  await p2.goto(guestPath);
  await p2.getByRole('button', { name: 'Organizer? Manage with your password' }).click();
  const m = p2.getByRole('dialog', { name: 'Manage this poll' });
  await m.getByLabel('Organizer password').fill('lighthouse');
  await m.getByRole('button', { name: 'Open organizer view' }).click();
  await expect(m.getByRole('alert')).toContainText('isn’t right');
  await m.getByLabel('Organizer password').fill('lighthouse-keeper');
  await m.getByRole('button', { name: 'Open organizer view' }).click();
  await expect(p2).toHaveURL(new RegExp(`/m/${poll.id}#k=`));
  await expect(p2.getByText('Signed in with your password')).toBeVisible();
  await expect(p2.locator('main')).not.toContainText(/\bnull\b|undefined/);
  // Signed in by password, the organizer can't remove it (they'd lock themselves out) but can get a link.
  await expect(p2.locator('.settings-row').filter({ hasText: 'Organizer password' }).getByRole('button', { name: 'Remove' })).toHaveCount(0);
  await p2.getByRole('button', { name: 'Create a new private link' }).click();
  await p2.getByRole('dialog').getByRole('button', { name: 'Replace private link' }).click();
  await expect(p2.getByLabel('Private link: keep this to yourself')).toHaveValue(new RegExp(`/m/${poll.id}#k=[A-Za-z0-9_-]{32}$`));
  await other.close();
});

test('a new poll can start with an organizer password', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Event name').fill('Password poll');
  await page.getByRole('button', { name: 'Next 7 days' }).click();
  await page.getByText('More options').click();
  await page.getByLabel('Organizer password').fill('first-light-7');
  await page.getByRole('button', { name: 'Create poll' }).click();
  await expect(page).toHaveURL(/\/m\/[a-z0-9]+#k=/);
  await expect(page.locator('.settings-row').filter({ hasText: 'Organizer password' })).toContainText('On');
});
