// The page's language: the one chosen in the footer (remembered in this
// browser), else the best match for the browser's languages, else English.
//
//   t('key', { name: 'Ana', count: 3 })   plain text
//   tx('key', { link: h('a', …) })        an array of text and nodes, for rich text
//   locale()                              the language code, for Intl formatting

import { isLanguage, languageDir, matchLanguage } from '/shared/i18n/languages.js';
import { lookup, parts, formatNumber } from '/shared/i18n/core.js';

const PREF = 'overlap.lang';
let lang = 'en';
let catalog = {};
let english = {};

function saved() {
  try { return localStorage.getItem(PREF); } catch { return null; }
}

/** Load the language before anything renders. */
export async function initI18n() {
  const chosen = saved();
  const browser = navigator.languages?.length ? navigator.languages : [navigator.language];
  lang = isLanguage(chosen) ? chosen : matchLanguage(browser);
  english = (await import('/shared/i18n/en.js')).default;
  catalog = english;
  if (lang !== 'en') {
    try {
      catalog = (await import(`/shared/i18n/${lang}.js`)).default;
    } catch {
      lang = 'en'; // a missing file must never break the page
    }
  }
  document.documentElement.lang = lang;
  document.documentElement.dir = languageDir(lang);
}

export const locale = () => lang;

export function t(key, vars = {}) {
  return parts(lookup(catalog, english, lang, key, vars), vars, (n) => formatNumber(lang, n)).join('');
}

export function tx(key, vars = {}) {
  return parts(lookup(catalog, english, lang, key, vars), vars, (n) => formatNumber(lang, n));
}

/** Switch language and remember it in this browser; the page reloads in the new language. */
export function setLanguage(code) {
  if (!isLanguage(code)) return;
  try { localStorage.setItem(PREF, code); } catch { /* still switch for this visit */ }
  location.reload();
}

/** The language chosen in this browser, if any (else the page follows the browser). */
export const chosenLanguage = () => (isLanguage(saved()) ? saved() : null);
