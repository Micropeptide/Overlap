import { test, expect } from '@playwright/test';
import { createPoll, respond, isPhone } from './helpers.js';

test('small groups show a colored lane per person; the heatmap is one click away', async ({ page, request }, info) => {
  const { poll, managePath } = await createPoll(request); // 2 days × 6 half hours
  const s = poll.slots;
  await respond(request, poll.id, { name: 'Ana', available: [s[0], s[1]], preferred: [s[2]] });
  await respond(request, poll.id, { name: 'Ben', available: [s[1]], ifNeeded: [s[2]] });
  await page.goto(managePath);
  const view = page.getByRole('radiogroup', { name: 'Show by' });
  await expect(view.getByRole('radio', { name: 'People' })).toBeChecked();
  await expect(page.locator('.legend')).toContainText('Each color is one person');
  await expect(page.locator('.legend')).not.toContainText('Everyone');
  await expect(page.locator('.person-dot')).toHaveCount(2);

  if (isPhone(info)) {
    // Phone rows show who's free as colored initials.
    const second = page.locator('.slot-list-results .slot-btn').nth(1);
    await expect(second.locator('.chip-person')).toHaveText(['A', 'B']);
  } else {
    const cell = (slot) => page.locator(`.grid-results .cell[data-slot="${slot}"]`);
    await expect(cell(s[1]).locator('.lane')).toHaveCount(2);
    await expect(cell(s[1]).locator('.lane.ln-yes')).toHaveCount(2);
    await expect(cell(s[2]).locator('.lane.ln-pref')).toHaveCount(1);
    await expect(cell(s[2]).locator('.lane.ln-maybe')).toHaveCount(1);
    // Ana's lane runs through her first two times as one bar.
    await expect(cell(s[0]).locator('.lane').first()).toHaveClass(/down/);
    await expect(cell(s[1]).locator('.lane').first()).toHaveClass(/up/);
    // Pointing at a name brings that person's lanes forward.
    await page.getByRole('button', { name: /^Ben/ }).hover();
    await expect(page.locator('.grid-results')).toHaveClass(/lane-hl/);
    await expect(cell(s[1]).locator('.lane.keep')).toHaveCount(1);
  }

  // The choice is remembered.
  await view.getByRole('radio', { name: 'Heatmap' }).check({ force: true });
  await expect(page.locator('.legend')).toContainText('Darker means more people');
  await page.reload();
  await expect(page.getByRole('radio', { name: 'Heatmap' })).toBeChecked();
});

test('times everyone can make are highlighted only when asked', async ({ page, request }, info) => {
  test.skip(isPhone(info), 'Checked on the desktop grid.');
  const { poll, managePath } = await createPoll(request);
  const s = poll.slots;
  await respond(request, poll.id, { name: 'Ana', available: [s[0]] });
  await respond(request, poll.id, { name: 'Ben', available: [s[0]] });
  await page.goto(managePath);
  const all = page.locator(`.grid-results .cell[data-slot="${s[0]}"]`);
  const box = page.getByLabel('Highlight times everyone can make');
  await expect(box).not.toBeChecked();
  await expect(all).not.toHaveClass(/\ball\b/);
  await box.check();
  await expect(all).toHaveClass(/\ball\b/);
  await expect(page.locator('.legend')).toContainText('Everyone');
  await page.reload();
  await expect(page.getByLabel('Highlight times everyone can make')).toBeChecked();
});

test('big groups start on the heatmap', async ({ page, request }) => {
  const { poll, managePath } = await createPoll(request);
  for (let i = 0; i < 9; i++) await respond(request, poll.id, { name: `P${i}`, available: [poll.slots[0]] });
  await page.goto(managePath);
  await expect(page.getByRole('radio', { name: 'Heatmap' })).toBeChecked();
});
