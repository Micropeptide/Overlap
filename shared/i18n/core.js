// Message lookup shared by the browser and the server.
//
// A catalog is a flat object: { 'namespace.key': message }. A message is a
// string with {placeholders}, or for counts an object of plural forms keyed
// by Intl.PluralRules categories, e.g. { one: '{count} time', other: '{count} times' }.
// Missing keys fall back to English, then to the key itself.

const pluralRules = new Map();
function pluralCategory(lang, n) {
  if (!pluralRules.has(lang)) pluralRules.set(lang, new Intl.PluralRules(lang));
  return pluralRules.get(lang).select(n);
}

/** Pick the message for `key` in `lang`, choosing a plural form from vars.count. */
export function lookup(catalog, fallback, lang, key, vars = {}) {
  let msg = catalog?.[key];
  let msgLang = lang;
  if (msg == null) { msg = fallback?.[key]; msgLang = 'en'; }
  if (msg == null) return key;
  if (typeof msg === 'object') {
    const n = Number(vars.count ?? 0);
    msg = msg[pluralCategory(msgLang, n)] ?? msg.other ?? Object.values(msg)[0];
  }
  return msg;
}

/**
 * Split a message into text and {placeholder} parts. Returns an array of
 * strings and the matching vars' values (which may be DOM nodes), so callers
 * can build rich text without HTML strings.
 */
export function parts(message, vars = {}, formatNumber = String) {
  const out = [];
  const re = /\{(\w+)\}/g;
  let last = 0;
  let m;
  while ((m = re.exec(message))) {
    if (m.index > last) out.push(message.slice(last, m.index));
    const value = vars[m[1]];
    if (value === undefined) out.push(m[0]);
    else out.push(typeof value === 'number' ? formatNumber(value) : value);
    last = re.lastIndex;
  }
  if (last < message.length) out.push(message.slice(last));
  return out;
}

const numberFormats = new Map();
export function formatNumber(lang, n) {
  if (!numberFormats.has(lang)) numberFormats.set(lang, new Intl.NumberFormat(lang));
  return numberFormats.get(lang).format(n);
}

/** A plain-text translation. */
export function translate(catalog, fallback, lang, key, vars = {}) {
  return parts(lookup(catalog, fallback, lang, key, vars), vars, (n) => formatNumber(lang, n)).join('');
}
