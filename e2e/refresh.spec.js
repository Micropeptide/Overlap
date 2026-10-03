import { test, expect } from '@playwright/test';
import { createPoll, respond, isPhone, markFirstTimes, scrollGridToTop } from './helpers.js';

// Pretend the person just came back to the tab, which triggers a refresh.
const comeBack = (page) => page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));

test('a refresh during a drag waits, and nothing scrolls by itself afterwards', async ({ page, request }, info) => {
  test.skip(isPhone(info), 'Drag painting is the desktop grid.');
  const { poll, guestPath } = await createPoll(request);
  await page.goto(guestPath);
  await scrollGridToTop(page);
  const cells = page.locator('.grid-edit .cell[data-slot]');
  const a = await cells.nth(0).boundingBox();
  const b = await cells.nth(4).boundingBox();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 3 });
  await respond(request, poll.id, { name: 'Interrupter', available: [poll.slots[0]] });
  await comeBack(page);
  await page.waitForTimeout(300);
  await page.mouse.up();
  await expect(page.getByText('3 times available')).toBeVisible();
  const y = await page.evaluate(() => window.scrollY);
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => window.scrollY)).toBe(y);
  // The postponed refresh happens on the next check.
  await comeBack(page);
  await expect(page.getByRole('tab', { name: 'Group results (1)' })).toBeVisible();
  await expect(page.getByText('3 times available')).toBeVisible();
});

test('guests see the organizer’s edits when they come back to the tab', async ({ page, request }) => {
  const { poll, adminToken, guestPath } = await createPoll(request, { dates: ['2027-03-03'] });
  await page.goto(guestPath);
  await expect(page.locator('.facts')).toContainText('Wed, Mar 3');
  await request.patch(`/api/polls/${poll.id}`, { headers: { Authorization: `Bearer ${adminToken}` }, data: { dates: ['2027-03-03', '2027-03-04'], location: 'Room 9' } });
  await comeBack(page);
  await expect(page.getByText('Room 9')).toBeVisible();
  await expect(page.getByText('2 dates, Mar 3 to Mar 4')).toBeVisible();
});

test('undo survives switching tabs, and undoing everything leaves nothing to restore', async ({ page, request }, info) => {
  const { poll, guestPath } = await createPoll(request);
  await respond(request, poll.id, { name: 'Other', available: [] });
  page.on('dialog', (d) => d.accept());
  await page.goto(guestPath);
  await markFirstTimes(page, isPhone(info), 2);
  await page.getByRole('tab', { name: /Group results/ }).click();
  await page.getByRole('tab', { name: /Your availability/ }).click();
  await expect(page.getByRole('button', { name: 'Undo' })).toBeEnabled();
  const undo = page.getByRole('button', { name: 'Undo' });
  while (await undo.isEnabled()) await undo.click();
  await expect(page.getByText('No times marked yet')).toBeVisible();
  await page.waitForTimeout(400);
  await page.reload();
  await expect(page.getByText('We restored the changes')).toHaveCount(0);
});

test('organizer refresh keeps focus, the person filter and the numbers toggle', async ({ page, request }, info) => {
  const { poll, managePath } = await createPoll(request);
  await respond(request, poll.id, { name: 'Ann', available: [poll.slots[0]] });
  await page.goto(managePath);
  const ann = page.getByRole('button', { name: /^Ann/ });
  await ann.click();
  if (!isPhone(info)) await page.getByLabel('Show numbers').check();
  await ann.focus();
  await respond(request, poll.id, { name: 'Bo', available: [poll.slots[1]] });
  await comeBack(page);
  await expect(page.getByText('Responses (2)')).toBeVisible();
  await expect(page.getByRole('button', { name: /^Ann/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: /^Ann/ })).toBeFocused();
  if (!isPhone(info)) await expect(page.getByLabel('Show numbers')).toBeChecked();
});

test('the phone keeps the chosen day through a refresh', async ({ page, request }, info) => {
  test.skip(!isPhone(info), 'Phone layout only.');
  const { poll, guestPath } = await createPoll(request);
  await page.goto(guestPath);
  await page.locator('.day-chip').nth(1).click();
  await respond(request, poll.id, { name: 'Late', available: [] });
  await comeBack(page);
  await expect(page.getByRole('tab', { name: 'Group results (1)' })).toBeVisible();
  await expect(page.locator('.day-chip').nth(1)).toHaveAttribute('aria-pressed', 'true');
});

test('links in text are built carefully', async ({ page, request }) => {
  const { guestPath } = await createPoll(request, { description: 'Docs (see https://ex.com/a_(b)). Also «https://ex.org/x» and https://. and javascript:alert(1)' });
  await page.goto(guestPath);
  const links = page.locator('.poll-desc a');
  await expect(links).toHaveCount(2);
  await expect(links.nth(0)).toHaveAttribute('href', 'https://ex.com/a_(b)');
  await expect(links.nth(1)).toHaveAttribute('href', 'https://ex.org/x');
});
