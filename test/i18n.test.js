import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchLanguage, isLanguage, languageDir, LANGUAGES } from '../shared/i18n/languages.js';
import { lookup, translate, parts } from '../shared/i18n/core.js';
import { check } from '../scripts/i18n.mjs';

test('the browser’s languages pick the best supported one', () => {
  assert.equal(matchLanguage(['fr-CA', 'en']), 'fr');
  assert.equal(matchLanguage(['pt-BR']), 'pt');
  assert.equal(matchLanguage(['zh-TW']), 'zh-Hant');
  assert.equal(matchLanguage(['zh-HK']), 'zh-Hant');
  assert.equal(matchLanguage(['zh-Hant-TW']), 'zh-Hant');
  assert.equal(matchLanguage(['zh-CN']), 'zh-Hans');
  assert.equal(matchLanguage(['zh']), 'zh-Hans');
  assert.equal(matchLanguage(['nb-NO', 'de-AT']), 'de'); // unsupported first choice: next one
  assert.equal(matchLanguage(['xx']), 'en');
  assert.equal(matchLanguage([]), 'en');
  assert.ok(isLanguage('ja') && !isLanguage('jp'));
  assert.equal(languageDir('ar'), 'rtl');
  assert.equal(languageDir('en'), 'ltr');
  assert.equal(LANGUAGES.length, 20);
});

test('messages fill placeholders and choose plural forms by language rules', () => {
  const en = { 'x.times': { one: '{count} time', other: '{count} times' }, 'x.hi': 'Hi, {name}' };
  const ru = { 'x.times': { one: '{count} раз', few: '{count} раза', many: '{count} раз', other: '{count} раза' } };
  assert.equal(translate(en, en, 'en', 'x.times', { count: 1 }), '1 time');
  assert.equal(translate(en, en, 'en', 'x.times', { count: 1200 }), '1,200 times');
  assert.equal(translate(ru, en, 'ru', 'x.times', { count: 3 }), '3 раза');
  assert.equal(translate(ru, en, 'ru', 'x.times', { count: 5 }), '5 раз');
  // Missing in the language: English; missing everywhere: the key.
  assert.equal(translate(ru, en, 'ru', 'x.hi', { name: 'Ana' }), 'Hi, Ana');
  assert.equal(translate(ru, en, 'ru', 'x.nope'), 'x.nope');
  assert.equal(lookup(en, en, 'en', 'x.hi'), 'Hi, {name}');
  // Rich text keeps nodes (here, an object standing in for a DOM node).
  const node = { tag: 'a' };
  assert.deepEqual(parts('Read {link}.', { link: node }), ['Read ', node, '.']);
});

test('every language has every message, with matching placeholders and plural forms', async () => {
  const problems = await check();
  assert.deepEqual(problems, [], problems.slice(0, 20).join('\n'));
});
