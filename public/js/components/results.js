// Group results: heatmap grid, legend, the people who answered, and a panel
// showing exactly who can make the time under the pointer or keyboard focus.

import { h, clear, confirmDialog, icon, announce } from '../lib/dom.js';
import * as f from '../lib/format.js';
import { tallySlots, statusAt } from '/shared/overlap.js';
import { createGrid, slotDetail } from './grid.js';
import { t } from '../lib/i18n.js';

/**
 * `state` is owned by the page so choices survive re-renders and refreshes:
 * { focusId, showCounts, day }.
 */
export function resultsSection({ poll, timeZone, selfId = null, onPick = null, onRemove = null, exportable = false, title = t('results.title'), state = {} }) {
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
      h('p', { class: 'empty-title' }, t('results.emptyTitle')),
      h('p', null, t('results.emptyBody'))));
    return root;
  }

  const legend = h('div', { class: 'legend', 'aria-label': t('results.legend') });
  const detailHost = h('div', { class: 'detail-host', 'aria-live': 'polite' });
  const detailIdle = () => h('p', { class: 'muted small detail-idle' }, onPick
    ? t('results.idlePick')
    : t('results.idle'));
  detailHost.append(detailIdle());

  const grid = createGrid({
    mode: 'results',
    weekly,
    slots: poll.slots,
    slotMinutes: poll.slotMinutes,
    timeZone,
    responses,
    label: t('results.gridLabel'),
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
        h('span', { class: 'legend-who' }, t('results.showing', { name: who })),
        item('sw-pref', t('results.legendPref')), item('sw-yes', t('results.legendYes')), item('sw-maybe', t('results.legendMaybe')),
        item('sw-no', t('results.legendNo')), item('sw-unanswered', t('results.legendUnanswered')),
      );
    } else {
      legend.append(
        item('sw-ramp', t('results.legendRamp')),
        item('sw-all', t('results.legendAll')),
        item('sw-has-maybe', t('results.legendHasMaybe')),
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
      const summary = personSummary({ yes, pref, maybe });
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
        h('span', { class: 'person-name' }, r.name, r.id === selfId ? h('span', { class: 'you-tag' }, t('results.you')) : null),
        h('span', { class: 'person-meta' }, unseen ? t('results.unseen', { summary, count: unseen }) : summary),
        r.note ? h('span', { class: 'person-note' }, t('results.note', { note: r.note })) : null,
        r.updatedAt ? h('span', { class: 'person-when' }, t('results.answered', { when: f.ago(r.updatedAt) })) : null),
        onRemove ? h('button', {
          type: 'button',
          class: 'icon-btn danger-text',
          'aria-label': t('results.removeLabel', { name: r.name }),
          onclick: async () => {
            const ok = await confirmDialog({
              title: t('results.removeTitle', { name: r.name }),
              message: t('results.removeMessage'),
              confirm: t('results.removeConfirm'),
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
    h('span', null, t('results.showNumbers')));

  renderLegend();
  renderPeople();

  root.append(
    h('p', { class: 'muted small', id: 'results-help' }, t('results.help')),
    h('div', { class: 'legend-row' }, legend, h('div', { class: 'results-tools' },
      countsToggle,
      exportable ? h('button', { type: 'button', class: 'btn small ghost', onclick: () => downloadCsv(poll, timeZone) }, icon('download'), t('results.exportCsv')) : null)),
    h('div', { class: 'results-layout' },
      h('div', { class: 'results-grid' }, grid.el),
      h('aside', { class: 'results-side', 'aria-label': t('results.whoResponded') },
        h('h3', { class: 'side-title' }, t('results.responses', { count: responses.length })),
        people,
        h('div', { class: 'detail-card' }, detailHost),
      ),
    ),
  );
  root.destroy = () => grid.destroy();
  root.highlight = (slots) => grid.highlight(slots);
  return root;
}

/** "3 available (1 preferred), 2 if needed", or that none of the times work. */
function personSummary({ yes, pref, maybe }) {
  if (!yes && !maybe) return t('results.noneWork');
  const vars = { count: yes, pref, maybe };
  if (pref && maybe) return t('results.summaryPrefMaybe', vars);
  if (pref) return t('results.summaryPref', vars);
  if (maybe) return t('results.summaryMaybe', vars);
  return t('results.summary', vars);
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
  const word = { yes: t('results.csvYes'), maybe: t('results.csvMaybe'), no: t('results.csvNo'), unanswered: t('results.csvUnanswered') };
  const cell = (v) => {
    let s = String(v ?? '');
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // keep spreadsheets from running it as a formula
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = [t('results.csvName'), t('results.csvNote'), ...poll.slots.map((s) => t('results.csvTime', { day: f.slotDay(s, timeZone, weekly), time: f.time(s, timeZone) }))];
  const rows = responses.map((r, i) => [
    r.name,
    r.note || '',
    ...poll.slots.map((s) => (indexed[i].pref.has(s) ? t('results.csvPref') : word[statusAt(indexed[i], s)])),
  ]);
  const counts = [t('results.csvCount'), '', ...poll.slots.map((s) => indexed.filter((p) => p.yes.has(s) || p.maybe.has(s)).length)];
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
  announce(t('results.downloaded'));
}
