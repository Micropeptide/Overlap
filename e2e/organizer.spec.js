import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { createPoll, respond, daysFromNow, isPhone, expectNoHorizontalScroll, openBestTimes } from './helpers.js';

test('organizer creates a poll and gets two clearly labeled links', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Event name').fill('Team dinner');
  for (const d of [daysFromNow(20), daysFromNow(21)]) {
    for (let i = 0; i < 3 && !(await page.locator(`[data-date="${d}"]`).count()); i++) {
      await page.getByRole('button', { name: 'Next month' }).click();
    }
    await page.locator(`[data-date="${d}"]`).click();
  }
  await expect(page.getByText('2 dates picked')).toBeVisible();
  await page.getByLabel('Earliest start').selectOption({ label: '10:00 AM' });
  await page.getByLabel('Latest end').selectOption({ label: '1:00 PM' });
  await expect(page.getByText(/In New York \(E[SD]T, UTC−[45]\)/)).toBeVisible();

  // Advanced choices stay tucked away until asked for.
  await expect(page.getByLabel('Meeting length')).toBeHidden();
  await page.getByText('More options').click();
  await page.getByLabel('Meeting length').selectOption({ label: '1 hour' });

  await page.getByRole('button', { name: 'Create poll' }).click();
  await expect(page).toHaveURL(/\/m\/[a-z0-9]+#k=/);
  await expect(page.getByText('Your poll is ready')).toBeVisible();

  const guest = await page.getByLabel('Guest link: share this one').inputValue();
  const priv = await page.getByLabel('Private link: keep this to yourself').inputValue();
  expect(guest).toMatch(/\/p\/[a-z0-9]{12}$/);
  expect(priv).toMatch(/\/m\/[a-z0-9]{12}#k=[A-Za-z0-9_-]{32}$/);
  expect(guest).not.toContain('#');
  await expect(page.getByText('Anyone with this link can manage the poll')).toBeVisible();
  await expect(page.getByText('No responses yet').first()).toBeVisible();
  await expectNoHorizontalScroll(page);
});

test('poll form explains what is missing', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create poll' }).click();
  await expect(page.getByText('Give your event a name so guests know what it’s for.')).toBeVisible();
  await expect(page.getByLabel('Event name')).toBeFocused();
  await page.getByLabel('Event name').fill('Picnic');
  await page.getByRole('button', { name: 'Create poll' }).click();
  await expect(page.getByText('Pick at least one date.')).toBeVisible();
});

test('organizer sees the overlap, picks a final time, and guests see it', async ({ page, request }) => {
  const { poll, managePath, guestPath } = await createPoll(request, { durationMinutes: 60 });
  const s = poll.slots;
  await respond(request, poll.id, { name: 'Ana', available: [s[0], s[1], s[2], s[3]] });
  await respond(request, poll.id, { name: 'Ben', available: [s[2], s[3], s[4]] });
  await respond(request, poll.id, { name: 'Cy', available: [s[2]], ifNeeded: [s[3]] });

  await page.goto(managePath);
  // Collapsed, the section still names the top answer.
  await expect(page.locator('details.best summary')).toContainText(/Works for everyone: Wed, Mar 3, 10:00\s*–\s*11:00\s*AM/);
  await openBestTimes(page);
  await expect(page.getByText('Everyone can make these (3 people)')).toBeVisible();
  const best = page.locator('.best-item.everyone').first();
  await expect(best).toContainText(/10:00\s*–\s*11:00\s*AM/);
  await expect(best).toContainText('3 of 3 available');
  await expect(best).toContainText('1 if needed');
  // Partial options that only repeat this one with fewer people are left out (see test/overlap.test.js).

  await best.getByRole('button', { name: /^Choose/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Choose the final time' });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.final-preview')).toContainText(/10:00\s*–\s*11:00\s*AM/);
  await dialog.getByRole('button', { name: 'Set final time' }).click();

  const card = page.locator('.final-card');
  await expect(card).toContainText(/10:00\s*–\s*11:00\s*AM/);
  await expect(card).toContainText('Wednesday, March 3, 2027');
  await expect(page.locator('.status-chip')).toHaveText('Final time chosen');

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    card.getByRole('link', { name: 'Download calendar invite' }).click(),
  ]);
  const ics = await readFile(await download.path(), 'utf8');
  expect(ics).toContain('DTSTART:20270303T150000Z'); // 10:00 New York (EST) is 15:00 UTC
  expect(ics).toContain('DTEND:20270303T160000Z');
  expect(ics).toContain('SUMMARY:Garden planning');

  await page.goto(guestPath);
  await expect(page.getByText('It’s set. The organizer chose a time.')).toBeVisible();
  await expect(page.locator('.final-card')).toContainText(/10:00\s*–\s*11:00\s*AM/);
  await expect(page.getByRole('button', { name: 'Submit availability' })).toHaveCount(0);
});

test('results keep available, if needed, unavailable and unanswered distinct', async ({ page, request }, info) => {
  const { poll, adminToken, managePath } = await createPoll(request, { dates: ['2027-03-03'] });
  const s = poll.slots;
  await respond(request, poll.id, { name: 'Dee', available: [s[0]], ifNeeded: [s[1]] });
  // Add a day after Dee answered: those times are "not answered" for Dee.
  const res = await request.patch(`/api/polls/${poll.id}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
    data: { dates: ['2027-03-03', '2027-03-04'] },
  });
  expect(res.status()).toBe(200);

  await page.goto(managePath);
  await page.getByRole('button', { name: /^Dee/ }).click();
  await expect(page.getByText('Showing Dee')).toBeVisible();
  if (isPhone(info)) {
    const states = page.locator('.slot-list-results .slot-state');
    await expect(states.nth(0)).toHaveText('Available');
    await expect(states.nth(1)).toHaveText('If needed');
    await expect(states.nth(2)).toHaveText('Not available');
    await page.locator('.day-chip').nth(1).click();
    await expect(page.locator('.slot-list-results .slot-state').first()).toHaveText('Not answered');
  } else {
    await expect(page.locator('.grid-results .cell.st-yes')).toHaveCount(1);
    await expect(page.locator('.grid-results .cell.st-maybe')).toHaveCount(1);
    await expect(page.locator('.grid-results .cell.st-no')).toHaveCount(4);
    await expect(page.locator('.grid-results .cell.st-unanswered')).toHaveCount(6);
    // Each state looks different.
    const bg = (cls) => page.locator(`.grid-results .cell.${cls}`).first().evaluate((el) => { const st = getComputedStyle(el, '::before'); return st.backgroundImage + st.backgroundColor; });
    const looks = await Promise.all(['st-yes', 'st-maybe', 'st-no', 'st-unanswered'].map(bg));
    expect(new Set(looks).size).toBe(4);
  }
});

test('organizer replaces the private link and the old one stops working', async ({ page, request }) => {
  const { poll, managePath } = await createPoll(request);
  await page.goto(managePath);
  const before = await page.getByLabel('Private link: keep this to yourself').inputValue();
  await page.getByRole('button', { name: 'Replace' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Replace private link' }).click();
  await expect(page.getByLabel('Private link: keep this to yourself')).not.toHaveValue(before);
  const after = await page.getByLabel('Private link: keep this to yourself').inputValue();
  expect(await page.getByLabel('Guest link: share this one').inputValue()).toMatch(new RegExp(`/p/${poll.id}$`));

  await page.goto('/privacy');
  await page.goto(before);
  await expect(page.getByRole('heading', { name: 'This private link no longer works' })).toBeVisible();
  await page.goto('/privacy');
  await page.goto(after);
  await expect(page.getByRole('heading', { name: 'Garden planning' })).toBeVisible();
});

test('organizer closes and reopens a poll', async ({ page, request }) => {
  const { managePath, guestPath } = await createPoll(request);
  await page.goto(managePath);
  await page.getByRole('button', { name: 'Close poll' }).click();
  await expect(page.locator('.status-chip')).toHaveText('Closed');
  await page.goto(guestPath);
  await expect(page.getByText('This poll is closed')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Submit availability' })).toHaveCount(0);
  await page.goto('/privacy');
  await page.goto(managePath);
  await page.getByRole('button', { name: 'Reopen poll' }).click();
  await expect(page.locator('.status-chip')).toHaveText('Open for responses');
});

test('organizer deletes a poll and every link stops working', async ({ page, request }) => {
  const { poll, managePath, guestPath } = await createPoll(request);
  await respond(request, poll.id, { name: 'Eve', available: [poll.slots[0]] });
  await page.goto(managePath);
  await page.getByRole('button', { name: 'Delete poll now' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete poll' }).click();
  await expect(page.getByRole('heading', { name: 'Poll deleted' })).toBeVisible();
  await page.goto(guestPath);
  await expect(page.getByRole('heading', { name: 'This poll isn’t here' })).toBeVisible();
  expect((await request.get(`/api/polls/${poll.id}`)).status()).toBe(404);
});

test('organizer page fits the screen', async ({ page, request }) => {
  const { poll, managePath } = await createPoll(request, { dates: ['2027-03-01', '2027-03-02', '2027-03-03', '2027-03-04', '2027-03-05', '2027-03-08', '2027-03-09'] });
  await respond(request, poll.id, { name: 'Fay', available: poll.slots.slice(0, 5) });
  await page.goto(managePath);
  await expect(page.getByRole('heading', { name: 'Garden planning' })).toBeVisible();
  await expectNoHorizontalScroll(page);
});
