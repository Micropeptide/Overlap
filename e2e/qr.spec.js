import { test, expect } from '@playwright/test';
import { createPoll } from './helpers.js';

test('the organizer can show the guest link as a QR code', async ({ page, request, baseURL }) => {
  const { poll, managePath } = await createPoll(request, { title: 'Room 204 meetup' });
  await page.goto(managePath);
  await page.getByRole('button', { name: 'QR code' }).click();
  const dialog = page.getByRole('dialog', { name: 'Scan to answer' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('img', { name: 'QR code for the guest link to “Room 204 meetup”' })).toBeVisible();
  await expect(dialog).toContainText(`${new URL(baseURL).host}/p/${poll.id}`);
  await expect(dialog).toContainText('No app or account needed.');
  await dialog.getByRole('button', { name: 'Close' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'QR code' })).toBeFocused();
});
