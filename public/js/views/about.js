import { h, clear } from '../lib/dom.js';

const GITHUB = 'https://github.com/Micropeptide';
const SOURCE = 'https://github.com/Micropeptide/Overlap';
const MORE = 'https://software.runtian.uk';

export function renderAbout(main) {
  document.title = 'About · Overlap';
  const section = (title, ...body) => h('section', { class: 'prose-section' }, h('h2', null, title), ...body);
  const ext = (href, text) => h('a', { href, target: '_blank', rel: 'noopener' }, text);

  clear(main).append(h('article', { class: 'page narrow prose about' },
    h('h1', { class: 'page-title' }, 'About Overlap'),
    h('p', { class: 'lede' }, 'A free, quiet way to find a time that works for a group. The organizer picks some dates, shares one link, and everyone marks when they’re free.'),

    section('How it works',
      h('ul', null,
        h('li', null, 'Nobody signs up, signs in, connects a calendar or gives an email address, not even the organizer.'),
        h('li', null, 'Each poll has a guest link to share and a private link for the organizer. Guests get their own private link to change their answer.'),
        h('li', null, 'Times are stored as exact moments and shown in each person’s own time zone, across daylight saving changes.'),
        h('li', null, 'No ads and no tracking. Polls stay until the organizer deletes them, and guests can delete their own answers. ', h('a', { href: '/privacy' }, 'How your data is handled'), '.'))),

    section('Who made it',
      h('div', { class: 'author' },
        h('img', { class: 'author-avatar', src: '/favicon.svg', alt: '', width: '56', height: '56' }),
        h('div', null,
          h('p', { class: 'author-name' }, 'Micropeptide'),
          h('p', null, 'Overlap is built and maintained by Micropeptide, who makes small, focused tools for research, productivity and the occasional oddly specific problem.'),
          h('p', { class: 'author-links' },
            ext(GITHUB, 'Micropeptide on GitHub'),
            ext(MORE, 'More software by Micropeptide'))))),

    section('Open source',
      h('p', null, 'Overlap’s code is public at ', ext(SOURCE, 'github.com/Micropeptide/Overlap'),
        ' under the MIT License. Bug reports and ideas are welcome there.'),
      h('p', null, 'It was inspired by the open-source scheduler ', ext('https://github.com/schej-it/timeful.app', 'Timeful'),
        ' but shares no code with it. Typefaces: Bricolage Grotesque and Atkinson Hyperlegible Next, both under the SIL Open Font License.')),
  ));
}
