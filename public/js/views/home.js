import { h, clear } from '../lib/dom.js';
import { api } from '../lib/api.js';
import { storage } from '../lib/storage.js';
import { createPollForm } from '../components/poll-form.js';
import * as f from '../lib/format.js';

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
    <figcaption>Everyone’s free here</figcaption>`;
  return wrap;
}

export async function renderHome(main) {
  document.title = 'Overlap: find a time that works for everyone';
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
    submitLabel: 'Create poll',
    onSubmit: async (value) => {
      const { poll, adminToken } = await api('POST', '/api/polls', { body: value });
      storage.setFormPrefs({
        startMinute: value.startMinute, endMinute: value.endMinute, slotMinutes: value.slotMinutes,
        durationMinutes: value.durationMinutes, resultsVisibility: value.resultsVisibility,
      });
      storage.saveManaged(poll.id, { token: adminToken, title: poll.title });
      location.assign(`/m/${poll.id}#k=${encodeURIComponent(adminToken)}&new=1`);
    },
  });

  const saved = Object.entries(storage.managed()).sort((a, b) => (b[1].savedAt || 0) - (a[1].savedAt || 0));
  const savedList = saved.length ? h('section', { class: 'saved', 'aria-labelledby': 'saved-title' },
    h('h2', { id: 'saved-title', class: 'section-title small' }, 'Polls you manage on this device'),
    h('ul', { class: 'saved-list', role: 'list' }, saved.slice(0, 12).map(([id, entry]) => {
      const li = h('li', null,
        h('a', { href: `/m/${id}#k=${encodeURIComponent(entry.token)}` }, entry.title || 'Untitled poll'),
        h('button', {
          type: 'button',
          class: 'link-btn muted',
          'aria-label': `Forget ${entry.title || 'this poll'} on this device`,
          onclick: () => { storage.forgetManaged(id); li.remove(); },
        }, 'Forget'));
      return li;
    })),
    h('p', { class: 'muted small' }, 'Forgetting only removes the link from this browser. The poll itself stays until you delete it or it expires.'),
  ) : null;

  main.append(h('div', { class: 'page home' },
    h('section', { class: 'hero' },
      h('div', { class: 'hero-text' },
        h('h1', { class: 'hero-title' }, 'Pick some dates. Share one link. See where everyone overlaps.'),
        h('p', { class: 'lede' }, 'Free group scheduling. Nobody needs an account, an email address or a calendar connection, including you.'),
      ),
      overlapIllustration(),
    ),
    h('section', { class: 'create', 'aria-labelledby': 'create-title' },
      h('h2', { id: 'create-title', class: 'visually-hidden' }, 'Create a poll'),
      source ? h('p', { class: 'notice small copied' }, `Copied the settings from “${source.title}”. ${source.kind === 'weekly' ? 'Check the days and create it.' : 'Pick the dates and create it.'}`) : null,
      form.el,
    ),
    savedList,
  ));
}
