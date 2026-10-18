import { test, expect } from '@playwright/test';
import { createPoll, respond } from './helpers.js';

test('the organizer edits the note, place and everything else from the top of the page', async ({ page, request }) => {
  const { poll, managePath, guestPath } = await createPoll(request);
  await page.goto(managePath);
  // A shortcut straight to the note for guests.
  await page.getByRole('button', { name: '+ Add a note for guests' }).click();
  await expect(page.getByLabel('Note for guests')).toBeFocused();
  // Every option is in view while editing.
  await expect(page.locator('details.more')).toHaveAttribute('open', '');
  await page.getByLabel('Note for guests').fill('Bring snacks');
  await page.getByLabel('Where').fill('Garden shed');
  await page.getByLabel('Event name').fill('Garden planning, round 2');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('heading', { name: 'Garden planning, round 2' })).toBeVisible();
  await expect(page.locator('.poll-desc')).toHaveText('Bring snacks');
  await expect(page.getByRole('button', { name: /Add a note for guests/ })).toHaveCount(0);

  // The note can be changed again later via the top button.
  await page.getByRole('button', { name: 'Edit poll' }).first().click();
  await page.getByLabel('Note for guests').fill('Bring snacks and gloves');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.locator('.poll-desc')).toHaveText('Bring snacks and gloves');

  // Guests see it.
  await page.goto(guestPath);
  await expect(page.locator('.poll-desc')).toHaveText('Bring snacks and gloves');
  await expect(page.locator('.poll-location')).toContainText('Garden shed');
  expect((await (await request.get(`/api/polls/${poll.id}`)).json()).poll.description).toBe('Bring snacks and gloves');
});

test('the organizer can switch a poll to days of the week after people answered', async ({ page, request }) => {
  const { poll, managePath } = await createPoll(request);
  await respond(request, poll.id, { name: 'Ana', available: [poll.slots[0]] });
  await page.goto(managePath);
  await page.getByRole('button', { name: 'Edit poll' }).first().click();
  await page.getByText('Days of the week', { exact: true }).click();
  await page.getByRole('button', { name: 'Save changes' }).click();
  const dlg = page.getByRole('dialog', { name: 'Switch to days of the week?' });
  await expect(dlg).toContainText('One person has already answered');
  await dlg.getByRole('button', { name: 'Switch' }).click();
  await expect(page.locator('.facts')).toContainText('Every week');
  const data = (await (await request.get(`/api/polls/${poll.id}`)).json()).poll;
  expect(data.kind).toBe('weekly');
  expect(data.weekdays).toEqual([1, 2, 3, 4, 5]);
});

test('the final time can be several sessions, or run over several days', async ({ page, request }, info) => {
  test.skip(info.project.name !== 'desktop', 'Same in every layout.');
  const { poll, adminToken, managePath } = await createPoll(request, { title: 'Lab retreat', dates: ['2027-03-03', '2027-03-04', '2027-03-05'] });
  await request.post(`/api/polls/${poll.id}/responses`, { data: { name: 'Ana', available: poll.slots, ifNeeded: [] } });
  await page.goto(managePath);
  await page.locator('details.best').getByRole('button', { name: /^Choose / }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Choose the final time' });
  await expect(dialog.getByRole('group', { name: 'Time 1' })).toBeVisible();
  // A second session: the same time the next day.
  await dialog.getByRole('button', { name: 'Add another time' }).click();
  await expect(dialog.getByRole('group', { name: 'Time 2' })).toBeVisible();
  await dialog.getByRole('button', { name: 'Set final time' }).click();
  await expect(page.locator('.final-sessions li')).toHaveCount(2);
  await expect(page.locator('.final-card')).toContainText('The calendar invite has all of these times.');
  const ics = await (await request.get(`/api/polls/${poll.id}/invite.ics`)).text();
  expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);

  // Change it to one time that runs from the first day into the last.
  await page.getByRole('button', { name: 'Change time' }).click();
  await dialog.getByRole('group', { name: 'Time 2' }).getByRole('button', { name: 'Remove this time' }).click();
  const end = dialog.getByLabel('Ends');
  const last = await end.locator('option').last().getAttribute('value');
  await end.selectOption(last);
  await dialog.getByRole('button', { name: 'Set final time' }).click();
  await expect(page.locator('.final-sessions')).toHaveCount(0);
  const data = await (await request.get(`/api/polls/${poll.id}`)).json();
  expect(data.poll.final.sessions).toHaveLength(1);
  expect(data.poll.final.end - data.poll.final.start).toBeGreaterThan(24 * 3600e3);
  void adminToken;
});
