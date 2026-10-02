import { test, expect } from '@playwright/test';
import { createPoll, respond, isPhone, markFirstTimes, expectNoHorizontalScroll } from './helpers.js';

test('guest marks times, submits, then edits their own response', async ({ page, request }, info) => {
  const phone = isPhone(info);
  const { poll, guestPath } = await createPoll(request);
  await page.goto(guestPath);
  await expect(page.getByRole('heading', { name: 'Garden planning' })).toBeVisible();
  await expect(page.getByText(/Times shown in New York \(EST, UTC−5\)/)).toBeVisible();

  // Phones get a touch layout, not a shrunken grid.
  if (phone) {
    await expect(page.locator('.day-strip')).toBeVisible();
    await expect(page.locator('.grid')).toHaveCount(0);
  } else {
    await expect(page.getByRole('grid', { name: 'Your availability' })).toBeVisible();
  }

  await page.getByLabel('Your name').fill('Sam');
  await markFirstTimes(page, phone, 3);
  await expect(page.getByText('3 times available')).toBeVisible();
  await expectNoHorizontalScroll(page);
  await page.getByRole('button', { name: 'Submit availability' }).click();
  await expect(page.locator('.saved-notice').getByText('Thanks, Sam. Your times are in.')).toBeVisible();
  const editLink = await page.getByLabel('Your private edit link').inputValue();
  expect(editLink).toMatch(new RegExp(`/p/${poll.id}#r=[A-Za-z0-9_-]{32}$`));

  let data = await (await request.get(`/api/polls/${poll.id}`)).json();
  expect(data.poll.responses).toHaveLength(1);
  expect(data.poll.responses[0].available).toEqual(poll.slots.slice(0, 3));

  // Coming back in the same browser opens their response for editing.
  await page.reload();
  await expect(page.getByRole('tab', { name: 'Your response' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByLabel('Your name')).toHaveValue('Sam');
  await page.locator('.brush-maybe').click();
  if (phone) {
    await page.locator('.slot-list-edit .slot-btn').nth(3).tap();
    await expect(page.locator('.slot-list-edit .slot-btn').nth(3)).toHaveText(/If needed/);
  } else {
    const cols = await page.locator('.grid-edit .col-head').count();
    await page.locator('.grid-edit .cell[data-slot]').nth(3 * cols).click();
  }
  await expect(page.getByText('3 times available, 1 if needed')).toBeVisible();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.locator('#toast')).toHaveText('Saved your changes');

  data = await (await request.get(`/api/polls/${poll.id}`)).json();
  expect(data.poll.responses[0].ifNeeded).toEqual([poll.slots[3]]);

  // Group results are visible by default.
  await page.getByRole('tab', { name: /Group results/ }).click();
  await expect(page.getByText('Works for the one response so far')).toBeVisible();
});

test('keyboard users can mark times on the grid', async ({ page, request }, info) => {
  test.skip(isPhone(info), 'The keyboard grid is the desktop layout.');
  const { poll, guestPath } = await createPoll(request);
  await page.goto(guestPath);
  const cells = page.locator('.grid-edit .cell[data-slot]');
  await cells.first().focus();
  await page.keyboard.press('Space');
  await expect(cells.first()).toHaveAttribute('aria-selected', 'true');
  await expect(cells.first()).toHaveAttribute('aria-label', /9:00\s*AM, available/);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Shift+ArrowDown');
  await expect(cells.nth(4)).toHaveAttribute('aria-selected', 'true'); // two columns: index 4 is row 3, column 1
  await expect(page.getByText('2 times available')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(cells.nth(5)).toBeFocused();
  await page.getByLabel('Your name').fill('Kim');
  await page.getByRole('button', { name: 'Submit availability' }).click();
  await expect(page.locator('.saved-notice').getByText('Thanks, Kim. Your times are in.')).toBeVisible();
  const data = await (await request.get(`/api/polls/${poll.id}`)).json();
  expect(data.poll.responses[0].available).toEqual([poll.slots[0], poll.slots[2]]);
});

test('a second guest using the same name cannot overwrite the first', async ({ page, request }, info) => {
  const { poll, guestPath } = await createPoll(request);
  await respond(request, poll.id, { name: 'Alex', available: [poll.slots[0]] });
  await page.goto(guestPath);
  await page.getByLabel('Your name').fill('alex');
  await markFirstTimes(page, isPhone(info), 2);
  await page.getByRole('button', { name: 'Submit availability' }).click();
  await expect(page.getByText(/Someone already responded as “alex”/)).toBeVisible();
  await expect(page.getByLabel('Your name')).toHaveAttribute('aria-invalid', 'true');
  const data = await (await request.get(`/api/polls/${poll.id}`)).json();
  expect(data.poll.responses).toHaveLength(1);
  expect(data.poll.responses[0].available).toEqual([poll.slots[0]]);
});

test('a private edit link opens the response on another device', async ({ page, request }) => {
  const { poll } = await createPoll(request);
  const { editToken } = await respond(request, poll.id, { name: 'Riley', available: [poll.slots[1]] });
  await page.goto(`/p/${poll.id}#r=${editToken}`);
  await expect(page.getByLabel('Your name')).toHaveValue('Riley');
  await expect(page.getByRole('button', { name: 'Save changes' })).toBeVisible();
  // The key is moved into this browser and taken out of the address bar.
  expect(page.url()).not.toContain('#r=');

  await page.getByRole('button', { name: 'Delete my response' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete response' }).click();
  await expect(page.getByRole('button', { name: 'Submit availability' })).toBeVisible();
  const data = await (await request.get(`/api/polls/${poll.id}`)).json();
  expect(data.poll.responses).toHaveLength(0);
});

test('the guest link and guest keys never open organizer controls', async ({ page, request }) => {
  const { poll, guestPath } = await createPoll(request);
  const { editToken } = await respond(request, poll.id, { name: 'Gus', available: [] });

  await page.goto(guestPath);
  await expect(page.getByRole('heading', { name: 'Garden planning' })).toBeVisible();
  for (const name of ['Close poll', 'Delete poll now', 'Edit poll', 'Replace']) {
    await expect(page.getByRole('button', { name })).toHaveCount(0);
  }
  await expect(page.getByText('Private link')).toHaveCount(0);

  await page.goto(`/m/${poll.id}`);
  await expect(page.getByRole('heading', { name: 'Open this page with your private link' })).toBeVisible();
  await page.goto('/privacy');
  await page.goto(`/m/${poll.id}#k=${editToken}`);
  await expect(page.getByRole('heading', { name: 'This private link no longer works' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close poll' })).toHaveCount(0);
});

test('when the organizer hides responses, guests only see their own', async ({ page, request }) => {
  const { poll, guestPath } = await createPoll(request, { resultsVisibility: 'organizer' });
  await respond(request, poll.id, { name: 'Hidden Hana', available: [poll.slots[0]] });
  await page.goto(guestPath);
  await expect(page.getByText('Only the organizer can see responses').first()).toBeVisible();
  await expect(page.getByText('Hidden Hana')).toHaveCount(0);
  await expect(page.getByRole('tab', { name: /Group results/ })).toHaveCount(0);
});
