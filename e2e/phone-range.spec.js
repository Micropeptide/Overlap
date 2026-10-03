import { test, expect } from '@playwright/test';
import { createPoll, isPhone } from './helpers.js';

test('on a phone, "Select a range" fills everything between two taps', async ({ page, request }, info) => {
  test.skip(!isPhone(info), 'The range tool is part of the phone layout.');
  const { poll, guestPath } = await createPoll(request); // 9:00 to 12:00, half-hour steps
  await page.goto(guestPath);
  await page.getByLabel('Your name').fill('Rana');
  const range = page.getByRole('button', { name: 'Select a range' });
  await range.tap();
  await expect(range).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.range-hint')).toContainText('tap the first time, then the last');
  const slots = page.locator('.slot-list-edit .slot-btn');
  await slots.nth(1).tap();
  await expect(page.locator('.range-hint')).toContainText('From 9:30 AM');
  await slots.nth(4).tap(); // 9:30 through the 11:00 block
  await expect(page.getByText('4 times available')).toBeVisible();
  await expect(slots.nth(0)).toHaveAttribute('aria-pressed', 'false');
  await expect(slots.nth(5)).toHaveAttribute('aria-pressed', 'false');

  // Erase a smaller range, tapping the end first.
  await page.locator('label.brush-erase').tap();
  await slots.nth(3).tap();
  await slots.nth(2).tap();
  await expect(page.getByText('2 times available')).toBeVisible();

  // Undo brings the range back in one step.
  await page.getByRole('button', { name: 'Undo' }).tap();
  await expect(page.getByText('4 times available')).toBeVisible();

  // Turning range off goes back to one time per tap.
  await range.tap();
  await page.locator('label.brush-yes').tap();
  await slots.nth(0).tap();
  await expect(page.getByText('5 times available')).toBeVisible();
  await page.getByRole('button', { name: 'Submit availability' }).tap();
  await expect(page.locator('.saved-notice')).toBeVisible();
  const data = await (await request.get(`/api/polls/${poll.id}`)).json();
  expect(data.poll.responses[0].available).toEqual(poll.slots.slice(0, 5));
});
