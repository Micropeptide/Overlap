// Overlap calculation, shared by the server (tests, invites) and the browser.
//
// Each person is in one of four states for a given slot:
//   yes        they marked it available (or preferred: available, and a time
//              that suits them best, tracked separately as `pref`)
//   maybe      they marked it "if needed"
//   no         they answered the poll and left it unmarked
//   unanswered the slot was added after they last saved, so they never saw it

export const YES = 'yes';
export const MAYBE = 'maybe';
export const NO = 'no';
export const UNANSWERED = 'unanswered';

function indexResponse(r) {
  return {
    id: r.id,
    name: r.name,
    yes: new Set([...(r.available || []), ...(r.preferred || [])]),
    pref: new Set(r.preferred || []),
    maybe: new Set(r.ifNeeded || []),
    answered: r.answered ? new Set(r.answered) : null,
  };
}

export function statusAt(indexed, slot) {
  if (indexed.yes.has(slot)) return YES;
  if (indexed.maybe.has(slot)) return MAYBE;
  if (indexed.answered && !indexed.answered.has(slot)) return UNANSWERED;
  return NO;
}

/** Who is in which state at every slot. */
export function tallySlots(slots, responses) {
  const people = responses.map(indexResponse);
  const tally = new Map();
  for (const slot of slots) {
    const t = { yes: [], maybe: [], no: [], unanswered: [], pref: [] };
    for (const p of people) {
      t[statusAt(p, slot)].push(p.id);
      if (p.pref.has(slot)) t.pref.push(p.id);
    }
    tally.set(slot, t);
  }
  return tally;
}

/**
 * Rank the windows of time when people can meet.
 *
 * A meeting needs `ceil(duration / slot)` back-to-back slots. For each possible
 * start we work out who can attend the whole block: "yes" if available for all
 * of it, "maybe" if every part is available or if-needed. Consecutive starts
 * with the same attendees merge into one window, so "10:00–12:00, fits a 1 hour
 * meeting" stands in for three nearly identical rows.
 *
 * Returns { total, everyone: Window[], partial: Window[] } where everyone holds
 * windows all respondents can make (best first) and partial holds the next best
 * options with at least one person.
 */
export function rankWindows({ slots, slotMinutes, durationMinutes, responses, partialLimit = 5 }) {
  const people = responses.map(indexResponse);
  const total = people.length;
  const slotMs = slotMinutes * 60000;
  const need = Math.max(1, Math.ceil((durationMinutes || slotMinutes) / slotMinutes));
  const sorted = [...slots].sort((a, b) => a - b);

  const blocks = [];
  for (let i = 0; i + need <= sorted.length; i++) {
    let contiguous = true;
    for (let k = 1; k < need; k++) {
      if (sorted[i + k] - sorted[i + k - 1] !== slotMs) { contiguous = false; break; }
    }
    if (!contiguous) continue;
    const yes = [];
    const maybe = [];
    const pref = [];
    for (const p of people) {
      let allYes = true;
      let allOk = true;
      let allPref = true;
      for (let k = 0; k < need; k++) {
        const slot = sorted[i + k];
        const s = statusAt(p, slot);
        if (!p.pref.has(slot)) allPref = false;
        if (s !== YES) allYes = false;
        if (s !== YES && s !== MAYBE) { allOk = false; break; }
      }
      if (allYes) yes.push(p.id);
      else if (allOk) maybe.push(p.id);
      if (allOk && allPref) pref.push(p.id);
    }
    blocks.push({ start: sorted[i], end: sorted[i] + need * slotMs, yes, maybe, pref });
  }

  const sameSet = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
  const windows = [];
  for (const b of blocks) {
    const last = windows[windows.length - 1];
    if (last && b.start - last.lastStart === slotMs && sameSet(last.yes, b.yes) && sameSet(last.maybe, b.maybe) && sameSet(last.pref, b.pref)) {
      last.lastStart = b.start;
      last.end = b.end;
    } else {
      windows.push({ start: b.start, lastStart: b.start, end: b.end, yes: b.yes, maybe: b.maybe, pref: b.pref });
    }
  }
  for (const w of windows) {
    w.count = w.yes.length + w.maybe.length;
    w.minutes = Math.round((w.end - w.start) / 60000);
  }

  const better = (a, b) =>
    b.count - a.count || // more people first
    b.yes.length - a.yes.length || // fewer "if needed" first
    b.pref.length - a.pref.length || // more people's preferred times first
    b.minutes - a.minutes || // more room to move
    a.start - b.start; // earlier first

  const withPeople = windows.filter((w) => w.count > 0).sort(better);
  const everyone = total ? withPeople.filter((w) => w.count === total) : [];
  const partial = [];
  for (const w of withPeople) {
    if (w.count === total || partial.length >= partialLimit) continue;
    // Skip a window that overlaps a better one already listed that the same
    // people (and more) can make: it would only repeat that option.
    const shadowed = [...everyone, ...partial].some(
      (o) => o.start < w.end && w.start < o.end && [...w.yes, ...w.maybe].every((id) => o.yes.includes(id) || o.maybe.includes(id)),
    );
    if (!shadowed) partial.push(w);
  }
  return { total, need, everyone, partial };
}
