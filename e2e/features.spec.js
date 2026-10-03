import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { createPoll, respond, isPhone, markFirstTimes, expectNoHorizontalScroll } from './helpers.js';

async function tapOrClickSlot(page, phone, index) {
  if (phone) return page.locator('.slot-list-edit .slot-btn').nth(index).tap();
  const cols = await page.locator('.grid-edit .col-head').count();
  return page.locator('.grid-edit .cell[data-slot]').nth(index * cols).click();
}

test('preferred, erase, undo and a note all reach the organizer', async ({ page, request }, info) => {
  const phone = isPhone(info);
  const { poll, guestPath } = await createPoll(request);
  await page.goto(guestPath);
  await page.getByLabel('Your name').fill('Quinn');
  await markFirstTimes(page, phone, 3);
  await expect(page.getByText('3 times available')).toBeVisible();

  await page.locator('.brush-pref').click();
  await tapOrClickSlot(page, phone, 0);
  await expect(page.getByText('3 times available (1 preferred)')).toBeVisible();

  await page.locator('.brush-erase').click();
  await tapOrClickSlot(page, phone, 2);
  await expect(page.getByText('2 times available (1 preferred)')).toBeVisible();
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByText('3 times available (1 preferred)')).toBeVisible();

  await page.getByLabel('Note (optional)').fill('Remote is fine');
  await page.getByRole('button', { name: 'Submit availability' }).click();
  await expect(page.locator('.saved-notice')).toBeVisible();

  const data = await (await request.get(`/api/polls/${poll.id}`)).json();
  const r = data.poll.responses[0];
  expect(r.preferred).toEqual([poll.slots[0]]);
  expect(r.available).toEqual([poll.slots[1], poll.slots[2]]);
  expect(r.note).toBe('Remote is fine');

  await page.getByRole('tab', { name: /Group results/ }).click();
  await expect(page.getByText('“Remote is fine”')).toBeVisible();
  await expect(page.locator('.best-item').first()).toContainText('1 prefers');
});

test('keyboard shortcuts switch brushes and undo on desktop', async ({ page, request }, info) => {
  test.skip(isPhone(info), 'Keyboard shortcuts are for the desktop grid.');
  const { guestPath } = await createPoll(request);
  await page.goto(guestPath);
  const cells = page.locator('.grid-edit .cell[data-slot]');
  await cells.first().focus();
  await page.keyboard.press('2'); // preferred
  await page.keyboard.press('Space');
  await expect(cells.first()).toHaveAttribute('aria-label', /preferred/);
  await page.keyboard.press('ControlOrMeta+z');
  await expect(cells.first()).toHaveAttribute('aria-label', /not available/);
  // Clicking a day heading fills the whole day with the current brush.
  await page.keyboard.press('1');
  await page.getByRole('button', { name: /Wednesday, March 3: mark or clear the whole day/ }).click();
  await expect(page.getByText('6 times available')).toBeVisible();
});

test('unsaved marks survive a reload and can be discarded', async ({ page, request }, info) => {
  const { guestPath } = await createPoll(request);
  page.on('dialog', (d) => d.accept());
  await page.goto(guestPath);
  await page.getByLabel('Your name').fill('Rae');
  await markFirstTimes(page, isPhone(info), 2);
  await page.waitForTimeout(400); // drafts are saved after a short pause
  await page.reload();
  await expect(page.getByText('We restored the changes you hadn’t submitted yet.')).toBeVisible();
  await expect(page.getByLabel('Your name')).toHaveValue('Rae');
  await expect(page.getByText('2 times available')).toBeVisible();
  await page.getByRole('button', { name: 'Discard them' }).click();
  await expect(page.getByText('No times marked yet')).toBeVisible();
});

test('switching time zone or tabs keeps unsaved marks', async ({ page, request }, info) => {
  const { poll, guestPath } = await createPoll(request);
  await respond(request, poll.id, { name: 'Other', available: [poll.slots[0]] });
  await page.goto(guestPath);
  await markFirstTimes(page, isPhone(info), 2);
  await page.locator('#zone-line').getByRole('button', { name: 'Change' }).click();
  await page.getByLabel('Show times in').selectOption('Europe/London');
  await expect(page.getByLabel('Show times in')).toBeFocused();
  await page.getByRole('tab', { name: /Group results/ }).click();
  await page.getByRole('tab', { name: /Your availability/ }).click();
  await expect(page.getByText('2 times available')).toBeVisible();
});

test('location, closing date and clickable links show on the poll', async ({ page, request }) => {
  const { guestPath, managePath } = await createPoll(request, {
    location: 'https://meet.example.com/abc',
    description: 'Agenda: https://docs.example.com/plan.',
    closesOn: '2027-03-01',
  });
  await page.goto(guestPath);
  await expect(page.getByRole('link', { name: 'https://meet.example.com/abc' })).toHaveAttribute('rel', /noopener/);
  await expect(page.getByRole('link', { name: 'https://docs.example.com/plan' })).toBeVisible();
  await expect(page.getByText('Responses close at the end of Mon, Mar 1')).toBeVisible();
  await page.goto(managePath);
  await page.getByRole('button', { name: 'Edit poll' }).first().click();
  await expect(page.getByLabel('Where')).toHaveValue('https://meet.example.com/abc');
  await expect(page.getByLabel('Stop taking responses after')).toHaveValue('2027-03-01');
});

test('organizer exports a CSV, duplicates a poll, and sees counts on the heatmap', async ({ page, request }, info) => {
  const { poll, managePath } = await createPoll(request, { location: 'Room 2' });
  await respond(request, poll.id, { name: '=cmd()', available: [poll.slots[0]], preferred: [poll.slots[1]], note: 'hi, there' });
  await page.goto(managePath);

  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export CSV' }).click()]);
  const csv = await readFile(await download.path(), 'utf8');
  expect(csv).toContain("'=cmd()"); // formula-looking names are neutralised
  expect(csv).toContain('"hi, there"');
  expect(csv).toContain('Preferred');

  if (!isPhone(info)) {
    await page.getByLabel('Show numbers').check();
    await expect(page.locator('.grid-results .cell[data-slot]').first()).toHaveText('1');
  }

  await page.getByRole('button', { name: 'Duplicate poll' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText('Copied the settings from “Garden planning”.')).toBeVisible();
  await expect(page.getByLabel('Event name')).toHaveValue('Garden planning');
});

test('a closed poll’s grid cannot be changed, even by keyboard', async ({ page, request }, info) => {
  test.skip(isPhone(info), 'Keyboard check on the desktop grid.');
  const { poll, adminToken, guestPath } = await createPoll(request);
  const { editToken } = await respond(request, poll.id, { name: 'Lou', available: [poll.slots[0]] });
  await request.patch(`/api/polls/${poll.id}`, { headers: { Authorization: `Bearer ${adminToken}` }, data: { status: 'closed' } });
  await page.goto(`${guestPath}#r=${editToken}`);
  await page.getByRole('tab', { name: 'Your response' }).click();
  const cell = page.locator('.grid-edit .cell[data-slot]').nth(2);
  await cell.focus();
  await page.keyboard.press('Space');
  await expect(cell).toHaveAttribute('aria-selected', 'false');
  await expect(page.getByRole('grid', { name: 'Your availability' })).toHaveAttribute('aria-readonly', 'true');
});

test.describe('in Tokyo', () => {
  test.use({ timezoneId: 'Asia/Tokyo' });

  test('a final time across midnight reads naturally, with calendar links', async ({ page, request }) => {
    const { poll, adminToken, guestPath } = await createPoll(request, { dates: ['2027-03-03'] });
    // 9:00–12:00 New York is 11 pm to 2 am in Tokyo.
    await request.patch(`/api/polls/${poll.id}`, { headers: { Authorization: `Bearer ${adminToken}` }, data: { final: { start: poll.slots[0], end: poll.slots[0] + 3 * 3600e3 } } });
    await page.goto(guestPath);
    const card = page.locator('.final-card');
    await expect(card.locator('.final-time')).toHaveText(/Wed 11:00\s*PM – Thu 2:00\s*AM/);
    await expect(card).not.toContainText(/\d+\/\d+\/\d{4}/);
    await expect(card.getByRole('link', { name: 'Google Calendar' })).toHaveAttribute('href', /^https:\/\/calendar\.google\.com\/calendar\/render\?/);
  });
});

test('hidden-results polls accept the same name twice', async ({ page, request }) => {
  const { poll, guestPath } = await createPoll(request, { resultsVisibility: 'organizer' });
  await respond(request, poll.id, { name: 'Sam', available: [] });
  await page.goto(guestPath);
  await page.getByLabel('Your name').fill('Sam');
  await page.getByRole('button', { name: 'Submit availability' }).click();
  await expect(page.locator('.saved-notice')).toContainText('Thanks, Sam.');
});

test('long unbroken text does not push the page sideways', async ({ page, request }) => {
  const { guestPath } = await createPoll(request, { description: 'x'.repeat(400), location: 'y'.repeat(250) });
  await page.goto(guestPath);
  await expect(page.getByRole('heading', { name: 'Garden planning' })).toBeVisible();
  await expectNoHorizontalScroll(page);
});

test('dragging to the edge of the screen keeps scrolling and painting', async ({ page, request }, info) => {
  test.skip(isPhone(info), 'Drag painting is the desktop grid.');
  await page.setViewportSize({ width: 1280, height: 700 });
  const { guestPath } = await createPoll(request, { dates: ['2027-03-03'], startMinute: 8 * 60, endMinute: 22 * 60, slotMinutes: 15 });
  await page.goto(guestPath);
  const first = page.locator('.grid-edit .cell[data-slot]').first();
  await first.scrollIntoViewIfNeeded();
  const box = await first.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, 690, { steps: 8 });
  await page.waitForTimeout(1500);
  await page.mouse.move(box.x + box.width / 2 + 1, 690);
  await page.mouse.up();
  const text = await page.locator('.count').textContent();
  expect(Number(text.match(/\d+/)[0])).toBeGreaterThan(30); // far more rows than fit on screen at once
});

test('the About page names the author and links the source', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Site' }).getByRole('link', { name: 'About' }).click();
  await expect(page.getByRole('heading', { name: 'About Overlap' })).toBeVisible();
  await expect(page.getByText('Micropeptide', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Micropeptide on GitHub' })).toHaveAttribute('href', 'https://github.com/Micropeptide');
  await expect(page.getByRole('link', { name: 'github.com/Micropeptide/Overlap' })).toHaveAttribute('href', 'https://github.com/Micropeptide/Overlap');
});
