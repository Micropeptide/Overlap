// Picks the view for the current URL. Navigation between views uses normal
// page loads, so the back button and bookmarks behave as expected.

import { api } from './lib/api.js';
import { renderHome } from './views/home.js';
import { renderGuest } from './views/guest.js';
import { renderManage } from './views/manage.js';
import { renderPrivacy } from './views/privacy.js';
import { renderAbout } from './views/about.js';
import { renderNotFound } from './views/not-found.js';

const routes = [
  [/^\/$/, renderHome],
  [/^\/p\/([a-z0-9]+)\/?$/, renderGuest],
  [/^\/m\/([a-z0-9]+)\/?$/, renderManage],
  [/^\/privacy\/?$/, renderPrivacy],
  [/^\/about\/?$/, renderAbout],
];

const main = document.getElementById('main');

// The footer states what the server is actually configured to do with old polls.
api('GET', '/api/config').then(({ retentionDays }) => {
  const note = document.getElementById('retention-note');
  if (note && retentionDays) note.textContent = `Polls are deleted automatically ${retentionDays} days after their last date (weekly polls, after their last change).`;
}).catch(() => {});

const path = location.pathname;
const match = routes.find(([re]) => re.test(path));

(async () => {
  try {
    if (match) await match[1](main, ...match[0].exec(path).slice(1));
    else renderNotFound(main);
  } catch (err) {
    console.error(err);
    renderNotFound(main, { title: 'Something went wrong', message: err.message || 'Reload the page to try again.' });
  }
  main.setAttribute('aria-busy', 'false');
})();
