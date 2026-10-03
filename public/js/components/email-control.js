// "Email me": an organizer's or guest's optional email, for their private
// link and/or update emails. Shown only when the server can send email.

import { h, icon, announce, formDialog } from '../lib/dom.js';
import { api } from '../lib/api.js';
import { serverConfig } from '../lib/config.js';
import { t, tx, locale } from '../lib/i18n.js';

/**
 * role: 'organizer' | 'guest'. `token` is whatever the page authenticates
 * with; `linkKey` is the private link's key when the page has one (a link
 * can't be emailed after signing in with a password).
 */
export function emailControl({ poll, role, responseId = null, token, linkKey = null, compact = false }) {
  const path = role === 'organizer' ? `/api/polls/${poll.id}/email` : `/api/polls/${poll.id}/responses/${responseId}/email`;
  const el = h('div', { class: `email-control${compact ? ' compact' : ''}`, hidden: true });
  let state = { email: null, confirmed: false };

  const updatesText = () => (role === 'organizer' ? t('emailCtl.updatesOrganizer')
    : poll.resultsVisibility === 'everyone' ? t('emailCtl.updatesGuestResults')
    : t('emailCtl.updatesGuest'));

  function render() {
    el.replaceChildren();
    const status = !state.email
      ? (role === 'organizer' ? t('emailCtl.offerOrganizer') : t('emailCtl.offerGuest'))
      : state.confirmed
        ? h('span', null, ...tx('emailCtl.confirmed', { email: h('strong', null, state.email) }))
        : h('span', null, ...tx('emailCtl.waiting', { email: h('strong', null, state.email) }));
    el.append(
      h('p', { class: 'email-status muted small' }, icon('mail'), status),
      h('div', { class: 'email-actions' },
        h('button', { type: 'button', class: compact ? 'link-btn' : 'btn secondary', dataset: { action: 'email' }, onclick: open },
          compact ? null : icon('mail'), state.email ? t('emailCtl.change') : t('emailCtl.emailMe')),
        state.email ? h('button', { type: 'button', class: compact ? 'link-btn' : 'btn ghost', onclick: stop }, t('emailCtl.stop')) : null));
  }

  async function open() {
    const email = h('input', { id: 'em-address', class: 'input', type: 'email', autocomplete: 'email', inputmode: 'email', maxlength: '254', required: true, value: state.email || '' });
    const sendLink = h('input', { type: 'checkbox', checked: !!linkKey, disabled: !linkKey });
    const updates = h('input', { type: 'checkbox', checked: true });
    const result = await formDialog({
      title: t('emailCtl.emailMe'),
      intro: h('p', { class: 'dialog-text' }, role === 'guest' ? t('emailCtl.introGuest') : t('emailCtl.introOrganizer')),
      fields: [
        h('div', { class: 'field' }, h('label', { for: 'em-address', class: 'field-label' }, t('emailCtl.address')), email),
        h('label', { class: 'check' }, sendLink, h('span', null, !linkKey ? t('emailCtl.sendLinkUnavailable')
          : role === 'organizer' ? t('emailCtl.sendLinkOrganizer')
          : t('emailCtl.sendLinkGuest'))),
        h('label', { class: 'check' }, updates, h('span', null, updatesText())),
        h('p', { class: 'muted small' }, ...tx('emailCtl.sender', { link: h('a', { href: '/privacy', target: '_blank' }, t('emailCtl.privacy')) })),
      ],
      submitLabel: t('emailCtl.send'),
    }, async () => {
      if (!email.value.trim()) throw new Error(t('emailCtl.addressMissing'));
      if (!sendLink.checked && !updates.checked) throw new Error(t('emailCtl.nothingTicked'));
      return api('PUT', path, { token, body: { email: email.value, updates: updates.checked, link: sendLink.checked ? linkKey : null, lang: locale() } });
    });
    if (!result) return;
    if (updates.checked) state = { email: result.email, confirmed: result.confirmed };
    render();
    el.querySelector('[data-action="email"]')?.focus();
    announce(result.confirmed
      ? (sendLink.checked ? t('emailCtl.sentUpdatesOn') : t('emailCtl.updatesOn'))
      : updates.checked ? t('emailCtl.sentConfirm') : t('emailCtl.sentLink'));
  }

  async function stop() {
    try {
      await api('DELETE', path, { token });
      state = { email: null, confirmed: false };
      render();
      el.querySelector('[data-action="email"]')?.focus();
      announce(t('emailCtl.stopped'));
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
