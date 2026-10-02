// The JSON API, independent of where it runs. Node (server/app.js) and
// Cloudflare Workers (worker/index.js) both turn their requests into:
//
//   { method, pathname, header(name), readText(limit), ip }
//
// and send back the { status, body, headers } this returns. No cookies, no
// request logging. Secrets travel in the Authorization header, never in URLs
// the server sees (the browser keeps them in the link's #fragment).

import { HttpError, LIMITS, validateFinal, validatePollFields, validateResponse } from './validate.js';
import { secretMatches, slotsFor } from './store-core.js';
import { buildInvite } from './ics.js';

const MAX_BODY = 200_000;

export function createApi({ store, limiter, publicUrl = '', info = {} }) {
  const bearer = (req) => {
    const m = /^Bearer\s+([A-Za-z0-9_-]{16,128})$/.exec(req.header('authorization') || '');
    return m ? m[1] : null;
  };

  async function readJson(req) {
    if (!(req.header('content-type') || '').startsWith('application/json')) {
      throw new HttpError(415, 'Send JSON with Content-Type: application/json.');
    }
    const text = await req.readText(MAX_BODY);
    if (text === null) throw new HttpError(413, 'That request is too large.');
    try {
      return JSON.parse(text || 'null');
    } catch {
      throw new HttpError(400, 'The request body is not valid JSON.');
    }
  }

  async function requirePoll(id) {
    const poll = await store.getPoll(id);
    if (!poll) throw new HttpError(404, 'This poll does not exist. It may have been deleted or expired.');
    return poll;
  }

  const isAdmin = (req, poll) => secretMatches(bearer(req), poll.adminHash);

  async function requireAdmin(req, poll) {
    if (!(await isAdmin(req, poll))) throw new HttpError(403, 'This private link is not valid. It may have been replaced.');
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
      status: status(poll),
      final: poll.final,
      slots: poll.slots,
      createdAt: poll.createdAt,
      updatedAt: poll.updatedAt,
      // null when polls are kept until deleted; only the organizer sees it.
      expiresAt: admin ? (store.retentionDays ? poll.expiresAt : null) : undefined,
      responseCount: responses.length,
      responses: visible ? responses.map((r) => publicResponse(r, poll)) : null,
      isOrganizer: admin,
    };
  }

  async function guestResponseFor(req, poll, responseId) {
    const r = await store.getResponse(poll.id, responseId);
    if (!r) throw new HttpError(404, 'That response no longer exists.');
    if (!(await secretMatches(bearer(req), r.editHash))) throw new HttpError(403, 'Only the person who sent this response can change it.');
    return r;
  }

  const routes = [
    ['GET', /^\/api\/config$/, () => ({ body: { retentionDays: store.retentionDays, limits: LIMITS, ...info } })],

    ['POST', /^\/api\/polls$/, async (req) => {
      limiter.check(req.ip, 'create');
      const fields = validatePollFields(await readJson(req));
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
      if (!body || typeof body !== 'object' || Array.isArray(body)) throw new HttpError(400, 'Send the changes as a JSON object.');
      const { status: nextStatus, final, ...rest } = body;
      if (nextStatus === 'open' && final) throw new HttpError(400, 'Reopening a poll clears its final time, so send one or the other.', 'final');
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
        else throw new HttpError(400, 'Status must be "open" or "closed".', 'status');
      }
      const updated = await store.updatePoll(id, changes);
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
      if (poll.closed) throw new HttpError(409, 'This poll is closed, so it is not taking new responses.');
      const data = validateResponse(body, poll);
      if (await store.countResponses(id) >= LIMITS.responses) throw new HttpError(409, `This poll already has ${LIMITS.responses} responses.`);
      // Names are unique when everyone can see responses, so nobody is confused
      // about who is who. With hidden results they needn't be, so a guest can't
      // find out who responded by trying names.
      if (poll.resultsVisibility === 'everyone' && await store.nameTaken(id, data.name)) {
        throw new HttpError(409, `Someone already responded as “${data.name}”. If that was you, open your private edit link. Otherwise, add a last initial.`, 'name');
      }
      const { response, editToken } = await store.createResponse(poll, data);
      return { status: 201, body: { response: publicResponse(response, poll), editToken } };
    }],

    ['GET', /^\/api\/polls\/([a-z0-9]+)\/my-response$/, async (req, [id]) => {
      limiter.check(req.ip, 'read');
      const poll = await requirePoll(id);
      const mine = await store.findResponseByToken(poll.id, bearer(req));
      if (!mine) throw new HttpError(404, 'We could not find your response. It may have been deleted.');
      return { body: { response: publicResponse(mine, poll) } };
    }],

    ['PUT', /^\/api\/polls\/([a-z0-9]+)\/responses\/([a-z0-9]+)$/, async (req, [id, rid]) => {
      limiter.check(req.ip, 'write');
      const body = await readJson(req);
      const poll = await requirePoll(id);
      await guestResponseFor(req, poll, rid);
      if (poll.closed) throw new HttpError(409, 'This poll is closed, so responses can no longer be changed.');
      const data = validateResponse(body, poll);
      if (poll.resultsVisibility === 'everyone' && await store.nameTaken(id, data.name, rid)) {
        throw new HttpError(409, `Someone else already responded as “${data.name}”. Try adding a last initial.`, 'name');
      }
      const updated = await store.updateResponse(poll, rid, data);
      if (!updated) throw new HttpError(404, 'That response no longer exists.');
      return { body: { response: publicResponse(updated, poll) } };
    }],

    ['DELETE', /^\/api\/polls\/([a-z0-9]+)\/responses\/([a-z0-9]+)$/, async (req, [id, rid]) => {
      limiter.check(req.ip, 'write');
      const poll = await requirePoll(id);
      // The guest who wrote it, or the organizer, can delete a response. Deleting
      // your own data works even after the poll is closed.
      if (!(await isAdmin(req, poll))) await guestResponseFor(req, poll, rid);
      else if (!(await store.getResponse(id, rid))) throw new HttpError(404, 'That response no longer exists.');
      await store.deleteResponse(id, rid);
      return { status: 204 };
    }],

    ['GET', /^\/api\/polls\/([a-z0-9]+)\/invite\.ics$/, async (req, [id]) => {
      limiter.check(req.ip, 'read');
      const poll = await requirePoll(id);
      if (!poll.final) throw new HttpError(404, 'This poll does not have a final time yet.');
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
      return { status: known ? 405 : 404, body: { error: known ? 'That method is not allowed here.' : 'Not found.' }, headers: {} };
    } catch (err) {
      if (err instanceof HttpError) {
        return {
          status: err.status,
          body: { error: err.message, field: err.field },
          headers: err.retryAfter ? { 'Retry-After': String(err.retryAfter) } : {},
        };
      }
      console.error(err);
      return { status: 500, body: { error: 'Something went wrong on our side. Please try again.' }, headers: {} };
    }
  }

  return { handle };
}
