// The availability grid, in two forms:
//   - desktop: a days × times grid. Drag to paint a rectangle, click a day or
//     time heading to fill it, or use the keyboard (arrows move, Space marks,
//     Shift+arrows paint as you go, Ctrl/Cmd+Z undoes).
//   - phones (≤ 640px): one day at a time, a list of large time buttons.
// The same component shows a guest's own availability ("edit") and the group
// heatmap ("results"). Slots are UTC instants; layout is in the viewer's zone.

import { h, clear, announce } from '../lib/dom.js';
import * as f from '../lib/format.js';
import { layoutSlots } from '/shared/time.js';
import { tallySlots } from '/shared/overlap.js';

const PHONE = window.matchMedia('(max-width: 640px)');
// Phone "Select a range" mode, kept for the page's lifetime so re-renders don't drop it.
let phoneRange = false;

/** Marks a guest can give a time. "erase" is a brush, not a state. */
export const MARKS = {
  pref: { word: 'preferred', label: 'Preferred' },
  yes: { word: 'available', label: 'Available' },
  maybe: { word: 'if needed', label: 'If needed' },
};
const stateWord = (v) => (v ? MARKS[v].word : 'not available');
const PERSON_STATES = {
  pref: ['preferred', 'Preferred'],
  yes: ['available', 'Available'],
  maybe: ['if needed', 'If needed'],
  no: ['not available', 'Not available'],
  unanswered: ['has not seen this time', 'Not answered'],
};

export function createGrid(options) {
  const s = {
    mode: 'edit', // 'edit' | 'results'
    value: new Map(), // edit: slot -> 'pref' | 'yes' | 'maybe'
    brush: 'yes', // edit: 'pref' | 'yes' | 'maybe' | 'erase'
    responses: [],
    focusId: null, // results: show one person's answers
    others: null, // edit: Map slot -> how many other people are free then
    othersTotal: 0,
    showOthers: false,
    showCounts: false, // results: print the number of people in each cell
    history: null, // edit: { undo: [], redo: [] } kept by the page, so undo survives re-renders
    day: null, // phone: which day to show first
    onDayChange: () => {},
    onChange: () => {},
    onInspect: () => {},
    onPick: null, // results: organizer chooses a final time from a cell
    label: 'Availability',
    readOnly: false, // edit mode shown but not changeable (closed poll)
    weekly: false, // weekly polls label columns by weekday, not date
    ...options,
  };
  s.value = new Map(s.value);
  const root = h('div', { class: 'grid-root' });
  let layout;
  let tally;
  let total = 0;
  let matrix = []; // desktop: rows × columns of cell elements (or null)
  let gapBefore = []; // desktop: true where a "later" gap separates a row from the one above
  let gridEl = null;
  let cellBySlot = new Map();
  let colHeads = [];
  let focus = { r: 0, c: 0 };
  let mobileDay = s.day;
  let rangeStart = null; // phone range mode: the first time tapped
  let rangeStartHad = ''; // and what it was marked as then, which decides mark vs clear
  let expandedSlot = null;
  let highlighted = new Set();
  let lastInspected;
  const inspect = (slot) => {
    // Only report a change of cell, so the detail panel isn't rebuilt (and
    // re-announced to screen readers) on every mouse movement.
    if (slot === lastInspected) return;
    lastInspected = slot;
    s.onInspect(slot);
  };
  const history = s.history || { undo: [], redo: [] };
  const undoStack = history.undo;
  const redoStack = history.redo;
  let drag = null; // desktop painting in progress
  let scrollTimer = null;

  const cellLabel = (slot) => `${f.slotDay(slot, s.timeZone, s.weekly)}, ${f.time(slot, s.timeZone)}`;

  function computeResults() {
    if (s.mode !== 'results') return;
    tally = tallySlots(s.slots, s.responses);
    total = s.responses.length;
  }

  function personState(t, id) {
    if (t.pref.includes(id)) return 'pref';
    return ['yes', 'maybe', 'no', 'unanswered'].find((k) => t[k].includes(id)) || 'no';
  }

  // ---------- editing, with undo ----------

  /** What a click on a time does with the current brush: toggle the mark, or erase. */
  const canEdit = () => s.mode === 'edit' && !s.readOnly;
  const paintValue = (slot) => (s.brush === 'erase' || s.value.get(slot) === s.brush ? '' : s.brush);

  const sameMap = (a, b) => a.size === b.size && [...a].every(([k, v]) => b.get(k) === v);

  /** Record a change made since `before` so it can be undone, and notify. */
  function commit(before) {
    if (sameMap(before, s.value)) return 0;
    undoStack.push(before);
    if (undoStack.length > 100) undoStack.shift();
    redoStack.length = 0;
    s.onChange(s.value);
    let changed = 0;
    for (const slot of new Set([...before.keys(), ...s.value.keys()])) if (before.get(slot) !== s.value.get(slot)) changed++;
    return changed;
  }

  function setMany(slots, value) {
    const before = new Map(s.value);
    for (const slot of slots) if (value) s.value.set(slot, value); else s.value.delete(slot);
    return commit(before);
  }

  /** Fill a group of times, or clear it if it is already filled with the brush. */
  function toggleGroup(slots, what) {
    if (!slots.length) return;
    const allSet = s.brush !== 'erase' && slots.every((slot) => s.value.get(slot) === s.brush);
    const value = s.brush === 'erase' || allSet ? '' : s.brush;
    setMany(slots, value);
    afterExternalChange();
    announce(value ? `Marked ${what} as ${MARKS[value].word}` : `Cleared ${what}`);
  }

  function afterExternalChange() {
    if (PHONE.matches) render(); else refreshCells();
  }

  function undo() {
    if (!undoStack.length) return false;
    redoStack.push(new Map(s.value));
    s.value = undoStack.pop();
    s.onChange(s.value);
    afterExternalChange();
    announce('Undone');
    return true;
  }

  function redo() {
    if (!redoStack.length) return false;
    undoStack.push(new Map(s.value));
    s.value = redoStack.pop();
    s.onChange(s.value);
    afterExternalChange();
    announce('Redone');
    return true;
  }

  // ---------- desktop ----------

  function renderDesktop() {
    const cols = layout.columns;
    const editing = s.mode === 'edit';
    const rowH = s.slotMinutes === 15 ? 'var(--row-15)' : s.slotMinutes === 60 ? 'var(--row-60)' : 'var(--row-30)';
    const grid = h('div', {
      class: `grid grid-${s.mode}${s.showOthers && editing ? ' show-others' : ''}${s.showCounts && !editing ? ' show-counts' : ''}`,
      role: 'grid',
      'aria-label': s.label,
      'aria-describedby': s.describedBy || null,
      'aria-readonly': editing && !s.readOnly ? null : 'true',
      'aria-multiselectable': editing ? 'true' : null,
      'aria-rowcount': layout.rows.length + 1,
      'aria-colcount': cols.length + 1,
    });
    grid.style.setProperty('--cols', cols.length);
    grid.style.setProperty('--row-h', rowH);
    grid.dataset.brush = s.brush;
    gridEl = grid;

    const dayText = (dk) => [
      s.weekly ? null : h('span', { class: 'col-weekday' }, f.weekdayShort(dk)),
      h('span', { class: 'col-date' }, s.weekly ? f.weekdayShort(dk) : f.monthDay(dk)),
    ];
    const headButtons = editing && !s.readOnly;
    colHeads = cols.map((dk, i) => h('div', { class: 'col-head', role: 'columnheader', 'aria-colindex': i + 2 },
      headButtons
        ? h('button', {
          // Day headings are keyboard-reachable unless there are so many they'd bury the grid.
          type: 'button', class: 'head-btn col-btn', tabindex: cols.length <= 14 ? null : '-1', dataset: { c: String(i) },
          'aria-label': `${f.dayName(dk, s.weekly, 'long')}: mark or clear the whole day`,
        }, dayText(dk))
        : dayText(dk)));
    grid.append(h('div', { class: 'grid-row grid-head', role: 'row', 'aria-rowindex': 1 },
      h('div', { class: 'grid-corner', role: 'columnheader' }, h('span', { class: 'visually-hidden' }, 'Time')),
      colHeads,
    ));

    matrix = [];
    gapBefore = [];
    cellBySlot = new Map();
    let prev = null;
    layout.rows.forEach((row, r) => {
      const gap = prev && (row.minuteOfDay - prev.minuteOfDay > s.slotMinutes);
      gapBefore[r] = !!gap;
      if (gap) grid.append(h('div', { class: 'grid-gap', 'aria-hidden': 'true' }, h('span', null, 'later')));
      const showLabel = !prev || gap || row.minuteOfDay % 60 === 0 || row.occ > 0 || s.slotMinutes === 60;
      const labelText = f.minuteOfDay(row.minuteOfDay) + (row.occ > 0 ? ' (repeat)' : '');
      const label = h('span', { class: showLabel ? 'row-label' : 'visually-hidden' }, labelText);
      const rowEl = h('div', {
        class: `grid-row${row.minuteOfDay % 60 === 0 ? ' hour-start' : ''}`,
        role: 'row',
        'aria-rowindex': r + 2,
      }, h('div', { class: `row-head${showLabel ? '' : ' quiet'}`, role: 'rowheader' },
        headButtons
          ? h('button', { type: 'button', class: 'head-btn row-btn', tabindex: '-1', dataset: { r: String(r) }, 'aria-label': `${labelText}: mark or clear on every day` }, label)
          : label));
      const line = [];
      cols.forEach((dk, c) => {
        const cell = layout.byCell.get(`${dk}|${row.key}`);
        if (!cell) {
          rowEl.append(h('div', { class: 'cell none', role: 'gridcell', 'aria-disabled': 'true', 'aria-colindex': c + 2 }));
          line.push(null);
          return;
        }
        const el = h('div', {
          class: 'cell',
          role: 'gridcell',
          tabindex: '-1',
          'aria-colindex': c + 2,
          dataset: { slot: String(cell.slot), r: String(r), c: String(c) },
        });
        cellBySlot.set(cell.slot, el);
        rowEl.append(el);
        line.push(el);
      });
      matrix.push(line);
      grid.append(rowEl);
      prev = row;
    });

    // Roving tab stop: keep the previous position if it still exists.
    if (!matrix[focus.r]?.[focus.c]) focus = firstCell();
    const start = matrix[focus.r]?.[focus.c];
    if (start) start.tabIndex = 0;

    refreshCells();
    attachDesktopEvents(grid);
    root.append(h('div', { class: 'grid-scroll' }, grid));
  }

  function firstCell() {
    for (let r = 0; r < matrix.length; r++) for (let c = 0; c < matrix[r].length; c++) if (matrix[r][c]) return { r, c };
    return { r: 0, c: 0 };
  }

  function refreshCells() {
    for (const [slot, el] of cellBySlot) decorate(el, slot);
    joinRuns();
  }

  /** Mark cells whose neighbor above/below has the same mark, so runs draw as one block. */
  function joinRuns() {
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        const el = matrix[r][c];
        if (!el) continue;
        const k = el.dataset.k;
        const up = r > 0 && !gapBefore[r] ? matrix[r - 1][c] : null;
        const down = r + 1 < matrix.length && !gapBefore[r + 1] ? matrix[r + 1][c] : null;
        el.classList.toggle('join-top', !!k && up?.dataset.k === k);
        el.classList.toggle('join-bottom', !!k && down?.dataset.k === k);
      }
    }
  }

  function decorate(el, slot) {
    if (s.mode === 'edit') {
      const v = s.value.get(slot) || '';
      el.dataset.k = v;
      el.classList.toggle('is-pref', v === 'pref');
      el.classList.toggle('is-yes', v === 'yes');
      el.classList.toggle('is-maybe', v === 'maybe');
      el.setAttribute('aria-selected', v ? 'true' : 'false');
      let others = '';
      if (s.showOthers && s.others) {
        const n = s.others.get(slot) || 0;
        el.style.setProperty('--others', s.othersTotal ? n / s.othersTotal : 0);
        el.classList.toggle('has-others', n > 0);
        others = n ? `, ${n} of ${s.othersTotal} others free` : '';
      }
      el.setAttribute('aria-label', `${cellLabel(slot)}, ${stateWord(v)}${others}`);
      return;
    }
    const t = tally.get(slot);
    const avail = t.yes.length + t.maybe.length;
    const heat = total ? (t.yes.length + t.maybe.length * 0.6) / total : 0;
    el.style.setProperty('--heat', heat);
    el.classList.toggle('all', total > 0 && avail === total);
    el.classList.toggle('has-maybe', t.maybe.length > 0);
    el.classList.toggle('empty', avail === 0);
    el.classList.toggle('dark', heat > 0.55 || (total > 0 && avail === total));
    el.classList.toggle('hl', highlighted.has(slot));
    for (const st of Object.keys(PERSON_STATES)) el.classList.remove(`st-${st}`);
    el.classList.toggle('focused-person', !!s.focusId);
    el.replaceChildren(...(s.showCounts && avail && !s.focusId ? [h('span', null, String(avail))] : []));
    el.dataset.k = s.focusId ? '' : (avail ? 'on' : '');
    let label;
    if (s.focusId) {
      const st = personState(t, s.focusId);
      el.classList.add(`st-${st}`);
      el.dataset.k = st === 'no' ? '' : st;
      const who = s.responses.find((r) => r.id === s.focusId)?.name || 'This person';
      label = `${cellLabel(slot)}, ${who}: ${PERSON_STATES[st][0]}`;
    } else {
      label = `${cellLabel(slot)}, ${avail} of ${total} available`
        + `${t.maybe.length ? `, ${t.maybe.length} if needed` : ''}${t.pref.length ? `, ${t.pref.length} prefer this` : ''}`;
    }
    el.setAttribute('aria-label', label);
    el.removeAttribute('aria-selected');
  }

  function attachDesktopEvents(grid) {
    let hoverCol = -1;

    const cellAt = (x, y) => document.elementFromPoint(x, y)?.closest?.('.cell[data-slot]');
    const coords = (el) => ({ r: Number(el.dataset.r), c: Number(el.dataset.c) });
    const colSlots = (c) => matrix.map((line) => line[c]).filter(Boolean).map((el) => Number(el.dataset.slot));
    const rowSlots = (r) => matrix[r].filter(Boolean).map((el) => Number(el.dataset.slot));

    function applyRect(a, b, value, base) {
      const next = new Map(base);
      for (let r = Math.min(a.r, b.r); r <= Math.max(a.r, b.r); r++) {
        for (let c = Math.min(a.c, b.c); c <= Math.max(a.c, b.c); c++) {
          const el = matrix[r][c];
          if (!el) continue;
          const slot = Number(el.dataset.slot);
          if (value) next.set(slot, value); else next.delete(slot);
        }
      }
      s.value = next;
      refreshCells();
    }

    function setHoverCol(c) {
      if (c === hoverCol) return;
      colHeads[hoverCol]?.classList.remove('col-hover');
      hoverCol = c;
      colHeads[hoverCol]?.classList.add('col-hover');
    }

    grid.addEventListener('click', (e) => {
      const head = e.target.closest('.head-btn');
      if (head && canEdit()) {
        if (head.dataset.c != null) toggleGroup(colSlots(Number(head.dataset.c)), f.dayName(layout.columns[Number(head.dataset.c)], s.weekly, 'long'));
        else toggleGroup(rowSlots(Number(head.dataset.r)), `${f.minuteOfDay(layout.rows[Number(head.dataset.r)].minuteOfDay)} on every day`);
        return;
      }
      const el = e.target.closest('.cell[data-slot]');
      if (el && s.mode === 'results' && s.onPick) s.onPick(Number(el.dataset.slot));
    });

    grid.addEventListener('pointerdown', (e) => {
      grid.dataset.input = 'pointer';
      const el = e.target.closest('.cell[data-slot]');
      if (!el || e.button !== 0) return;
      setFocus(coords(el), { scroll: false });
      if (!canEdit()) return;
      e.preventDefault();
      const value = paintValue(Number(el.dataset.slot));
      drag = { anchor: coords(el), last: coords(el), value, base: new Map(s.value), id: e.pointerId, pointer: { x: e.clientX, y: e.clientY } };
      grid.setPointerCapture(e.pointerId);
      grid.classList.add('painting');
      applyRect(drag.anchor, drag.anchor, value, drag.base);
    });

    // While painting near the top or bottom of the screen (or of the grid's own
    // scroll area), keep scrolling so a tall range can be marked in one drag.
    const scroller = () => grid.closest('.grid-scroll');
    function autoScroll() {
      if (!drag || !grid.isConnected) return stopScroll();
      const { x, y } = drag.pointer;
      const sc = scroller();
      const box = sc.getBoundingClientRect();
      const bar = document.querySelector('.action-bar');
      // Use the grid's own edges when it scrolls by itself; otherwise the
      // window's (above the sticky submit bar).
      const ownScroll = sc.scrollHeight > sc.clientHeight + 1;
      const windowBottom = window.innerHeight - (bar ? bar.getBoundingClientRect().height : 0);
      const bottomEdge = (ownScroll ? Math.min(windowBottom, box.bottom) : windowBottom) - 24;
      const topEdge = (ownScroll ? Math.max(0, box.top) : 0) + 24;
      const dy = y > bottomEdge ? Math.min(24, (y - bottomEdge) / 2 + 4) : y < topEdge ? -Math.min(24, (topEdge - y) / 2 + 4) : 0;
      // Only scroll once the pointer has rested at the edge briefly, so passing
      // through the edge while painting the last visible rows doesn't move the page.
      if (!dy) { drag.edgeSince = null; return; }
      drag.edgeSince ??= Date.now();
      if (Date.now() - drag.edgeSince < 250) return;
      if ((dy > 0 && sc.scrollTop + sc.clientHeight < sc.scrollHeight - 1) || (dy < 0 && sc.scrollTop > 0)) sc.scrollTop += dy;
      else window.scrollBy(0, dy);
      // The pointer may be over the sticky submit bar; paint the nearest visible row instead.
      paintAt(Math.min(Math.max(x, box.left + 1), box.right - 1), Math.min(Math.max(y, topEdge - 14), bottomEdge + 14));
    }

    function paintAt(x, y) {
      const el = cellAt(x, y);
      if (!el || !grid.contains(el)) return;
      const at = coords(el);
      if (at.r === drag.last.r && at.c === drag.last.c) return;
      drag.last = at;
      applyRect(drag.anchor, at, drag.value, drag.base);
    }

    grid.addEventListener('pointermove', (e) => {
      const over = e.target.closest?.('.cell[data-slot]');
      if (over) setHoverCol(Number(over.dataset.c));
      if (s.mode === 'results') {
        if (over) inspect(Number(over.dataset.slot));
        return;
      }
      if (!drag || e.pointerId !== drag.id) return;
      drag.pointer = { x: e.clientX, y: e.clientY };
      if (!scrollTimer) scrollTimer = setInterval(autoScroll, 16);
      paintAt(e.clientX, e.clientY);
    });

    const finish = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      grid.classList.remove('painting');
      stopScroll();
      const { value, base } = drag;
      drag = null;
      s.lastPaint = value;
      const n = commit(base);
      if (n > 1) announce(value ? `Marked ${n} times as ${MARKS[value].word}` : `Cleared ${n} times`);
    };
    grid.addEventListener('pointerup', finish);
    grid.addEventListener('pointercancel', finish);
    grid.addEventListener('lostpointercapture', finish);

    grid.addEventListener('pointerleave', () => {
      setHoverCol(-1);
      if (s.mode === 'results') inspect(null);
    });

    grid.addEventListener('focusin', (e) => {
      const el = e.target.closest('.cell[data-slot]');
      if (!el) return;
      // Keep the roving tab stop in step when focus arrives from outside (e.g. restored after a refresh).
      const at = coords(el);
      if (at.r !== focus.r || at.c !== focus.c) {
        const old = matrix[focus.r]?.[focus.c];
        if (old) old.tabIndex = -1;
        focus = at;
        el.tabIndex = 0;
      }
      setHoverCol(Number(el.dataset.c));
      if (s.mode === 'results') inspect(Number(el.dataset.slot));
    });

    grid.addEventListener('keydown', (e) => {
      if (!e.target.classList.contains('cell')) return;
      grid.dataset.input = 'keyboard';
      const moves = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
      if (moves[e.key]) {
        e.preventDefault();
        const moved = step(focus, ...moves[e.key]);
        if (!moved) return;
        setFocus(moved);
        if (e.shiftKey && canEdit()) {
          const slot = Number(matrix[moved.r][moved.c].dataset.slot);
          setMany([slot], s.lastPaint ?? (s.brush === 'erase' ? '' : s.brush));
          refreshCells();
        }
        return;
      }
      if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault();
        const line = matrix[focus.r];
        const idx = e.key === 'Home' ? line.findIndex(Boolean) : line.length - 1 - [...line].reverse().findIndex(Boolean);
        if (line[idx]) setFocus({ r: focus.r, c: idx });
        return;
      }
      if ((e.key === ' ' || e.key === 'Enter') && matrix[focus.r]?.[focus.c]) {
        e.preventDefault();
        const slot = Number(matrix[focus.r][focus.c].dataset.slot);
        if (s.mode === 'results') {
          if (s.onPick) s.onPick(slot);
          return;
        }
        if (!canEdit()) return;
        const value = paintValue(slot);
        s.lastPaint = value;
        setMany([slot], value);
        refreshCells();
        announce(`${f.time(slot, s.timeZone)} ${value ? `marked ${MARKS[value].word}` : 'cleared'}`);
      }
    });
  }

  function stopScroll() {
    clearInterval(scrollTimer);
    scrollTimer = null;
  }

  function step(from, dr, dc) {
    let { r, c } = from;
    for (;;) {
      r += dr;
      c += dc;
      if (r < 0 || r >= matrix.length || c < 0 || c >= (matrix[0]?.length || 0)) return null;
      if (matrix[r][c]) return { r, c };
    }
  }

  function setFocus(next, { scroll = true } = {}) {
    const old = matrix[focus.r]?.[focus.c];
    if (old) old.tabIndex = -1;
    focus = next;
    const el = matrix[focus.r][focus.c];
    el.tabIndex = 0;
    el.focus({ preventScroll: !scroll });
    if (scroll) el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  // ---------- phone ----------

  function renderPhone() {
    const cols = layout.columns;
    if (!cols.includes(mobileDay)) mobileDay = cols[0];
    const daySlots = layout.cells.filter((c) => c.dateKey === mobileDay).sort((a, b) => a.slot - b.slot);

    const strip = h('div', { class: 'day-strip', role: 'group', 'aria-label': 'Choose a day' },
      cols.map((dk) => {
        const badge = chipBadge(dk);
        return h('button', {
          type: 'button',
          class: 'day-chip',
          'aria-pressed': dk === mobileDay ? 'true' : 'false',
          'aria-label': chipLabel(dk, badge),
          dataset: { day: dk },
          onclick: () => { mobileDay = dk; s.onDayChange(dk); expandedSlot = null; render(); root.querySelector('.day-chip[aria-pressed="true"]')?.focus(); },
        },
        s.weekly ? null : h('span', { class: 'chip-weekday' }, f.weekdayShort(dk)),
        h('span', { class: `chip-day${s.weekly ? ' weekday' : ''}` }, s.weekly ? f.weekdayShort(dk) : f.dayNumber(dk)),
        h('span', { class: `chip-badge${badge ? '' : ' empty'}` }, badge || '·'));
      }),
    );

    if (rangeStart != null && !daySlots.some((c) => c.slot === rangeStart)) rangeStart = null; // another day
    const title = h('h3', { class: 'day-title', tabindex: '-1' }, f.dayName(mobileDay, s.weekly, 'long'));
    const list = h('ul', { class: `slot-list slot-list-${s.mode}${s.mode === 'edit' && phoneRange ? ' range-mode' : ''}`, role: 'list' });
    for (const cell of daySlots) list.append(s.mode === 'edit' ? phoneEditItem(cell.slot) : phoneResultItem(cell.slot));

    // Always present while marking, at a fixed height: turning range mode on or
    // off changes only its text, so the list below never moves.
    const rangeHint = s.mode === 'edit' && canEdit() ? h('div', { class: 'range-hint' }) : null;
    const parts = [strip, h('div', { class: 'day-head' }, title, s.mode === 'edit' ? dayTools(daySlots) : null), rangeHint, list];
    const idx = cols.indexOf(mobileDay);
    const go = (dk) => { mobileDay = dk; s.onDayChange(dk); expandedSlot = null; render(); scrollToTop(); root.querySelector('.day-title')?.focus({ preventScroll: true }); };
    parts.push(h('div', { class: 'day-nav' },
      idx > 0 ? h('button', { type: 'button', class: 'btn ghost', onclick: () => go(cols[idx - 1]) }, `Previous: ${f.dayName(cols[idx - 1], s.weekly, s.weekly ? 'long' : 'medium')}`) : h('span'),
      idx < cols.length - 1 ? h('button', { type: 'button', class: 'btn ghost', onclick: () => go(cols[idx + 1]) }, `Next: ${f.dayName(cols[idx + 1], s.weekly, s.weekly ? 'long' : 'medium')}`) : h('span'),
    ));
    root.append(h('div', { class: `phone-grid phone-${s.mode}` }, parts));
    if (rangeHint) updateRangeHint();
    // Centre the chosen day in the strip by scrolling the strip only; scrollIntoView
    // would also scroll the page, which made it jump on every re-render.
    const chip = strip.querySelector('.day-chip[aria-pressed="true"]');
    if (chip) {
      const a = chip.getBoundingClientRect();
      const b = strip.getBoundingClientRect();
      strip.scrollLeft += a.left - b.left - (b.width - a.width) / 2;
    }
  }

  function chipBadge(dk) {
    const cells = layout.cells.filter((c) => c.dateKey === dk);
    if (s.mode === 'edit') {
      const n = cells.filter((c) => s.value.has(c.slot)).length;
      return n ? String(n) : '';
    }
    if (!total) return '';
    const best = Math.max(0, ...cells.map((c) => tally.get(c.slot).yes.length + tally.get(c.slot).maybe.length));
    return best ? `${best}/${total}` : '';
  }

  function chipLabel(dk, badge) {
    const name = f.dayName(dk, s.weekly, 'long');
    if (!badge) return name;
    return s.mode === 'edit' ? `${name}, ${badge} times marked` : `${name}, up to ${badge} available`;
  }

  function scrollToTop() {
    root.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  function dayTools(daySlots) {
    const slots = daySlots.map((c) => c.slot);
    const copyToAll = () => {
      const before = new Map(s.value);
      const pattern = new Map(daySlots.map((c) => [c.rowKey, s.value.get(c.slot) || '']));
      for (const c of layout.cells) {
        if (c.dateKey === mobileDay || !pattern.has(c.rowKey)) continue;
        const v = pattern.get(c.rowKey);
        if (v) s.value.set(c.slot, v); else s.value.delete(c.slot);
      }
      commit(before);
      render();
      announce('Copied this day to every day');
    };
    // These re-render the list, so put focus back on the button that was pressed.
    const tool = (id, label, run) => h('button', {
      type: 'button', class: 'btn small ghost', dataset: { tool: id }, disabled: !canEdit(),
      onclick: () => { run(); root.querySelector(`[data-tool="${id}"]`)?.focus(); },
    }, label);
    const range = h('button', {
      type: 'button', class: `btn small ghost${phoneRange ? ' on' : ''}`, dataset: { tool: 'range' }, disabled: !canEdit(),
      'aria-pressed': phoneRange ? 'true' : 'false',
      onclick: () => setRangeMode(!phoneRange),
    }, 'Select a range');
    return h('div', { class: 'day-tools' },
      range,
      tool('whole', s.brush === 'erase' ? 'Clear day' : 'Whole day', () => toggleGroup(slots, 'the whole day')),
      tool('clear', 'Clear', () => { setMany(slots, ''); render(); announce('Cleared this day'); }),
      layout.columns.length > 1 ? tool('copy', 'Copy to every day', copyToAll) : null,
    );
  }

  function phoneEditItem(slot) {
    const v = s.value.get(slot) || '';
    const others = s.showOthers && s.others ? s.others.get(slot) || 0 : 0;
    const btn = h('button', {
      type: 'button',
      class: `slot-btn${v ? ` is-${v}` : ''}${slot === rangeStart ? ' range-start' : ''}`,
      'aria-pressed': v ? 'true' : 'false',
      'aria-disabled': canEdit() ? null : 'true',
      'aria-label': `${f.time(slot, s.timeZone)}, ${stateWord(v)}${others ? `, ${others} of ${s.othersTotal} others free` : ''}`,
      dataset: { slot: String(slot) },
      onclick: () => {
        if (!canEdit()) return;
        if (phoneRange) return rangeTap(slot);
        setMany([slot], paintValue(slot));
        const fresh = phoneEditItem(slot);
        btn.parentElement.replaceWith(fresh);
        fresh.querySelector('button').focus({ preventScroll: true });
        refreshStripBadges();
      },
    },
    h('span', { class: 'slot-time' }, f.time(slot, s.timeZone)),
    others ? h('span', { class: 'slot-others', 'aria-hidden': 'true' }, `${others} other${others === 1 ? '' : 's'} free`) : null,
    h('span', { class: 'slot-state' }, v ? MARKS[v].label : ''));
    return h('li', null, btn);
  }

  // ----- phone range mode. Everything updates in place (no re-render), so the page never moves. -----

  /** Mark (with the brush) or clear? Like a single tap: clear if the first time already had this mark. */
  const rangeClears = () => s.brush === 'erase' || rangeStartHad === s.brush;

  function setRangeMode(on) {
    phoneRange = on;
    cancelRange({ quiet: true });
    const btn = root.querySelector('[data-tool="range"]');
    if (btn) {
      btn.className = `btn small ghost${on ? ' on' : ''}`;
      btn.setAttribute('aria-pressed', String(on));
    }
    root.querySelector('.slot-list-edit')?.classList.toggle('range-mode', on);
    updateRangeHint();
    announce(on ? 'Range on: tap where the range starts, then where it ends' : 'Range off: each tap marks one time', { silent: on });
  }

  /** The hint's text changes, but its height doesn't (see .range-hint in the CSS). */
  function updateRangeHint() {
    const hint = root.querySelector('.range-hint');
    if (!hint) return;
    hint.classList.toggle('on', phoneRange);
    const text = !phoneRange
      ? 'Tip: “Select a range” marks a long stretch with just two taps.'
      : rangeStart == null
      ? 'Tap where the range starts, then where it ends.'
      : `From ${f.time(rangeStart, s.timeZone)}: tap the end to ${rangeClears() ? 'clear' : `mark “${MARKS[s.brush].label}”`}.`;
    hint.replaceChildren(...[
      h('span', { class: 'range-hint-text' }, text),
      rangeStart == null ? null : h('button', { type: 'button', class: 'link-btn range-cancel', onclick: () => cancelRange() }, 'Cancel'),
    ].filter(Boolean)); // replaceChildren(null) would show the word "null"
  }

  function setStartMark(slot, on) {
    root.querySelector(`.slot-btn[data-slot="${slot}"]`)?.classList.toggle('range-start', on);
  }

  function cancelRange({ quiet = false } = {}) {
    if (rangeStart == null) return;
    const slot = rangeStart;
    rangeStart = null;
    setStartMark(slot, false);
    updateRangeHint();
    if (!quiet) {
      root.querySelector(`.slot-btn[data-slot="${slot}"]`)?.focus({ preventScroll: true });
      announce('Range cancelled', { silent: true });
    }
  }

  /** Range mode: the first tap picks a start; the second marks or clears every time between. */
  function rangeTap(slot) {
    if (rangeStart == null) {
      rangeStart = slot;
      rangeStartHad = s.value.get(slot) || '';
      setStartMark(slot, true);
      updateRangeHint();
      announce(`From ${f.time(slot, s.timeZone)}. Now tap where it ends.`, { silent: true });
      return;
    }
    const day = layout.cells.filter((c) => c.dateKey === mobileDay).map((c) => c.slot).sort((a, b) => a - b);
    const [lo, hi] = [Math.min(rangeStart, slot), Math.max(rangeStart, slot)];
    const slots = day.filter((x) => x >= lo && x <= hi);
    const value = rangeClears() ? '' : s.brush;
    rangeStart = null;
    setMany(slots, value);
    for (const x of slots) {
      const li = root.querySelector(`.slot-btn[data-slot="${x}"]`)?.parentElement;
      li?.replaceWith(phoneEditItem(x));
    }
    refreshStripBadges();
    updateRangeHint();
    root.querySelector(`.slot-btn[data-slot="${slot}"]`)?.focus({ preventScroll: true });
    const what = `${f.time(lo, s.timeZone)} to ${f.time(hi + s.slotMinutes * 60e3, s.timeZone)}`;
    announce(value ? `Marked ${what} as ${MARKS[value].word}` : `Cleared ${what}`);
  }

  function refreshStripBadges() {
    root.querySelectorAll('.day-chip').forEach((chip) => {
      const dk = chip.dataset.day;
      const badge = chipBadge(dk);
      const el = chip.querySelector('.chip-badge');
      el.textContent = badge || '·';
      el.classList.toggle('empty', !badge);
      chip.setAttribute('aria-label', chipLabel(dk, badge));
    });
  }

  function phoneResultItem(slot) {
    const t = tally.get(slot);
    const avail = t.yes.length + t.maybe.length;
    const open = expandedSlot === slot;
    let stateText;
    let stateClass = '';
    if (s.focusId) {
      const st = personState(t, s.focusId);
      stateClass = ` st-${st}`;
      stateText = PERSON_STATES[st][1];
    }
    const bar = h('span', { class: 'slot-bar', 'aria-hidden': 'true' }, h('span', { class: 'slot-bar-fill' }));
    bar.style.setProperty('--fill', total ? avail / total : 0);
    bar.style.setProperty('--maybe', total ? t.maybe.length / total : 0);
    const btn = h('button', {
      type: 'button',
      class: `slot-btn result${total && avail === total ? ' all' : ''}${t.maybe.length ? ' has-maybe' : ''}${stateClass}`,
      'aria-expanded': open ? 'true' : 'false',
      dataset: { slot: String(slot) },
      onclick: () => { expandedSlot = open ? null : slot; render(); root.querySelector(`.slot-btn[data-slot="${slot}"]`)?.focus(); },
    },
    h('span', { class: 'slot-time' }, f.time(slot, s.timeZone)),
    s.focusId ? h('span', { class: 'slot-state' }, stateText) : bar,
    h('span', { class: 'slot-count' }, total ? `${avail}/${total}` : '–'));
    const li = h('li', { class: open ? 'open' : '' }, btn);
    if (open) li.append(slotDetail({ slot, slotMinutes: s.slotMinutes, timeZone: s.timeZone, weekly: s.weekly, tally: t, responses: s.responses, onPick: s.onPick, compact: true }));
    return li;
  }

  // ---------- shared ----------

  function render() {
    drag = null;
    stopScroll();
    const active = document.activeElement;
    const hadFocus = root.contains(active) && active.classList.contains('cell');
    clear(root);
    layout = layoutSlots(s.slots, s.timeZone);
    computeResults();
    if (!layout.cells.length) {
      root.append(h('p', { class: 'empty-note' }, 'This poll has no times to choose from.'));
      return;
    }
    if (PHONE.matches) renderPhone(); else renderDesktop();
    if (hadFocus) matrix[focus.r]?.[focus.c]?.focus({ preventScroll: true });
  }

  const onMedia = () => render();
  PHONE.addEventListener('change', onMedia);
  render();

  return {
    el: root,
    update(patch) {
      Object.assign(s, patch);
      if ('value' in patch) s.value = new Map(patch.value);
      render();
    },
    setBrush(brush) {
      s.brush = brush;
      s.lastPaint = undefined;
      if (gridEl) gridEl.dataset.brush = brush;
      if (PHONE.matches && s.mode === 'edit') {
        const tool = root.querySelector('[data-tool="whole"]');
        if (tool) tool.textContent = brush === 'erase' ? 'Clear day' : 'Whole day';
        updateRangeHint();
      }
    },
    /** Replace all marks (e.g. "Clear all"); undoable. */
    replace(next) {
      const before = new Map(s.value);
      s.value = new Map(next);
      commit(before);
      afterExternalChange();
    },
    /** Outline these slots (desktop heatmap), e.g. while a best time is hovered. */
    highlight(slots) {
      highlighted = new Set(slots || []);
      if (!PHONE.matches && s.mode === 'results') refreshCells();
    },
    undo,
    redo,
    get canUndo() { return undoStack.length > 0; },
    /** True while a drag is being painted; callers should not re-render then. */
    get busy() { return !!drag; },
    get value() {
      return s.value;
    },
    destroy() {
      PHONE.removeEventListener('change', onMedia);
      stopScroll();
      drag = null;
    },
  };
}

/** Who can make one time slot. Used in the side panel and in phone rows. */
export function slotDetail({ slot, slotMinutes, timeZone, weekly = false, tally, responses, onPick, compact = false }) {
  const byId = new Map(responses.map((r) => [r.id, r]));
  const total = responses.length;
  const avail = tally.yes.length + tally.maybe.length;
  const prefers = new Set(tally.pref || []);
  const nameOf = (id) => [
    byId.get(id)?.name,
    prefers.has(id) ? h('span', { class: 'pref-mark', title: 'Preferred' }, h('span', { 'aria-hidden': 'true' }, ' ★'), h('span', { class: 'visually-hidden' }, ' (preferred)')) : null,
  ];
  const group = (label, ids, cls) => ids.length
    ? h('div', { class: `who who-${cls}` },
      h('p', { class: 'who-label' }, `${label} (${ids.length})`),
      h('ul', { class: 'who-list' }, ids.map((id) => h('li', null, nameOf(id)))))
    : null;
  return h('div', { class: `slot-detail${compact ? ' compact' : ''}` },
    compact ? null : h('p', { class: 'slot-detail-time' }, f.slotRange(slot, slot + slotMinutes * 60000, timeZone, weekly)),
    h('p', { class: 'slot-detail-count' }, total
      ? `${avail} of ${total} can make it${prefers.size ? `, ${prefers.size} prefer${prefers.size === 1 ? 's' : ''} this time` : ''}`
      : 'No responses yet'),
    group('Available', tally.yes, 'yes'),
    group('If needed', tally.maybe, 'maybe'),
    group('Not available', tally.no, 'no'),
    group('Haven’t seen this time', tally.unanswered, 'unanswered'),
    onPick ? h('button', { type: 'button', class: 'btn small secondary', onclick: () => onPick(slot) }, 'Choose a final time starting here') : null,
  );
}
