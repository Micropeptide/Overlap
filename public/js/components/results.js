// Group results: heatmap grid, legend, the people who answered, and a panel
// showing exactly who can make the time under the pointer or keyboard focus.

import { h, clear, confirmDialog, icon, announce } from '../lib/dom.js';
import * as f from '../lib/format.js';
import { tallySlots, statusAt } from '/shared/overlap.js';
import { createGrid, slotDetail } from './grid.js';

/**
 * `state` is owned by the page so choices survive re-renders and refreshes:
 * { focusId, showCounts, day }.
 */
export function resultsSection({ poll, timeZone, selfId = null, onPick = null, onRemove = null, exportable = false, title = 'Everyone’s availability', state = {} }) {
  const responses = poll.responses || [];
  const tally = tallySlots(poll.slots, responses);
  const weekly = poll.kind === 'weekly';
  if (state.focusId && !responses.some((r) => r.id === state.focusId)) state.focusId = null;
  let focusId = state.focusId || null;
  let showCounts = !!state.showCounts;

  const root = h('section', { class: 'results', 'aria-labelledby': 'results-title' });
  root.highlight = () => {};
  root.destroy = () => {};
  root.append(h('h2', { id: 'results-title', class: 'section-title' }, title));

  if (!responses.length) {
    root.append(h('div', { class: 'empty-state' },
      h('p', { class: 'empty-title' }, 'Nothing to compare yet'),
      h('p', null, 'Once people respond, darker squares show times more of them can make.')));
    return root;
  }

  const legend = h('div', { class: 'legend', 'aria-label': 'Legend' });
  const detailHost = h('div', { class: 'detail-host', 'aria-live': 'polite' });
  const detailIdle = () => h('p', { class: 'muted small detail-idle' }, onPick
    ? 'Point at or tab to a time to see who can make it. Click a time to make it the final time.'
    : 'Point at or tab to a time to see who can make it.');
  detailHost.append(detailIdle());

  const grid = createGrid({
    mode: 'results',
    weekly,
    slots: poll.slots,
    slotMinutes: poll.slotMinutes,
    timeZone,
    responses,
    label: 'Group availability',
    describedBy: 'results-help',
    focusId,
    showCounts,
    day: state.day,
    onDayChange: (d) => { state.day = d; },
    onPick,
    onInspect: (slot) => {
      clear(detailHost);
      if (slot == null) { detailHost.append(detailIdle()); return; }
      detailHost.append(slotDetail({ slot, slotMinutes: poll.slotMinutes, timeZone, weekly, tally: tally.get(slot), responses }));
    },
  });

  function renderLegend() {
    clear(legend);
    const item = (cls, text) => h('span', { class: 'legend-item' }, h('span', { class: `swatch ${cls}`, 'aria-hidden': 'true' }), text);
    if (focusId) {
      const who = responses.find((r) => r.id === focusId)?.name;
      legend.append(
        h('span', { class: 'legend-who' }, `Showing ${who}`),
        item('sw-pref', 'Preferred'), item('sw-yes', 'Available'), item('sw-maybe', 'If needed'),
        item('sw-no', 'Not available'), item('sw-unanswered', 'Hasn’t seen this time'),
      );
    } else {
      legend.append(
        item('sw-ramp', 'Darker means more people'),
        item('sw-all', 'Everyone'),
        item('sw-has-maybe', 'Includes “if needed”'),
      );
    }
  }

  const people = h('ul', { class: 'people', role: 'list' });
  function renderPeople() {
    clear(people);
    for (const r of responses) {
      const pref = (r.preferred || []).length;
      const yes = r.available.length + pref;
      const maybe = r.ifNeeded.length;
      const unseen = r.answered ? poll.slots.filter((s) => !r.answered.includes(s)).length : 0;
      const summary = yes || maybe
        ? `${yes} available${pref ? ` (${pref} preferred)` : ''}${maybe ? `, ${maybe} if needed` : ''}`
        : 'None of these times work';
      const pressed = focusId === r.id;
      const li = h('li', { class: `person${pressed ? ' active' : ''}`, dataset: { id: r.id } },
        h('button', {
          type: 'button',
          class: 'person-btn',
          'aria-pressed': pressed ? 'true' : 'false',
          onclick: () => {
            focusId = pressed ? null : r.id;
            state.focusId = focusId;
            grid.update({ focusId });
            renderLegend();
            renderPeople();
            people.querySelector(`[data-id="${r.id}"] .person-btn`)?.focus();
          },
        },
        h('span', { class: 'person-name' }, r.name, r.id === selfId ? h('span', { class: 'you-tag' }, 'You') : null),
        h('span', { class: 'person-meta' }, summary + (unseen ? `, hasn’t seen ${unseen} newer times` : '')),
        r.note ? h('span', { class: 'person-note' }, `“${r.note}”`) : null,
        r.updatedAt ? h('span', { class: 'person-when' }, `Answered ${f.ago(r.updatedAt)}`) : null),
        onRemove ? h('button', {
          type: 'button',
          class: 'icon-btn danger-text',
          'aria-label': `Remove ${r.name}’s response`,
          onclick: async () => {
            const ok = await confirmDialog({
              title: `Remove ${r.name}’s response?`,
              message: 'Their times will be deleted for good. They can respond again while the poll is open.',
              confirm: 'Remove response',
              danger: true,
            });
            if (ok) onRemove(r);
          },
        }, '×') : null,
      );
      people.append(li);
    }
  }

  const countsToggle = h('label', { class: 'check' },
    h('input', {
      type: 'checkbox',
      checked: showCounts,
      onchange: (e) => { showCounts = e.target.checked; state.showCounts = showCounts; grid.update({ showCounts }); },
    }),
    h('span', null, 'Show numbers'));

  renderLegend();
  renderPeople();

  root.append(
    h('p', { class: 'muted small', id: 'results-help' }, 'Select a name to see just that person’s answers.'),
    h('div', { class: 'legend-row' }, legend, h('div', { class: 'results-tools' },
      countsToggle,
      exportable ? h('button', { type: 'button', class: 'btn small ghost', onclick: () => downloadCsv(poll, timeZone) }, icon('download'), 'Export CSV') : null)),
    h('div', { class: 'results-layout' },
      h('div', { class: 'results-grid' }, grid.el),
      h('aside', { class: 'results-side', 'aria-label': 'Who responded' },
        h('h3', { class: 'side-title' }, `Responses (${responses.length})`),
        people,
        h('div', { class: 'detail-card' }, detailHost),
      ),
    ),
  );
  root.destroy = () => grid.destroy();
  root.highlight = (slots) => grid.highlight(slots);
  return root;
}

/** One row per person, one column per time, in the viewer's time zone. */
export function buildCsv(poll, timeZone) {
  const responses = poll.responses || [];
  const weekly = poll.kind === 'weekly';
  const indexed = responses.map((r) => ({
    yes: new Set([...(r.available || []), ...(r.preferred || [])]),
    pref: new Set(r.preferred || []),
    maybe: new Set(r.ifNeeded || []),
    answered: r.answered ? new Set(r.answered) : null,
  }));
  const word = { yes: 'Available', maybe: 'If needed', no: 'Not available', unanswered: 'Not answered' };
  const cell = (v) => {
    let s = String(v ?? '');
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // keep spreadsheets from running it as a formula
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = ['Name', 'Note', ...poll.slots.map((s) => `${f.slotDay(s, timeZone, weekly)} ${f.time(s, timeZone)}`)];
  const rows = responses.map((r, i) => [
    r.name,
    r.note || '',
    ...poll.slots.map((s) => (indexed[i].pref.has(s) ? 'Preferred' : word[statusAt(indexed[i], s)])),
  ]);
  const counts = ['Available (count)', '', ...poll.slots.map((s) => indexed.filter((p) => p.yes.has(s) || p.maybe.has(s)).length)];
  return [header, ...rows, counts].map((row) => row.map(cell).join(',')).join('\r\n') + '\r\n';
}

function downloadCsv(poll, timeZone) {
  const blob = new Blob(['﻿', buildCsv(poll, timeZone)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: `${poll.title.replace(/[^\w\- ]+/g, '').trim().slice(0, 40) || 'overlap'}.csv` });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  announce('Downloaded the responses as a CSV file');
}
