// "Email me": an organizer's or guest's optional email, for their private
// link and/or update emails. Shown only when the server can send email.

import { h, icon, announce, formDialog } from '../lib/dom.js';
import { api } from '../lib/api.js';
import { serverConfig } from '../lib/config.js';

/**
 * role: 'organizer' | 'guest'. `token` is whatever the page authenticates
 * with; `linkKey` is the private link's key when the page has one (a link
 * can't be emailed after signing in with a password).
 */
export function emailControl({ poll, role, responseId = null, token, linkKey = null, compact = false }) {
  const path = role === 'organizer' ? `/api/polls/${poll.id}/email` : `/api/polls/${poll.id}/responses/${responseId}/email`;
  const el = h('div', { class: `email-control${compact ? ' compact' : ''}`, hidden: true });
  let state = { email: null, confirmed: false };

  const updatesText = role === 'organizer'
    ? 'Email me when people respond or change their answers'
    : `Email me when the organizer picks a time or changes the poll${poll.resultsVisibility === 'everyone' ? ', or when people respond' : ''}`;

  function render() {
    el.replaceChildren();
    const status = !state.email
      ? (role === 'organizer' ? 'Get your private link by email, or an email when people respond.' : 'Get your edit link by email, or an email when the organizer picks a time.')
      : state.confirmed
        ? h('span', null, 'Updates go to ', h('strong', null, state.email), '.')
        : h('span', null, 'Waiting for you to confirm ', h('strong', null, state.email), '. Check your inbox.');
    el.append(
      h('p', { class: 'email-status muted small' }, icon('mail'), status),
      h('div', { class: 'email-actions' },
        h('button', { type: 'button', class: compact ? 'link-btn' : 'btn secondary', dataset: { action: 'email' }, onclick: open },
          compact ? null : icon('mail'), state.email ? 'Change' : 'Email me'),
        state.email ? h('button', { type: 'button', class: compact ? 'link-btn' : 'btn ghost', onclick: stop }, 'Stop emails') : null));
  }

  async function open() {
    const email = h('input', { id: 'em-address', class: 'input', type: 'email', autocomplete: 'email', inputmode: 'email', maxlength: '254', required: true, value: state.email || '' });
    const sendLink = h('input', { type: 'checkbox', checked: !!linkKey, disabled: !linkKey });
    const updates = h('input', { type: 'checkbox', checked: true });
    const result = await formDialog({
      title: 'Email me',
      intro: h('p', { class: 'dialog-text' }, 'Optional. Your address is used only for what you tick below. Nobody else sees it, and it’s deleted when you stop emails',
        role === 'guest' ? ', delete your response,' : '', ' or the poll is deleted.'),
      fields: [
        h('div', { class: 'field' }, h('label', { for: 'em-address', class: 'field-label' }, 'Email address'), email),
        h('label', { class: 'check' }, sendLink, h('span', null, linkKey
          ? `Send me my private ${role === 'organizer' ? 'link' : 'edit link'} now`
          : 'Send me my private link (not available after signing in with a password)')),
        h('label', { class: 'check' }, updates, h('span', null, `${updatesText}. At most one email every 30 minutes, and you confirm first.`)),
        h('p', { class: 'muted small' }, 'Emails are sent by Resend for Overlap. Each one has a link to stop them. ', h('a', { href: '/privacy', target: '_blank' }, 'Privacy')),
      ],
      submitLabel: 'Send',
    }, async () => {
      if (!email.value.trim()) throw new Error('Enter your email address.');
      if (!sendLink.checked && !updates.checked) throw new Error('Tick at least one: your link, or updates.');
      return api('PUT', path, { token, body: { email: email.value, updates: updates.checked, link: sendLink.checked ? linkKey : null } });
    });
    if (!result) return;
    if (updates.checked) state = { email: result.email, confirmed: result.confirmed };
    render();
    el.querySelector('[data-action="email"]')?.focus();
    announce(result.confirmed
      ? (sendLink.checked ? 'Sent. Updates are still on.' : 'Updates are on.')
      : updates.checked ? 'Sent. Open the email to confirm updates.' : 'Sent your link.');
  }

  async function stop() {
    try {
      await api('DELETE', path, { token });
      state = { email: null, confirmed: false };
      render();
      el.querySelector('[data-action="email"]')?.focus();
      announce('Emails stopped. Your address was deleted.');
    } catch (err) {
      announce(err.message, { tone: 'error' });
    }
  }

  serverConfig().then(async (cfg) => {
    if (!cfg.emails) return;
    try { state = await api('GET', path, { token }); } catch { /* show as off */ }
    render();
    el.hidden = false;
  });
  return el;
}
