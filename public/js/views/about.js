import { h, clear } from '../lib/dom.js';
import { t, tx } from '../lib/i18n.js';

const GITHUB = 'https://github.com/Micropeptide';
const SOURCE = 'https://github.com/Micropeptide/Overlap';
const MORE = 'https://software.runtian.uk';

export function renderAbout(main) {
  document.title = `${t('about.tabTitle')} · Overlap`;
  const section = (title, ...body) => h('section', { class: 'prose-section' }, h('h2', null, title), ...body);
  const ext = (href, text) => h('a', { href, target: '_blank', rel: 'noopener' }, text);

  clear(main).append(h('article', { class: 'page narrow prose about' },
    h('h1', { class: 'page-title' }, t('about.title')),
    h('p', { class: 'lede' }, t('about.lede')),

    section(t('about.howHeading'),
      h('ul', null,
        h('li', null, t('about.howNoAccounts')),
        h('li', null, t('about.howLinks')),
        h('li', null, t('about.howTimeZones')),
        h('li', null, ...tx('about.howPrivacy', { privacyLink: h('a', { href: '/privacy' }, t('about.privacyLink')) })))),

    section(t('about.whoHeading'),
      h('div', { class: 'author' },
        h('img', { class: 'author-avatar', src: '/favicon.svg', alt: '', width: '56', height: '56' }),
        h('div', null,
          h('p', { class: 'author-name' }, 'Micropeptide'),
          h('p', null, t('about.bio')),
          h('p', { class: 'author-links' },
            ext(GITHUB, t('about.githubLink')),
            ext(MORE, t('about.moreLink')))))),

    section(t('about.sourceHeading'),
      h('p', null, ...tx('about.sourceCode', { link: ext(SOURCE, 'github.com/Micropeptide/Overlap') })),
      h('p', null, ...tx('about.inspired', { timeful: ext('https://github.com/schej-it/timeful.app', 'Timeful') }))),
  ));
}
