// Picks the view for the current URL. Navigation between views uses normal
// page loads, so the back button and bookmarks behave as expected.

import { api } from './lib/api.js';
import { h, icon } from './lib/dom.js';
import { initI18n, t, tx, locale, setLanguage } from './lib/i18n.js';
import { LANGUAGES } from '/shared/i18n/languages.js';
import { renderHome } from './views/home.js';
import { renderGuest } from './views/guest.js';
import { renderManage } from './views/manage.js';
import { renderPrivacy } from './views/privacy.js';
import { renderAbout } from './views/about.js';
import { renderNotFound } from './views/not-found.js';
import { renderEmail } from './views/email.js';

const routes = [
  [/^\/$/, renderHome],
  [/^\/p\/([a-z0-9]+)\/?$/, renderGuest],
  [/^\/m\/([a-z0-9]+)\/?$/, renderManage],
  [/^\/privacy\/?$/, renderPrivacy],
  [/^\/about\/?$/, renderAbout],
  [/^\/e\/(confirm|unsubscribe)\/?$/, renderEmail],
];

const main = document.getElementById('main');

// Language first: every view below reads its text from the chosen language.
await initI18n();
translateShell();

/** The parts of index.html that every page shares: header, footer, language picker. */
function translateShell() {
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of document.querySelectorAll('[data-i18n-label]')) el.setAttribute('aria-label', t(el.dataset.i18nLabel));
  const footer = document.getElementById('footer-text');
  if (footer) {
    footer.replaceChildren(...tx('shell.footer', {
      retention: h('span', { id: 'retention-note' }, t('shell.retentionKept')),
      privacyLink: h('a', { href: '/privacy' }, t('shell.privacyLink')),
      aboutLink: h('a', { href: '/about' }, t('shell.aboutLink')),
    }));
  }
  const picker = document.getElementById('language-picker');
  if (picker) {
    const select = h('select', { id: 'language-select', class: 'input language-select', onchange: (e) => setLanguage(e.target.value) },
      LANGUAGES.map(({ code, name }) => h('option', { value: code, lang: code, selected: code === locale() }, name)));
    picker.replaceChildren(icon('globe'), h('label', { for: 'language-select', class: 'visually-hidden' }, t('shell.language')), select);
  }
}

// The footer states what the server is actually configured to do with old polls.
api('GET', '/api/config').then(({ retentionDays }) => {
  const note = document.getElementById('retention-note');
  if (note && retentionDays) note.textContent = t('shell.retentionAuto', { count: retentionDays });
}).catch(() => {});

const path = location.pathname;
const match = routes.find(([re]) => re.test(path));

(async () => {
  try {
    if (match) await match[1](main, ...match[0].exec(path).slice(1));
    else renderNotFound(main);
  } catch (err) {
    console.error(err);
    renderNotFound(main, { title: t('shell.errorTitle'), message: err.message || t('shell.errorReload') });
  }
  main.setAttribute('aria-busy', 'false');
})();
