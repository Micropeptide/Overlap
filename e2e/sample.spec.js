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

test('the sample has an organizer side: pick the time, and the guest side shows it', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'Same in every layout.');
  const calls = [];
  page.on('request', (r) => { if (r.url().includes('/api/polls')) calls.push(r.url()); });

  await page.goto('/');
  await page.getByRole('link', { name: 'Try it as the organizer' }).click();
  await expect(page).toHaveURL(/\/m\/example#k=sample$/);
  await expect(page.getByRole('note', { name: 'About this sample poll' })).toContainText('organizer’s side');
  await expect(page.getByRole('heading', { name: 'Team offsite (sample)' })).toBeVisible();
  // The guest link and its QR code point at the guest side of the sample.
  await expect(page.getByLabel('Guest link: share this one')).toHaveValue(/\/p\/example$/);

  // Pick the time everyone can make.
  await page.locator('details.best').getByRole('button', { name: /^Choose / }).first().click();
  await page.getByRole('button', { name: 'Set final time' }).click();
  await expect(page.locator('.final-card')).toBeVisible();
  await expect(page.locator('.status-chip')).toHaveText('Final time chosen');

  // Editing works too.
  await page.getByRole('button', { name: 'Edit poll' }).first().click();
  await page.getByLabel('Event name').fill('Team offsite');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('heading', { name: 'Team offsite', exact: true })).toBeVisible();

  // The guest side shows the plan, with an invite made in the browser.
  await page.getByRole('link', { name: 'See the guest’s side' }).click();
  await expect(page).toHaveURL(/\/p\/example$/);
  await expect(page.locator('.final-card')).toContainText('The organizer chose a time');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download calendar invite' }).click();
  expect((await download).suggestedFilename()).toBe('overlap-sample.ics');

  // Deleting the poll starts the sample over.
  await page.goto('/m/example#k=sample');
  await page.getByRole('button', { name: 'Delete poll now' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete poll' }).click();
  await expect(page.getByRole('heading', { name: 'Poll deleted' })).toBeVisible();
  await page.goto('/p/example');
  await expect(page.getByRole('heading', { name: 'Team offsite (sample)' })).toBeVisible();
  await expect(page.locator('.final-card')).toHaveCount(0);
  expect(calls).toEqual([]);
});
