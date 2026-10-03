import { h, clear } from '../lib/dom.js';
import { api } from '../lib/api.js';
import { t, tx } from '../lib/i18n.js';

// Every statement here describes what the code actually does. If you change
// the server's behavior, update this page (shared/i18n/en/privacy.js) in the
// same commit.
export async function renderPrivacy(main) {
  document.title = `${t('privacy.tabTitle')} · Overlap`;
  let days = 0;
  let hosting = null;
  let restoreDays = 7;
  let emails = false;
  try { ({ retentionDays: days, hosting = null, restoreDays = 7, emails = false } = await api('GET', '/api/config')); } catch { /* keep defaults */ }
  const cloudflare = hosting === 'cloudflare';

  const section = (title, ...body) => h('section', { class: 'prose-section' }, h('h2', null, title), ...body);
  const list = (...items) => h('ul', null, items.filter(Boolean).map((i) => h('li', null, i)));

  const retention = {
    policy: days ? t('privacy.retentionAuto', { count: days }) : t('privacy.retentionKept'),
    anytime: t('privacy.deleteAnytime'),
    emails: t('privacy.emailDeletion'),
    afterDelete: cloudflare ? t('privacy.deletedCloudflare', { count: restoreDays }) : t('privacy.deletedOther'),
  };

  clear(main).append(h('article', { class: 'page narrow prose' },
    h('h1', { class: 'page-title' }, t('privacy.title')),
    h('p', { class: 'lede' }, days ? t('privacy.ledeRetention') : t('privacy.ledeKept')),

    section(t('privacy.storesHeading'),
      list(
        t('privacy.storesPoll'),
        t('privacy.storesResponse'),
        t('privacy.storesTimestamps'),
        t('privacy.storesLinkHash'),
        t('privacy.storesPasswordHash'),
        t('privacy.storesAttempts'),
        emails ? t('privacy.storesEmail') : null,
      )),

    section(t('privacy.notCollectedHeading'),
      list(
        emails ? t('privacy.noAccountsWithEmails') : t('privacy.noAccounts'),
        t('privacy.passwordsLocal'),
        t('privacy.noCalendar'),
        t('privacy.noTracking'),
        t('privacy.noIpLogs'),
        cloudflare ? t('privacy.hostingCloudflare') : t('privacy.hostingOther'),
        emails ? t('privacy.resend') : null,
        t('privacy.calendarLinks'),
      )),

    section(t('privacy.whoHeading'),
      list(
        t('privacy.guestLink'),
        t('privacy.privateLink'),
        t('privacy.guestEditLink'),
        t('privacy.passwordAccess'),
        t('privacy.hiddenResults'),
        emails ? t('privacy.emailPrivate') : null,
        t('privacy.browserStorage'),
      )),

    section(t('privacy.retentionHeading'),
      h('p', null, t(emails ? 'privacy.retentionParagraphEmails' : 'privacy.retentionParagraph', retention))),

    section(t('privacy.securityHeading'),
      h('p', null, t('privacy.securityLinks')),
      h('p', null, t('privacy.securityPasswords')),
      h('p', null, t('privacy.securityEncryption', {
        transit: cloudflare ? t('privacy.httpsCloudflare') : t('privacy.httpsOther'),
      }))),

    section(t('privacy.sourceHeading'),
      h('p', null, ...tx('privacy.source', {
        link: h('a', { href: 'https://github.com/Micropeptide/Overlap', target: '_blank', rel: 'noopener' }, 'github.com/Micropeptide/Overlap'),
      }))),
  ));
}
