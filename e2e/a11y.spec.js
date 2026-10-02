import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createPoll, respond } from './helpers.js';

async function audit(page) {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  const serious = violations.filter((v) => ['serious', 'critical'].includes(v.impact));
  expect(serious.map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
}

for (const scheme of ['light', 'dark']) {
  test.describe(`${scheme} mode`, () => {
    test.use({ colorScheme: scheme });

    test('main screens have no serious accessibility violations', async ({ page, request }) => {
      const { poll, guestPath, managePath } = await createPoll(request, { durationMinutes: 60 });
      await respond(request, poll.id, { name: 'Ana', available: poll.slots.slice(0, 4), ifNeeded: poll.slots.slice(4, 6) });
      await respond(request, poll.id, { name: 'Ben', available: poll.slots.slice(2, 8) });

      await page.goto('/');
      await expect(page.getByLabel('Event name')).toBeVisible();
      await audit(page);

      await page.goto(guestPath);
      await expect(page.getByLabel('Your name')).toBeVisible();
      await audit(page);

      await page.getByRole('tab', { name: /Group results/ }).click();
      await expect(page.getByText('Everyone’s availability')).toBeVisible();
      await audit(page);

      await page.goto(managePath);
      await expect(page.getByText('Best times')).toBeVisible();
      await audit(page);

      await page.goto('/privacy');
      await audit(page);

      await page.goto('/about');
      await expect(page.getByRole('heading', { name: 'About Overlap' })).toBeVisible();
      await audit(page);
    });
  });
}
