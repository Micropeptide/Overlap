import { h, clear, icon, announce, copyText, confirmDialog, openDialog, formDialog, passwordField, linkify } from '../lib/dom.js';
import { api, ApiError } from '../lib/api.js';
import { storage, hashParams } from '../lib/storage.js';
import * as f from '../lib/format.js';
import { layoutSlots } from '/shared/time.js';
import { bestTimes } from '../components/best-times.js';
import { resultsSection } from '../components/results.js';
import { zoneLine } from '../components/zone-picker.js';
import { createPollForm } from '../components/poll-form.js';
import { LENGTHS } from '../components/lengths.js';
import { renderNotFound } from './not-found.js';
import { emailControl } from '../components/email-control.js';
import { serverConfig } from '../lib/config.js';
import { pollFacts, finalCard, locationLine, watchForUpdates, captureFocus } from './shared.js';
import { isValidTimeZone } from '/shared/time.js';
import { passwordKey, passwordProblem, KEY_PATTERN } from '/shared/password.js';

export async function renderManage(main, pollId) {
  const params = hashParams();
  let token = params.get('k') || storage.getManaged(pollId)?.token || null;
  const isNew = params.get('new') === '1';
  const passwordFailed = params.get('pw') === '0';

  if (!token) {
    return renderNotFound(main, {
      title: 'Open this page with your private link',
      message: 'Managing a poll needs the private link you got when you created it. If you set an organizer password, open the guest link and choose “Manage with your password”.',
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
        ? { title: 'This private link no longer works', message: 'It may have been replaced with a new one, or the password changed. Use the newest private link, or open the guest link and choose “Manage with your password”.' }
        : { title: 'This poll isn’t here', message: 'It may have been deleted.' });
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
    document.title = `${poll.title} (organizer) · Overlap`;
    const page = h('div', { class: 'page poll-page manage-page' });

    page.append(h('header', { class: 'poll-head' },
      h('p', { class: 'role-tag' }, icon('lock'), 'Organizer view: only people with your private link see this page'),
      h('div', { class: 'title-row' },
        h('h1', { class: 'page-title poll-title', tabindex: '-1' }, poll.title),
        h('span', { class: `status-chip status-${poll.status}`, tabindex: '-1' }, { open: 'Open for responses', closed: 'Closed', finalized: 'Final time chosen' }[poll.status])),
      poll.description ? h('p', { class: 'poll-desc' }, linkify(poll.description)) : null,
      locationLine(poll),
      pollFacts(poll, { audience: 'organizer' }),
    ));

    if (editing) {
      page.append(editPanel());
      main.append(page);
      return;
    }

    if (showReady) {
      page.append(h('div', { class: 'callout success ready', tabindex: '-1' },
        h('p', { class: 'callout-title' }, icon('check'), 'Your poll is ready'),
        h('p', null, 'Copy the guest link and send it to everyone. Bookmark this page, or copy your private link, so you can come back to manage it.')));
    }

    page.append(linksSection());

    if (poll.final) {
      page.append(finalCard(poll, viewZone, {
        organizer: true,
        extra: [
          h('button', { type: 'button', class: 'btn ghost', onclick: () => chooseFinal(poll.final.start, (poll.final.end - poll.final.start) / 60000) }, 'Change time'),
          h('button', { type: 'button', class: 'btn ghost', onclick: () => patch({ status: 'open' }, 'Poll reopened. The final time was cleared.') }, 'Reopen poll'),
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
          announce(`Removed ${r.name}’s response`);
        } catch (err) {
          announce(err.message, { tone: 'error' });
        }
      },
    });
    page.append(h('div', { class: 'panel' }, zone, results,
      h('p', { class: 'add-own' }, h('a', { href: `/p/${pollId}`, target: '_blank', rel: 'noopener' }, 'Add your own availability'), ' (opens the guest page)')));
    page.append(h('div', { class: 'panel best-panel' },
      bestTimes({
        poll,
        timeZone: viewZone,
        onChoose: (w) => chooseFinal(w.start, Math.min(w.minutes, poll.durationMinutes || w.minutes)),
        onHighlight: (slots) => results.highlight(slots),
        emptyAction: h('button', { type: 'button', class: 'btn primary', onclick: () => copyText(guestUrl(), 'Copied the guest link') }, icon('copy'), 'Copy guest link'),
      }),
    ));


    page.append(settingsSection());
    main.append(page);
    if (showReady) {
      main.querySelector('.ready')?.focus();
      showReady = false;
    }
  }

  function inviteMessage() {
    const what = poll.kind === 'weekly' ? 'which times usually work for you each week' : 'when you’re free';
    return `Hi! Please mark ${what} for “${poll.title}”: ${guestUrl()}\nIt takes a minute and needs no account.`;
  }

  async function shareGuestLink() {
    try {
      await navigator.share({ title: poll.title, text: inviteMessage().split('\n')[0].replace(`: ${guestUrl()}`, ''), url: guestUrl() });
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
      h('h2', { id: 'links-title', class: 'visually-hidden' }, 'Links'),
      linkBlock({
        id: 'guest-link',
        label: 'Guest link: share this one',
        description: 'Anyone with this link can respond and, if you allow it, see the results. It can’t change or close the poll.',
        value: guestUrl(),
        tone: 'guest',
        actions: [
          h('button', { type: 'button', class: `btn ${noResponses ? 'primary' : 'secondary'}`, onclick: () => copyText(guestUrl(), 'Copied the guest link') }, icon('copy'), 'Copy'),
          navigator.share ? h('button', { type: 'button', class: 'btn ghost', onclick: shareGuestLink }, icon('share'), 'Share') : null,
          h('a', { class: 'btn ghost', href: guestUrl(), target: '_blank', rel: 'noopener' }, 'Open'),
        ].filter(Boolean),
        extra: h('p', { class: 'link-extra' },
          h('button', { type: 'button', class: 'link-btn', onclick: () => copyText(inviteMessage(), 'Copied an invitation message you can paste anywhere') }, 'Copy an invitation message'),
          ' with the link and a line explaining what to do.'),
      }),
      viaPassword() ? h('div', { class: 'link-block private' },
        h('p', { class: 'link-label', id: 'private-link', tabindex: '-1' }, icon('lock'), 'Signed in with your password'),
        h('p', { class: 'link-desc' }, 'You opened this page with the organizer password, so there’s no private link to show here. If you’d like a link too, create a new one. Any older private link stops working.'),
        h('div', { class: 'link-row' },
          h('button', { type: 'button', class: 'btn secondary', onclick: replaceLink }, icon('refresh'), 'Create a new private link'))) : linkBlock({
        id: 'private-link',
        label: 'Private link: keep this to yourself',
        description: 'Anyone with this link can manage the poll: edit it, close it, remove responses or delete it. It’s saved in this browser. Copy it somewhere safe to manage from another device.',
        value: privateUrl(),
        tone: 'private',
        actions: [
          h('button', { type: 'button', class: 'btn secondary', onclick: () => copyText(privateUrl(), 'Copied your private link') }, icon('copy'), 'Copy'),
          h('button', { type: 'button', class: 'btn ghost', onclick: replaceLink }, icon('refresh'), 'Replace'),
        ],
      }),
    );
  }

  async function replaceLink() {
    const ok = await confirmDialog({
      title: 'Replace your private link?',
      message: 'The current private link will stop working right away, for everyone who has it. You’ll get a new one here. The guest link doesn’t change.',
      confirm: 'Replace private link',
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
      announce('Private link replaced. The old one no longer works. Copy and save the new one.');
    } catch (err) {
      announce(err.message, { tone: 'error' });
    }
  }

  async function setPassword() {
    const pw = passwordField({ id: 'op-new', label: 'New password', autocomplete: 'new-password', hint: 'At least 8 characters. It never leaves this browser: only a scrambled key derived from it is sent.' });
    const again = passwordField({ id: 'op-again', label: 'Type it again', autocomplete: 'new-password' });
    const key = await formDialog({
      title: poll.hasOrganizerPassword ? 'Change the organizer password' : 'Set an organizer password',
      intro: h('p', { class: 'dialog-text' }, 'With a password, you can manage this poll from any device: open the guest link and choose “Manage with your password”. Your private link keeps working.'),
      fields: [pw.el, again.el],
      submitLabel: 'Save password',
    }, async () => {
      const problem = passwordProblem(pw.input.value);
      if (problem) throw new Error(problem);
      if (pw.input.value !== again.input.value) throw new Error('The two passwords don’t match.');
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
    announce('Organizer password saved');
  }

  async function removePassword() {
    const ok = await confirmDialog({
      title: 'Remove the organizer password?',
      message: 'You’ll need the private link to manage this poll from other devices.',
      confirm: 'Remove password',
    });
    if (!ok) return;
    await patch({ organizerPassword: null }, 'Organizer password removed', '[data-action="password"]');
  }

  async function chooseFinal(startSlot, minutes) {
    const weekly = poll.kind === 'weekly';
    const layout = layoutSlots(poll.slots, viewZone);
    const startSel = h('select', { id: 'fin-start', class: 'input' },
      layout.columns.map((dk) => h('optgroup', { label: f.dayName(dk, weekly, 'long') },
        layout.cells.filter((c) => c.dateKey === dk).sort((a, b) => a.slot - b.slot)
          .map((c) => h('option', { value: String(c.slot), selected: c.slot === startSlot }, `${f.time(c.slot, viewZone)}, ${f.dayName(dk, weekly)}`)))));
    const lengths = LENGTHS.filter(([m]) => m > 0);
    if (minutes && !lengths.some(([m]) => m === minutes)) lengths.push([minutes, f.duration(minutes)]);
    lengths.sort((a, b) => a[0] - b[0]);
    const lenSel = h('select', { id: 'fin-len', class: 'input' },
      lengths.map(([m, label]) => h('option', { value: String(m), selected: m === (minutes || 60) }, label)));
    const preview = h('p', { class: 'final-preview', 'aria-live': 'polite' });
    const update = () => {
      const s = Number(startSel.value);
      const e = s + Number(lenSel.value) * 60000;
      preview.textContent = `${weekly ? 'Every ' : ''}${f.slotRange(s, e, viewZone, weekly)} (${f.zoneLabel(viewZone, s)})`;
    };
    startSel.addEventListener('change', update);
    lenSel.addEventListener('change', update);
    update();
    const result = await openDialog({
      title: 'Choose the final time',
      body: h('div', { class: 'dialog-body' },
        h('div', { class: 'field' }, h('label', { for: 'fin-start' }, 'Starts'), startSel),
        h('div', { class: 'field' }, h('label', { for: 'fin-len' }, 'Lasts'), lenSel),
        preview,
        h('p', { class: 'muted small' }, 'Setting a final time closes the poll. Guests will see the time and can download a calendar invite.')),
      actions: [
        { label: 'Cancel', value: 'cancel' },
        { label: 'Set final time', value: 'ok', kind: 'primary', submit: true },
      ],
    });
    if (result !== 'ok') return;
    const start = Number(startSel.value);
    const ok = await patch({ final: { start, end: start + Number(lenSel.value) * 60000 } }, 'Final time set. Guests can see it now.', '.final-card');
    if (ok) main.querySelector('.final-card')?.scrollIntoView({ block: 'start' });
  }

  function editPanel() {
    const form = createPollForm({
      initial: poll,
      editing: true,
      submitLabel: 'Save changes',
      onSubmit: async (value) => {
        watcher.bump();
        ({ poll } = await api('PATCH', `/api/polls/${pollId}`, { token, body: value }));
        storage.saveManaged(pollId, { token, title: poll.title });
        editing = false;
        render();
        main.querySelector('[data-action="edit"]')?.focus();
        announce('Saved your changes');
      },
    });
    const panel = h('section', { class: 'panel edit-panel', 'aria-labelledby': 'edit-title' },
      h('div', { class: 'edit-head' },
        h('h2', { id: 'edit-title', class: 'section-title' }, 'Edit poll'),
        h('button', { type: 'button', class: 'btn ghost', onclick: () => { editing = false; render(); main.querySelector('[data-action="edit"]')?.focus(); } }, 'Cancel')),
      poll.responseCount
        ? h('p', { class: 'notice small' }, 'People have already responded. If you add times, they’ll show as “hasn’t seen this time” for those people until they answer again. Times you remove are dropped from the results.')
        : null,
      form.el);
    queueMicrotask(() => form.focus());
    return panel;
  }

  // Shown only when this copy of Overlap can send email.
  function emailRow() {
    const row = h('div', { class: 'settings-row email-row', hidden: true },
      h('div', null,
        h('p', { class: 'setting-name' }, 'Email'),
        emailControl({ poll, role: 'organizer', token, linkKey: viaPassword() ? null : token })));
    serverConfig().then((cfg) => { row.hidden = !cfg.emails; });
    return row;
  }

  function settingsSection() {
    const expires = poll.expiresAt ? new Date(poll.expiresAt) : null;
    const isOpen = poll.status === 'open';
    return h('section', { class: 'settings panel', 'aria-labelledby': 'settings-title' },
      h('h2', { id: 'settings-title', class: 'section-title' }, 'Manage poll'),
      h('div', { class: 'settings-row' },
        h('div', null,
          h('p', { class: 'setting-name' }, 'Details and times'),
          h('p', { class: 'muted small' }, 'Change the name, dates, times, meeting length or who can see responses.')),
        h('button', { type: 'button', class: 'btn secondary', dataset: { action: 'edit' }, onclick: () => { editing = true; render(); } }, icon('edit'), 'Edit poll')),
      h('div', { class: 'settings-row' },
        h('div', null,
          h('p', { class: 'setting-name' }, isOpen ? 'Stop taking responses' : 'Take responses again'),
          h('p', { class: 'muted small' }, isOpen
            ? 'Guests can still see the poll but can’t add or change answers.'
            : poll.final ? 'Reopening clears the final time.' : 'Guests will be able to answer and edit again.')),
        isOpen
          ? h('button', { type: 'button', class: 'btn secondary', onclick: () => patch({ status: 'closed' }, 'Poll closed') }, 'Close poll')
          : h('button', { type: 'button', class: 'btn secondary', onclick: () => patch({ status: 'open' }, 'Poll reopened') }, 'Reopen poll')),
      h('div', { class: 'settings-row' },
        h('div', null,
          h('p', { class: 'setting-name' }, 'Organizer password', poll.hasOrganizerPassword ? h('span', { class: 'chip on' }, 'On') : null),
          h('p', { class: 'muted small' }, poll.hasOrganizerPassword
            ? 'On any device, open the guest link and choose “Manage with your password”.'
            : 'Optional. Manage this poll from any device with a password instead of keeping the private link.')),
        h('div', { class: 'row-actions' },
          poll.hasOrganizerPassword && !viaPassword()
            ? h('button', { type: 'button', class: 'btn ghost', onclick: removePassword }, 'Remove') : null,
          h('button', { type: 'button', class: 'btn secondary', dataset: { action: 'password' }, onclick: setPassword }, icon('lock'), poll.hasOrganizerPassword ? 'Change password' : 'Set password'))),
      emailRow(),
      h('div', { class: 'settings-row' },
        h('div', null,
          h('p', { class: 'setting-name' }, 'Duplicate'),
          h('p', { class: 'muted small' }, 'Start a new poll with the same settings, for the next meeting. Responses aren’t copied.')),
        h('button', {
          type: 'button', class: 'btn secondary',
          onclick: () => {
            const keys = ['kind', 'weekdays', 'title', 'description', 'location', 'dates', 'startMinute', 'endMinute', 'slotMinutes', 'durationMinutes', 'timezone', 'resultsVisibility'];
            storage.setCopySource(Object.fromEntries(keys.map((k) => [k, poll[k]])));
            location.assign('/');
          },
        }, 'Duplicate poll')),
      h('div', { class: 'settings-row' },
        h('div', null,
          h('p', { class: 'setting-name' }, 'Data'),
          h('p', { class: 'muted small' }, expires
            ? `This poll and every response will be deleted automatically on ${expires.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}. `
            : 'This poll and its responses stay until you delete them. ',
            h('a', { href: '/privacy' }, 'How Overlap handles data'))),
        h('button', { type: 'button', class: 'btn danger', onclick: deletePoll }, icon('trash'), 'Delete poll now')),
    );
  }

  async function deletePoll() {
    const ok = await confirmDialog({
      title: 'Delete this poll?',
      message: `“${poll.title}” and all ${f.plural(poll.responseCount, 'response')} will be erased right away. This can’t be undone, and both links will stop working.`,
      confirm: 'Delete poll',
      danger: true,
    });
    if (!ok) return;
    try {
      await api('DELETE', `/api/polls/${pollId}`, { token });
      storage.forgetManaged(pollId);
      clear(main).append(h('div', { class: 'page narrow message-page' },
        h('h1', { class: 'page-title', tabindex: '-1' }, 'Poll deleted'),
        h('p', { class: 'lede' }, 'The poll and all of its responses have been erased.'),
        h('p', null, h('a', { class: 'btn primary', href: '/' }, 'Create a new poll'))));
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
      announce('Results updated');
    },
  });

  render();
  if (passwordFailed) announce('Your poll is ready, but the organizer password wasn’t saved. Set it under Manage poll.', { tone: 'error' });
}
