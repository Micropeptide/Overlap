import { test, expect } from '@playwright/test';
import { createPoll, daysFromNow, isPhone, expectNoHorizontalScroll } from './helpers.js';

const pollOf = async (request, id) => (await (await request.get(`/api/polls/${id}`)).json()).poll;

test('an organizer gives one day shorter hours when creating a poll', async ({ page, request }, info) => {
  test.skip(isPhone(info), 'One run is enough for the form; the phone layout has its own test.');
  await page.goto('/');
  await page.getByLabel('Event name').fill('Study group');
  const days = [daysFromNow(20), daysFromNow(21)];
  for (const d of days) {
    for (let i = 0; i < 3 && !(await page.locator(`[data-date="${d}"]`).count()); i++) {
      await page.getByRole('button', { name: 'Next month' }).click();
    }
    await page.locator(`[data-date="${d}"]`).click();
  }
  await page.getByLabel('Earliest start', { exact: true }).selectOption({ label: '9:00 AM' });
  await page.getByLabel('Latest end', { exact: true }).selectOption({ label: '5:00 PM' });
  await page.getByLabel('Different hours on some days').check();
  const second = await page.evaluate((d) => new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(Date.parse(`${d}T12:00:00Z`)), days[1]);
  await page.getByLabel(`Earliest start on ${second}`).selectOption({ label: '1:00 PM' });
  await page.getByLabel(`Latest end on ${second}`).selectOption({ label: '3:00 PM' });
  await page.getByRole('button', { name: 'Create poll' }).click();
  await expect(page).toHaveURL(/\/m\/[a-z0-9]+#k=/);
  await expect(page.getByText(/Hours vary by day/).first()).toBeVisible();

  const id = page.url().match(/\/m\/([a-z0-9]+)/)[1];
  const poll = await pollOf(request, id);
  expect(poll.dayHours).toEqual({ [days[1]]: [780, 900] });
  expect(poll.slots.length).toBe(16 + 4);

  await page.goto(`/p/${id}`);
  await expect(page.locator('.grid-edit .cell.none').first()).toBeAttached();
});

test('editing shows the day hours, and turning them off clears them', async ({ page, request }) => {
  const { poll, managePath } = await createPoll(request, { dayHours: { '2027-03-04': [600, 660] } });
  await page.goto(managePath);
  await page.getByRole('button', { name: 'Edit poll' }).first().click();
  const toggle = page.getByLabel('Different hours on some days');
  await expect(toggle).toBeChecked();
  await expect(page.getByLabel('Earliest start on Thu, Mar 4')).toHaveValue('600');
  await expect(page.getByLabel('Latest end on Thu, Mar 4')).toHaveValue('660');
  await expect(page.getByLabel('Earliest start on Wed, Mar 3')).toHaveValue('540');
  await toggle.uncheck();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Saved your changes')).toBeVisible();
  expect((await pollOf(request, poll.id)).dayHours).toEqual({});
  await expect(page.getByText(/9:00\s*AM to 12:00\s*PM/).first()).toBeVisible();
});

test('changing the time step snaps day hours', async ({ page, request }) => {
  const { poll, managePath } = await createPoll(request, { dayHours: { '2027-03-04': [630, 690] } });
  await page.goto(managePath);
  await page.getByRole('button', { name: 'Edit poll' }).first().click();
  await page.getByLabel('Time steps').selectOption({ label: '1 hour' });
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Saved your changes')).toBeVisible();
  expect((await pollOf(request, poll.id)).dayHours).toEqual({ '2027-03-04': [660, 720] });
});

test('day hours rows fit on a phone', async ({ page, request }, info) => {
  test.skip(!isPhone(info), 'Phone layout.');
  const dates = Array.from({ length: 30 }, (_, i) => daysFromNow(10 + i));
  const { managePath } = await createPoll(request, { dates });
  await page.goto(managePath);
  await page.getByRole('button', { name: 'Edit poll' }).first().click();
  await page.getByLabel('Different hours on some days').check();
  await expect(page.locator('.day-hours-row')).toHaveCount(30);
  await expectNoHorizontalScroll(page);
});

test('duplicating a poll keeps its day hours', async ({ page, request }) => {
  const { managePath } = await createPoll(request, { dayHours: { '2027-03-04': [600, 660] } });
  await page.goto(managePath);
  await page.getByRole('button', { name: 'Duplicate poll' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByLabel('Different hours on some days')).toBeChecked();
  await expect(page.getByLabel('Earliest start on Thu, Mar 4')).toHaveValue('600');
});

test('a day’s end picked before its start moves the start, so the row stays valid', async ({ page, request }, info) => {
  test.skip(isPhone(info), 'Same in every layout.');
  const { poll, managePath } = await createPoll(request);
  await page.goto(managePath);
  await page.getByRole('button', { name: 'Edit poll' }).first().click();
  await page.getByLabel('Different hours on some days').check();
  const start = page.getByLabel('Earliest start on Thu, Mar 4');
  const end = page.getByLabel('Latest end on Thu, Mar 4');
  await expect(start).toHaveAttribute('aria-describedby', 'err-dayHours');
  await end.selectOption({ label: '9:00 AM' }); // the row starts at 9:00 AM
  await expect(start).toHaveValue('480');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Saved your changes')).toBeVisible();
  expect((await pollOf(request, poll.id)).dayHours).toEqual({ '2027-03-04': [480, 540] });
});
