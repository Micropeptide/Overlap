import { h, clear, icon, announce, copyText, confirmDialog, formDialog, passwordField, linkify } from '../lib/dom.js';
import { api, ApiError } from '../lib/api.js';
import { storage, hashParams } from '../lib/storage.js';
import * as f from '../lib/format.js';
import { createGrid, MARKS } from '../components/grid.js';
import { zoneLine } from '../components/zone-picker.js';
import { bestTimes } from '../components/best-times.js';
import { resultsSection } from '../components/results.js';
import { renderNotFound } from './not-found.js';
import { isValidTimeZone } from '/shared/time.js';
import { passwordKey, passwordProblem } from '/shared/password.js';
import { emailControl } from '../components/email-control.js';
import { pollFacts, finalCard, statusBanner, locationLine, watchForUpdates, captureFocus } from './shared.js';

const BRUSHES = [
  ['yes', 'Available', '1'],
  ['pref', 'Preferred', '2'],
  ['maybe', 'If needed', '3'],
  ['erase', 'Erase', '4'],
];

export async function renderGuest(main, pollId) {
  // A private edit link looks like /p/<id>#r=<key>. Remember the key in this
  // browser, then drop it from the address bar so it isn't shared by accident.
  const fromHash = hashParams().get('r');
  let token = fromHash || storage.getAnswer(pollId)?.token || null;
  if (fromHash && storage.saveAnswer(pollId, { token: fromHash })) {
    history.replaceState(null, '', location.pathname);
  }

  let poll;
  try {
    ({ poll } = await api('GET', `/api/polls/${pollId}`));
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      storage.forgetAnswer(pollId);
      storage.forgetDraft(pollId);
      return renderNotFound(main, { title: 'This poll isn’t here', message: 'It may have been deleted by the organizer. Ask them for a new link.' });
    }
    throw err;
  }

  let mine = null;
  if (token) {
    try {
      ({ response: mine } = await api('GET', `/api/polls/${pollId}/my-response`, { token }));
      storage.saveAnswer(pollId, { token, responseId: mine.id, name: mine.name, title: poll.title });
    } catch (err) {
      // 404: the response is gone. 403: the password it was opened with has changed.
      if (err instanceof ApiError && (err.status === 404 || err.status === 403)) {
        storage.forgetAnswer(pollId);
        token = null;
      } else throw err;
    }
  }

  let viewZone = storage.viewTimeZone() || f.deviceTimeZone();
  if (!isValidTimeZone(viewZone)) viewZone = f.deviceTimeZone();
  const isOpen = () => poll.status === 'open';
  // A sent answer is locked when the organizer turned off changes after sending.
  const locked = () => !!mine && poll.allowEdits === false;
  const canEdit = () => isOpen() && !locked();
  const canSeeResults = () => poll.responses !== null;
  let tab = isOpen() ? 'mine' : 'group';
  let justSaved = false;
  let grid = null;
  let results = null;
  let brush = 'yes';
  let showOthers = false;
  let zoneExpanded = false;
  // Signed in here with a password rather than the private edit link.
  const viaPassword = () => !!token && token.includes(':');

  // The guest's work in progress lives here, outside the rendered panel, so
  // switching tabs or time zones never throws away unsaved marks.
  const draft = {
    value: new Map(),
    name: '',
    note: '',
    dirty: false,
    restored: false,
    changedHere: false, // changed since this page loaded, so not yet safe in a draft
    history: { undo: [], redo: [] }, // undo survives tab and time zone switches
  };
  let baseline = null; // what the saved response looks like, to tell real changes from undone ones
  let gridDay = null; // phone: the day being marked
  const resultsState = {}; // person filter, numbers toggle, phone day in the results
  function savedMarks() {
    const m = new Map();
    for (const s of mine?.available || []) m.set(s, 'yes');
    for (const s of mine?.preferred || []) m.set(s, 'pref');
    for (const s of mine?.ifNeeded || []) m.set(s, 'maybe');
    return m;
  }
  function loadDraftFromResponse() {
    draft.value = savedMarks();
    draft.name = mine?.name || storage.lastName() || '';
    draft.note = mine?.note || '';
    draft.dirty = false;
    draft.history = { undo: [], redo: [] };
    baseline = { value: savedMarks(), name: draft.name, note: draft.note };
  }
  const sameAsSaved = () => baseline
    && draft.name.trim() === baseline.name.trim() && draft.note.trim() === baseline.note.trim()
    && draft.value.size === baseline.value.size && [...draft.value].every(([k, v]) => baseline.value.get(k) === v);
  loadDraftFromResponse();
  const saved = storage.getDraft(pollId);
  if (saved && canEdit() && (saved.baseUpdatedAt ?? null) === (mine?.updatedAt ?? null)) {
    const valid = new Set(poll.slots);
    draft.value = new Map((saved.marks || []).filter(([s, v]) => valid.has(s) && MARKS[v]));
    draft.name = saved.name ?? draft.name;
    draft.note = saved.note ?? draft.note;
    draft.dirty = true;
    draft.restored = true;
    if (sameAsSaved()) {
      storage.forgetDraft(pollId);
      draft.dirty = false;
      draft.restored = false;
    }
  } else if (saved) {
    storage.forgetDraft(pollId);
  }

  let draftTimer;
  function writeDraft() {
    clearTimeout(draftTimer);
    draftTimer = null;
    if (draft.dirty) {
      storage.saveDraft(pollId, { marks: [...draft.value], name: draft.name, note: draft.note, baseUpdatedAt: mine?.updatedAt ?? null });
    } else {
      storage.forgetDraft(pollId);
    }
  }
  function markDirty() {
    // Undoing back to what was saved isn't a change worth keeping or warning about.
    draft.dirty = !sameAsSaved();
    draft.changedHere = draft.dirty;
    if (!draft.dirty) draft.restored = false;
    clearTimeout(draftTimer);
    draftTimer = setTimeout(writeDraft, 300);
  }
  // Don't lose the last few hundred milliseconds of work if the tab is closed or hidden.
  window.addEventListener('pagehide', () => { if (draftTimer) writeDraft(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && draftTimer) writeDraft(); });
  function clearDraft() {
    clearTimeout(draftTimer);
    storage.forgetDraft(pollId);
    draft.dirty = false;
    draft.restored = false;
    draft.changedHere = false;
  }

  window.addEventListener('beforeunload', (e) => {
    if (draft.dirty && draft.changedHere && canEdit()) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  // Keyboard shortcuts while marking: 1–4 pick a brush, Ctrl/Cmd+Z undoes.
  document.addEventListener('keydown', (e) => {
    if (tab !== 'mine' || !grid || !canEdit()) return;
    const t = e.target;
    if (t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) && t.type !== 'radio') return;
    if (document.querySelector('dialog[open]')) return;
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) grid.redo(); else grid.undo();
      return;
    }
    if (mod && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      grid.redo();
      return;
    }
    if (mod || e.altKey) return;
    const pick = BRUSHES.find(([, , key]) => key === e.key);
    if (pick) {
      setBrush(pick[0]);
      main.querySelector(`input[name="brush"][value="${pick[0]}"]`)?.click();
      announce(`Marking as ${pick[1].toLowerCase()}`);
    }
  });

  function setBrush(next) {
    brush = next;
    grid?.setBrush(next);
  }

  document.title = `${poll.title} · Overlap`;

  async function reload() {
    ({ poll } = await api('GET', `/api/polls/${pollId}`));
  }

  // Pick up new responses and organizer changes when the guest comes back to the tab.
  const watcher = watchForUpdates({
    fetch: () => api('GET', `/api/polls/${pollId}`).then((r) => r.poll),
    current: () => poll,
    paused: () => !!grid?.busy || submitting,
    apply: (next) => {
      poll = next;
      const restore = captureFocus();
      const y = window.scrollY;
      render();
      window.scrollTo(0, y);
      restore();
    },
  });
  let submitting = false;

  function render() {
    grid?.destroy();
    results?.destroy?.();
    grid = null;
    results = null;
    clear(main);
    if (!isOpen() && tab === 'mine' && !mine) tab = 'group';

    const page = h('div', { class: 'page poll-page' });
    page.append(h('header', { class: 'poll-head' },
      h('h1', { class: 'page-title poll-title', tabindex: '-1' }, poll.title),
      poll.description ? h('p', { class: 'poll-desc' }, linkify(poll.description)) : null,
      locationLine(poll),
      pollFacts(poll, { audience: 'guest' }),
    ));

    if (poll.final) page.append(finalCard(poll, viewZone, { organizer: false }));
    else if (poll.status === 'closed') page.append(statusBanner('closed', poll));

    const zone = zoneLine({
      timeZone: viewZone,
      organizerZone: poll.timezone,
      atMs: poll.slots[0],
      expanded: zoneExpanded,
      onChange: (z) => { viewZone = z; storage.setViewTimeZone(z); zoneExpanded = true; render(); zoneExpanded = false; document.getElementById('zone-line-select')?.focus(); },
    });

    const tabIds = [];
    if (isOpen() || mine) tabIds.push('mine');
    if (canSeeResults()) tabIds.push('group');
    if (!tabIds.includes(tab)) tab = tabIds[0] || 'group';
    if (tabIds.length > 1) {
      const tabs = h('div', { class: 'tabs', role: 'tablist', 'aria-label': 'View' });
      const label = { mine: mine ? 'Your response' : 'Your availability', group: `Group results (${poll.responseCount})` };
      for (const id of tabIds) {
        tabs.append(h('button', {
          type: 'button', role: 'tab', id: `tab-${id}`, class: 'tab',
          'aria-selected': tab === id ? 'true' : 'false', 'aria-controls': `panel-${id}`, tabindex: tab === id ? '0' : '-1',
          onclick: () => { tab = id; justSaved = false; render(); document.getElementById(`tab-${id}`)?.focus(); },
        }, label[id], id === 'mine' && draft.dirty && canEdit() ? h('span', { class: 'unsaved-dot', title: 'Unsaved changes' }, h('span', { class: 'visually-hidden' }, ' (unsaved changes)')) : null));
      }
      tabs.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        const all = [...tabs.querySelectorAll('[role=tab]')];
        const i = all.findIndex((t) => t.getAttribute('aria-selected') === 'true');
        all[(i + (e.key === 'ArrowRight' ? 1 : all.length - 1)) % all.length].click();
      });
      page.append(tabs);
    }

    page.append(tab === 'mine' ? minePanel(zone) : groupPanel(zone));
    const access = accessLinks();
    if (access) page.append(access);
    main.append(page);
  }

  function minePanel(zone) {
    const open = canEdit();
    const panel = h('section', { class: `panel${open ? '' : ' is-locked'}`, id: 'panel-mine', role: 'tabpanel', 'aria-labelledby': 'tab-mine' });

    if (justSaved && mine) panel.append(savedNotice());
    if (draft.restored && open) {
      panel.append(h('div', { class: 'notice small restored' },
        h('span', null, 'We restored the changes you hadn’t submitted yet. '),
        h('button', {
          type: 'button', class: 'link-btn',
          onclick: () => { clearDraft(); loadDraftFromResponse(); render(); announce('Discarded unsaved changes'); },
        }, 'Discard them')));
    }
    if (!isOpen()) {
      panel.append(h('p', { class: 'notice' }, 'This poll is closed, so responses can’t be changed. You can still delete yours.'));
    } else if (locked()) {
      panel.append(h('p', { class: 'notice' }, 'The organizer doesn’t allow changing answers after they’re sent. You can still delete yours.'));
    }
    if (!mine && open) {
      panel.append(h('p', { class: 'sign-in-line small' },
        'Already answered on another device? ',
        h('button', { type: 'button', class: 'link-btn', onclick: signInAsGuest }, 'Sign in with your name and password')));
    }

    const visibleTo = poll.resultsVisibility === 'everyone' ? 'Shown to the organizer and everyone with the guest link.' : 'Shown only to the organizer.';
    const nameInput = h('input', {
      id: 'g-name', class: 'input', type: 'text', maxlength: '40', autocomplete: 'nickname', required: true,
      value: draft.name, disabled: !open,
      'aria-describedby': 'g-name-hint g-name-err',
    });
    const nameErr = h('p', { class: 'field-error', id: 'g-name-err', hidden: true });
    nameInput.addEventListener('input', () => {
      nameErr.hidden = true;
      nameInput.removeAttribute('aria-invalid');
      draft.name = nameInput.value;
      markDirty();
    });

    const noteInput = h('input', {
      id: 'g-note', class: 'input', type: 'text', maxlength: '200', value: draft.note, disabled: !open,
      placeholder: 'e.g. “Remote only” or “Can’t stay past 4”', 'aria-describedby': 'g-note-hint',
    });
    noteInput.addEventListener('input', () => { draft.note = noteInput.value; markDirty(); });

    // Optional password: lets the guest open their response anywhere with their name.
    const pw = passwordField({
      id: 'g-password', label: mine?.hasPassword ? 'New password' : 'Password',
      autocomplete: 'new-password',
      hint: mine?.hasPassword
        ? 'Leave empty to keep your current password.'
        : 'Optional. With it, you can change your answer from any device by signing in with your name. At least 8 characters.',
    });
    pw.input.disabled = !open;
    let removePassword = false;
    const pwSection = h('details', { class: 'pw-section', open: draft.passwordOpen || null },
      h('summary', null, icon('lock'), mine?.hasPassword ? 'Password is on' : 'Add a password (optional)'),
      h('div', { class: 'pw-body' },
        pw.el,
        mine?.hasPassword && !viaPassword() ? h('label', { class: 'check small' },
          h('input', { type: 'checkbox', disabled: !open, onchange: (e) => { removePassword = e.target.checked; pw.input.disabled = removePassword; } }),
          h('span', null, 'Remove my password')) : null,
        mine?.hasPassword && viaPassword() ? h('p', { class: 'field-hint' }, 'You signed in with your password on this device, so you can change it here but not remove it.') : null));
    pwSection.addEventListener('toggle', () => { draft.passwordOpen = pwSection.open; });

    const unseen = mine?.answered ? poll.slots.filter((s) => !mine.answered.includes(s)).length : 0; // null means all seen

    const counter = h('p', { class: 'count', 'aria-live': 'polite' });
    const emptyHint = h('p', { class: 'muted small empty-hint', hidden: true }, 'Nothing marked yet. If none of these times work, you can still submit so the organizer knows.');
    const undoBtn = h('button', { type: 'button', class: 'btn small ghost', disabled: true, onclick: () => grid.undo() }, 'Undo');
    const clearBtn = h('button', {
      type: 'button', class: 'btn small ghost',
      onclick: () => { grid.replace(new Map()); announce('Cleared all your marks. Press Undo to bring them back.'); },
    }, 'Clear all');
    const updateCount = () => {
      const counts = { pref: 0, yes: 0, maybe: 0 };
      for (const v of draft.value.values()) counts[v]++;
      const available = counts.yes + counts.pref;
      counter.textContent = draft.value.size
        ? `${f.plural(available, 'time')} available${counts.pref ? ` (${counts.pref} preferred)` : ''}${counts.maybe ? `, ${counts.maybe} if needed` : ''}`
        : 'No times marked yet';
      emptyHint.hidden = draft.value.size > 0;
      undoBtn.disabled = !grid?.canUndo;
      clearBtn.disabled = draft.value.size === 0;
    };

    const brushChip = ([id, label, key]) => h('label', { class: `brush brush-${id}`, title: `Shortcut: ${key}` },
      h('input', { type: 'radio', name: 'brush', value: id, checked: brush === id, disabled: !open, onchange: () => setBrush(id) }),
      h('span', { class: 'brush-swatch', 'aria-hidden': 'true' }),
      h('span', null, label));

    // Other people's availability, faintly, so a guest can lean toward times that work.
    const others = new Map();
    const otherResponses = (poll.responses || []).filter((r) => r.id !== mine?.id);
    for (const r of otherResponses) {
      for (const s of [...r.available, ...(r.preferred || []), ...r.ifNeeded]) others.set(s, (others.get(s) || 0) + 1);
    }
    const othersToggle = otherResponses.length ? h('label', { class: 'check' },
      h('input', {
        type: 'checkbox', checked: showOthers, disabled: !open,
        onchange: (e) => { showOthers = e.target.checked; grid.update({ showOthers }); },
      }),
      h('span', null, `Show when the ${f.plural(otherResponses.length, 'other person', 'other people')} ${otherResponses.length === 1 ? 'is' : 'are'} free`)) : null;

    grid = createGrid({
      mode: 'edit',
      weekly: poll.kind === 'weekly',
      slots: poll.slots,
      slotMinutes: poll.slotMinutes,
      timeZone: viewZone,
      value: draft.value,
      history: draft.history,
      day: gridDay,
      onDayChange: (d) => { gridDay = d; },
      brush,
      others,
      othersTotal: otherResponses.length,
      showOthers,
      label: 'Your availability',
      describedBy: open ? 'grid-help' : null,
      readOnly: !open,
      onChange: (v) => {
        draft.value = new Map(v);
        markDirty();
        updateCount();
        main.querySelector('#tab-mine')?.classList.add('has-unsaved');
      },
    });
    updateCount();

    const submit = h('button', { type: 'submit', class: 'btn primary large', disabled: !open }, mine ? 'Save changes' : 'Submit availability');
    const formError = h('p', { class: 'form-error', role: 'alert', hidden: true });

    const form = h('form', { class: 'respond', novalidate: true },
      h('div', { class: 'field name-field' },
        h('label', { for: 'g-name', class: 'field-label' }, 'Your name'),
        nameInput,
        h('p', { class: 'field-hint', id: 'g-name-hint' }, `${visibleTo} No email or account needed.`),
        nameErr),
      h('div', { class: 'field' },
        h('p', { class: 'field-label', id: 'when-label' }, open ? 'When are you free?' : 'Your times'),
        open ? h('p', { class: 'field-hint', id: 'grid-help' },
          h('span', { class: 'hint-pointer' }, 'Drag across the times you’re free. Click a day or time heading to fill it. '),
          h('span', { class: 'hint-touch' }, 'Tap each time you’re free. '),
          h('span', { class: 'hint-keys' }, 'With a keyboard: arrows move, Space marks, Shift with an arrow marks as you go, 1–4 switch what you’re marking, Ctrl+Z undoes.')) : null,
        poll.kind === 'weekly' ? h('p', { class: 'field-hint weekly-hint' }, 'This is a weekly poll. Mark the times that usually work for you in a typical week.') : null,
        unseen ? h('p', { class: 'notice small' }, `The organizer added ${f.plural(unseen, 'time')} since you last answered. Take a look and save again.`) : null,
        zone,
        // Read-only (closed, or locked after sending): no marking tools.
        open ? h('div', { class: 'brush-row' },
          h('div', { class: 'brushes', role: 'radiogroup', 'aria-label': 'Mark times as' },
            h('span', { class: 'brushes-label', 'aria-hidden': 'true' }, 'Mark as'),
            BRUSHES.map(brushChip)),
          h('div', { class: 'edit-tools' }, undoBtn, clearBtn)) : null,
        open ? h('p', { class: 'brush-help muted small' }, '“Preferred” tells the organizer which times suit you best. “If needed” means you could make it, but would rather not.') : null,
        open ? othersToggle : null,
        grid.el),
      emptyHint,
      h('div', { class: 'field note-field' },
        h('label', { for: 'g-note', class: 'field-label' }, 'Note ', h('span', { class: 'optional' }, '(optional)')),
        noteInput,
        h('p', { class: 'field-hint', id: 'g-note-hint' }, 'Anything the organizer should know. Shown next to your name.')),
      locked() ? null : pwSection,
      !mine && poll.allowEdits === false ? h('p', { class: 'notice small' }, 'Check your times before sending: the organizer doesn’t allow changes afterwards.') : null,
      formError,
      h('div', { class: 'action-bar' },
        h('div', { class: 'action-status' }, counter),
        h('div', { class: 'action-buttons' },
          mine ? h('button', { type: 'button', class: 'btn ghost danger-text', onclick: deleteMine }, 'Delete my response') : null,
          locked() ? null : submit)),
    );

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      formError.hidden = true;
      const name = nameInput.value.trim();
      if (!name) {
        nameErr.textContent = 'Add your name so the organizer knows who answered.';
        nameErr.hidden = false;
        nameInput.setAttribute('aria-invalid', 'true');
        nameInput.focus();
        return;
      }
      const password = pw.input.value;
      if (password && !removePassword) {
        const problem = passwordProblem(password);
        if (problem) {
          pwSection.open = true;
          formError.textContent = `Password: ${problem}`;
          formError.hidden = false;
          pw.input.focus();
          return;
        }
      }
      const marks = [...draft.value];
      const body = {
        name,
        note: noteInput.value.trim(),
        available: marks.filter(([, v]) => v === 'yes').map(([k]) => k),
        preferred: marks.filter(([, v]) => v === 'pref').map(([k]) => k),
        ifNeeded: marks.filter(([, v]) => v === 'maybe').map(([k]) => k),
      };
      submit.disabled = true;
      submit.dataset.busy = 'true';
      submitting = true;
      watcher.bump();
      const sent = { value: new Map(draft.value), name: draft.name, note: draft.note };
      try {
        if (removePassword) body.password = null;
        else if (password) body.password = await passwordKey(password, pollId, 'guest');
        if (mine) {
          ({ response: mine } = await api('PUT', `/api/polls/${pollId}/responses/${mine.id}`, { token, body }));
          // Signed in with the old password: carry on with the new one.
          if (viaPassword() && body.password) token = `${mine.id}:${body.password}`;
          announce(body.password ? 'Saved your changes and your new password' : 'Saved your changes');
        } else {
          const res = await api('POST', `/api/polls/${pollId}/responses`, { body });
          mine = res.response;
          token = res.editToken;
          justSaved = true;
          announce(`Thanks, ${mine.name}. Your times are in.`);
        }
        storage.saveAnswer(pollId, { token, responseId: mine.id, name: mine.name, title: poll.title, savedAt: Date.now() });
        storage.setLastName(mine.name);
        draft.passwordOpen = false;
        // Keep anything the guest changed while the save was on its way.
        const editedMeanwhile = draft.name !== sent.name || draft.note !== sent.note || draft.value.size !== sent.value.size
          || [...draft.value].some(([k, v]) => sent.value.get(k) !== v);
        const pending = editedMeanwhile ? { value: new Map(draft.value), name: draft.name, note: draft.note } : null;
        clearDraft();
        await reload().catch(() => {});
        loadDraftFromResponse();
        if (pending) {
          Object.assign(draft, pending);
          markDirty();
        }
        submitting = false;
        render();
        (main.querySelector('.saved-notice') || main.querySelector('#g-name'))?.focus();
      } catch (err) {
        if (err.field === 'name') {
          nameErr.textContent = err.message;
          nameErr.hidden = false;
          nameInput.setAttribute('aria-invalid', 'true');
          nameInput.focus();
        } else {
          formError.textContent = err.message;
          formError.hidden = false;
          if (err.status === 409 || err.status === 404) reload().then(() => render()).catch(() => {});
        }
        submit.disabled = false;
        delete submit.dataset.busy;
        submitting = false;
      }
    });

    panel.append(form);
    if (mine && !viaPassword()) panel.append(editLinkBox());
    if (mine) panel.append(emailControl({ poll, role: 'guest', responseId: mine.id, token, linkKey: viaPassword() ? null : token, compact: true }));
    return panel;
  }

  /** The guest's private link, to copy any time after sending. */
  function editLinkBox() {
    const link = `${location.origin}/p/${pollId}#r=${token}`;
    return h('div', { class: 'edit-link-box' },
      h('p', { class: 'muted small' }, icon('link'),
        h('span', null, locked()
          ? 'Your private link opens your answer on any device, so you can see or delete it. Don’t share it.'
          : 'Your private edit link opens your answer on any device, so you can change or delete it. Don’t share it.')),
      h('button', { type: 'button', class: 'link-btn', dataset: { action: 'copy-edit-link' }, onclick: () => copyText(link, 'Copied your private edit link') },
        'Copy my edit link'));
  }

  function savedNotice() {
    const link = `${location.origin}/p/${pollId}#r=${token}`;
    const input = h('input', { class: 'input mono-link', readonly: true, value: link, 'aria-label': 'Your private edit link', onfocus: (e) => e.target.select() });
    return h('div', { class: 'saved-notice callout success', tabindex: '-1' },
      h('p', { class: 'callout-title' }, icon('check'), `Thanks, ${mine.name}. Your times are in.`),
      h('p', null, poll.allowEdits === false
        ? 'The organizer doesn’t allow changes after sending, but you can delete your response any time: from this browser, or on another device with your private link. Don’t share the link.'
        : mine.hasPassword
        ? 'You can change or delete your response from this browser any time. On another device, open this poll and sign in with your name and password, or use your private edit link. Don’t share the link: anyone with it can change your answer.'
        : 'You can change or delete your response from this browser any time. To do it from another device, use your private edit link, or add a password below. Don’t share the link: anyone with it can change your answer.'),
      h('div', { class: 'link-row' }, input,
        h('button', { type: 'button', class: 'btn secondary', onclick: () => copyText(link, 'Copied your private edit link') }, icon('copy'), 'Copy')),
      canSeeResults() ? h('p', null, h('button', { type: 'button', class: 'link-btn', onclick: () => { tab = 'group'; justSaved = false; render(); document.getElementById('tab-group')?.focus(); } }, 'See group results')) : null,
    );
  }

  async function deleteMine() {
    const ok = await confirmDialog({
      title: 'Delete your response?',
      message: 'Your name and times will be removed from this poll for good.',
      confirm: 'Delete response',
      danger: true,
    });
    if (!ok) return;
    watcher.bump();
    try {
      await api('DELETE', `/api/polls/${pollId}/responses/${mine.id}`, { token });
      storage.forgetAnswer(pollId);
      clearDraft();
      mine = null;
      token = null;
      justSaved = false;
      await reload();
      loadDraftFromResponse();
      tab = isOpen() ? 'mine' : 'group';
      render();
      announce('Your response was deleted');
      main.querySelector('h1')?.focus();
    } catch (err) {
      announce(err.message, { tone: 'error' });
    }
  }

  /** Ways back in without a private link, shown at the foot of the poll. */
  function accessLinks() {
    const items = [];
    if (!mine && !isOpen() && poll.responseCount) items.push(h('button', { type: 'button', class: 'link-btn', onclick: signInAsGuest }, 'Sign in to your response'));
    if (poll.hasOrganizerPassword) items.push(h('button', { type: 'button', class: 'link-btn', onclick: manageWithPassword }, 'Organizer? Manage with your password'));
    return items.length ? h('p', { class: 'access-links small' }, ...items) : null;
  }

  async function signInAsGuest() {
    const name = h('input', { id: 'si-name', class: 'input', type: 'text', maxlength: '40', autocomplete: 'nickname', required: true, value: storage.lastName() || '' });
    const pwd = passwordField({ id: 'si-password', label: 'Password' });
    const signed = await formDialog({
      title: 'Sign in to your response',
      intro: h('p', { class: 'dialog-text' }, 'Use the name you answered with and the password you added. This only works if you added a password when you answered.'),
      fields: [h('div', { class: 'field' }, h('label', { for: 'si-name', class: 'field-label' }, 'Your name'), name), pwd.el],
      submitLabel: 'Sign in',
    }, async () => {
      if (!name.value.trim()) throw new Error('Enter the name you answered with.');
      if (!pwd.input.value) throw new Error('Enter your password.');
      const key = await passwordKey(pwd.input.value, pollId, 'guest');
      const { response } = await api('POST', `/api/polls/${pollId}/sign-in`, { body: { name: name.value, password: key } });
      return { response, key };
    });
    if (!signed) return;
    mine = signed.response;
    token = `${mine.id}:${signed.key}`;
    storage.saveAnswer(pollId, { token, responseId: mine.id, name: mine.name, title: poll.title, savedAt: Date.now() });
    clearDraft();
    loadDraftFromResponse();
    tab = isOpen() ? 'mine' : 'group';
    render();
    announce(`Signed in as ${mine.name}`);
    main.querySelector('#g-name, h1')?.focus();
  }

  async function manageWithPassword() {
    const pwd = passwordField({ id: 'mp-password', label: 'Organizer password' });
    const key = await formDialog({
      title: 'Manage this poll',
      intro: h('p', { class: 'dialog-text' }, 'Enter the password the organizer set for this poll. Your private link works too, if you have it.'),
      fields: pwd.el,
      submitLabel: 'Open organizer view',
    }, async () => {
      if (!pwd.input.value) throw new Error('Enter the password.');
      const k = await passwordKey(pwd.input.value, pollId, 'organizer');
      try {
        await api('GET', `/api/polls/${pollId}/manage`, { token: k });
      } catch (err) {
        if (err.status === 403) throw new Error('That password isn’t right for this poll.');
        throw err;
      }
      return k;
    });
    if (!key) return;
    storage.saveManaged(pollId, { token: key, title: poll.title });
    location.assign(`/m/${pollId}#k=${encodeURIComponent(key)}`);
  }

  function groupPanel(zone) {
    const panel = h('section', { class: 'panel', id: 'panel-group', role: 'tabpanel', 'aria-labelledby': 'tab-group' });
    if (!canSeeResults()) {
      panel.append(h('div', { class: 'empty-state' },
        h('p', { class: 'empty-title' }, 'Only the organizer can see responses'),
        h('p', null, `${f.plural(poll.responseCount, 'person has', 'people have')} responded so far.`)));
      return panel;
    }
    results = resultsSection({ poll, timeZone: viewZone, selfId: mine?.id, state: resultsState });
    panel.append(zone, results, bestTimes({ poll, timeZone: viewZone, onHighlight: (slots) => results.highlight(slots) }));
    return panel;
  }

  render();
}
