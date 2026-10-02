import { test, expect } from '@playwright/test';
import { createPoll, isPhone } from './helpers.js';

test.describe('a guest in Tokyo', () => {
  test.use({ timezoneId: 'Asia/Tokyo' });

  test('sees the poll in Tokyo time, and their answer means the same moment', async ({ page, request }, info) => {
    // 9:00 to 12:00 New York time on 3 March is 11 pm to 2 am in Tokyo.
    const { poll, guestPath } = await createPoll(request, { dates: ['2027-03-03'] });
    await page.goto(guestPath);
    await expect(page.getByText('Times shown in Tokyo (UTC+9)')).toBeVisible();
    await expect(page.getByText('The organizer set this poll up in New York (EST, UTC−5).')).toBeVisible();

    if (isPhone(info)) {
      await expect(page.locator('.day-chip')).toHaveCount(2); // the evening of the 3rd and early on the 4th
      const first = page.locator('.slot-list-edit .slot-btn').first();
      await expect(first).toContainText(/11:00\s*PM/);
      await first.tap();
    } else {
      await expect(page.locator('.grid-edit .col-head')).toHaveCount(2);
      await page.getByRole('gridcell', { name: /Wed, Mar 3, 11:00\s*PM/ }).click();
    }
    await page.getByLabel('Your name').fill('Kenji');
    await page.getByRole('button', { name: 'Submit availability' }).click();
    await expect(page.locator('.saved-notice').getByText('Thanks, Kenji. Your times are in.')).toBeVisible();

    const data = await (await request.get(`/api/polls/${poll.id}`)).json();
    expect(data.poll.responses[0].available).toEqual([poll.slots[0]]);
    expect(new Date(poll.slots[0]).toISOString()).toBe('2027-03-03T14:00:00.000Z');
  });

  test('can switch to another time zone', async ({ page, request }, info) => {
    const { guestPath } = await createPoll(request, { dates: ['2027-03-03'] });
    await page.goto(guestPath);
    await page.locator('#zone-line').getByRole('button', { name: 'Change' }).click();
    await page.getByLabel('Show times in').selectOption('America/New_York');
    await expect(page.getByText('Times shown in New York (EST, UTC−5)')).toBeVisible();
    if (isPhone(info)) await expect(page.locator('.slot-list-edit .slot-btn').first()).toContainText(/9:00\s*AM/);
    else await expect(page.getByRole('gridcell', { name: /Wed, Mar 3, 9:00\s*AM/ })).toBeVisible();
  });
});

test.describe('a guest in London during the US daylight saving change', () => {
  test.use({ timezoneId: 'Europe/London' });

  test('sees each day shifted by the right amount', async ({ page, request }, info) => {
    // New York springs forward on 14 March 2027; London doesn't until the 28th.
    // So 9:00 New York is 2 pm in London on the 13th but 1 pm on the 15th.
    const { guestPath } = await createPoll(request, { dates: ['2027-03-13', '2027-03-15'] });
    await page.goto(guestPath);
    await expect(page.getByText(/Times shown in London \(GMT, UTC\+0\)/)).toBeVisible();
    if (isPhone(info)) {
      await expect(page.locator('.slot-list-edit .slot-btn').first()).toContainText(/2:00\s*PM/);
      await page.locator('.day-chip').nth(1).click();
      await expect(page.locator('.slot-list-edit .slot-btn').first()).toContainText(/1:00\s*PM/);
    } else {
      await expect(page.getByRole('gridcell', { name: /Sat, Mar 13, 2:00\s*PM/ })).toBeVisible();
      await expect(page.getByRole('gridcell', { name: /Mon, Mar 15, 1:00\s*PM/ })).toBeVisible();
      await expect(page.getByRole('gridcell', { name: /Sat, Mar 13, 1:00\s*PM/ })).toHaveCount(0);
    }
  });
});
