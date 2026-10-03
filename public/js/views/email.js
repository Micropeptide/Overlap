// The pages email links open: /e/confirm#t=… and /e/unsubscribe#t=…. The key
// sits after "#", so it reaches the server only when this page sends it, which
// also means link-checking robots in mail systems can't confirm or unsubscribe.

import { h, clear } from '../lib/dom.js';
import { api } from '../lib/api.js';
import { hashParams } from '../lib/storage.js';

export async function renderEmail(main, action) {
  const token = hashParams().get('t');
  history.replaceState(null, '', location.pathname);
  const page = (title, ...body) => clear(main).append(h('article', { class: 'page narrow prose email-page' },
    h('h1', { class: 'page-title', tabindex: '-1' }, title), ...body));
  const pollLink = (poll) => poll ? h('p', null, h('a', { class: 'btn primary', href: `/p/${poll.id}` }, `Open “${poll.title}”`)) : null;

  if (!token) return page('This link is incomplete', h('p', null, 'Open the link straight from the email, or copy all of it into the address bar.'));

  if (action === 'confirm') {
    document.title = 'Confirm emails · Overlap';
    try {
      const { poll, role } = await api('POST', '/api/email/confirm', { body: { token } });
      page('Emails are on',
        h('p', { class: 'lede' }, role === 'organizer'
          ? `You’ll get an email when people respond to “${poll?.title || 'your poll'}” or change their answers, at most one every 30 minutes.`
          : `You’ll get an email when the organizer of “${poll?.title || 'the poll'}” picks a time or changes the poll, at most one every 30 minutes.`),
        h('p', null, 'Every email has a link to stop them, which also deletes your address.'),
        role === 'organizer' ? null : pollLink(poll));
    } catch (err) {
      page('This link didn’t work', h('p', null, err.message));
    }
  } else {
    document.title = 'Stop emails · Overlap';
    try {
      const { found, poll } = await api('POST', '/api/email/unsubscribe', { body: { token } });
      if (!found) {
        return page('Emails were already stopped',
          h('p', { class: 'lede' }, 'This link was already used, or emails for this poll were turned off another way. Either way, no address is kept for it.'));
      }
      page('No more emails',
        h('p', { class: 'lede' }, poll ? `You won’t get more emails about “${poll.title}”, and your address has been deleted.` : 'You won’t get more emails about this poll, and your address has been deleted.'),
        h('p', null, 'You can turn emails on again from the poll page at any time.'));
    } catch (err) {
      page('This link didn’t work', h('p', null, err.message));
    }
  }
  main.querySelector('h1')?.focus();
}
