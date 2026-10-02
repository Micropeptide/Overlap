import { expect } from '@playwright/test';

export const isPhone = (testInfo) => testInfo.project.name === 'mobile';

/** A date N days from today in New York, as YYYY-MM-DD. */
export function daysFromNow(n) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
  const d = new Date(`${today}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export async function createPoll(request, overrides = {}) {
  const res = await request.post('/api/polls', {
    data: {
      title: 'Garden planning',
      dates: ['2027-03-03', '2027-03-04'],
      startMinute: 9 * 60,
      endMinute: 12 * 60,
      timezone: 'America/New_York',
      ...overrides,
    },
  });
  expect(res.status()).toBe(201);
  const { poll, adminToken } = await res.json();
  return { poll, adminToken, guestPath: `/p/${poll.id}`, managePath: `/m/${poll.id}#k=${adminToken}` };
}

export async function respond(request, pollId, body) {
  const res = await request.post(`/api/polls/${pollId}/responses`, { data: body });
  expect(res.status()).toBe(201);
  return res.json();
}

/**
 * Mark the first `count` times of the first day as available, the way a person
 * would: by dragging on desktop, by tapping on a phone.
 */
export async function markFirstTimes(page, phone, count) {
  if (phone) {
    const buttons = page.locator('.slot-list-edit .slot-btn');
    for (let i = 0; i < count; i++) await buttons.nth(i).tap();
    return;
  }
  const cols = await page.locator('.grid-edit .col-head').count();
  const cells = page.locator('.grid-edit .cell[data-slot]');
  const a = await cells.nth(0).boundingBox();
  const b = await cells.nth((count - 1) * cols).boundingBox();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, (a.y + b.y) / 2 + a.height / 2, { steps: 4 });
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 4 });
  await page.mouse.up();
}

export async function expectNoHorizontalScroll(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}
