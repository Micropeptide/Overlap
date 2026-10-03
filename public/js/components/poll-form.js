// The poll form, used both to create a poll and to edit one. Only the name,
// dates and times are up front; everything else sits under "More options".

import { h, icon, announce, passwordField, confirmDialog } from '../lib/dom.js';
import * as f from '../lib/format.js';
import { todayIn, addDays, weekdayOf, WEEK_ORDER } from '/shared/time.js';
import { PASSWORD_MIN, PASSWORD_MAX } from '/shared/password.js';
import { t, tx, locale } from '../lib/i18n.js';
import { createDatePicker } from './date-picker.js';
import { lengthOptions, lengthLabel } from './lengths.js';

/** The organizer password's problem in the page's language, or null. */
function passwordError(password) {
  if (password.length < PASSWORD_MIN) return t('pollForm.passwordTooShort', { min: PASSWORD_MIN });
  if (password.length > PASSWORD_MAX) return t('pollForm.passwordTooLong', { max: PASSWORD_MAX });
  return null;
}

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
    autocomplete: 'off', placeholder: t('pollForm.titlePlaceholder'), value: v.title,
    'aria-describedby': 'err-title',
  });

  // Dates
  const dateCount = h('p', { class: 'field-hint', id: 'dates-hint', 'aria-live': 'polite' });
  const updateDateCount = (dates) => {
    const list = dates.slice(0, 4).map(f.dateMedium).join(', ');
    if (!dates.length) dateCount.textContent = t('pollForm.datesHint');
    else if (dates.length > 4) dateCount.textContent = t('pollForm.datesPickedMore', { count: dates.length, list, more: dates.length - 4 });
    else dateCount.textContent = t('pollForm.datesPicked', { count: dates.length, list });
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
  const quickPicks = h('div', { class: 'quick-picks', role: 'group', 'aria-label': t('pollForm.quickPicks') },
    quickPick(t('pollForm.next7Days'), () => nextDays(7, false)),
    quickPick(t('pollForm.next10Weekdays'), () => nextDays(10, true)),
    quickPick(t('pollForm.clearDates'), () => []));

  // Days of the week (weekly polls)
  const weekdayFmt = new Intl.DateTimeFormat(locale(), { weekday: 'short', timeZone: 'UTC' });
  const weekdayLongFmt = new Intl.DateTimeFormat(locale(), { weekday: 'long', timeZone: 'UTC' });
  const weekCount = h('p', { class: 'field-hint', 'aria-live': 'polite' });
  const updateWeekCount = () => {
    weekCount.textContent = v.weekdays.length
      ? t('pollForm.weeklyHint')
      : t('pollForm.weekdaysHint');
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
  const weekPicker = h('div', { class: 'weekday-picker', role: 'group', 'aria-label': t('pollForm.daysOfWeek') }, weekdayButtons);
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
  const kindToggle = h('div', { class: 'segmented', role: 'radiogroup', 'aria-label': t('pollForm.kind') },
    kindRadio('dates', t('pollForm.kindDates')),
    kindRadio('weekly', t('pollForm.daysOfWeek')));

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
  const PRESETS = [[t('pollForm.presetMorning'), 9 * 60, 12 * 60], [t('pollForm.presetAfternoon'), 12 * 60, 17 * 60], [t('pollForm.presetEvening'), 17 * 60, 21 * 60], [t('pollForm.presetWorkDay'), 9 * 60, 17 * 60], [t('pollForm.presetAllDay'), 8 * 60, 22 * 60]];
  const presets = h('div', { class: 'quick-picks', role: 'group', 'aria-label': t('pollForm.presets') },
    PRESETS.map(([label, a, b]) => h('button', {
      type: 'button', class: 'btn small ghost',
      onclick: () => {
        v.startMinute = snap(a);
        v.endMinute = Math.max(v.startMinute + v.slotMinutes, snap(b));
        fillTimes();
        clearError('endMinute');
        announce(t('pollForm.timesSet', { start: f.minuteOfDay(v.startMinute), end: f.minuteOfDay(v.endMinute) }));
      },
    }, label)));

  // Time zone
  const zoneSel = h('select', { id: 'f-zone', class: 'input' },
    f.allTimeZones(v.timezone).map((z) => h('option', { value: z, selected: z === v.timezone }, z.replace(/_/g, ' '))));
  const zoneText = h('strong', null, f.zoneLabel(v.timezone));
  zoneSel.addEventListener('change', () => { v.timezone = zoneSel.value; zoneText.textContent = f.zoneLabel(v.timezone); });
  const zoneWrap = h('div', { class: 'field zone-field', hidden: true, id: 'zone-field' },
    h('label', { for: 'f-zone' }, t('pollForm.zoneLabel')), zoneSel);
  const zoneToggle = h('button', {
    type: 'button', class: 'link-btn', 'aria-expanded': 'false', 'aria-controls': 'zone-field',
    onclick: () => {
      zoneWrap.hidden = !zoneWrap.hidden;
      zoneToggle.setAttribute('aria-expanded', String(!zoneWrap.hidden));
      if (!zoneWrap.hidden) zoneSel.focus();
    },
  }, t('pollForm.zoneChange'));

  // More options
  const lengthSel = h('select', { id: 'f-length', class: 'input', 'aria-describedby': 'length-hint' },
    [...lengthOptions(), ...(lengthOptions().some(([m]) => m === v.durationMinutes) ? [] : [[v.durationMinutes, f.duration(v.durationMinutes)]])]
      .sort((a, b) => a[0] - b[0])
      .map(([m, label]) => h('option', { value: String(m), selected: m === v.durationMinutes }, label)));
  lengthSel.addEventListener('change', () => { v.durationMinutes = Number(lengthSel.value); });

  const stepSel = h('select', { id: 'f-step', class: 'input', 'aria-describedby': 'step-hint' },
    [15, 30, 60].map((m) => [m, lengthLabel(m)]).map(([m, l]) => h('option', { value: String(m), selected: m === v.slotMinutes }, l)));
  stepSel.addEventListener('change', () => {
    v.slotMinutes = Number(stepSel.value);
    v.startMinute = snap(v.startMinute);
    v.endMinute = Math.max(v.startMinute + v.slotMinutes, snap(v.endMinute));
    fillTimes();
  });

  const visRadio = (value, label, hint) => h('label', { class: 'radio' },
    h('input', { type: 'radio', name: 'visibility', value, checked: v.resultsVisibility === value, onchange: () => { v.resultsVisibility = value; } }),
    h('span', null, h('span', { class: 'radio-label' }, label), h('span', { class: 'radio-hint' }, hint)));

  const desc = h('textarea', { id: 'f-desc', class: 'input', rows: '3', maxlength: '1000', placeholder: t('pollForm.notePlaceholder') });
  desc.value = v.description;

  const loc = h('input', {
    id: 'f-location', class: 'input', type: 'text', maxlength: '300', value: v.location,
    placeholder: t('pollForm.locationPlaceholder'), 'aria-describedby': 'location-hint',
  });
  // Closing: "never" (the organizer closes it) unless a date is chosen. The
  // date box shows only for "On a date", since an empty date box can look
  // filled in (Safari shows today's date in it).
  const closes = h('input', {
    id: 'f-closes', class: 'input date-input', type: 'date', value: v.closesOn, min: editing ? null : today,
    'aria-label': t('pollForm.closesLabel'), 'aria-describedby': 'closes-hint err-closesOn',
  });
  let closeOnDate = !!v.closesOn;
  const closesDate = h('div', { class: 'closes-date', hidden: !closeOnDate }, closes,
    h('p', { class: 'field-hint', id: 'closes-hint' }, t('pollForm.closesHint')));
  const closeRadio = (onDate, label) => h('label', { class: 'radio' },
    h('input', {
      type: 'radio', name: 'closes-mode', value: onDate ? 'date' : 'never', checked: closeOnDate === onDate,
      onchange: () => {
        closeOnDate = onDate;
        closesDate.hidden = !onDate;
        clearError('closesOn');
        if (onDate) closes.focus();
      },
    }),
    h('span', null, h('span', { class: 'radio-label' }, label)));

  // New polls only: an organizer password is changed later from the manage page.
  const orgPw = editing ? null : passwordField({
    id: 'f-password', label: t('pollForm.password'), autocomplete: 'new-password',
    hint: t('pollForm.passwordHint'),
  });

  const allowEdits = h('input', { type: 'checkbox', checked: v.allowEdits, 'aria-describedby': 'edits-hint', onchange: (e) => { v.allowEdits = e.target.checked; } });

  // When editing, everything is in view: nothing to hunt for.
  const more = h('details', { class: 'more', open: editing ? true : null },
    h('summary', null, t('pollForm.more')),
    h('div', { class: 'more-body' },
      h('div', { class: 'field' },
        h('label', { for: 'f-length' }, t('pollForm.length')),
        lengthSel,
        h('p', { class: 'field-hint', id: 'length-hint' }, t('pollForm.lengthHint'))),
      h('div', { class: 'field' },
        h('label', { for: 'f-step' }, t('pollForm.step')),
        stepSel,
        h('p', { class: 'field-hint', id: 'step-hint' }, t('pollForm.stepHint'))),
      h('fieldset', { class: 'field' },
        h('legend', null, t('pollForm.visibility')),
        visRadio('everyone', t('pollForm.visibilityEveryone'), t('pollForm.visibilityEveryoneHint')),
        visRadio('organizer', t('pollForm.visibilityOrganizer'), t('pollForm.visibilityOrganizerHint'))),
      h('div', { class: 'field' },
        h('label', { class: 'check' }, allowEdits, h('span', null, t('pollForm.allowEdits'))),
        h('p', { class: 'field-hint', id: 'edits-hint' }, t('pollForm.allowEditsHint'))),
      h('div', { class: 'field' },
        h('label', { for: 'f-location' }, t('pollForm.location')),
        loc,
        h('p', { class: 'field-hint', id: 'location-hint' }, t('pollForm.locationHint'))),
      h('div', { class: 'field' },
        h('label', { for: 'f-desc' }, t('pollForm.note')),
        desc),
      h('fieldset', { class: 'field' },
        h('legend', null, t('pollForm.closes')),
        closeRadio(false, t('pollForm.closesNever')),
        closeRadio(true, t('pollForm.closesOnDate')),
        closesDate,
        errorEl('closesOn')),
      orgPw ? h('div', { class: 'pw-create' }, orgPw.el, errorEl('password')) : null,
    ),
  );

  const submit = h('button', { type: 'submit', class: 'btn primary large' }, submitLabel);
  const formError = h('p', { class: 'form-error', role: 'alert', hidden: true });

  const form = h('form', { class: 'poll-form', novalidate: true },
    h('div', { class: 'field' },
      h('label', { for: 'f-title', class: 'field-label' }, t('pollForm.title')),
      title, errorEl('title')),
    h('div', { class: 'field', role: 'group', 'aria-labelledby': 'dates-label' },
      h('p', { class: 'field-label', id: 'dates-label' }, v.kind === 'weekly' && editing ? t('pollForm.daysOfWeek') : t('pollForm.days')),
      kindToggle, datesPane, weeklyPane, errorEl('dates'), errorEl('weekdays')),
    h('div', { class: 'field', role: 'group', 'aria-labelledby': 'times-label' },
      h('p', { class: 'field-label', id: 'times-label' }, t('pollForm.times')),
      // "From [start] to [end]": the words are visual only, each menu has its own label.
      h('div', { class: 'time-range' },
        tx('pollForm.timeRange', {
          start: [h('label', { for: 'f-start', class: 'visually-hidden' }, t('pollForm.earliestStart')), startSel],
          end: [h('label', { for: 'f-end', class: 'visually-hidden' }, t('pollForm.latestEnd')), endSel],
        }).map((part) => (typeof part === 'string' ? (part.trim() ? h('span', { 'aria-hidden': 'true' }, part.trim()) : null) : part))),
      presets,
      errorEl('endMinute'), errorEl('startMinute'),
      h('p', { class: 'zone-current form-zone' }, icon('globe'), h('span', null, ...tx('pollForm.zoneIn', { zone: zoneText })), zoneToggle),
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
      closesOn: closeOnDate ? closes.value || null : null,
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
    if (!value.title) return showError(t('pollForm.errorTitle'), 'title');
    if (v.kind === 'weekly' && !value.weekdays.length) return showError(t('pollForm.errorWeekdays'), 'weekdays');
    if (v.kind === 'dates' && !value.dates.length) return showError(t('pollForm.errorDates'), 'dates');
    if (closeOnDate && !value.closesOn) return showError(t('pollForm.errorClosesMissing'), 'closesOn');
    if (value.closesOn && !editing && value.closesOn < today) return showError(t('pollForm.errorClosesPast'), 'closesOn');
    const password = orgPw?.input.value || '';
    if (password && passwordError(password)) {
      more.open = true;
      return showError(passwordError(password), 'password');
    }
    if (editing && value.kind === initial.kind) delete value.kind; // unchanged
    if (editing && value.kind && initial.responseCount) {
      const ok = await confirmDialog({
        title: value.kind === 'weekly' ? t('pollForm.switchWeeklyTitle') : t('pollForm.switchDatesTitle'),
        message: t('pollForm.switchMessage', { count: initial.responseCount }),
        confirm: t('pollForm.switchConfirm'),
      });
      if (!ok) return;
    }
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
