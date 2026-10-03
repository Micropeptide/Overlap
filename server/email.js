// Optional email: confirmations, "email me my link", and update digests,
// sent through Resend (https://resend.com). Off unless RESEND_API_KEY and
// EMAIL_FROM are set. Addresses are kept only while a subscription exists.

import catalogs from '../shared/i18n/catalogs.js';
import { translate } from '../shared/i18n/core.js';
import { isLanguage, languageDir } from '../shared/i18n/languages.js';
import emailEnglish from '../shared/i18n/en/email.js';

const MAX_EMAIL = 254;

// English email text, straight from its source as well as the merged catalog,
// so emails never show bare keys even before `npm run i18n:merge` has run.
const ENGLISH = { ...catalogs.en, ...emailEnglish };

/** A supported language with a catalog, else English (also for old subscriptions with none). */
const emailLang = (lang) => (isLanguage(lang) && catalogs[lang] ? lang : 'en');

/** The `t()` for one email's language. */
function translator(lang) {
  const catalog = lang === 'en' ? ENGLISH : catalogs[lang];
  return (key, vars) => translate(catalog, ENGLISH, lang, key, vars);
}

/** Intl locale for dates: US English as before, otherwise the language itself. */
const dateLocale = (lang) => (lang === 'en' ? 'en-US' : lang);

/** A plain check that catches typos; the confirmation email does the real test. */
export function cleanEmail(value) {
  if (typeof value !== 'string') return null;
  const email = value.trim();
  if (email.length > MAX_EMAIL || !/^[^\s@<>()",;:\\[\]]+@[^\s@<>()",;:\\[\]]+\.[^\s@<>()",;:\\[\]]{2,}$/.test(email)) return null;
  const at = email.lastIndexOf('@');
  return email.slice(0, at) + '@' + email.slice(at + 1).toLowerCase();
}

export function createResendMailer({ apiKey, from, fetchImpl = fetch }) {
  if (!apiKey || !from) return null;
  return {
    async send({ to, subject, text, html, headers = {} }) {
      const res = await fetchImpl('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to: [to], subject, text, html, headers }),
      });
      if (!res.ok) throw new Error(`Resend answered ${res.status}`);
    },
  };
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
// Titles go into subject lines and plain text; keep them on one line.
const oneLine = (s, max = 80) => { const t = String(s).replace(/\s+/g, ' ').trim(); return t.length > max ? `${t.slice(0, max - 1)}…` : t; };

/** A small, plain email: a few paragraphs, an optional button, and a footer. */
function compose({ paragraphs, button, footer, lang = 'en' }) {
  const t = translator(lang);
  const text = [...paragraphs, button ? t('email.buttonText', { label: button.label, url: button.url }) : null, '', ...footer].filter((x) => x !== null).join('\n\n');
  const p = (t) => `<p style="margin:0 0 14px;line-height:1.5">${esc(t)}</p>`;
  // English keeps its plain <html>; other languages say what they are (and Arabic its direction).
  const htmlAttrs = lang === 'en' ? '' : ` lang="${esc(lang)}"${languageDir(lang) === 'rtl' ? ' dir="rtl"' : ''}`;
  const html = `<!doctype html><html${htmlAttrs}><body style="margin:0;padding:24px;background:#f2f5f7;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#14202b">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;padding:24px">
<p style="margin:0 0 18px;font-weight:700;font-size:18px">Overlap</p>
${paragraphs.map(p).join('\n')}
${button ? `<p style="margin:20px 0"><a href="${esc(button.url)}" style="display:inline-block;background:#0b7a75;color:#fff;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:10px">${esc(button.label)}</a></p>` : ''}
<div style="margin-top:24px;border-top:1px solid #d8dfe4;padding-top:12px;font-size:13px;color:#4a5866">${footer.map((t) => `<p style="margin:0 0 6px">${esc(t)}</p>`).join('')}</div>
</div></body></html>`;
  return { text, html };
}

const unsubHeaders = (oneClickUrl) => ({ 'List-Unsubscribe': `<${oneClickUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' });

/**
 * The one email sent when someone types their address. It can carry their
 * private link (if they asked) and a button to confirm updates (if they asked).
 */
export function welcomeEmail({ poll, role, link, confirmUrl, publicUrl, lang }) {
  lang = emailLang(lang);
  const t = translator(lang);
  const title = oneLine(poll.title);
  const paragraphs = [];
  if (link) {
    paragraphs.push(t(role === 'organizer' ? 'email.linkOrganizer' : 'email.linkGuest', { title }));
    paragraphs.push(link);
  }
  if (confirmUrl) {
    const key = role === 'organizer' ? 'email.confirmOrganizer'
      : poll.resultsVisibility === 'everyone' ? 'email.confirmGuestPublic' : 'email.confirmGuest';
    paragraphs.push(t(key));
  }
  const subject = t(confirmUrl ? 'email.subjectConfirm' : 'email.subjectLink', { title });
  return {
    subject,
    ...compose({
      lang,
      paragraphs,
      button: confirmUrl ? { label: t('email.confirmButton'), url: confirmUrl } : null,
      footer: [
        t('email.welcomeFooter'),
        `Overlap · ${publicUrl}`,
      ],
    }),
  };
}

function timeRange(start, end, timeZone, weekly, lang = 'en') {
  const locale = dateLocale(lang);
  const day = new Intl.DateTimeFormat(locale, { timeZone, weekday: 'long', ...(weekly ? {} : { month: 'short', day: 'numeric' }) }).format(start);
  const time = (ms) => new Intl.DateTimeFormat(locale, { timeZone, hour: 'numeric', minute: '2-digit' }).format(ms);
  return translator(lang)(weekly ? 'email.timeRangeWeekly' : 'email.timeRange', { day, start: time(start), end: time(end), zone: timeZone.replace(/_/g, ' ') });
}

/** Turn a subscriber's events into lines; empty when nothing is worth an email. */
export function digestLines({ poll, sub, events, responses }) {
  const lang = emailLang(sub.lang);
  const t = translator(lang);
  const forOrganizer = !sub.responseId;
  const publicResults = poll.resultsVisibility === 'everyone';
  const names = new Map(responses.map((r) => [r.id, r.name]));
  const added = new Set();
  const changed = new Set();
  let removed = 0;
  const pollNews = [];
  for (const e of events) {
    if (e.responseId && e.responseId === sub.responseId) continue; // their own doing
    if (e.kind.startsWith('response_')) {
      if (!forOrganizer && !publicResults) continue;
      if (forOrganizer && e.kind === 'response_removed') continue; // the organizer removed it
      if (e.kind === 'response_new') added.add(e.responseId);
      else if (e.kind === 'response_updated' && !added.has(e.responseId)) changed.add(e.responseId);
      else if (e.kind === 'response_deleted' || e.kind === 'response_removed') {
        if (added.delete(e.responseId)) continue; // came and went
        changed.delete(e.responseId);
        removed++;
      }
    } else if (!forOrganizer) {
      pollNews.push(e.kind);
    }
  }
  const lines = [];
  const last = pollNews.at(-1);
  if (pollNews.includes('final') && poll.final) {
    lines.push(t('email.finalPicked', { time: timeRange(poll.final.start, poll.final.end, poll.timezone, poll.kind === 'weekly', lang) }));
  } else if (last === 'closed' && poll.closed) lines.push(t('email.closed'));
  else if (last === 'reopened' && !poll.closed) lines.push(t('email.reopened'));
  if (pollNews.includes('edited')) lines.push(t('email.edited'));
  const list = (ids) => [...ids].map((id) => names.get(id)).filter(Boolean);
  const joined = (people) => people.join(t('email.nameSeparator'));
  const newNames = list(added);
  const changedNames = list(changed);
  if (newNames.length) lines.push(t('email.newResponses', { count: newNames.length, names: joined(newNames) }));
  if (changedNames.length) lines.push(t('email.changedAnswers', { count: changedNames.length, names: joined(changedNames) }));
  if (removed) lines.push(t('email.removed', { count: removed }));
  if ((newNames.length || changedNames.length || removed) && (forOrganizer || publicResults)) {
    lines.push(t('email.respondedSoFar', { count: responses.length }));
  }
  return lines;
}

export function digestEmail({ poll, sub, lines, publicUrl, unsubUrl }) {
  const lang = emailLang(sub.lang);
  const t = translator(lang);
  const title = oneLine(poll.title);
  const url = sub.responseId ? `${publicUrl}/p/${poll.id}` : `${publicUrl}/m/${poll.id}`;
  return {
    subject: t('email.subjectUpdates', { title }),
    ...compose({
      lang,
      paragraphs: [t('email.news', { title }), ...lines],
      button: { label: t(sub.responseId ? 'email.openPoll' : 'email.openOrganizerView'), url },
      footer: [
        t(sub.responseId ? 'email.guestFooter' : 'email.organizerFooter'),
        t('email.stop', { url: unsubUrl }),
      ],
    }),
  };
}

/**
 * Send the update emails that are due. Runs from a timer (Node) or a cron
 * trigger (Cloudflare). Returns how many were sent.
 */
export async function sendDueDigests({ store, mailer, publicUrl, apiUrl, now = Date.now() }) {
  if (!mailer) return 0;
  let sent = 0;
  for (const sub of await store.dueEmailSubs({ now })) {
    const poll = await store.getPoll(sub.pollId);
    if (!poll) { await store.deleteEmailSub(sub.pollId, sub.responseId); continue; }
    // Changes after the last email, or from the moment updates were confirmed (inclusive).
    const events = await store.eventsSince(poll.id, sub.lastSentAt ?? sub.createdAt - 1);
    const lines = digestLines({ poll, sub, events, responses: await store.listResponses(poll.id) });
    if (lines.length) {
      const token = await store.newUnsubToken(sub.id);
      const unsubUrl = `${publicUrl}/e/unsubscribe#t=${token}`;
      const msg = digestEmail({ poll, sub, lines, publicUrl, unsubUrl });
      try {
        await mailer.send({ to: sub.email, ...msg, headers: unsubHeaders(`${apiUrl}/api/email/unsubscribe?t=${token}`) });
        sent++;
      } catch (err) {
        console.error('Email not sent:', err.message);
        continue; // try again next time
      }
    }
    await store.markEmailed(sub.id, now);
  }
  return sent;
}

export { unsubHeaders };
