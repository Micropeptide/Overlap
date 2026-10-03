import { h, clear } from '../lib/dom.js';
import { api } from '../lib/api.js';
import { storage } from '../lib/storage.js';
import { createPollForm } from '../components/poll-form.js';
import * as f from '../lib/format.js';
import { passwordKey } from '/shared/password.js';
import { t } from '../lib/i18n.js';

// Three people's free time drawn as translucent bands; where all three stack
// up is the overlap. Purely illustrative.
function overlapIllustration() {
  const wrap = document.createElement('figure');
  wrap.className = 'hero-art';
  wrap.setAttribute('aria-hidden', 'true');
  wrap.innerHTML = `
    <svg viewBox="0 0 320 200" class="bands">
      <g class="band-lines">
        <line x1="0" x2="320" y1="40" y2="40"/><line x1="0" x2="320" y1="80" y2="80"/>
        <line x1="0" x2="320" y1="120" y2="120"/><line x1="0" x2="320" y1="160" y2="160"/>
      </g>
      <rect class="band b1" x="24" y="22" width="190" height="44" rx="22"/>
      <rect class="band b2" x="96" y="78" width="200" height="44" rx="22"/>
      <rect class="band b3" x="60" y="134" width="196" height="44" rx="22"/>
      <rect class="overlap-col" x="120" y="12" width="76" height="176" rx="12"/>
      <text class="band-name" x="40" y="49">Ana</text>
      <text class="band-name" x="244" y="105">Ben</text>
      <text class="band-name" x="76" y="161">Cy</text>
    </svg>
    <figcaption></figcaption>`;
  wrap.querySelector('figcaption').textContent = t('home.illustrationCaption');
  return wrap;
}

export async function renderHome(main) {
  document.title = t('home.pageTitle');
  clear(main);

  // Start from a duplicated poll, or from the settings used last time.
  const source = storage.takeCopySource();
  const prefs = storage.formPrefs();
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: f.deviceTimeZone() }).format(new Date());
  const initial = source
    ? {
      ...source,
      dates: source.kind === 'weekly' ? source.dates : (source.dates || []).filter((d) => d >= today),
      closesOn: null,
    }
    : prefs;
  const form = createPollForm({
    initial,
    submitLabel: t('home.submit'),
    onSubmit: async (value, { password }) => {
      const { poll, adminToken } = await api('POST', '/api/polls', { body: value });
      // The password's key is salted with the poll id, so it is set once the poll exists.
      let passwordSaved = true;
      if (password) {
        try {
          const organizerPassword = await passwordKey(password, poll.id, 'organizer');
          await api('PATCH', `/api/polls/${poll.id}`, { token: adminToken, body: { organizerPassword } });
        } catch {
          passwordSaved = false;
        }
      }
      storage.setFormPrefs({
        startMinute: value.startMinute, endMinute: value.endMinute, slotMinutes: value.slotMinutes,
        durationMinutes: value.durationMinutes, resultsVisibility: value.resultsVisibility,
      });
      storage.saveManaged(poll.id, { token: adminToken, title: poll.title });
      location.assign(`/m/${poll.id}#k=${encodeURIComponent(adminToken)}&new=1${passwordSaved ? '' : '&pw=0'}`);
    },
  });

  // Polls this browser knows about: ones you organize and ones you answered.
  const byRecent = (a, b) => (b[1].savedAt || 0) - (a[1].savedAt || 0);
  const managed = Object.entries(storage.managed()).sort(byRecent).slice(0, 12);
  const answered = Object.entries(storage.answered()).filter(([id]) => !storage.getManaged(id)).sort(byRecent).slice(0, 12);
  const STATUS = { open: t('home.statusOpen'), closed: t('home.statusClosed'), finalized: t('home.statusFinalized') };
  const pollItem = (id, entry, kind) => {
    const status = h('span', { class: 'saved-status' }, '…');
    const href = kind === 'managed' ? `/m/${id}#k=${encodeURIComponent(entry.token)}` : `/p/${id}`;
    const li = h('li', { class: 'saved-item' },
      h('a', { class: 'saved-title', href }, entry.title || t('home.untitled')),
      kind === 'answered' && entry.name ? h('span', { class: 'saved-meta' }, t('home.answeredAs', { name: entry.name })) : null,
      status,
      h('button', {
        type: 'button', class: 'link-btn muted saved-forget',
        'aria-label': entry.title ? t('home.forgetLabel', { title: entry.title }) : t('home.forgetUntitledLabel'),
        onclick: () => { (kind === 'managed' ? storage.forgetManaged : storage.forgetAnswer).call(storage, id); li.remove(); },
      }, t('home.forget')));
    api('GET', `/api/polls/${id}`).then(({ poll }) => {
      status.textContent = STATUS[poll.status] || '';
      status.dataset.status = poll.status;
      li.querySelector('.saved-title').textContent = poll.title;
    }).catch(() => { status.textContent = t('home.statusDeleted'); status.dataset.status = 'gone'; });
    return li;
  };
  const list = (title, items, kind) => items.length ? h('div', { class: 'saved-group' },
    h('h3', { class: 'saved-heading' }, title),
    h('ul', { class: 'saved-list', role: 'list' }, items.map(([id, entry]) => pollItem(id, entry, kind)))) : null;
  const savedList = managed.length || answered.length ? h('section', { class: 'saved', 'aria-labelledby': 'saved-title' },
    h('h2', { id: 'saved-title', class: 'section-title small' }, t('home.savedTitle')),
    list(t('home.organizing'), managed, 'managed'),
    list(t('home.answered'), answered, 'answered'),
    h('p', { class: 'muted small' }, t('home.savedNote')),
  ) : null;

  main.append(h('div', { class: 'page home' },
    h('section', { class: 'hero' },
      h('div', { class: 'hero-text' },
        h('h1', { class: 'hero-title' }, t('home.headline')),
        h('p', { class: 'lede' }, t('home.lede')),
      ),
      overlapIllustration(),
    ),
    h('section', { class: 'create', 'aria-labelledby': 'create-title' },
      h('h2', { id: 'create-title', class: 'visually-hidden' }, t('home.createTitle')),
      source ? h('p', { class: 'notice small copied' }, source.kind === 'weekly' ? t('home.copiedWeekly', { title: source.title }) : t('home.copiedDates', { title: source.title })) : null,
      form.el,
    ),
    savedList,
  ));
}
