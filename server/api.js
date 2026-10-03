// The JSON API, independent of where it runs. Node (server/app.js) and
// Cloudflare Workers (worker/index.js) both turn their requests into:
//
//   { method, pathname, header(name), readText(limit), ip }
//
// and send back the { status, body, headers } this returns. No cookies, no
// request logging. Secrets travel in the Authorization header, never in URLs
// the server sees (the browser keeps them in the link's #fragment).

import { HttpError, LIMITS, validateFinal, validatePollFields, validateResponse } from './validate.js';
import { secretMatches, slotsFor, hashText } from './store-core.js';
import { buildInvite } from './ics.js';
import { KEY_PATTERN } from '../shared/password.js';
import { cleanEmail, welcomeEmail } from './email.js';
import { isLanguage } from '../shared/i18n/languages.js';

const MAX_BODY = 200_000;
// Wrong passwords allowed per poll (organizer and guests counted separately)
// before password sign-in pauses. Private links keep working throughout.
const GUESS_MAX = 30;
const GUESS_WINDOW_MS = 60 * 60e3;
// Emails Overlap will send on request, so it can't be used to flood an inbox.
const EMAILS_PER_ADDRESS_PER_DAY = 5;
const EMAILS_PER_POLL_PER_DAY = 40;

export function createApi({ store, limiter, publicUrl = '', info = {}, mailer = null }) {
  const siteUrl = (req) => (publicUrl ? publicUrl.replace(/\/$/, '') : req.origin);
  const record = (poll, kind, responseId, opts) => (mailer ? store.recordEvent(poll, kind, responseId, opts) : null);
  const bearer = (req) => {
    const m = /^Bearer\s+([A-Za-z0-9_-]{16,128})$/.exec(req.header('authorization') || '');
    return m ? m[1] : null;
  };

  // A guest who signed in with a password sends "Password <response id>:<key>".
  const passwordAuth = (req) => {
    const m = /^Password\s+([a-z0-9]{6,32}):([A-Za-z0-9_-]{43})$/.exec(req.header('authorization') || '');
    return m ? { responseId: m[1], key: m[2] } : null;
  };

  /** A password key from a request body: undefined (not sent), null (remove) or a key. */
  function passwordKeyField(value) {
    if (value === undefined || value === null) return value;
    if (typeof value !== 'string' || !KEY_PATTERN.test(value)) throw new HttpError(400, 'That password could not be read. Reload the page and try again.', 'password', 'password_unreadable');
    return value;
  }

  /**
   * Compare a password key, counting wrong ones per poll. Once too many have
   * been wrong, every password is refused for a while, right or not, so
   * guessing learns nothing.
   */
  async function passwordMatches(scope, pollId, key, hashes) {
    const throttleKey = `${scope}:${pollId}`;
    if (await store.throttleBlocked(throttleKey, GUESS_MAX)) {
      const err = new HttpError(429, 'Too many wrong passwords for this poll. Wait an hour and try again, or use your private link.', undefined, 'too_many_wrong_passwords');
      err.retryAfter = GUESS_WINDOW_MS / 1000;
      throw err;
    }
    for (const hash of hashes) if (hash && await secretMatches(key, hash)) return true;
    await store.throttleMiss(throttleKey, GUESS_WINDOW_MS);
    return false;
  }

  async function readJson(req) {
    if (!(req.header('content-type') || '').startsWith('application/json')) {
      throw new HttpError(415, 'Send JSON with Content-Type: application/json.', undefined, 'json_required');
    }
    const text = await req.readText(MAX_BODY);
    if (text === null) throw new HttpError(413, 'That request is too large.', undefined, 'body_too_large');
    try {
      return JSON.parse(text || 'null');
    } catch {
      throw new HttpError(400, 'The request body is not valid JSON.', undefined, 'invalid_json');
    }
  }

  async function requirePoll(id) {
    const poll = await store.getPoll(id);
    if (!poll) throw new HttpError(404, 'This poll does not exist. It may have been deleted or expired.', undefined, 'poll_not_found');
    return poll;
  }

  /** The private link's key, or a key from the organizer's password. */
  async function isAdmin(req, poll) {
    const key = bearer(req);
    if (!key) return false;
    if (await secretMatches(key, poll.adminHash)) return true;
    return !!poll.adminPwHash && KEY_PATTERN.test(key) && passwordMatches('organizer', poll.id, key, [poll.adminPwHash]);
  }

  async function requireAdmin(req, poll) {
    if (!(await isAdmin(req, poll))) {
      throw poll.adminPwHash
        ? new HttpError(403, 'That private link or password is not right. The link may have been replaced, or the password changed.', undefined, 'admin_link_or_password_wrong')
        : new HttpError(403, 'This private link is not valid. It may have been replaced.', undefined, 'admin_link_invalid');
    }
  }

  function status(poll) {
    if (poll.final) return 'finalized';
    return poll.closed ? 'closed' : 'open';
  }

  /**
   * `answered` lists the current times this person has seen, or is null when
   * they have seen them all (the usual case, and much smaller to send).
   */
  function publicResponse(r, poll) {
    // Answered against the current settings: the same cached slot list, nothing to compare.
    const seen = r.answered === poll.slots ? null : new Set(r.answered);
    const missing = !!seen && poll.slots.some((slot) => !seen.has(slot));
    return {
      id: r.id, name: r.name, available: r.available, ifNeeded: r.ifNeeded, preferred: r.preferred, note: r.note,
      answered: missing ? poll.slots.filter((slot) => seen.has(slot)) : null,
      createdAt: r.createdAt, updatedAt: r.updatedAt,
    };
  }

  async function serializePoll(poll, { admin = false } = {}) {
    const responses = await store.listResponses(poll.id);
    const visible = admin || poll.resultsVisibility === 'everyone';
    return {
      id: poll.id,
      kind: poll.kind,
      weekdays: poll.kind === 'weekly' ? poll.weekdays : undefined,
      title: poll.title,
      description: poll.description,
      location: poll.location,
      closesOn: poll.closesOn,
      closesAt: poll.closesAt,
      timezone: poll.timezone,
      dates: poll.dates,
      startMinute: poll.startMinute,
      endMinute: poll.endMinute,
      slotMinutes: poll.slotMinutes,
      durationMinutes: poll.durationMinutes,
      resultsVisibility: poll.resultsVisibility,
      allowEdits: poll.allowEdits,
      status: status(poll),
      final: poll.final,
      slots: poll.slots,
      createdAt: poll.createdAt,
      updatedAt: poll.updatedAt,
      // Lets the guest page offer "Manage with your password".
      hasOrganizerPassword: !!poll.adminPwHash,
      // null when polls are kept until deleted; only the organizer sees it.
      expiresAt: admin ? (store.retentionDays ? poll.expiresAt : null) : undefined,
      responseCount: responses.length,
      responses: visible ? responses.map((r) => publicResponse(r, poll)) : null,
      isOrganizer: admin,
    };
  }

  /** Is this request from the guest who wrote `r`: their edit link's key, or their password? */
  async function isAuthor(req, poll, r) {
    const pw = passwordAuth(req);
    if (pw) return pw.responseId === r.id && !!r.pwHash && passwordMatches('guest', poll.id, pw.key, [r.pwHash]);
    return secretMatches(bearer(req), r.editHash);
  }

  async function guestResponseFor(req, poll, responseId) {
    const r = await store.getResponse(poll.id, responseId);
    if (!r) throw new HttpError(404, 'That response no longer exists.', undefined, 'response_not_found');
    if (!(await isAuthor(req, poll, r))) throw new HttpError(403, 'Only the person who sent this response can change it.', undefined, 'not_your_response');
    return r;
  }

  /** The organizer (no response id) or the guest who wrote `rid`. */
  async function emailOwner(req, id, rid) {
    const poll = await requirePoll(id);
    if (!rid) {
      await requireAdmin(req, poll);
      return { poll };
    }
    return { poll, response: await guestResponseFor(req, poll, rid) };
  }

  /** What the guest who wrote a response sees about it, beyond what everyone sees. */
  const ownResponse = (r, poll) => ({ ...publicResponse(r, poll), hasPassword: !!r.pwHash });

  const routes = [
    ['GET', /^\/api\/config$/, () => ({ body: { retentionDays: store.retentionDays, limits: LIMITS, emails: !!mailer, ...info } })],

    ['POST', /^\/api\/polls$/, async (req) => {
      limiter.check(req.ip, 'create');
      const fields = validatePollFields(await readJson(req));
      // An organizer password is set afterwards (PATCH), since its key is salted with the poll id.
      const { poll, adminToken } = await store.createPoll(fields);
      return { status: 201, body: { poll: await serializePoll(poll, { admin: true }), adminToken } };
    }],

    ['GET', /^\/api\/polls\/([a-z0-9]+)$/, async (req, [id]) => {
      limiter.check(req.ip, 'read');
      return { body: { poll: await serializePoll(await requirePoll(id)) } };
    }],

    ['GET', /^\/api\/polls\/([a-z0-9]+)\/manage$/, async (req, [id]) => {
      limiter.check(req.ip, 'read');
      const poll = await requirePoll(id);
      await requireAdmin(req, poll);
      return { body: { poll: await serializePoll(poll, { admin: true }) } };
    }],

    ['PATCH', /^\/api\/polls\/([a-z0-9]+)$/, async (req, [id]) => {
      limiter.check(req.ip, 'write');
      // Read the whole body first, so every check below sees the poll as it is now.
      const body = await readJson(req);
      const poll = await requirePoll(id);
      await requireAdmin(req, poll);
      if (!body || typeof body !== 'object' || Array.isArray(body)) throw new HttpError(400, 'Send the changes as a JSON object.', undefined, 'changes_not_object');
      const { status: nextStatus, final, organizerPassword, ...rest } = body;
      const passwordKey = passwordKeyField(organizerPassword);
      if (nextStatus === 'open' && final) throw new HttpError(400, 'Reopening a poll clears its final time, so send one or the other.', 'final', 'reopen_with_final');
      const changes = Object.keys(rest).length ? validatePollFields(rest, poll) : {};
      const merged = { ...poll, ...changes };
      const mergedSlots = slotsFor(merged);
      if (final !== undefined) {
        changes.final = validateFinal(final, mergedSlots);
        if (changes.final) changes.manualClosed = true;
      } else if (poll.final && !mergedSlots.includes(poll.final.start)) {
        // The edit removed the final time's slot, so the final time no longer applies.
        changes.final = null;
      }
      if (nextStatus !== undefined) {
        if (nextStatus === 'open') {
          changes.manualClosed = false;
          changes.final = null;
          // Reopening a poll whose deadline has passed removes the deadline,
          // unless this same request sets a new one.
          if (!('closesOn' in rest) && merged.closesOn && store.deadlinePassed(merged)) changes.closesOn = null;
        } else if (nextStatus === 'closed') changes.manualClosed = true;
        else throw new HttpError(400, 'Status must be "open" or "closed".', 'status', 'status_invalid');
      }
      if (passwordKey !== undefined) await store.setAdminPassword(id, passwordKey);
      const updated = await store.updatePoll(id, changes);
      if (changes.final && changes.final.start !== poll.final?.start) await record(updated, 'final');
      else if (nextStatus === 'closed' && !poll.closed) await record(updated, 'closed');
      else if (nextStatus === 'open' && poll.closed) await record(updated, 'reopened');
      const EDITS = ['kind', 'title', 'location', 'description', 'dates', 'startMinute', 'endMinute', 'slotMinutes', 'timezone', 'durationMinutes'];
      if (EDITS.some((k) => k in changes && JSON.stringify(changes[k]) !== JSON.stringify(poll[k]))) await record(updated, 'edited');
      return { body: { poll: await serializePoll(updated, { admin: true }) } };
    }],

    ['DELETE', /^\/api\/polls\/([a-z0-9]+)$/, async (req, [id]) => {
      limiter.check(req.ip, 'write');
      const poll = await requirePoll(id);
      await requireAdmin(req, poll);
      await store.deletePoll(id);
      return { status: 204 };
    }],

    ['POST', /^\/api\/polls\/([a-z0-9]+)\/private-link$/, async (req, [id]) => {
      limiter.check(req.ip, 'write');
      const poll = await requirePoll(id);
      await requireAdmin(req, poll);
      return { body: { adminToken: await store.rotateAdmin(id) } };
    }],

    ['POST', /^\/api\/polls\/([a-z0-9]+)\/responses$/, async (req, [id]) => {
      limiter.check(req.ip, 'write');
      const body = await readJson(req);
      const poll = await requirePoll(id);
      if (poll.closed) throw new HttpError(409, 'This poll is closed, so it is not taking new responses.', undefined, 'poll_closed');
      const data = validateResponse(body, poll);
      const passwordKey = passwordKeyField(body?.password);
      if (await store.countResponses(id) >= LIMITS.responses) throw new HttpError(409, `This poll already has ${LIMITS.responses} responses.`, undefined, 'too_many_responses', { count: LIMITS.responses });
      // Names are unique when everyone can see responses, so nobody is confused
      // about who is who. With hidden results they needn't be, so a guest can't
      // find out who responded by trying names.
      if (poll.resultsVisibility === 'everyone' && await store.nameTaken(id, data.name)) {
        throw new HttpError(409, `Someone already responded as “${data.name}”. If that was you, open your private edit link. Otherwise, add a last initial.`, 'name', 'name_taken', { name: data.name });
      }
      const { response, editToken } = await store.createResponse(poll, data, { passwordKey });
      await record(poll, 'response_new', response.id);
      return { status: 201, body: { response: ownResponse(response, poll), editToken } };
    }],

    ['GET', /^\/api\/polls\/([a-z0-9]+)\/my-response$/, async (req, [id]) => {
      limiter.check(req.ip, 'read');
      const poll = await requirePoll(id);
      const pw = passwordAuth(req);
      let mine;
      if (pw) {
        mine = await store.getResponse(poll.id, pw.responseId);
        if (mine && !(await isAuthor(req, poll, mine))) throw new HttpError(403, 'That password no longer works for this response. It may have been changed.', undefined, 'password_no_longer_works');
      } else {
        mine = await store.findResponseByToken(poll.id, bearer(req));
      }
      if (!mine) throw new HttpError(404, 'We could not find your response. It may have been deleted.', undefined, 'my_response_not_found');
      return { body: { response: ownResponse(mine, poll) } };
    }],

    // Sign in to your response from another device with your name and password.
    ['POST', /^\/api\/polls\/([a-z0-9]+)\/sign-in$/, async (req, [id]) => {
      limiter.check(req.ip, 'write');
      const body = await readJson(req);
      const poll = await requirePoll(id);
      const name = typeof body?.name === 'string' ? body.name.slice(0, 200) : '';
      const key = passwordKeyField(body?.password);
      if (!name.trim() || !key) throw new HttpError(400, 'Enter the name you answered with and your password.', undefined, 'sign_in_incomplete');
      const candidates = (await store.responsesNamed(poll.id, name)).filter((r) => r.pwHash);
      // One comparison per candidate, counted once, whether or not the name exists.
      let match = null;
      const ok = await passwordMatches('guest', poll.id, key, candidates.length ? candidates.map((r) => r.pwHash) : [null]);
      if (ok) for (const r of candidates) if (await secretMatches(key, r.pwHash)) { match = r; break; }
      if (!match) throw new HttpError(403, 'That name and password don’t match a response with a password. Check the spelling, or use your private edit link.', undefined, 'sign_in_failed');
      return { body: { response: ownResponse(match, poll) } };
    }],

    ['PUT', /^\/api\/polls\/([a-z0-9]+)\/responses\/([a-z0-9]+)$/, async (req, [id, rid]) => {
      limiter.check(req.ip, 'write');
      const body = await readJson(req);
      const poll = await requirePoll(id);
      await guestResponseFor(req, poll, rid);
      if (poll.closed) throw new HttpError(409, 'This poll is closed, so responses can no longer be changed.', undefined, 'poll_closed_no_changes');
      if (!poll.allowEdits) throw new HttpError(409, 'The organizer doesn’t allow changing answers after they’re sent. You can still delete yours.', undefined, 'edits_not_allowed');
      const data = validateResponse(body, poll);
      if (poll.resultsVisibility === 'everyone' && await store.nameTaken(id, data.name, rid)) {
        throw new HttpError(409, `Someone else already responded as “${data.name}”. Try adding a last initial.`, 'name', 'name_taken_other', { name: data.name });
      }
      const passwordKey = passwordKeyField(body?.password);
      let updated = await store.updateResponse(poll, rid, data);
      if (!updated) throw new HttpError(404, 'That response no longer exists.', undefined, 'response_not_found');
      await record(poll, 'response_updated', rid);
      if (passwordKey !== undefined) {
        await store.setResponsePassword(poll.id, rid, passwordKey);
        updated = await store.getResponse(poll.id, rid);
      }
      return { body: { response: ownResponse(updated, poll) } };
    }],

    ['DELETE', /^\/api\/polls\/([a-z0-9]+)\/responses\/([a-z0-9]+)$/, async (req, [id, rid]) => {
      limiter.check(req.ip, 'write');
      const poll = await requirePoll(id);
      // The guest who wrote it, or the organizer, can delete a response. Deleting
      // your own data works even after the poll is closed.
      const byOrganizer = await isAdmin(req, poll);
      if (!byOrganizer) await guestResponseFor(req, poll, rid);
      else if (!(await store.getResponse(id, rid))) throw new HttpError(404, 'That response no longer exists.', undefined, 'response_not_found');
      await store.deleteResponse(id, rid);
      await record(poll, byOrganizer ? 'response_removed' : 'response_deleted', rid, { byOrganizer });
      return { status: 204 };
    }],

    // Email: the organizer's (…/email) or one guest's (…/responses/<id>/email).
    ['GET', /^\/api\/polls\/([a-z0-9]+)(?:\/responses\/([a-z0-9]+))?\/email$/, async (req, [id, rid]) => {
      limiter.check(req.ip, 'read');
      const { poll } = await emailOwner(req, id, rid);
      const sub = await store.getEmailSub(poll.id, rid || null);
      return { body: { email: sub?.email ?? null, confirmed: !!sub?.confirmed } };
    }],

    ['PUT', /^\/api\/polls\/([a-z0-9]+)(?:\/responses\/([a-z0-9]+))?\/email$/, async (req, [id, rid]) => {
      limiter.check(req.ip, 'write');
      const body = await readJson(req);
      const { poll, response } = await emailOwner(req, id, rid);
      if (!mailer) throw new HttpError(404, 'Email isn’t set up on this copy of Overlap.', undefined, 'email_not_set_up');
      const email = cleanEmail(body?.email);
      if (!email) throw new HttpError(400, 'That doesn’t look like an email address.', 'email', 'email_invalid');
      const wantsUpdates = body.updates === true;
      // Emails are written in the language of the page that asked for them.
      const lang = isLanguage(body.lang) ? body.lang : 'en';
      // The link is only ever one the browser already holds, checked against its hash.
      let link = null;
      if (typeof body.link === 'string' && body.link) {
        const ok = rid ? await secretMatches(body.link, response.editHash) : await secretMatches(body.link, poll.adminHash);
        if (!ok) throw new HttpError(400, 'That private link isn’t current. Reload the page and try again.', 'link', 'link_not_current');
        link = rid ? `${siteUrl(req)}/p/${poll.id}#r=${body.link}` : `${siteUrl(req)}/m/${poll.id}#k=${body.link}`;
      }
      if (!link && !wantsUpdates) throw new HttpError(400, 'Choose what to email: your link, updates, or both.', undefined, 'email_nothing_chosen');
      limiter.check(req.ip, 'email');
      const addressKey = `email-addr:${await hashText(email.toLowerCase())}`;
      if (await store.throttleBlocked(addressKey, EMAILS_PER_ADDRESS_PER_DAY) || await store.throttleBlocked(`email-poll:${poll.id}`, EMAILS_PER_POLL_PER_DAY)) {
        throw new HttpError(429, 'Overlap has sent enough emails to that address (or for this poll) today. Try again tomorrow.', undefined, 'email_daily_limit');
      }
      let confirmUrl = null;
      let confirmed = false;
      if (wantsUpdates) {
        const sub = await store.putEmailSub(poll.id, rid || null, email, lang);
        confirmed = sub.confirmed;
        if (!confirmed) confirmUrl = `${siteUrl(req)}/e/confirm#t=${sub.confirmToken}`;
      }
      if (link || confirmUrl) {
        const msg = welcomeEmail({ poll, role: rid ? 'guest' : 'organizer', link, confirmUrl, publicUrl: siteUrl(req), lang });
        try {
          await mailer.send({ to: email, ...msg });
        } catch (err) {
          console.error('Email not sent:', err.message);
          throw new HttpError(502, 'The email couldn’t be sent just now. Try again in a minute.', undefined, 'email_send_failed');
        }
        await store.throttleMiss(addressKey, 86400e3);
        await store.throttleMiss(`email-poll:${poll.id}`, 86400e3);
      }
      return { body: { email: wantsUpdates ? email : (await store.getEmailSub(poll.id, rid || null))?.email ?? null, confirmed, sent: !!(link || confirmUrl) } };
    }],

    ['DELETE', /^\/api\/polls\/([a-z0-9]+)(?:\/responses\/([a-z0-9]+))?\/email$/, async (req, [id, rid]) => {
      limiter.check(req.ip, 'write');
      const { poll } = await emailOwner(req, id, rid);
      await store.deleteEmailSub(poll.id, rid || null);
      return { status: 204 };
    }],

    ['POST', /^\/api\/email\/confirm$/, async (req) => {
      limiter.check(req.ip, 'write');
      const body = await readJson(req);
      const sub = await store.confirmEmailSub(body?.token);
      if (!sub) throw new HttpError(404, 'This confirmation link has expired or was already replaced. Ask for emails again from the poll.', undefined, 'confirm_link_expired');
      const poll = await store.getPoll(sub.pollId);
      return { body: { poll: poll ? { id: poll.id, title: poll.title } : null, role: sub.responseId ? 'guest' : 'organizer' } };
    }],

    // From the page (JSON), or one-click from a mail app (form post with ?t=).
    ['POST', /^\/api\/email\/unsubscribe$/, async (req) => {
      limiter.check(req.ip, 'write');
      let token = req.query?.get('t') || null;
      if (!token && (req.header('content-type') || '').startsWith('application/json')) token = (await readJson(req))?.token;
      const sub = await store.unsubscribe(token);
      if (!sub) return { body: { found: false, poll: null } }; // already stopped, or a stale link
      const poll = await store.getPoll(sub.pollId);
      return { body: { found: true, poll: poll ? { id: poll.id, title: poll.title } : null } };
    }],

    ['GET', /^\/api\/polls\/([a-z0-9]+)\/invite\.ics$/, async (req, [id]) => {
      limiter.check(req.ip, 'read');
      const poll = await requirePoll(id);
      if (!poll.final) throw new HttpError(404, 'This poll does not have a final time yet.', undefined, 'no_final_time');
      const slug = poll.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'event';
      const origin = publicUrl ? publicUrl.replace(/\/$/, '') : req.origin;
      return {
        body: buildInvite({ poll, guestUrl: `${origin}/p/${poll.id}` }),
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Content-Disposition': `attachment; filename="${slug}.ics"`,
        },
      };
    }],
  ];

  /** Handle one API request. Never throws: errors become JSON responses. */
  async function handle(req) {
    try {
      for (const [method, pattern, fn] of routes) {
        const m = pattern.exec(req.pathname);
        if (!m || req.method !== method) continue;
        const result = await fn(req, m.slice(1));
        return { status: result.status || 200, body: result.status === 204 ? '' : result.body, headers: result.headers || {} };
      }
      const known = routes.some(([, pattern]) => pattern.test(req.pathname));
      return {
        status: known ? 405 : 404,
        body: known ? { error: 'That method is not allowed here.', code: 'method_not_allowed' } : { error: 'Not found.', code: 'not_found' },
        headers: {},
      };
    } catch (err) {
      if (err instanceof HttpError) {
        return {
          status: err.status,
          body: { error: err.message, field: err.field, code: err.code, vars: err.vars }, // undefined ones are left out of the JSON
          headers: err.retryAfter ? { 'Retry-After': String(err.retryAfter) } : {},
        };
      }
      console.error(err);
      return { status: 500, body: { error: 'Something went wrong on our side. Please try again.', code: 'server_error' }, headers: {} };
    }
  }

  return { handle };
}
