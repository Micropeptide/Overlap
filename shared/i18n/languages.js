// The languages Overlap speaks, and how to pick one from a browser's list.
// Used by the browser (to choose and switch) and the server (for emails).

export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'pl', name: 'Polski' },
  { code: 'ru', name: 'Русский' },
  { code: 'uk', name: 'Українська' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'ar', name: 'العربية', dir: 'rtl' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'zh-Hans', name: '简体中文' },
  { code: 'zh-Hant', name: '繁體中文' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'id', name: 'Bahasa Indonesia' },
  { code: 'th', name: 'ไทย' },
];

export const DEFAULT_LANGUAGE = 'en';
const CODES = new Set(LANGUAGES.map((l) => l.code));

export const isLanguage = (code) => typeof code === 'string' && CODES.has(code);
export const languageDir = (code) => LANGUAGES.find((l) => l.code === code)?.dir || 'ltr';

/** Chinese is chosen by script: Traditional for Taiwan, Hong Kong and Macau, Simplified otherwise. */
function chineseFor(tag) {
  const t = tag.toLowerCase();
  if (/-hant\b/.test(t) || /-(tw|hk|mo)\b/.test(t)) return 'zh-Hant';
  return 'zh-Hans';
}

/**
 * The best supported language for a list of BCP 47 tags in preference order
 * (navigator.languages, or an Accept-Language header's tags), else English.
 */
export function matchLanguage(tags = []) {
  for (const raw of tags) {
    if (typeof raw !== 'string' || !raw) continue;
    const tag = raw.trim();
    const base = tag.split('-')[0].toLowerCase();
    if (base === 'zh') return chineseFor(tag);
    if (CODES.has(tag)) return tag;
    if (CODES.has(base)) return base;
    if (base === 'nb' || base === 'nn' || base === 'no') continue; // not supported yet: try the next
  }
  return DEFAULT_LANGUAGE;
}
