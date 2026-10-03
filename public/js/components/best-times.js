// Ranked list of the best times: first every window everyone can make, then
// the closest partial matches. Shown as a collapsible section below the grid;
// its header always says the top answer, and the open/closed choice is remembered.

import { h } from '../lib/dom.js';
import * as f from '../lib/format.js';
import { rankWindows } from '/shared/overlap.js';
import { storage } from '../lib/storage.js';

export function bestTimes({ poll, timeZone, onChoose, emptyAction, onHighlight = () => {} }) {
  const weekly = poll.kind === 'weekly';
  const responses = poll.responses || [];
  const summaryLine = h('span', { class: 'best-summary' });
  const root = h('div', { class: 'best-body' });
  const details = h('details', { class: 'best', open: storage.pref('showBest', false) ? true : null },
    h('summary', null, h('span', { class: 'best-heading' }, 'Best times'), summaryLine),
    root);
  details.addEventListener('toggle', () => storage.setPref('showBest', details.open));

  if (!responses.length) {
    summaryLine.textContent = 'Appear here as people answer';
    root.append(h('div', { class: 'empty-state' },
      h('p', { class: 'empty-title' }, 'No responses yet'),
      h('p', null, 'Share the guest link. The best times will appear here as people answer.'),
      emptyAction || null,
    ));
    return details;
  }

  const ranked = rankWindows({
    slots: poll.slots,
    slotMinutes: poll.slotMinutes,
    durationMinutes: poll.durationMinutes,
    responses,
  });
  const names = new Map(responses.map((r) => [r.id, r.name]));
  // Availability is checked in whole time steps, but the meeting itself is as long as the organizer said.
  const meetingMinutes = poll.durationMinutes || poll.slotMinutes;
  const blockMinutes = ranked.need * poll.slotMinutes;

  const item = (w, everyone) => {
    const roomy = w.minutes > blockMinutes;
    const li = h('li', { class: `best-item${everyone ? ' everyone' : ''}` },
      h('div', { class: 'best-when' },
        h('p', { class: 'best-day' }, weekly ? f.finalDay(w.start, timeZone, true) : f.dayOf(w.start, timeZone)),
        h('p', { class: 'best-time' }, f.timeRange(w.start, w.end, timeZone)),
        roomy && poll.durationMinutes
          ? h('p', { class: 'best-note' }, `Room for a ${f.duration(meetingMinutes)} meeting anywhere in this window`)
          : null,
      ),
      h('div', { class: 'best-who' },
        h('p', { class: 'best-count' },
          h('strong', null, `${w.count} of ${ranked.total}`), ' available',
          w.maybe.length ? h('span', { class: 'maybe-tag' }, `${w.maybe.length} if needed`) : null,
          w.pref.length ? h('span', { class: 'pref-tag' }, `★ ${w.pref.length} prefer${w.pref.length === 1 ? 's' : ''}`) : null),
        h('p', { class: 'best-names' },
          w.yes.map((id) => h('span', { class: `name-chip${w.pref.includes(id) ? ' pref' : ''}` }, names.get(id),
            w.pref.includes(id) ? h('span', { class: 'visually-hidden' }, ' (preferred)') : null)),
          w.maybe.map((id) => h('span', { class: 'name-chip maybe', title: 'If needed' }, names.get(id), h('span', { class: 'visually-hidden' }, ' (if needed)'))),
        ),
      ),
      onChoose ? h('button', {
        type: 'button',
        class: `btn ${everyone ? 'primary' : 'secondary'} small best-choose`,
        onclick: () => onChoose(w),
        'aria-label': `Choose ${f.slotRange(w.start, Math.min(w.end, w.start + meetingMinutes * 60000), timeZone, weekly)}`,
      }, 'Choose') : null,
    );
    // Point at or focus an option to outline it on the grid below.
    const slotsIn = poll.slots.filter((s) => s >= w.start && s < w.end);
    li.addEventListener('mouseenter', () => onHighlight(slotsIn));
    li.addEventListener('mouseleave', () => onHighlight(null));
    li.addEventListener('focusin', () => onHighlight(slotsIn));
    li.addEventListener('focusout', () => onHighlight(null));
    return li;
  };

  if (ranked.everyone.length) {
    root.append(
      h('h3', { class: 'best-sub' }, ranked.total === 1 ? 'Works for the one response so far' : `Everyone can make these (${ranked.total} people)`),
      h('ol', { class: 'best-list' }, ranked.everyone.slice(0, 6).map((w) => item(w, true))),
    );
    if (ranked.everyone.length > 6) root.append(h('p', { class: 'muted small' }, `${ranked.everyone.length - 6} more times work for everyone. See the grid above.`));
  } else {
    root.append(h('p', { class: 'no-everyone' }, 'No time works for everyone yet. These come closest.'));
  }

  if (ranked.partial.length) {
    root.append(
      h('h3', { class: 'best-sub' }, ranked.everyone.length ? 'Next best' : 'Closest matches'),
      h('ol', { class: 'best-list' }, ranked.partial.map((w) => item(w, false))),
    );
  } else if (!ranked.everyone.length) {
    root.append(h('p', { class: 'muted' }, 'Nobody has marked any times yet.'));
  }
  const top = ranked.everyone[0] || ranked.partial[0];
  summaryLine.textContent = !top ? 'No times yet'
    : `${ranked.everyone.length ? 'Works for everyone' : `Closest: ${top.count} of ${ranked.total}`}: ${weekly ? f.finalDay(top.start, timeZone, true) : f.dayOf(top.start, timeZone)}, ${f.timeRange(top.start, top.end, timeZone)}`;
  return details;
}
