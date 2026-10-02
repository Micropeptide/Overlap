import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { createPoll, isPhone, markFirstTimes } from './helpers.js';

const weekly = (request, overrides = {}) => createPoll(request, { kind: 'weekly', weekdays: [1, 3], dates: undefined, ...overrides });

test('organizer creates a weekly poll from days of the week', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Event name').fill('Team standup');
  await page.getByText('Days of the week').click();
  // Weekdays are picked by default; the date calendar is out of the way.
  await expect(page.getByRole('button', { name: 'Monday' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Saturday' })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.datepicker')).toBeHidden();
  for (const day of ['Tuesday', 'Thursday', 'Friday']) await page.getByRole('button', { name: day }).click();
  await page.getByRole('button', { name: 'Create poll' }).click();

  await expect(page.getByText('Your poll is ready')).toBeVisible();
  await expect(page.getByText('Every week: Mon, Wed')).toBeVisible();
});

test('weekly form needs at least one day', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Event name').fill('Nothing');
  await page.getByText('Days of the week').click();
  for (const day of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']) await page.getByRole('button', { name: day }).click();
  await page.getByRole('button', { name: 'Create poll' }).click();
  await expect(page.getByText('Pick at least one day of the week.')).toBeVisible();
});

test('guests answer a weekly poll by weekday, and the final time repeats weekly', async ({ page, request }, info) => {
  const { poll, guestPath, managePath } = await weekly(request);
  await page.goto(guestPath);
  await expect(page.getByText('This is a weekly poll.')).toBeVisible();
  if (isPhone(info)) {
    await expect(page.locator('.day-chip').first()).toHaveAccessibleName(/^Monday/);
    await expect(page.getByRole('heading', { name: 'Monday', exact: true })).toBeVisible();
  } else {
    await expect(page.locator('.grid-edit .col-head')).toHaveText(['Mon', 'Wed']);
    await expect(page.getByRole('gridcell', { name: /^Mon, 9:00\s*AM/ })).toBeVisible();
  }
  await page.getByLabel('Your name').fill('Omar');
  await markFirstTimes(page, isPhone(info), 2);
  await page.getByRole('button', { name: 'Submit availability' }).click();
  await expect(page.locator('.saved-notice')).toContainText('Thanks, Omar.');

  await page.goto(managePath);
  const best = page.locator('.best-item').first();
  await expect(best).toContainText('Every Monday');
  await best.getByRole('button', { name: /^Choose/ }).click();
  await page.getByRole('dialog').getByLabel('Lasts').selectOption({ label: '1 hour' });
  await page.getByRole('dialog').getByRole('button', { name: 'Set final time' }).click();
  const card = page.locator('.final-card');
  await expect(card).toContainText('Every Monday');
  await expect(card).toContainText(/9:00\s*–\s*10:00\s*AM/);

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    card.getByRole('link', { name: 'Download weekly calendar invite' }).click(),
  ]);
  const ics = await readFile(await download.path(), 'utf8');
  expect(ics).toMatch(/DTSTART;TZID=America\/New_York:\d{8}T090000\r\n/);
  expect(ics).toContain('RRULE:FREQ=WEEKLY');

  await page.goto(guestPath);
  await expect(page.locator('.final-card')).toContainText('Every Monday');
  expect(poll.weekdays).toEqual([1, 3]);
});

test.describe('a guest in Tokyo', () => {
  test.use({ timezoneId: 'Asia/Tokyo' });

  test('sees an evening weekly slot on the following weekday', async ({ page, request }, info) => {
    // Monday 8–9 pm in New York is Tuesday morning in Tokyo.
    const { guestPath } = await weekly(request, { weekdays: [1], startMinute: 20 * 60, endMinute: 21 * 60 });
    await page.goto(guestPath);
    if (isPhone(info)) {
      await expect(page.getByRole('heading', { name: 'Tuesday', exact: true })).toBeVisible();
    } else {
      await expect(page.locator('.grid-edit .col-head')).toHaveText(['Tue']);
      await expect(page.getByRole('gridcell', { name: /^Tue, (9|10):00\s*AM/ })).toBeVisible();
    }
  });
});

test('organizer adds a day to a weekly poll without losing answers', async ({ page, request }) => {
  const { poll, managePath } = await weekly(request);
  await request.post(`/api/polls/${poll.id}/responses`, { data: { name: 'Pia', available: [poll.slots[0]] } });
  await page.goto(managePath);
  await page.getByRole('button', { name: 'Edit poll' }).click();
  await expect(page.getByRole('radio', { name: 'Specific dates' })).toHaveCount(0); // kind is fixed once created
  await expect(page.getByRole('button', { name: 'Wednesday' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Friday' }).click();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Every week: Mon, Wed, Fri')).toBeVisible();
  const data = await (await request.get(`/api/polls/${poll.id}`)).json();
  expect(data.poll.weekdays).toEqual([1, 3, 5]);
  expect(data.poll.responses[0].available).toEqual([poll.slots[0]]);
});
