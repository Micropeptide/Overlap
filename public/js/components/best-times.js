// Ranked list of the best times: first every window everyone can make, then
// the closest partial matches. Shown as a collapsible section below the grid;
// its header always says the top answer, and the open/closed choice is remembered.

import { h } from '../lib/dom.js';
import * as f from '../lib/format.js';
import { rankWindows } from '/shared/overlap.js';
import { storage } from '../lib/storage.js';
import { t, tx } from '../lib/i18n.js';

export function bestTimes({ poll, timeZone, onChoose, emptyAction, onHighlight = () => {} }) {
  const weekly = poll.kind === 'weekly';
  const responses = poll.responses || [];
  const summaryLine = h('span', { class: 'best-summary' });
  const root = h('div', { class: 'best-body' });
  const details = h('details', { class: 'best', open: storage.pref('showBest', false) ? true : null },
    h('summary', null, h('span', { class: 'best-heading' }, t('best.heading')), summaryLine),
    root);
  details.addEventListener('toggle', () => storage.setPref('showBest', details.open));

  if (!responses.length) {
    summaryLine.textContent = t('best.emptySummary');
    root.append(h('div', { class: 'empty-state' },
      h('p', { class: 'empty-title' }, t('best.noResponses')),
      h('p', null, t('best.emptyBody')),
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
          ? h('p', { class: 'best-note' }, t('best.roomFor', { length: f.duration(meetingMinutes) }))
          : null,
      ),
      h('div', { class: 'best-who' },
        h('p', { class: 'best-count' },
          tx('best.available', { fraction: h('strong', null, t('best.fraction', { count: w.count, total: ranked.total })) }),
          w.maybe.length ? h('span', { class: 'maybe-tag' }, t('best.maybeCount', { count: w.maybe.length })) : null,
          w.pref.length ? h('span', { class: 'pref-tag' }, t('best.prefCount', { count: w.pref.length })) : null),
        h('p', { class: 'best-names' },
          w.yes.map((id) => h('span', { class: `name-chip${w.pref.includes(id) ? ' pref' : ''}` }, names.get(id),
            w.pref.includes(id) ? h('span', { class: 'visually-hidden' }, ' ', t('best.preferredNote')) : null)),
          w.maybe.map((id) => h('span', { class: 'name-chip maybe', title: t('best.ifNeeded') }, names.get(id), h('span', { class: 'visually-hidden' }, ' ', t('best.ifNeededNote')))),
        ),
      ),
      onChoose ? h('button', {
        type: 'button',
        class: `btn ${everyone ? 'primary' : 'secondary'} small best-choose`,
        onclick: () => onChoose(w),
        'aria-label': t('best.chooseLabel', { time: f.slotRange(w.start, Math.min(w.end, w.start + meetingMinutes * 60000), timeZone, weekly) }),
      }, t('best.choose')) : null,
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
      h('h3', { class: 'best-sub' }, ranked.total === 1 ? t('best.everyoneSingle') : t('best.everyone', { count: ranked.total })),
      h('ol', { class: 'best-list' }, ranked.everyone.slice(0, 6).map((w) => item(w, true))),
    );
    if (ranked.everyone.length > 6) root.append(h('p', { class: 'muted small' }, t('best.more', { count: ranked.everyone.length - 6 })));
  } else {
    root.append(h('p', { class: 'no-everyone' }, t('best.noEveryone')));
  }

  if (ranked.partial.length) {
    root.append(
      h('h3', { class: 'best-sub' }, ranked.everyone.length ? t('best.nextBest') : t('best.closest')),
      h('ol', { class: 'best-list' }, ranked.partial.map((w) => item(w, false))),
    );
  } else if (!ranked.everyone.length) {
    root.append(h('p', { class: 'muted' }, t('best.nobody')));
  }
  const top = ranked.everyone[0] || ranked.partial[0];
  if (!top) summaryLine.textContent = t('best.noTimes');
  else {
    const when = { day: weekly ? f.finalDay(top.start, timeZone, true) : f.dayOf(top.start, timeZone), time: f.timeRange(top.start, top.end, timeZone) };
    summaryLine.textContent = ranked.everyone.length
      ? t('best.summaryEveryone', when)
      : t('best.summaryClosest', { ...when, count: top.count, total: ranked.total });
  }
  return details;
}
