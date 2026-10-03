import { test, expect } from '@playwright/test';
import { createPoll } from './helpers.js';
import fr from '../shared/i18n/fr.js';
import de from '../shared/i18n/de.js';
import ja from '../shared/i18n/ja.js';
import ar from '../shared/i18n/ar.js';

test.describe('in French by browser setting', () => {
  test.use({ locale: 'fr-FR' });

  test('the page follows the browser language, dates included', async ({ page, request }) => {
    const { guestPath } = await createPoll(request);
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.locator('.site-nav').getByRole('link', { name: fr['shell.newPoll'], exact: true })).toBeVisible();
    await expect(page.locator('#language-select')).toHaveValue('fr');
    await page.goto(guestPath);
    // 3 March 2027 in French ("mer. 3 mars").
    await expect(page.locator('main')).toContainText(/mars/);
    await expect(page.getByRole('button', { name: fr['guest.submit'] })).toBeVisible();
  });

  test('server messages come back in the page language', async ({ page, request }) => {
    const { poll, guestPath } = await createPoll(request);
    await request.post(`/api/polls/${poll.id}/responses`, { data: { name: 'Sam', available: [] } });
    await page.goto(guestPath);
    await page.locator('#g-name').fill('sam');
    await page.locator('.action-bar .btn.primary').click();
    const msg = fr['errors.name_taken'];
    expect(msg, 'French has a name-taken message').toBeTruthy();
    await expect(page.locator('#g-name-err')).toHaveText(msg.replace('{name}', 'sam'));
  });
});

test('choosing a language in the footer sticks, across pages and visits', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.locator('#language-select').selectOption('de');
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.locator('.site-nav').getByRole('link', { name: de['shell.privacy'], exact: true })).toBeVisible();
  await page.goto('/privacy');
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await page.goto('/about');
  await expect(page.locator('#language-select')).toHaveValue('de');
  // Back to English.
  await page.locator('#language-select').selectOption('en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('.site-nav').getByRole('link', { name: 'Privacy', exact: true })).toBeVisible();
});

test.describe('Japanese', () => {
  test.use({ locale: 'ja-JP' });
  test('Japanese text, dates and times', async ({ page, request }) => {
    const { guestPath } = await createPoll(request);
    await page.goto(guestPath);
    await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
    await expect(page.locator('main')).toContainText(/3月/);
    await expect(page.locator('.site-nav').getByRole('link', { name: ja['shell.about'], exact: true })).toBeVisible();
  });
});

test.describe('Arabic', () => {
  test.use({ locale: 'ar-EG' });
  test('right-to-left, with the grid kept in time order', async ({ page, request }) => {
    const { guestPath } = await createPoll(request);
    await page.goto(guestPath);
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('.site-nav').getByRole('link', { name: ar['shell.privacy'], exact: true })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
