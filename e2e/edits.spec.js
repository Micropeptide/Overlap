import { test, expect } from '@playwright/test';
import { createPoll, respond, isPhone, markFirstTimes } from './helpers.js';

test('when the organizer turns off changes, a sent answer is read-only but can be deleted', async ({ page, request }, info) => {
  const { poll, guestPath } = await createPoll(request, { allowEdits: false });
  await page.goto(guestPath);
  await expect(page.locator('.facts')).toContainText('Answers can’t be changed after they’re sent');
  await expect(page.getByText('Check your times before sending')).toBeVisible();
  await page.getByLabel('Your name').fill('Firm');
  await markFirstTimes(page, isPhone(info), 2);
  await page.getByRole('button', { name: 'Submit availability' }).click();
  await expect(page.locator('.saved-notice')).toContainText('doesn’t allow changes after sending');
  await expect(page.getByText('The organizer doesn’t allow changing answers after they’re sent')).toBeVisible();
  await expect(page.getByLabel('Your name')).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Save changes' })).toHaveCount(0);
  await expect(page.getByText('Add a password (optional)')).toHaveCount(0);
  await page.getByRole('button', { name: 'Delete my response' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete response' }).click();
  await expect(page.getByRole('button', { name: 'Submit availability' })).toBeVisible();
  const data = await (await request.get(`/api/polls/${poll.id}`)).json();
  expect(data.poll.responses).toHaveLength(0);
});

test('the organizer can turn changes off from the edit form', async ({ page, request }) => {
  const { poll, managePath } = await createPoll(request);
  await page.goto(managePath);
  await page.getByRole('button', { name: 'Edit poll' }).first().click();
  await page.getByLabel('Guests can change their answer after sending it').uncheck();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.locator('.facts')).toContainText('Guests can’t change answers after sending');
  expect((await (await request.get(`/api/polls/${poll.id}`)).json()).poll.allowEdits).toBe(false);
});

test('a guest can copy their edit link any time after sending', async ({ page, request, context }, info) => {
  test.skip(info.project.name === 'mobile', 'Clipboard permissions are desktop-only in this setup.');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const { poll, guestPath } = await createPoll(request);
  const { editToken } = await respond(request, poll.id, { name: 'Later', available: [poll.slots[0]] });
  await page.goto(`${guestPath}#r=${editToken}`);
  await expect(page.locator('.saved-notice')).toHaveCount(0); // not just after sending
  await page.getByRole('button', { name: 'Copy my edit link' }).click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toBe(`${new URL(page.url()).origin}/p/${poll.id}#r=${editToken}`);
});
