import { test, expect } from '@playwright/test';

/** Show a given month in the date picker using its month and year menus. */
async function showMonth(page, year, month) {
  await page.locator('.dp-select').nth(1).selectOption(String(year));
  await page.locator('.dp-select').nth(0).selectOption(String(month));
}
const day = (page, dk) => page.locator(`.dp-day[data-date="${dk}"]`);
const picked = (page) => page.locator('#dates-hint');
const position = (page) => page.evaluate(() => ({ y: Math.round(scrollY), top: Math.round(document.querySelector('.dp-months').getBoundingClientRect().top) }));

test('"Select a range" picks every day between two taps, across months', async ({ page }) => {
  const year = new Date().getFullYear() + 1;
  await page.goto('/');
  const hint = page.locator('.dp-range-hint');
  await expect(hint).toContainText('Tip: “Select a range”');
  await showMonth(page, year, 3);
  // Calendar in view, as someone would have it before tapping.
  await page.locator('.datepicker').evaluate((el) => el.scrollIntoView({ block: 'start' }));
  const before = await position(page);
  await page.getByRole('button', { name: 'Select a range' }).click();
  await expect(hint).toContainText('Tap the first day, then the last');
  expect(await position(page)).toEqual(before);

  await day(page, `${year}-03-30`).click();
  await expect(day(page, `${year}-03-30`)).toHaveClass(/range-start/);
  await expect(hint).toContainText('tap the last day to add every day in between');
  expect(await position(page)).toEqual(before);
  // Change months between the two taps.
  await page.getByRole('button', { name: 'Next month' }).click();
  await page.getByRole('button', { name: 'Next month' }).click();
  await day(page, `${year}-05-02`).click();
  // March 30 to May 2: 2 + 30 + 2 days.
  await expect(picked(page)).toContainText('34 dates picked');
  await expect(hint).toContainText('Tap the first day, then the last');

  // Starting on a picked day removes instead.
  await day(page, `${year}-05-01`).click();
  await expect(hint).toContainText('tap the last day to remove every day in between');
  await day(page, `${year}-05-02`).click();
  await expect(picked(page)).toContainText('32 dates picked');

  // Cancel leaves everything as it was.
  await day(page, `${year}-05-10`).click();
  await hint.getByRole('button', { name: 'Cancel' }).click();
  await expect(day(page, `${year}-05-10`)).not.toHaveClass(/range-start/);
  await expect(picked(page)).toContainText('32 dates picked');

  // Turning range mode off goes back to one day per click.
  await page.getByRole('button', { name: 'Select a range' }).click();
  await day(page, `${year}-05-10`).click();
  await expect(picked(page)).toContainText('33 dates picked');
});

test('ranges can skip weekends, and stop at the most dates a poll can have', async ({ page }) => {
  const year = new Date().getFullYear() + 1;
  await page.goto('/');
  await showMonth(page, year, 6);
  await page.getByRole('button', { name: 'Select a range' }).click();
  await page.getByLabel('Skip weekends').check();
  // Mon 7 June 2027-ish: whatever the year, a 14-day span holds 10 weekdays.
  const start = `${year}-06-07`;
  const end = `${year}-06-20`;
  await day(page, start).click();
  await day(page, end).click();
  await expect(picked(page)).toContainText('10 dates picked');
  for (const dk of await page.locator('.dp-day.on').evaluateAll((els) => els.map((e) => e.dataset.date))) {
    const wd = new Date(`${dk}T12:00:00Z`).getUTCDay();
    expect(wd === 0 || wd === 6, `${dk} is a weekend day`).toBe(false);
  }

  // A long range is capped at 92 dates in all, with a message saying so.
  await page.getByLabel('Skip weekends').uncheck();
  await showMonth(page, year, 7);
  await day(page, `${year}-07-01`).click();
  await showMonth(page, year, 12);
  await day(page, `${year}-12-31`).click();
  await expect(picked(page)).toContainText('92 dates picked');
  await expect(page.locator('#toast')).toContainText('A poll can have up to 92 dates, so only 82 more days were added.');
});

test('on a phone, range taps work and the page stays still', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'Touch layout.');
  const year = new Date().getFullYear() + 1;
  await page.goto('/');
  await showMonth(page, year, 3);
  await page.getByRole('button', { name: 'Select a range' }).tap();
  await day(page, `${year}-03-10`).scrollIntoViewIfNeeded();
  const before = await position(page);
  await day(page, `${year}-03-10`).tap();
  expect(await position(page)).toEqual(before);
  await day(page, `${year}-03-25`).tap();
  expect(await position(page)).toEqual(before);
  await expect(picked(page)).toContainText('16 dates picked');
});
