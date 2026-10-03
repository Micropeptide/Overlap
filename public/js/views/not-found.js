import { h, clear } from '../lib/dom.js';
import { t } from '../lib/i18n.js';

export function renderNotFound(main, {
  title = t('notFound.title'),
  message = t('notFound.message'),
} = {}) {
  document.title = `${title} · Overlap`;
  clear(main).append(h('div', { class: 'page narrow message-page' },
    h('h1', { class: 'page-title' }, title),
    h('p', { class: 'lede' }, message),
    h('p', null, h('a', { class: 'btn primary', href: '/' }, t('notFound.create'))),
  ));
}
