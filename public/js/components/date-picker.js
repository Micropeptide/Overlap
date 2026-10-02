// Month calendar for choosing several dates. Click or drag across days; on a
// keyboard, arrows move, Space or Enter toggles, Page Up/Down change month.

import { h, clear } from '../lib/dom.js';
import { addDays, parseDateKey, toDateKey, weekdayOf } from '/shared/time.js';

function firstDayOfWeek() {
  try {
    const loc = new Intl.Locale(navigator.language);
    const info = loc.getWeekInfo?.() || loc.weekInfo;
    if (info?.firstDay) return info.firstDay % 7; // Intl uses 7 for Sunday
  } catch { /* ignore */ }
  return 0;
}

export function createDatePicker({ selected = [], today, allowPast = [], onChange = () => {}, labelledBy }) {
  const chosen = new Set(selected);
  const keepPast = new Set(allowPast);
  const weekStart = firstDayOfWeek();
  const start = [...chosen].sort()[0] || today;
  let view = { year: parseDateKey(start).year, month: parseDateKey(start).month };
  let focusKey = start;
  let drag = null;
  let pointerHandled = false;
  let anchor = null; // last day clicked, for Shift+click ranges

  const root = h('div', { class: 'datepicker' });
  const monthFmt = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const dayFmt = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
  const wdFmt = new Intl.DateTimeFormat(undefined, { weekday: 'narrow', timeZone: 'UTC' });
  const wdLong = new Intl.DateTimeFormat(undefined, { weekday: 'long', timeZone: 'UTC' });

  const disabled = (dk) => dk < today && !keepPast.has(dk);

  function setDay(dk, on) {
    if (disabled(dk)) return;
    if (on) chosen.add(dk); else chosen.delete(dk);
  }

  function emit() {
    onChange([...chosen].sort());
  }

  function shiftMonth(n) {
    const d = new Date(Date.UTC(view.year, view.month - 1 + n, 1));
    view = { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
  }

  function render({ keepFocus = false } = {}) {
    clear(root);
    const first = toDateKey(view.year, view.month, 1);
    const lead = (weekdayOf(first) - weekStart + 7) % 7;
    const gridStart = addDays(first, -lead);
    const monthLabel = monthFmt.format(Date.UTC(view.year, view.month - 1, 1));
    const canGoBack = toDateKey(view.year, view.month, 1) > today.slice(0, 8) + '01' || [...chosen].some((d) => d < first);

    const head = h('div', { class: 'dp-head' },
      h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Previous month', disabled: !canGoBack, onclick: () => { shiftMonth(-1); render(); } }, '‹'),
      h('p', { class: 'dp-month', 'aria-live': 'polite' }, monthLabel),
      h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Next month', onclick: () => { shiftMonth(1); render(); } }, '›'),
    );

    const table = h('table', { class: 'dp-table', role: 'grid', 'aria-labelledby': labelledBy, 'aria-multiselectable': 'true' });
    const thead = h('thead', null, h('tr', null, Array.from({ length: 7 }, (_, i) => {
      const dk = addDays(gridStart, i);
      const { year, month, day } = parseDateKey(dk);
      const ms = Date.UTC(year, month - 1, day);
      return h('th', { scope: 'col', abbr: wdLong.format(ms) }, h('span', { 'aria-hidden': 'true' }, wdFmt.format(ms)), h('span', { class: 'visually-hidden' }, wdLong.format(ms)));
    })));
    const tbody = h('tbody');
    const inMonth = (dk) => parseDateKey(dk).month === view.month;
    if (!inMonth(focusKey)) focusKey = [...chosen].sort().find(inMonth) || (inMonth(today) ? today : first);

    for (let w = 0; w < 6; w++) {
      const tr = h('tr');
      for (let d = 0; d < 7; d++) {
        const dk = addDays(gridStart, w * 7 + d);
        if (!inMonth(dk)) { tr.append(h('td', { class: 'dp-out', role: 'gridcell' })); continue; }
        const { year, month, day } = parseDateKey(dk);
        const btn = h('button', {
          type: 'button',
          class: `dp-day${chosen.has(dk) ? ' on' : ''}${dk === today ? ' today' : ''}`,
          'aria-pressed': chosen.has(dk) ? 'true' : 'false',
          'aria-label': `${dayFmt.format(Date.UTC(year, month - 1, day))}${dk === today ? ', today' : ''}`,
          disabled: disabled(dk),
          tabindex: dk === focusKey ? '0' : '-1',
          dataset: { date: dk },
        }, String(day));
        tr.append(h('td', { role: 'gridcell' }, btn));
      }
      if (w >= 4 && ![...tr.children].some((td) => td.firstChild)) continue;
      tbody.append(tr);
    }
    table.append(thead, tbody);
    root.append(head, table);
    if (keepFocus) root.querySelector(`[data-date="${focusKey}"]`)?.focus();
  }

  root.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('.dp-day');
    // Touch uses plain taps (handled on click) so swiping still scrolls the page.
    if (!btn || btn.disabled || e.button !== 0 || e.pointerType === 'touch') return;
    e.preventDefault();
    pointerHandled = true;
    const dk = btn.dataset.date;
    if (e.shiftKey && anchor) {
      // Shift+click selects every day between the last click and this one.
      const [a, b] = anchor < dk ? [anchor, dk] : [dk, anchor];
      for (let d = a; d <= b; d = addDays(d, 1)) setDay(d, true);
      focusKey = dk;
      render({ keepFocus: true });
      emit();
      return;
    }
    anchor = dk;
    drag = { on: !chosen.has(dk), id: e.pointerId };
    root.setPointerCapture(e.pointerId);
    focusKey = dk;
    setDay(dk, drag.on);
    render({ keepFocus: true });
  });
  root.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const btn = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('.dp-day');
    if (!btn || btn.disabled || !root.contains(btn)) return;
    const dk = btn.dataset.date;
    if (chosen.has(dk) === drag.on) return;
    setDay(dk, drag.on);
    btn.classList.toggle('on', drag.on);
    btn.setAttribute('aria-pressed', String(drag.on));
  });
  const end = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
    emit();
  };
  root.addEventListener('pointerup', end);
  root.addEventListener('pointercancel', end);
  // Mouse and pen are handled on pointerdown (to allow drag-selecting);
  // taps and keyboard presses arrive here.
  root.addEventListener('click', (e) => {
    if (pointerHandled) { pointerHandled = false; return; }
    const btn = e.target.closest('.dp-day');
    if (!btn || btn.disabled) return;
    const dk = btn.dataset.date;
    setDay(dk, !chosen.has(dk));
    focusKey = dk;
    render({ keepFocus: true });
    emit();
  });

  root.addEventListener('keydown', (e) => {
    const btn = e.target.closest('.dp-day');
    if (!btn) return;
    const deltas = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    let next = null;
    if (deltas[e.key]) next = addDays(btn.dataset.date, deltas[e.key]);
    else if (e.key === 'PageUp' || e.key === 'PageDown') {
      shiftMonth(e.key === 'PageUp' ? -1 : 1);
      const { day } = parseDateKey(btn.dataset.date);
      const last = new Date(Date.UTC(view.year, view.month, 0)).getUTCDate();
      next = toDateKey(view.year, view.month, Math.min(day, last));
    } else return;
    e.preventDefault();
    const { year, month } = parseDateKey(next);
    if (year !== view.year || month !== view.month) view = { year, month };
    focusKey = next;
    render({ keepFocus: true });
  });

  render();
  return {
    el: root,
    get value() { return [...chosen].sort(); },
    set(dates) { chosen.clear(); dates.forEach((d) => chosen.add(d)); render(); },
  };
}
