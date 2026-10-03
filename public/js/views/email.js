// The pages email links open: /e/confirm#t=… and /e/unsubscribe#t=…. The key
// sits after "#", so it reaches the server only when this page sends it, which
// also means link-checking robots in mail systems can't confirm or unsubscribe.

import { h, clear } from '../lib/dom.js';
import { api } from '../lib/api.js';
import { hashParams } from '../lib/storage.js';
import { t } from '../lib/i18n.js';

export async function renderEmail(main, action) {
  const token = hashParams().get('t');
  history.replaceState(null, '', location.pathname);
  const page = (title, ...body) => clear(main).append(h('article', { class: 'page narrow prose email-page' },
    h('h1', { class: 'page-title', tabindex: '-1' }, title), ...body));
  const pollLink = (poll) => poll ? h('p', null, h('a', { class: 'btn primary', href: `/p/${poll.id}` }, t('emailPage.openPoll', { title: poll.title }))) : null;

  if (!token) return page(t('emailPage.incompleteTitle'), h('p', null, t('emailPage.incompleteBody')));

  if (action === 'confirm') {
    document.title = `${t('emailPage.confirmTabTitle')} · Overlap`;
    try {
      const { poll, role } = await api('POST', '/api/email/confirm', { body: { token } });
      const title = poll?.title;
      const lede = role === 'organizer'
        ? (title ? t('emailPage.onOrganizer', { title }) : t('emailPage.onOrganizerUntitled'))
        : (title ? t('emailPage.onGuest', { title }) : t('emailPage.onGuestUntitled'));
      page(t('emailPage.onTitle'),
        h('p', { class: 'lede' }, lede),
        h('p', null, t('emailPage.stopNote')),
        role === 'organizer' ? null : pollLink(poll));
    } catch (err) {
      page(t('emailPage.failedTitle'), h('p', null, err.message));
    }
  } else {
    document.title = `${t('emailPage.stopTabTitle')} · Overlap`;
    try {
      const { found, poll } = await api('POST', '/api/email/unsubscribe', { body: { token } });
      if (!found) {
        return page(t('emailPage.alreadyTitle'),
          h('p', { class: 'lede' }, t('emailPage.alreadyBody')));
      }
      page(t('emailPage.stoppedTitle'),
        h('p', { class: 'lede' }, poll ? t('emailPage.stoppedPoll', { title: poll.title }) : t('emailPage.stoppedNoPoll')),
        h('p', null, t('emailPage.reenable')));
    } catch (err) {
      page(t('emailPage.failedTitle'), h('p', null, err.message));
    }
  }
  main.querySelector('h1')?.focus();
}
