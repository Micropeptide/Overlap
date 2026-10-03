// Optional email: confirmations, "email me my link", and update digests,
// sent through Resend (https://resend.com). Off unless RESEND_API_KEY and
// EMAIL_FROM are set. Addresses are kept only while a subscription exists.

const MAX_EMAIL = 254;

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
function compose({ paragraphs, button, footer }) {
  const text = [...paragraphs, button ? `${button.label}: ${button.url}` : null, '', ...footer].filter((x) => x !== null).join('\n\n');
  const p = (t) => `<p style="margin:0 0 14px;line-height:1.5">${esc(t)}</p>`;
  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#f2f5f7;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#14202b">
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
export function welcomeEmail({ poll, role, link, confirmUrl, publicUrl }) {
  const title = oneLine(poll.title);
  const paragraphs = [];
  if (link) {
    paragraphs.push(role === 'organizer'
      ? `Here is your private link for “${title}”. It lets you edit, close or delete the poll, so keep it to yourself:`
      : `Here is your private edit link for “${title}”. It lets you change or delete your response, so keep it to yourself:`);
    paragraphs.push(link);
  }
  if (confirmUrl) {
    paragraphs.push(role === 'organizer'
      ? `To get an email when people respond or change their answers, confirm below. You’ll get at most one email every 30 minutes.`
      : `To get an email when the organizer picks a time or changes the poll${poll.resultsVisibility === 'everyone' ? ', or when people respond' : ''}, confirm below. You’ll get at most one email every 30 minutes.`);
  }
  const subject = confirmUrl ? `Confirm emails about “${title}”` : `Your link for “${title}”`;
  return {
    subject,
    ...compose({
      paragraphs,
      button: confirmUrl ? { label: 'Confirm email updates', url: confirmUrl } : null,
      footer: [
        'You’re getting this because someone typed this address into Overlap. If it wasn’t you, ignore it: nothing more will be sent.',
        `Overlap · ${publicUrl}`,
      ],
    }),
  };
}

function timeRange(start, end, timeZone, weekly) {
  const day = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'long', ...(weekly ? {} : { month: 'short', day: 'numeric' }) }).format(start);
  const t = (ms) => new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', minute: '2-digit' }).format(ms);
  return `${weekly ? 'Every ' : ''}${day}, ${t(start)} – ${t(end)} (${timeZone.replace(/_/g, ' ')} time)`;
}

/** Turn a subscriber's events into lines; empty when nothing is worth an email. */
export function digestLines({ poll, sub, events, responses }) {
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
  if (pollNews.includes('final') && poll.final) lines.push(`The organizer picked a time: ${timeRange(poll.final.start, poll.final.end, poll.timezone, poll.kind === 'weekly')}.`);
  else if (last === 'closed' && poll.closed) lines.push('The organizer closed the poll.');
  else if (last === 'reopened' && !poll.closed) lines.push('The poll is open again.');
  if (pollNews.includes('edited')) lines.push('The organizer changed the poll. Check that your answer still fits.');
  const list = (ids) => [...ids].map((id) => names.get(id)).filter(Boolean);
  const newNames = list(added);
  const changedNames = list(changed);
  if (newNames.length) lines.push(`New ${newNames.length === 1 ? 'response' : 'responses'}: ${newNames.join(', ')}.`);
  if (changedNames.length) lines.push(`Changed their answer: ${changedNames.join(', ')}.`);
  if (removed) lines.push(`${removed === 1 ? 'One response was' : `${removed} responses were`} removed.`);
  if ((newNames.length || changedNames.length || removed) && (forOrganizer || publicResults)) {
    lines.push(`${responses.length} ${responses.length === 1 ? 'person has' : 'people have'} responded so far.`);
  }
  return lines;
}

export function digestEmail({ poll, sub, lines, publicUrl, unsubUrl }) {
  const title = oneLine(poll.title);
  const url = sub.responseId ? `${publicUrl}/p/${poll.id}` : `${publicUrl}/m/${poll.id}`;
  return {
    subject: `Updates to “${title}”`,
    ...compose({
      paragraphs: [`News about “${title}”:`, ...lines],
      button: { label: sub.responseId ? 'Open the poll' : 'Open the organizer view', url },
      footer: [
        sub.responseId
          ? 'The link opens the poll. On the device you answered from, your response is already there.'
          : 'The link opens the organizer view in the browser where you created the poll. Elsewhere, use your private link or organizer password.',
        `Stop these emails: ${unsubUrl}`,
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
    const events = await store.eventsSince(poll.id, sub.lastSentAt || sub.createdAt);
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
