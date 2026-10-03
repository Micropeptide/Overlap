import { test, expect } from '@playwright/test';
import { createPoll, isPhone } from './helpers.js';

/** Where the time list sits on screen and how far the page is scrolled: neither may move while picking a range. */
const position = (page) => page.evaluate(() => ({ y: Math.round(window.scrollY), top: Math.round(document.querySelector('.slot-list-edit').getBoundingClientRect().top) }));

test('on a phone, "Select a range" marks or clears everything between two taps, without the page moving', async ({ page, request }, info) => {
  test.skip(!isPhone(info), 'The range tool is part of the phone layout.');
  const { poll, guestPath } = await createPoll(request, { endMinute: 17 * 60 }); // 9:00 to 17:00, half hours
  await page.goto(guestPath);
  await page.getByLabel('Your name').fill('Rana');
  const range = page.getByRole('button', { name: 'Select a range' });
  await range.tap();
  await expect(range).toHaveAttribute('aria-pressed', 'true');
  const hint = page.locator('.range-hint');
  await expect(hint).toContainText('Tap where the range starts');
  const slots = page.locator('.slot-list-edit .slot-btn');

  // Scroll partway down the list, as someone would for afternoon times.
  await slots.nth(6).scrollIntoViewIfNeeded();
  const before = await position(page);
  await slots.nth(6).tap(); // 12:00
  await expect(hint).toContainText('From 12:00 PM: tap the end to mark “Available”');
  expect(await position(page)).toEqual(before);
  await slots.nth(11).tap(); // through the 2:30 block
  await expect(page.getByText('6 times available')).toBeVisible();
  expect(await position(page)).toEqual(before);
  await expect(hint).toContainText('Tap where the range starts');

  // Starting on a marked time clears instead, like a single tap would.
  await slots.nth(9).tap();
  await expect(hint).toContainText('tap the end to clear');
  await slots.nth(8).tap();
  await expect(page.getByText('4 times available')).toBeVisible();
  expect(await position(page)).toEqual(before);

  // Cancel drops a half-picked range without changing anything.
  await slots.nth(2).tap();
  await expect(slots.nth(2)).toHaveClass(/range-start/);
  await hint.getByRole('button', { name: 'Cancel' }).tap();
  await expect(slots.nth(2)).not.toHaveClass(/range-start/);
  await expect(hint.getByRole('button', { name: 'Cancel' })).toHaveCount(0);
  await expect(page.getByText('4 times available')).toBeVisible();

  // Undo brings the cleared times back in one step.
  await page.getByRole('button', { name: 'Undo' }).tap();
  await expect(page.getByText('6 times available')).toBeVisible();

  // Turning range off goes back to one time per tap.
  await range.tap();
  await expect(hint).toHaveCount(0);
  await slots.nth(0).tap();
  await expect(page.getByText('7 times available')).toBeVisible();
  await page.getByRole('button', { name: 'Submit availability' }).tap();
  await expect(page.locator('.saved-notice')).toBeVisible();
  const data = await (await request.get(`/api/polls/${poll.id}`)).json();
  expect(data.poll.responses[0].available).toEqual([poll.slots[0], ...poll.slots.slice(6, 12)]);
});

test('the range hint keeps its height on a narrow phone', async ({ page, request }, info) => {
  test.skip(!isPhone(info), 'The range tool is part of the phone layout.');
  await page.setViewportSize({ width: 320, height: 640 });
  const { guestPath } = await createPoll(request, { endMinute: 17 * 60 });
  await page.goto(guestPath);
  await page.getByRole('button', { name: 'Select a range' }).tap();
  await page.locator('label.brush-maybe').tap(); // the longest label
  const hint = page.locator('.range-hint');
  const h1 = (await hint.boundingBox()).height;
  await page.locator('.slot-list-edit .slot-btn').nth(13).tap(); // 3:30 PM
  await expect(hint).toContainText('mark “If needed”');
  expect((await hint.boundingBox()).height).toBe(h1);
});
