import { test, expect } from '@playwright/test';
import { isPhone, markFirstTimes, expectNoHorizontalScroll } from './helpers.js';

test('the sample poll shows a team’s answers and takes yours, without the server', async ({ page }, info) => {
  const phone = isPhone(info);
  const calls = [];
  page.on('request', (r) => { if (r.url().includes('/api/polls')) calls.push(r.url()); });

  await page.goto('/');
  await page.getByRole('link', { name: 'Try a sample poll' }).click();
  await expect(page).toHaveURL(/\/p\/example$/);
  await expect(page.getByRole('heading', { name: 'Team offsite (sample)' })).toBeVisible();
  await expect(page.getByRole('note', { name: 'About this sample poll' })).toContainText('nothing is sent anywhere');
  // It opens on the group's answers.
  await expect(page.getByRole('tab', { name: /Group results \(7\)/ })).toHaveAttribute('aria-selected', 'true');
  await expectNoHorizontalScroll(page);

  await page.getByRole('tab', { name: 'Your availability' }).click();
  await page.getByLabel('Your name').fill('Ana');
  await markFirstTimes(page, phone, 2);
  await page.getByRole('button', { name: 'Submit availability' }).click();
  await expect(page.getByText(/Someone else already responded as “Ana”/)).toBeVisible();

  await page.getByLabel('Your name').fill('Sam');
  await page.getByRole('button', { name: 'Submit availability' }).click();
  await expect(page.locator('.saved-notice').getByText('Thanks, Sam. Your times are in.')).toBeVisible();
  await expect(page.getByLabel('Your private edit link')).toHaveValue(/\/p\/example#r=/);
  await expect(page.getByRole('tab', { name: /Group results \(8\)/ })).toBeVisible();

  // It's remembered in this browser.
  await page.reload();
  await expect(page.getByRole('tab', { name: 'Your response' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByLabel('Your name')).toHaveValue('Sam');
  expect(calls).toEqual([]);
});
