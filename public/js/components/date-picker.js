// Calendar for choosing several dates: one month on narrow screens, two side
// by side on wide ones, with month and year menus for jumping far ahead.
// Click or drag across days, Shift+click for a range; on a keyboard, arrows
// move, Space or Enter toggles, Page Up/Down change month.

import { h, clear } from '../lib/dom.js';
import { addDays, parseDateKey, toDateKey, weekdayOf } from '/shared/time.js';
import { t, locale } from '../lib/i18n.js';

/**
 * The page's language, with the browser's region when both are the same
 * language (English page, en-GB browser: weeks start on Monday).
 */
function weekLocale() {
  const page = new Intl.Locale(locale());
  try {
    const browser = new Intl.Locale(navigator.language);
    if (browser.language === page.language && browser.region) {
      return new Intl.Locale(page.language, { ...(page.script ? { script: page.script } : {}), region: browser.region });
    }
  } catch { /* ignore */ }
  return page;
}

function firstDayOfWeek() {
  try {
    const loc = weekLocale();
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
  const monthFmt = new Intl.DateTimeFormat(locale(), { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const dayFmt = new Intl.DateTimeFormat(locale(), { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
  const wdFmt = new Intl.DateTimeFormat(locale(), { weekday: 'narrow', timeZone: 'UTC' });
  const wdLong = new Intl.DateTimeFormat(locale(), { weekday: 'long', timeZone: 'UTC' });

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

  const WIDE = window.matchMedia('(min-width: 860px)');
  const monthName = new Intl.DateTimeFormat(locale(), { month: 'long', timeZone: 'UTC' });
  const todayParts = parseDateKey(today);
  const monthsShown = () => (WIDE.matches ? 2 : 1);
  const monthOf = (offset) => {
    const d = new Date(Date.UTC(view.year, view.month - 1 + offset, 1));
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
  };
  const visible = (dk) => {
    const { year, month } = parseDateKey(dk);
    for (let i = 0; i < monthsShown(); i++) {
      const m = monthOf(i);
      if (m.year === year && m.month === month) return true;
    }
    return false;
  };

  function monthTable({ year, month }, i) {
    const first = toDateKey(year, month, 1);
    const lead = (weekdayOf(first) - weekStart + 7) % 7;
    const gridStart = addDays(first, -lead);
    const table = h('table', { class: 'dp-table', role: 'grid', 'aria-label': monthFmt.format(Date.UTC(year, month - 1, 1)), 'aria-multiselectable': 'true' });
    table.append(h('thead', null, h('tr', null, Array.from({ length: 7 }, (_, d) => {
      const { year: y, month: m, day } = parseDateKey(addDays(gridStart, d));
      const ms = Date.UTC(y, m - 1, day);
      return h('th', { scope: 'col', abbr: wdLong.format(ms) }, h('span', { 'aria-hidden': 'true' }, wdFmt.format(ms)), h('span', { class: 'visually-hidden' }, wdLong.format(ms)));
    }))));
    const tbody = h('tbody');
    for (let w = 0; w < 6; w++) {
      const tr = h('tr');
      let any = false;
      for (let d = 0; d < 7; d++) {
        const dk = addDays(gridStart, w * 7 + d);
        if (parseDateKey(dk).month !== month) { tr.append(h('td', { class: 'dp-out', role: 'gridcell' })); continue; }
        any = true;
        const { day } = parseDateKey(dk);
        tr.append(h('td', { role: 'gridcell' }, h('button', {
          type: 'button',
          class: `dp-day${chosen.has(dk) ? ' on' : ''}${dk === today ? ' today' : ''}`,
          'aria-pressed': chosen.has(dk) ? 'true' : 'false',
          'aria-label': dk === today ? t('datePicker.today', { day: dayFmt.format(Date.UTC(year, month - 1, day)) }) : dayFmt.format(Date.UTC(year, month - 1, day)),
          disabled: disabled(dk),
          tabindex: dk === focusKey ? '0' : '-1',
          dataset: { date: dk },
        }, String(day))));
      }
      if (any) tbody.append(tr);
    }
    table.append(tbody);
    return h('div', { class: 'dp-month-block' },
      i > 0 ? h('p', { class: 'dp-month-label', 'aria-hidden': 'true' }, monthFmt.format(Date.UTC(year, month - 1, 1))) : null,
      table);
  }

  function render({ keepFocus = false } = {}) {
    clear(root);
    const canGoBack = `${String(view.year).padStart(4, '0')}-${String(view.month).padStart(2, '0')}` > today.slice(0, 7)
      || [...chosen].some((d) => d < toDateKey(view.year, view.month, 1));
    if (!visible(focusKey)) {
      const m = monthOf(0);
      focusKey = [...chosen].sort().find(visible) || (visible(today) ? today : toDateKey(m.year, m.month, 1));
    }

    // Month and year can be picked directly, so far-off dates are two clicks away.
    const monthSel = h('select', { class: 'dp-select', 'aria-label': t('datePicker.month') },
      Array.from({ length: 12 }, (_, i) => h('option', { value: String(i + 1), selected: i + 1 === view.month }, monthName.format(Date.UTC(2024, i, 1)))));
    const years = [];
    for (let y = todayParts.year - 1; y <= todayParts.year + 3; y++) years.push(y);
    if (!years.includes(view.year)) years.push(view.year);
    const yearName = new Intl.DateTimeFormat(locale(), { year: 'numeric', timeZone: 'UTC' });
    const yearSel = h('select', { class: 'dp-select', 'aria-label': t('datePicker.year') },
      // Years as the language writes them (2569 in Thai's Buddhist calendar, 2026年 in Japanese), matching the month headings.
      years.sort().map((y) => h('option', { value: String(y), selected: y === view.year }, yearName.format(Date.UTC(y, 6, 1)))));
    const jump = () => { view = { year: Number(yearSel.value), month: Number(monthSel.value) }; render(); };
    monthSel.addEventListener('change', jump);
    yearSel.addEventListener('change', jump);

    root.append(h('div', { class: 'dp-head' },
      h('button', { type: 'button', class: 'icon-btn', 'aria-label': t('datePicker.previousMonth'), disabled: !canGoBack, onclick: () => { shiftMonth(-1); render(); } }, '‹'),
      h('div', { class: 'dp-jump', 'aria-live': 'polite' }, monthSel, yearSel),
      h('button', { type: 'button', class: 'dp-today', onclick: () => {
        view = { year: todayParts.year, month: todayParts.month };
        focusKey = today;
        render({ keepFocus: true });
      } }, t('datePicker.goToToday')),
      h('button', { type: 'button', class: 'icon-btn', 'aria-label': t('datePicker.nextMonth'), onclick: () => { shiftMonth(1); render(); } }, '›'),
    ));
    const months = h('div', { class: `dp-months${monthsShown() > 1 ? ' two' : ''}` });
    for (let i = 0; i < monthsShown(); i++) months.append(monthTable(monthOf(i), i));
    root.append(months);
    if (keepFocus) root.querySelector(`[data-date="${focusKey}"]`)?.focus();
  }
  WIDE.addEventListener('change', () => render());

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
    if (!visible(next)) {
      const { year, month } = parseDateKey(next);
      // Moving past the last visible month scrolls by one; before the first, jumps to it.
      view = next > focusKey ? (() => { const d = new Date(Date.UTC(year, month - monthsShown(), 1)); return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 }; })() : { year, month };
    }
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
