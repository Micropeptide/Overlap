import { h, clear, icon, announce, copyText, confirmDialog, openDialog, formDialog, passwordField, linkify } from '../lib/dom.js';
import { api, ApiError } from '../lib/api.js';
import { storage, hashParams } from '../lib/storage.js';
import * as f from '../lib/format.js';
import { layoutSlots } from '/shared/time.js';
import { bestTimes } from '../components/best-times.js';
import { resultsSection } from '../components/results.js';
import { zoneLine } from '../components/zone-picker.js';
import { createPollForm } from '../components/poll-form.js';
import { lengthOptions } from '../components/lengths.js';
import { renderNotFound } from './not-found.js';
import { emailControl } from '../components/email-control.js';
import { serverConfig } from '../lib/config.js';
import { pollFacts, finalCard, locationLine, watchForUpdates, captureFocus } from './shared.js';
import { isValidTimeZone } from '/shared/time.js';
import { passwordKey, passwordProblem, KEY_PATTERN, PASSWORD_MIN, PASSWORD_MAX } from '/shared/password.js';
import { t, tx, locale } from '../lib/i18n.js';

export async function renderManage(main, pollId) {
  const params = hashParams();
  let token = params.get('k') || storage.getManaged(pollId)?.token || null;
  const isNew = params.get('new') === '1';
  const passwordFailed = params.get('pw') === '0';

  if (!token) {
    return renderNotFound(main, {
      title: t('manage.noLinkTitle'),
      message: t('manage.noLinkMessage'),
    });
  }

  let poll;
  try {
    ({ poll } = await api('GET', `/api/polls/${pollId}/manage`, { token }));
  } catch (err) {
    if (err instanceof ApiError && (err.status === 403 || err.status === 404)) {
      // Forget the saved key only if it is the one that failed; an old link
      // shouldn't erase a newer key saved in this browser.
      if (err.status === 404 || storage.getManaged(pollId)?.token === token) storage.forgetManaged(pollId);
      return renderNotFound(main, err.status === 403
        ? { title: t('manage.badLinkTitle'), message: t('manage.badLinkMessage') }
        : { title: t('manage.goneTitle'), message: t('manage.goneMessage') });
    }
    throw err;
  }

  storage.saveManaged(pollId, { token, title: poll.title });
  // Keep the key in the address bar so the page can be bookmarked; drop the "new" flag.
  history.replaceState(null, '', `/m/${pollId}#k=${encodeURIComponent(token)}`);

  let viewZone = storage.viewTimeZone() || f.deviceTimeZone();
  if (!isValidTimeZone(viewZone)) viewZone = f.deviceTimeZone();
  const resultsState = {}; // person filter, numbers toggle, phone day: kept across re-renders
  let watcher = { bump() {} };
  let showReady = isNew;
  let editing = false;
  let zoneExpanded = false;
  let results = null;

  // Opened with the organizer password: the page holds a key derived from it, not a link key.
  const viaPassword = () => KEY_PATTERN.test(token);
  const guestUrl = () => `${location.origin}/p/${pollId}`;
  const privateUrl = () => `${location.origin}/m/${pollId}#k=${encodeURIComponent(token)}`;

  /** Save a change, re-render, and put keyboard focus somewhere sensible. */
  async function patch(body, message, focusSelector = '.status-chip') {
    watcher.bump();
    try {
      ({ poll } = await api('PATCH', `/api/polls/${pollId}`, { token, body }));
      render();
      (main.querySelector(focusSelector) || main.querySelector('h1'))?.focus();
      if (message) announce(message);
      return true;
    } catch (err) {
      announce(err.message, { tone: 'error' });
      return false;
    }
  }

  async function refresh() {
    watcher.bump();
    ({ poll } = await api('GET', `/api/polls/${pollId}/manage`, { token }));
  }

  function render() {
    results?.destroy?.();
    results = null;
    clear(main);
    document.title = t('manage.pageTitle', { title: poll.title });
    const page = h('div', { class: 'page poll-page manage-page' });

    page.append(h('header', { class: 'poll-head' },
      h('p', { class: 'role-tag' }, icon('lock'), t('manage.roleTag')),
      h('div', { class: 'title-row' },
        h('h1', { class: 'page-title poll-title', tabindex: '-1' }, poll.title),
        h('span', { class: `status-chip status-${poll.status}`, tabindex: '-1' }, { open: t('manage.statusOpen'), closed: t('manage.statusClosed'), finalized: t('manage.statusFinalized') }[poll.status]),
        editing ? null : h('button', { type: 'button', class: 'btn small secondary edit-top', dataset: { action: 'edit-top' }, onclick: () => startEditing() }, icon('edit'), t('manage.editPoll'))),
      poll.description ? h('p', { class: 'poll-desc' }, linkify(poll.description)) : null,
      locationLine(poll),
      // Quick ways to add what's missing; everything else is under "Edit poll".
      !editing && (!poll.description || !poll.location) ? h('p', { class: 'quick-add small' },
        poll.description ? null : h('button', { type: 'button', class: 'link-btn', onclick: () => startEditing('f-desc') }, t('manage.addNote')),
        poll.location ? null : h('button', { type: 'button', class: 'link-btn', onclick: () => startEditing('f-location') }, t('manage.addPlace'))) : null,
      pollFacts(poll, { audience: 'organizer' }),
    ));

    if (editing) {
      page.append(editPanel());
      main.append(page);
      return;
    }

    if (showReady) {
      page.append(h('div', { class: 'callout success ready', tabindex: '-1' },
        h('p', { class: 'callout-title' }, icon('check'), t('manage.readyTitle')),
        h('p', null, t('manage.readyText'))));
    }

    page.append(linksSection());

    if (poll.final) {
      page.append(finalCard(poll, viewZone, {
        organizer: true,
        extra: [
          h('button', { type: 'button', class: 'btn ghost', onclick: () => chooseFinal(poll.final.start, (poll.final.end - poll.final.start) / 60000) }, t('manage.changeTime')),
          h('button', { type: 'button', class: 'btn ghost', onclick: () => patch({ status: 'open' }, t('manage.reopenedCleared')) }, t('manage.reopen')),
        ],
      }));
    }

    const zone = zoneLine({
      timeZone: viewZone,
      organizerZone: poll.timezone,
      atMs: poll.slots[0],
      id: 'm-zone',
      expanded: zoneExpanded,
      onChange: (z) => { viewZone = z; storage.setViewTimeZone(z); zoneExpanded = true; render(); zoneExpanded = false; document.getElementById('m-zone-select')?.focus(); },
    });

    results = resultsSection({
      poll,
      timeZone: viewZone,
      exportable: true,
      state: resultsState,
      onPick: (slot) => chooseFinal(slot, poll.durationMinutes || poll.slotMinutes),
      onRemove: async (r) => {
        try {
          await api('DELETE', `/api/polls/${pollId}/responses/${r.id}`, { token });
          await refresh();
          render();
          (main.querySelector('.person-btn') || main.querySelector('#results-title'))?.focus();
          announce(t('manage.responseRemoved', { name: r.name }));
        } catch (err) {
          announce(err.message, { tone: 'error' });
        }
      },
    });
    page.append(h('div', { class: 'panel' }, zone, results,
      h('p', { class: 'add-own' }, ...tx('manage.addOwn', { link: h('a', { href: `/p/${pollId}`, target: '_blank', rel: 'noopener' }, t('manage.addOwnLink')) }))));
    page.append(h('div', { class: 'panel best-panel' },
      bestTimes({
        poll,
        timeZone: viewZone,
        onChoose: (w) => chooseFinal(w.start, Math.min(w.minutes, poll.durationMinutes || w.minutes)),
        onHighlight: (slots) => results.highlight(slots),
        emptyAction: h('button', { type: 'button', class: 'btn primary', onclick: () => copyText(guestUrl(), t('manage.copiedGuestLink')) }, icon('copy'), t('manage.copyGuestLink')),
      }),
    ));


    page.append(settingsSection());
    main.append(page);
    if (showReady) {
      main.querySelector('.ready')?.focus();
      showReady = false;
    }
  }

  /** "Hi! Please mark when you're free for …", without the link. */
  const inviteAsk = () => t(poll.kind === 'weekly' ? 'manage.inviteAskWeekly' : 'manage.inviteAsk', { title: poll.title });
  const inviteMessage = () => t('manage.inviteMessage', { ask: inviteAsk(), url: guestUrl() });

  async function shareGuestLink() {
    try {
      await navigator.share({ title: poll.title, text: inviteAsk(), url: guestUrl() });
    } catch { /* the person closed the share sheet */ }
  }

  function linkBlock({ id, label, description, value, actions, tone, extra = null }) {
    const input = h('input', { id, class: 'input mono-link', readonly: true, value, onfocus: (e) => e.target.select(), 'aria-describedby': `${id}-desc` });
    return h('div', { class: `link-block ${tone}` },
      h('label', { for: id, class: 'link-label' }, icon(tone === 'private' ? 'lock' : 'link'), label),
      h('p', { class: 'link-desc', id: `${id}-desc` }, description),
      h('div', { class: 'link-row' }, input, ...actions),
      extra);
  }

  function linksSection() {
    const noResponses = poll.responseCount === 0;
    return h('section', { class: 'links', 'aria-labelledby': 'links-title' },
      h('h2', { id: 'links-title', class: 'visually-hidden' }, t('manage.linksTitle')),
      linkBlock({
        id: 'guest-link',
        label: t('manage.guestLinkLabel'),
        description: t('manage.guestLinkText'),
        value: guestUrl(),
        tone: 'guest',
        actions: [
          h('button', { type: 'button', class: `btn ${noResponses ? 'primary' : 'secondary'}`, onclick: () => copyText(guestUrl(), t('manage.copiedGuestLink')) }, icon('copy'), t('manage.copy')),
          navigator.share ? h('button', { type: 'button', class: 'btn ghost', onclick: shareGuestLink }, icon('share'), t('manage.share')) : null,
          h('a', { class: 'btn ghost', href: guestUrl(), target: '_blank', rel: 'noopener' }, t('manage.open')),
        ].filter(Boolean),
        extra: h('p', { class: 'link-extra' }, ...tx('manage.inviteHint', {
          button: h('button', { type: 'button', class: 'link-btn', onclick: () => copyText(inviteMessage(), t('manage.copiedInvite')) }, t('manage.copyInvite')),
        })),
      }),
      viaPassword() ? h('div', { class: 'link-block private' },
        h('p', { class: 'link-label', id: 'private-link', tabindex: '-1' }, icon('lock'), t('manage.signedIn')),
        h('p', { class: 'link-desc' }, t('manage.signedInText')),
        h('div', { class: 'link-row' },
          h('button', { type: 'button', class: 'btn secondary', onclick: replaceLink }, icon('refresh'), t('manage.newPrivateLink')))) : linkBlock({
        id: 'private-link',
        label: t('manage.privateLinkLabel'),
        description: t('manage.privateLinkText'),
        value: privateUrl(),
        tone: 'private',
        actions: [
          h('button', { type: 'button', class: 'btn secondary', onclick: () => copyText(privateUrl(), t('manage.copiedPrivateLink')) }, icon('copy'), t('manage.copy')),
          h('button', { type: 'button', class: 'btn ghost', onclick: replaceLink }, icon('refresh'), t('manage.replace')),
        ],
      }),
    );
  }

  async function replaceLink() {
    const ok = await confirmDialog({
      title: t('manage.replaceTitle'),
      message: t('manage.replaceText'),
      confirm: t('manage.replaceConfirm'),
    });
    if (!ok) return;
    watcher.bump();
    try {
      const res = await api('POST', `/api/polls/${pollId}/private-link`, { token });
      token = res.adminToken;
      storage.saveManaged(pollId, { token, title: poll.title });
      history.replaceState(null, '', `/m/${pollId}#k=${encodeURIComponent(token)}`);
      render();
      document.getElementById('private-link')?.focus();
      announce(t('manage.replaced'));
    } catch (err) {
      announce(err.message, { tone: 'error' });
    }
  }

  async function setPassword() {
    const pw = passwordField({ id: 'op-new', label: t('manage.newPassword'), autocomplete: 'new-password', hint: t('manage.passwordHint', { count: PASSWORD_MIN }) });
    const again = passwordField({ id: 'op-again', label: t('manage.passwordAgain'), autocomplete: 'new-password' });
    const key = await formDialog({
      title: poll.hasOrganizerPassword ? t('manage.changePasswordTitle') : t('manage.setPasswordTitle'),
      intro: h('p', { class: 'dialog-text' }, t('manage.passwordIntro')),
      fields: [pw.el, again.el],
      submitLabel: t('manage.savePassword'),
    }, async () => {
      // passwordProblem() speaks English only; show the same rule in the page's language.
      if (passwordProblem(pw.input.value)) {
        throw new Error(pw.input.value.length < PASSWORD_MIN
          ? t('manage.passwordTooShort', { count: PASSWORD_MIN })
          : t('manage.passwordTooLong', { count: PASSWORD_MAX }));
      }
      if (pw.input.value !== again.input.value) throw new Error(t('manage.passwordMismatch'));
      const k = await passwordKey(pw.input.value, pollId, 'organizer');
      ({ poll } = await api('PATCH', `/api/polls/${pollId}`, { token, body: { organizerPassword: k } }));
      return k;
    });
    if (!key) return;
    watcher.bump();
    if (viaPassword()) {
      token = key;
      storage.saveManaged(pollId, { token, title: poll.title });
      history.replaceState(null, '', `/m/${pollId}#k=${encodeURIComponent(token)}`);
    }
    render();
    main.querySelector('[data-action="password"]')?.focus();
    announce(t('manage.passwordSaved'));
  }

  async function removePassword() {
    const ok = await confirmDialog({
      title: t('manage.removePasswordTitle'),
      message: t('manage.removePasswordText'),
      confirm: t('manage.removePasswordConfirm'),
    });
    if (!ok) return;
    await patch({ organizerPassword: null }, t('manage.passwordRemoved'), '[data-action="password"]');
  }

  async function chooseFinal(startSlot, minutes) {
    const weekly = poll.kind === 'weekly';
    const layout = layoutSlots(poll.slots, viewZone);
    const startSel = h('select', { id: 'fin-start', class: 'input' },
      layout.columns.map((dk) => h('optgroup', { label: f.dayName(dk, weekly, 'long') },
        layout.cells.filter((c) => c.dateKey === dk).sort((a, b) => a.slot - b.slot)
          .map((c) => h('option', { value: String(c.slot), selected: c.slot === startSlot }, t('manage.startOption', { time: f.time(c.slot, viewZone), day: f.dayName(dk, weekly) }))))));
    const lengths = lengthOptions().filter(([m]) => m > 0);
    if (minutes && !lengths.some(([m]) => m === minutes)) lengths.push([minutes, f.duration(minutes)]);
    lengths.sort((a, b) => a[0] - b[0]);
    const lenSel = h('select', { id: 'fin-len', class: 'input' },
      lengths.map(([m, label]) => h('option', { value: String(m), selected: m === (minutes || 60) }, label)));
    const preview = h('p', { class: 'final-preview', 'aria-live': 'polite' });
    const update = () => {
      const s = Number(startSel.value);
      const e = s + Number(lenSel.value) * 60000;
      preview.textContent = t(weekly ? 'manage.previewWeekly' : 'manage.preview', { time: f.slotRange(s, e, viewZone, weekly), zone: f.zoneLabel(viewZone, s) });
    };
    startSel.addEventListener('change', update);
    lenSel.addEventListener('change', update);
    update();
    const result = await openDialog({
      title: t('manage.finalTitle'),
      body: h('div', { class: 'dialog-body' },
        h('div', { class: 'field' }, h('label', { for: 'fin-start' }, t('manage.starts')), startSel),
        h('div', { class: 'field' }, h('label', { for: 'fin-len' }, t('manage.lasts')), lenSel),
        preview,
        h('p', { class: 'muted small' }, t('manage.finalNote'))),
      actions: [
        { label: t('manage.cancel'), value: 'cancel' },
        { label: t('manage.setFinal'), value: 'ok', kind: 'primary', submit: true },
      ],
    });
    if (result !== 'ok') return;
    const start = Number(startSel.value);
    const ok = await patch({ final: { start, end: start + Number(lenSel.value) * 60000 } }, t('manage.finalSet'), '.final-card');
    if (ok) main.querySelector('.final-card')?.scrollIntoView({ block: 'start' });
  }

  /** Open the edit form, optionally focusing one field (e.g. the note for guests). */
  let focusField = null;
  function startEditing(fieldId = null) {
    focusField = fieldId;
    editing = true;
    render();
  }
  const afterEditFocus = () => main.querySelector('[data-action="edit-top"]')?.focus({ preventScroll: true });

  function editPanel() {
    const form = createPollForm({
      initial: poll,
      editing: true,
      submitLabel: t('manage.saveChanges'),
      onSubmit: async (value) => {
        watcher.bump();
        ({ poll } = await api('PATCH', `/api/polls/${pollId}`, { token, body: value }));
        storage.saveManaged(pollId, { token, title: poll.title });
        editing = false;
        render();
        afterEditFocus();
        window.scrollTo({ top: 0 });
        announce(t('manage.saved'));
      },
    });
    const panel = h('section', { class: 'panel edit-panel', 'aria-labelledby': 'edit-title' },
      h('div', { class: 'edit-head' },
        h('h2', { id: 'edit-title', class: 'section-title' }, t('manage.editTitle')),
        h('button', { type: 'button', class: 'btn ghost', onclick: () => { editing = false; render(); afterEditFocus(); } }, t('manage.cancel'))),
      poll.responseCount
        ? h('p', { class: 'notice small' }, t('manage.editNotice'))
        : null,
      form.el);
    queueMicrotask(() => {
      const field = focusField && document.getElementById(focusField);
      focusField = null;
      if (field) { field.focus({ preventScroll: true }); field.scrollIntoView({ block: 'center' }); } else form.focus();
    });
    return panel;
  }

  // Shown only when this copy of Overlap can send email.
  function emailRow() {
    const row = h('div', { class: 'settings-row email-row', hidden: true },
      h('div', null,
        h('p', { class: 'setting-name' }, t('manage.email')),
        emailControl({ poll, role: 'organizer', token, linkKey: viaPassword() ? null : token })));
    serverConfig().then((cfg) => { row.hidden = !cfg.emails; });
    return row;
  }

  const privacyLink = () => h('a', { href: '/privacy' }, t('manage.privacyLink'));

  function settingsSection() {
    const expires = poll.expiresAt ? new Date(poll.expiresAt) : null;
    const isOpen = poll.status === 'open';
    return h('section', { class: 'settings panel', 'aria-labelledby': 'settings-title' },
      h('h2', { id: 'settings-title', class: 'section-title' }, t('manage.settingsTitle')),
      h('div', { class: 'settings-row' },
        h('div', null,
          h('p', { class: 'setting-name' }, t('manage.detailsName')),
          h('p', { class: 'muted small' }, t('manage.detailsText'))),
        h('button', { type: 'button', class: 'btn secondary', dataset: { action: 'edit' }, onclick: () => startEditing() }, icon('edit'), t('manage.editPoll'))),
      h('div', { class: 'settings-row' },
        h('div', null,
          h('p', { class: 'setting-name' }, isOpen ? t('manage.closeName') : t('manage.reopenName')),
          h('p', { class: 'muted small' }, isOpen
            ? t('manage.closeText')
            : poll.final ? t('manage.reopenClearsFinal') : t('manage.reopenText'))),
        isOpen
          ? h('button', { type: 'button', class: 'btn secondary', onclick: () => patch({ status: 'closed' }, t('manage.closed')) }, t('manage.close'))
          : h('button', { type: 'button', class: 'btn secondary', onclick: () => patch({ status: 'open' }, t('manage.reopened')) }, t('manage.reopen'))),
      h('div', { class: 'settings-row' },
        h('div', null,
          h('p', { class: 'setting-name' }, t('manage.passwordName'), poll.hasOrganizerPassword ? h('span', { class: 'chip on' }, t('manage.on')) : null),
          h('p', { class: 'muted small' }, poll.hasOrganizerPassword
            ? t('manage.passwordOnText')
            : t('manage.passwordOffText'))),
        h('div', { class: 'row-actions' },
          poll.hasOrganizerPassword && !viaPassword()
            ? h('button', { type: 'button', class: 'btn ghost', onclick: removePassword }, t('manage.remove')) : null,
          h('button', { type: 'button', class: 'btn secondary', dataset: { action: 'password' }, onclick: setPassword }, icon('lock'), poll.hasOrganizerPassword ? t('manage.changePassword') : t('manage.setPassword')))),
      emailRow(),
      h('div', { class: 'settings-row' },
        h('div', null,
          h('p', { class: 'setting-name' }, t('manage.duplicateName')),
          h('p', { class: 'muted small' }, t('manage.duplicateText'))),
        h('button', {
          type: 'button', class: 'btn secondary',
          onclick: () => {
            const keys = ['kind', 'weekdays', 'title', 'description', 'location', 'dates', 'startMinute', 'endMinute', 'slotMinutes', 'durationMinutes', 'timezone', 'resultsVisibility', 'allowEdits'];
            storage.setCopySource(Object.fromEntries(keys.map((k) => [k, poll[k]])));
            location.assign('/');
          },
        }, t('manage.duplicate'))),
      h('div', { class: 'settings-row' },
        h('div', null,
          h('p', { class: 'setting-name' }, t('manage.dataName')),
          h('p', { class: 'muted small' }, ...(expires
            ? tx('manage.dataExpires', { date: expires.toLocaleDateString(locale(), { year: 'numeric', month: 'long', day: 'numeric' }), link: privacyLink() })
            : tx('manage.dataKept', { link: privacyLink() })))),
        h('button', { type: 'button', class: 'btn danger', onclick: deletePoll }, icon('trash'), t('manage.deleteNow'))),
    );
  }

  async function deletePoll() {
    const ok = await confirmDialog({
      title: t('manage.deleteTitle'),
      message: t('manage.deleteText', { title: poll.title, count: poll.responseCount }),
      confirm: t('manage.deleteConfirm'),
      danger: true,
    });
    if (!ok) return;
    try {
      await api('DELETE', `/api/polls/${pollId}`, { token });
      storage.forgetManaged(pollId);
      clear(main).append(h('div', { class: 'page narrow message-page' },
        h('h1', { class: 'page-title', tabindex: '-1' }, t('manage.deletedTitle')),
        h('p', { class: 'lede' }, t('manage.deletedText')),
        h('p', null, h('a', { class: 'btn primary', href: '/' }, t('manage.createNew')))));
      history.replaceState(null, '', `/m/${pollId}`);
      main.querySelector('h1')?.focus();
    } catch (err) {
      announce(err.message, { tone: 'error' });
    }
  }

  watcher = watchForUpdates({
    fetch: () => api('GET', `/api/polls/${pollId}/manage`, { token }).then((r) => r.poll),
    current: () => poll,
    paused: () => editing, // don't disturb a half-edited form
    apply: (next) => {
      poll = next;
      const restore = captureFocus();
      const y = window.scrollY;
      render();
      window.scrollTo(0, y);
      restore();
      announce(t('manage.resultsUpdated'));
    },
  });

  render();
  if (passwordFailed) announce(t('manage.passwordFailed'), { tone: 'error' });
}
