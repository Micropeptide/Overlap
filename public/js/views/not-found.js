import { h, clear } from '../lib/dom.js';

export function renderNotFound(main, {
  title = 'We couldn’t find that page',
  message = 'The link may be mistyped, or the poll may have been deleted or expired.',
} = {}) {
  document.title = `${title} · Overlap`;
  clear(main).append(h('div', { class: 'page narrow message-page' },
    h('h1', { class: 'page-title' }, title),
    h('p', { class: 'lede' }, message),
    h('p', null, h('a', { class: 'btn primary', href: '/' }, 'Create a new poll')),
  ));
}
