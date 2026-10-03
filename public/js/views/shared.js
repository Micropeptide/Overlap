// Pieces shared by the guest and organizer pages.

import { h, icon, copyText, linkify } from '../lib/dom.js';
import * as f from '../lib/format.js';
import { API_BASE } from '../config.js';

export function pollFacts(poll, { audience }) {
  const dates = poll.dates;
  const dateText = poll.kind === 'weekly'
    ? `Every week: ${dates.length === 7 ? 'every day' : dates.map((d) => f.weekdayShort(d)).join(', ')}`
    : dates.length === 1
    ? f.dateMedium(dates[0])
    : `${f.plural(dates.length, 'date')}, ${f.monthDay(dates[0])} to ${f.monthDay(dates.at(-1))}`;
  const fact = (name, text) => h('li', null, icon(name), h('span', null, text));
  return h('ul', { class: 'facts', role: 'list' },
    fact('calendar', dateText),
    fact('clock', `${f.minuteOfDay(poll.startMinute)} to ${f.minuteOfDay(poll.endMinute)} ${poll.timezone.split('/').pop().replace(/_/g, ' ')} time${poll.durationMinutes ? `, for ${f.duration(poll.durationMinutes)}` : ''}`),
    fact('people', poll.responseCount ? f.plural(poll.responseCount, 'response') : 'No responses yet'),
    poll.closesOn && poll.status === 'open' ? fact('clock', `Responses close at the end of ${f.dateMedium(poll.closesOn)}`) : null,
    fact('lock', poll.resultsVisibility === 'everyone'
      ? (audience === 'guest' ? 'Everyone with this link can see responses' : 'Guests can see each other’s responses')
      : (audience === 'guest' ? 'Only the organizer can see responses' : 'Only you can see responses')),
    poll.allowEdits === false
      ? fact('edit', audience === 'guest' ? 'Answers can’t be changed after they’re sent' : 'Guests can’t change answers after sending')
      : null,
  );
}

export function statusBanner(status, poll) {
  if (status === 'closed') {
    const byDeadline = poll?.closesAt && Date.now() >= poll.closesAt;
    return h('div', { class: 'callout closed', role: 'status' },
      h('p', { class: 'callout-title' }, 'This poll is closed'),
      h('p', null, byDeadline
        ? `Responses closed at the end of ${f.dateMedium(poll.closesOn)}. A final time hasn’t been chosen yet.`
        : 'The organizer isn’t collecting new responses. A final time hasn’t been chosen yet.'));
  }
  return null;
}

/** "Where" line under the title; web addresses become links. */
export function locationLine(poll) {
  if (!poll.location) return null;
  return h('p', { class: 'poll-location' }, icon('pin'), h('span', null, linkify(poll.location)));
}

/**
 * Refresh data when the person comes back to the tab, and every minute while
 * it is visible. `apply` runs only when something actually changed.
 *
 * Call `bump()` whenever the page itself changes the poll (a save, a close…):
 * a refresh that was already in flight then carries older data and is dropped,
 * so it can't undo what the person just did. `paused()` can postpone a refresh,
 * e.g. while a drag is being painted.
 */
export function watchForUpdates({ fetch, current, apply, paused = () => false, every = 60e3 }) {
  let inFlight = false;
  let epoch = 0;
  const fingerprint = (p) => JSON.stringify([p.status, p.final, p.updatedAt, p.responses?.map((r) => [r.id, r.updatedAt]), p.responseCount]);
  async function check() {
    if (inFlight || document.hidden || document.querySelector('dialog[open]') || paused()) return;
    inFlight = true;
    const started = epoch;
    try {
      const next = await fetch();
      if (started === epoch && !paused() && next && fingerprint(next) !== fingerprint(current())) apply(next);
    } catch { /* offline or deleted: keep what we have */ }
    inFlight = false;
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
  setInterval(check, every);
  return { bump: () => { epoch++; } };
}

/**
 * Remember which control has focus, and return a function that focuses the
 * matching control after the page re-renders (elements are rebuilt, so this
 * matches by a stable key rather than by element).
 */
export function captureFocus() {
  const el = document.activeElement;
  if (!el || el === document.body) return () => {};
  let selector = null;
  if (el.id) selector = `#${CSS.escape(el.id)}`;
  else if (el.dataset?.slot) selector = `.${el.classList.contains('cell') ? 'cell' : 'slot-btn'}[data-slot="${el.dataset.slot}"]`;
  else if (el.name === 'brush') selector = `input[name="brush"][value="${CSS.escape(el.value)}"]`;
  else if (el.classList.contains('person-btn')) selector = `[data-id="${CSS.escape(el.closest('[data-id]')?.dataset.id || '')}"] .person-btn`;
  else if (el.dataset?.tool) selector = `[data-tool="${CSS.escape(el.dataset.tool)}"]`;
  else if (el.dataset?.day) selector = `.day-chip[data-day="${CSS.escape(el.dataset.day)}"]`;
  else if (el.dataset?.action) selector = `[data-action="${CSS.escape(el.dataset.action)}"]`;
  return () => {
    const target = selector && document.querySelector(selector);
    target?.focus({ preventScroll: true });
  };
}

const pad = (n) => String(n).padStart(2, '0');
const utcStamp = (ms) => {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
};

/** Links that open a prefilled event in Google Calendar or Outlook (only if the person clicks them). */
export function calendarLinks(poll, guestUrl) {
  const { start, end } = poll.final;
  const weekly = poll.kind === 'weekly';
  const details = [poll.description, `Scheduled with Overlap: ${guestUrl}`].filter(Boolean).join('\n\n');
  const google = new URL('https://calendar.google.com/calendar/render');
  google.searchParams.set('action', 'TEMPLATE');
  google.searchParams.set('text', poll.title);
  google.searchParams.set('dates', `${utcStamp(start)}/${utcStamp(end)}`);
  google.searchParams.set('details', details);
  if (poll.location) google.searchParams.set('location', poll.location);
  if (weekly) {
    google.searchParams.set('recur', 'RRULE:FREQ=WEEKLY');
    google.searchParams.set('ctz', poll.timezone);
  }
  const outlook = new URL('https://outlook.live.com/calendar/0/deeplink/compose');
  outlook.searchParams.set('path', '/calendar/action/compose');
  outlook.searchParams.set('rru', 'addevent');
  outlook.searchParams.set('subject', poll.title);
  outlook.searchParams.set('startdt', new Date(start).toISOString());
  outlook.searchParams.set('enddt', new Date(end).toISOString());
  outlook.searchParams.set('body', details);
  if (poll.location) outlook.searchParams.set('location', poll.location);
  return { google: google.toString(), outlook: weekly ? null : outlook.toString() };
}

export function finalDetailsText(poll, guestUrl) {
  const { start, end } = poll.final;
  return [
    poll.title,
    `${f.finalDay(start, poll.timezone, poll.kind === 'weekly')}, ${f.timeRange(start, end, poll.timezone)} (${f.zoneLabel(poll.timezone, start)})`,
    poll.location ? `Where: ${poll.location}` : null,
    poll.description || null,
    `Details: ${guestUrl}`,
  ].filter(Boolean).join('\n');
}

function finalLinks(poll, guestUrl) {
  const { google, outlook } = calendarLinks(poll, guestUrl);
  return h('p', { class: 'final-links' },
    'Or add it to ',
    h('a', { href: google, target: '_blank', rel: 'noopener noreferrer' }, 'Google Calendar'),
    outlook ? [' or ', h('a', { href: outlook, target: '_blank', rel: 'noopener noreferrer' }, 'Outlook.com')] : null,
    '. Opening one sends that company the event details, including this poll’s guest link.');
}

export function finalCard(poll, viewZone, { organizer = false, extra = [] } = {}) {
  const { start, end } = poll.final;
  const guestUrl = `${location.origin}/p/${poll.id}`;
  const different = viewZone !== poll.timezone;
  return h('section', { class: 'final-card', 'aria-labelledby': 'final-title', tabindex: '-1' },
    h('p', { class: 'final-kicker', id: 'final-title' }, organizer ? 'Final time' : 'It’s set. The organizer chose a time.'),
    h('p', { class: 'final-when' },
      h('span', { class: 'final-day' }, f.finalDay(start, viewZone, poll.kind === 'weekly')),
      h('span', { class: 'final-time' }, f.timeRange(start, end, viewZone))),
    h('p', { class: 'final-zone' }, `${f.zoneLabel(viewZone, start)}${different ? `. That’s ${f.slotRange(start, end, poll.timezone, poll.kind === 'weekly')} for the organizer in ${poll.timezone.split('/').pop().replace(/_/g, ' ')}.` : ''}`),
    h('div', { class: 'final-actions' },
      h('a', { class: 'btn primary', href: `${API_BASE}/api/polls/${poll.id}/invite.ics`, download: '' }, icon('download'), poll.kind === 'weekly' ? 'Download weekly calendar invite' : 'Download calendar invite'),
      h('button', { type: 'button', class: 'btn secondary', onclick: () => copyText(finalDetailsText(poll, guestUrl), 'Copied the event details') }, icon('copy'), 'Copy details'),
      ...extra,
    ),
    finalLinks(poll, guestUrl),
    organizer ? null : h('p', { class: 'muted small' }, 'This poll is closed, so responses can’t be changed.'),
  );
}
