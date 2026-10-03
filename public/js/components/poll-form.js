// The poll form, used both to create a poll and to edit one. Only the name,
// dates and times are up front; everything else sits under "More options".

import { h, icon, announce, passwordField } from '../lib/dom.js';
import * as f from '../lib/format.js';
import { todayIn, addDays, weekdayOf, WEEK_ORDER } from '/shared/time.js';
import { passwordProblem } from '/shared/password.js';
import { createDatePicker } from './date-picker.js';
import { LENGTHS } from './lengths.js';

export function createPollForm({ initial = {}, submitLabel, onSubmit, editing = false }) {
  const tz0 = initial.timezone || f.deviceTimeZone();
  const v = {
    kind: initial.kind || 'dates',
    weekdays: initial.weekdays || [1, 2, 3, 4, 5],
    title: initial.title || '',
    description: initial.description || '',
    location: initial.location || '',
    closesOn: initial.closesOn || '',
    dates: initial.kind === 'weekly' ? [] : (initial.dates || []),
    startMinute: initial.startMinute ?? 9 * 60,
    endMinute: initial.endMinute ?? 17 * 60,
    slotMinutes: initial.slotMinutes || 30,
    durationMinutes: initial.durationMinutes || 0,
    timezone: tz0,
    resultsVisibility: initial.resultsVisibility || 'everyone',
    allowEdits: initial.allowEdits !== false,
  };

  const errors = {};
  const errorEl = (field) => {
    errors[field] = h('p', { class: 'field-error', id: `err-${field}`, hidden: true });
    return errors[field];
  };

  // Name
  const title = h('input', {
    id: 'f-title', name: 'title', class: 'input title-input', type: 'text', maxlength: '120', required: true,
    autocomplete: 'off', placeholder: 'Team lunch, book club, project kickoff…', value: v.title,
    'aria-describedby': 'err-title',
  });

  // Dates
  const dateCount = h('p', { class: 'field-hint', id: 'dates-hint', 'aria-live': 'polite' });
  const updateDateCount = (dates) => {
    dateCount.textContent = dates.length
      ? `${f.plural(dates.length, 'date')} picked: ${dates.slice(0, 4).map(f.dateMedium).join(', ')}${dates.length > 4 ? ` and ${dates.length - 4} more` : ''}`
      : 'Click or drag across the days you could meet.';
  };
  const picker = createDatePicker({
    selected: v.dates,
    today: todayIn(tz0),
    allowPast: editing ? v.dates : [],
    labelledBy: 'dates-label',
    onChange: (dates) => { v.dates = dates; updateDateCount(dates); clearError('dates'); },
  });
  updateDateCount(v.dates);
  const today = todayIn(tz0);
  const quickPick = (label, make) => h('button', {
    type: 'button', class: 'btn small ghost',
    onclick: () => { const dates = make(); picker.set(dates); v.dates = dates; updateDateCount(dates); clearError('dates'); },
  }, label);
  const nextDays = (n, weekdaysOnly) => {
    const out = [];
    for (let d = today; out.length < n; d = addDays(d, 1)) if (!weekdaysOnly || (weekdayOf(d) % 6 !== 0)) out.push(d);
    return out;
  };
  const quickPicks = h('div', { class: 'quick-picks', role: 'group', 'aria-label': 'Quick picks' },
    quickPick('Next 7 days', () => nextDays(7, false)),
    quickPick('Next 10 weekdays', () => nextDays(10, true)),
    quickPick('Clear dates', () => []));

  // Days of the week (weekly polls)
  const weekdayFmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', timeZone: 'UTC' });
  const weekdayLongFmt = new Intl.DateTimeFormat(undefined, { weekday: 'long', timeZone: 'UTC' });
  const weekCount = h('p', { class: 'field-hint', 'aria-live': 'polite' });
  const updateWeekCount = () => {
    weekCount.textContent = v.weekdays.length
      ? 'Guests mark the times that usually work for them each week.'
      : 'Pick the days of the week you could meet.';
  };
  const weekdayButtons = WEEK_ORDER.map((d) => {
    const ms = Date.UTC(2024, 0, 7 + d); // 7 January 2024 was a Sunday
    const btn = h('button', {
      type: 'button',
      class: 'weekday-btn',
      'aria-pressed': v.weekdays.includes(d) ? 'true' : 'false',
      'aria-label': weekdayLongFmt.format(ms),
      onclick: () => {
        v.weekdays = v.weekdays.includes(d) ? v.weekdays.filter((x) => x !== d) : [...v.weekdays, d];
        btn.setAttribute('aria-pressed', String(v.weekdays.includes(d)));
        updateWeekCount();
        clearError('weekdays');
      },
    }, weekdayFmt.format(ms));
    return btn;
  });
  const weekPicker = h('div', { class: 'weekday-picker', role: 'group', 'aria-label': 'Days of the week' }, weekdayButtons);
  updateWeekCount();

  const datesPane = h('div', { class: 'kind-pane' }, picker.el, quickPicks, dateCount);
  const weeklyPane = h('div', { class: 'kind-pane' }, weekPicker, weekCount);
  const showKind = () => {
    datesPane.hidden = v.kind !== 'dates';
    weeklyPane.hidden = v.kind !== 'weekly';
  };
  showKind();
  const kindRadio = (value, label) => h('label', { class: 'seg' },
    h('input', {
      type: 'radio', name: 'kind', value, checked: v.kind === value,
      onchange: () => { v.kind = value; showKind(); clearError('dates'); clearError('weekdays'); },
    }),
    h('span', null, label));
  const kindToggle = editing ? null : h('div', { class: 'segmented', role: 'radiogroup', 'aria-label': 'Kind of poll' },
    kindRadio('dates', 'Specific dates'),
    kindRadio('weekly', 'Days of the week'));

  // Times
  const timeOptions = (from, to, selected) => {
    const out = [];
    for (let m = from; m <= to; m += v.slotMinutes) out.push(h('option', { value: String(m), selected: m === selected }, f.minuteOfDay(m)));
    return out;
  };
  const startSel = h('select', { id: 'f-start', class: 'input' });
  const endSel = h('select', { id: 'f-end', class: 'input', 'aria-describedby': 'err-endMinute' });
  const fillTimes = () => {
    startSel.replaceChildren(...timeOptions(0, 1440 - v.slotMinutes, v.startMinute));
    endSel.replaceChildren(...timeOptions(v.slotMinutes, 1440, v.endMinute));
  };
  const snap = (m) => Math.round(m / v.slotMinutes) * v.slotMinutes;
  startSel.addEventListener('change', () => {
    v.startMinute = Number(startSel.value);
    if (v.endMinute <= v.startMinute) { v.endMinute = Math.min(1440, v.startMinute + 60); fillTimes(); }
    clearError('endMinute');
  });
  endSel.addEventListener('change', () => { v.endMinute = Number(endSel.value); clearError('endMinute'); });
  fillTimes();
  const PRESETS = [['Morning', 9 * 60, 12 * 60], ['Afternoon', 12 * 60, 17 * 60], ['Evening', 17 * 60, 21 * 60], ['Work day', 9 * 60, 17 * 60], ['All day', 8 * 60, 22 * 60]];
  const presets = h('div', { class: 'quick-picks', role: 'group', 'aria-label': 'Common time ranges' },
    PRESETS.map(([label, a, b]) => h('button', {
      type: 'button', class: 'btn small ghost',
      onclick: () => {
        v.startMinute = snap(a);
        v.endMinute = Math.max(v.startMinute + v.slotMinutes, snap(b));
        fillTimes();
        clearError('endMinute');
        announce(`Times set to ${f.minuteOfDay(v.startMinute)} to ${f.minuteOfDay(v.endMinute)}`);
      },
    }, label)));

  // Time zone
  const zoneSel = h('select', { id: 'f-zone', class: 'input' },
    f.allTimeZones(v.timezone).map((z) => h('option', { value: z, selected: z === v.timezone }, z.replace(/_/g, ' '))));
  const zoneText = h('strong', null, f.zoneLabel(v.timezone));
  zoneSel.addEventListener('change', () => { v.timezone = zoneSel.value; zoneText.textContent = f.zoneLabel(v.timezone); });
  const zoneWrap = h('div', { class: 'field zone-field', hidden: true, id: 'zone-field' },
    h('label', { for: 'f-zone' }, 'Time zone for these times'), zoneSel);
  const zoneToggle = h('button', {
    type: 'button', class: 'link-btn', 'aria-expanded': 'false', 'aria-controls': 'zone-field',
    onclick: () => {
      zoneWrap.hidden = !zoneWrap.hidden;
      zoneToggle.setAttribute('aria-expanded', String(!zoneWrap.hidden));
      if (!zoneWrap.hidden) zoneSel.focus();
    },
  }, 'Change');

  // More options
  const lengthSel = h('select', { id: 'f-length', class: 'input', 'aria-describedby': 'length-hint' },
    [...LENGTHS, ...(LENGTHS.some(([m]) => m === v.durationMinutes) ? [] : [[v.durationMinutes, f.duration(v.durationMinutes)]])]
      .sort((a, b) => a[0] - b[0])
      .map(([m, label]) => h('option', { value: String(m), selected: m === v.durationMinutes }, label)));
  lengthSel.addEventListener('change', () => { v.durationMinutes = Number(lengthSel.value); });

  const stepSel = h('select', { id: 'f-step', class: 'input', 'aria-describedby': 'step-hint' },
    [[15, '15 minutes'], [30, '30 minutes'], [60, '1 hour']].map(([m, l]) => h('option', { value: String(m), selected: m === v.slotMinutes }, l)));
  stepSel.addEventListener('change', () => {
    v.slotMinutes = Number(stepSel.value);
    v.startMinute = snap(v.startMinute);
    v.endMinute = Math.max(v.startMinute + v.slotMinutes, snap(v.endMinute));
    fillTimes();
  });

  const visRadio = (value, label, hint) => h('label', { class: 'radio' },
    h('input', { type: 'radio', name: 'visibility', value, checked: v.resultsVisibility === value, onchange: () => { v.resultsVisibility = value; } }),
    h('span', null, h('span', { class: 'radio-label' }, label), h('span', { class: 'radio-hint' }, hint)));

  const desc = h('textarea', { id: 'f-desc', class: 'input', rows: '3', maxlength: '1000', placeholder: 'Where, what to bring, anything guests should know' });
  desc.value = v.description;

  const loc = h('input', {
    id: 'f-location', class: 'input', type: 'text', maxlength: '300', value: v.location,
    placeholder: 'An address, a room, or a video call link', 'aria-describedby': 'location-hint',
  });
  const closes = h('input', {
    id: 'f-closes', class: 'input date-input', type: 'date', value: v.closesOn, min: editing ? null : today,
    'aria-describedby': 'closes-hint err-closesOn',
  });

  // New polls only: an organizer password is changed later from the manage page.
  const orgPw = editing ? null : passwordField({
    id: 'f-password', label: 'Organizer password', autocomplete: 'new-password',
    hint: 'Optional. Lets you manage the poll from any device: open the guest link and choose “Manage with your password”. You’ll still get a private link.',
  });

  const allowEdits = h('input', { type: 'checkbox', checked: v.allowEdits, 'aria-describedby': 'edits-hint', onchange: (e) => { v.allowEdits = e.target.checked; } });

  const more = h('details', { class: 'more', open: editing && (v.durationMinutes || v.resultsVisibility !== 'everyone' || !v.allowEdits || v.description || v.location || v.closesOn) ? true : null },
    h('summary', null, 'More options'),
    h('div', { class: 'more-body' },
      h('div', { class: 'field' },
        h('label', { for: 'f-length' }, 'Meeting length'),
        lengthSel,
        h('p', { class: 'field-hint', id: 'length-hint' }, 'Overlap will only suggest times long enough for the whole meeting.')),
      h('div', { class: 'field' },
        h('label', { for: 'f-step' }, 'Time steps'),
        stepSel,
        h('p', { class: 'field-hint', id: 'step-hint' }, 'How finely guests can mark their times.')),
      h('fieldset', { class: 'field' },
        h('legend', null, 'Who can see responses'),
        visRadio('everyone', 'Everyone with the guest link', 'Guests see each other’s names and times. Most groups prefer this.'),
        visRadio('organizer', 'Only me', 'Guests see only their own response. You see everything.')),
      h('div', { class: 'field' },
        h('label', { class: 'check' }, allowEdits, h('span', null, 'Guests can change their answer after sending it')),
        h('p', { class: 'field-hint', id: 'edits-hint' }, 'Turn this off to keep answers as first sent. Guests can still delete their own answer.')),
      h('div', { class: 'field' },
        h('label', { for: 'f-location' }, 'Where'),
        loc,
        h('p', { class: 'field-hint', id: 'location-hint' }, 'Shown on the poll and added to the calendar invite. Links become clickable.')),
      h('div', { class: 'field' },
        h('label', { for: 'f-desc' }, 'Note for guests'),
        desc),
      h('div', { class: 'field' },
        h('label', { for: 'f-closes' }, 'Stop taking responses after'),
        closes,
        h('p', { class: 'field-hint', id: 'closes-hint' }, 'Optional. The poll closes itself at the end of this day. Leave empty to close it yourself.'),
        errorEl('closesOn')),
      orgPw ? h('div', { class: 'pw-create' }, orgPw.el, errorEl('password')) : null,
    ),
  );

  const submit = h('button', { type: 'submit', class: 'btn primary large' }, submitLabel);
  const formError = h('p', { class: 'form-error', role: 'alert', hidden: true });

  const form = h('form', { class: 'poll-form', novalidate: true },
    h('div', { class: 'field' },
      h('label', { for: 'f-title', class: 'field-label' }, 'Event name'),
      title, errorEl('title')),
    h('div', { class: 'field', role: 'group', 'aria-labelledby': 'dates-label' },
      h('p', { class: 'field-label', id: 'dates-label' }, v.kind === 'weekly' && editing ? 'Days of the week' : 'Possible days'),
      kindToggle, datesPane, weeklyPane, errorEl('dates'), errorEl('weekdays')),
    h('div', { class: 'field', role: 'group', 'aria-labelledby': 'times-label' },
      h('p', { class: 'field-label', id: 'times-label' }, 'Times of day'),
      h('div', { class: 'time-range' },
        h('label', { for: 'f-start', class: 'visually-hidden' }, 'Earliest start'),
        h('span', { 'aria-hidden': 'true' }, 'From'), startSel,
        h('label', { for: 'f-end', class: 'visually-hidden' }, 'Latest end'),
        h('span', { 'aria-hidden': 'true' }, 'to'), endSel),
      presets,
      errorEl('endMinute'), errorEl('startMinute'),
      h('p', { class: 'zone-current form-zone' }, icon('globe'), h('span', null, 'In ', zoneText), zoneToggle),
      zoneWrap),
    more,
    formError,
    h('div', { class: 'form-actions' }, submit),
  );

  function clearError(field) {
    if (errors[field]) errors[field].hidden = true;
  }

  function showError(message, field) {
    const target = errors[field];
    if (target) {
      target.textContent = message;
      target.hidden = false;
      if (field === 'password') more.open = true;
      const control = { password: orgPw?.input, title, dates: picker.el.querySelector('.dp-day:not([disabled])'), weekdays: weekdayButtons[0], endMinute: endSel, startMinute: startSel, closesOn: closes }[field];
      if (field === 'closesOn') more.open = true;
      control?.focus();
      if (field === 'title') title.setAttribute('aria-invalid', 'true');
    } else {
      formError.textContent = message;
      formError.hidden = false;
    }
  }

  title.addEventListener('input', () => { clearError('title'); title.removeAttribute('aria-invalid'); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.hidden = true;
    Object.keys(errors).forEach(clearError);
    const value = {
      title: title.value.trim(),
      description: desc.value.trim(),
      location: loc.value.trim(),
      closesOn: closes.value || null,
      kind: v.kind,
      ...(v.kind === 'weekly' ? { weekdays: [...v.weekdays].sort() } : { dates: picker.value }),
      startMinute: v.startMinute,
      endMinute: v.endMinute,
      slotMinutes: v.slotMinutes,
      durationMinutes: v.durationMinutes || null,
      timezone: v.timezone,
      resultsVisibility: v.resultsVisibility,
      allowEdits: v.allowEdits,
    };
    if (!value.title) return showError('Give your event a name so guests know what it’s for.', 'title');
    if (v.kind === 'weekly' && !value.weekdays.length) return showError('Pick at least one day of the week.', 'weekdays');
    if (v.kind === 'dates' && !value.dates.length) return showError('Pick at least one date.', 'dates');
    if (value.closesOn && !editing && value.closesOn < today) return showError('Choose a closing date that hasn’t passed.', 'closesOn');
    const password = orgPw?.input.value || '';
    if (password && passwordProblem(password)) {
      more.open = true;
      return showError(`Organizer password: ${passwordProblem(password)}`, 'password');
    }
    if (editing) delete value.kind; // a poll can't switch kinds
    submit.disabled = true;
    submit.dataset.busy = 'true';
    try {
      await onSubmit(value, { password });
    } catch (err) {
      showError(err.message, err.field === 'durationMinutes' ? null : err.field);
    } finally {
      submit.disabled = false;
      delete submit.dataset.busy;
    }
  });

  return { el: form, focus: () => title.focus() };
}
