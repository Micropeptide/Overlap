import { test, expect } from '@playwright/test';
import { movedFiles } from '../scripts/build-moved.mjs';
import { createPoll } from './helpers.js';

// The old address, played by an intercepted made-up host, hands this browser's
// remembered polls over to the address under test.
const OLD = 'http://old-overlap.test';

async function serveOldAddress(page, baseURL) {
  const files = movedFiles(baseURL);
  await page.route(`${OLD}/**`, (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/moved.js') return route.fulfill({ contentType: 'text/javascript', body: files['moved.js'] });
    if (path === '/seed') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>seed</title>' });
    return route.fulfill({ status: path === '/' ? 200 : 404, contentType: 'text/html', body: files['404.html'] });
  });
  // The new address trusts the old one (build-pages.mjs --moved-from).
  await page.route('**/js/config.js', async (route) => {
    const res = await route.fetch();
    const body = (await res.text()).replace(/export const MOVED_FROM = .*/, `export const MOVED_FROM = ${JSON.stringify([OLD])};`);
    await route.fulfill({ response: res, body });
  });
}

const stored = (page, key) => page.evaluate((k) => localStorage.getItem(k), key);

test('an old link opens at the new address with the polls this browser remembered', async ({ page, request, baseURL }, info) => {
  test.skip(info.project.name !== 'desktop', 'Same in every layout.');
  const mine = await createPoll(request, { title: 'Team lunch' });
  const answered = await createPoll(request, { title: 'Book club' });
  await serveOldAddress(page, baseURL);

  // What the old address remembered.
  await page.goto(`${OLD}/seed`);
  await page.evaluate(({ mine, answered }) => {
    localStorage.setItem('overlap.managed', JSON.stringify({ [mine.poll.id]: { token: mine.adminToken, title: 'Team lunch', savedAt: Date.now() } }));
    localStorage.setItem('overlap.answered', JSON.stringify({ [answered.poll.id]: { responseId: 'r1', editKey: 'k1', name: 'Ana' } }));
    localStorage.setItem('overlap.lang', 'fr');
    localStorage.setItem('unrelated', 'x');
  }, { mine, answered });

  // An organizer link with its key in the fragment.
  await page.goto(`${OLD}/m/${mine.poll.id}#k=${mine.adminToken}`);
  await page.waitForURL(`${baseURL}/m/${mine.poll.id}#k=${mine.adminToken}`);
  await expect(page.getByRole('heading', { name: 'Team lunch' })).toBeVisible();
  expect(page.url()).not.toContain('moved=');
  expect(JSON.parse(await stored(page, 'overlap.managed'))[mine.poll.id].token).toBe(mine.adminToken);
  expect(JSON.parse(await stored(page, 'overlap.answered'))[answered.poll.id].name).toBe('Ana');
  expect(await stored(page, 'overlap.lang')).toBe('fr');
  expect(await page.evaluate(() => document.documentElement.lang)).toBe('fr');
  expect(await stored(page, 'unrelated')).toBeNull();

  // The home page lists the poll, as it did at the old address.
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Team lunch/ })).toBeVisible();

  // Forgotten here, it stays forgotten when another old link is opened.
  await page.evaluate((id) => {
    const all = JSON.parse(localStorage.getItem('overlap.managed'));
    delete all[id];
    localStorage.setItem('overlap.managed', JSON.stringify(all));
    localStorage.setItem('overlap.lang', 'de');
  }, mine.poll.id);
  await page.goto(`${OLD}/p/${answered.poll.id}`);
  await page.waitForURL(`${baseURL}/p/${answered.poll.id}`);
  expect(JSON.parse(await stored(page, 'overlap.managed'))[mine.poll.id]).toBeUndefined();
  expect(await stored(page, 'overlap.lang')).toBe('de');
});

test('what this address already remembers wins over the old one', async ({ page, request, baseURL }, info) => {
  test.skip(info.project.name !== 'desktop', 'Same in every layout.');
  const a = await createPoll(request, { title: 'Old only' });
  const b = await createPoll(request, { title: 'Both' });
  await serveOldAddress(page, baseURL);
  await page.goto('/about');
  await page.evaluate((b) => {
    localStorage.setItem('overlap.managed', JSON.stringify({ [b.poll.id]: { token: 'new-token', title: 'Both' } }));
    localStorage.setItem('overlap.lang', 'es');
  }, b);
  await page.goto(`${OLD}/seed`);
  await page.evaluate(({ a, b }) => {
    localStorage.setItem('overlap.managed', JSON.stringify({ [a.poll.id]: { token: a.adminToken }, [b.poll.id]: { token: 'old-token' } }));
    localStorage.setItem('overlap.lang', 'fr');
  }, { a, b });
  await page.goto(`${OLD}/`);
  await page.waitForURL(`${baseURL}/`);
  const managed = JSON.parse(await stored(page, 'overlap.managed'));
  expect(managed[a.poll.id].token).toBe(a.adminToken);
  expect(managed[b.poll.id].token).toBe('new-token');
  expect(await stored(page, 'overlap.lang')).toBe('es');
});

test('a hand-over in a link from anywhere else is ignored', async ({ page, baseURL }, info) => {
  test.skip(info.project.name !== 'desktop', 'Same in every layout.');
  await serveOldAddress(page, baseURL);
  const forged = 'j' + Buffer.from(JSON.stringify({ 'overlap.lang': 'fr', 'overlap.name': 'Mallory' })).toString('base64url');
  await page.goto(`/about#moved=${forged}`);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(page.url()).toBe(`${baseURL}/about`);
  expect(await stored(page, 'overlap.lang')).toBeNull();
  expect(await stored(page, 'overlap.name')).toBeNull();
});
