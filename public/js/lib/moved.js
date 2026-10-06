// Overlap changed address once (overlap.runtian.uk → overlap.runtianwu.com).
// What a browser remembers (polls you made or answered, drafts, language, …)
// belongs to one address, so the old address's page hands it over in the new
// link's #fragment (scripts/build-moved.mjs). Fragments never reach any server.
// Here it is merged in, and taken out of the address bar before anything reads
// it. What this address already remembers wins.

import { MOVED_FROM } from '../config.js';

const PARAM = /(?:^|&)moved=([^&]*)/;
const DONE = 'overlap.movedImport';

export async function importMovedStorage() {
  const raw = location.hash.slice(1);
  const found = raw.match(PARAM);
  if (!found) return;
  const rest = raw.replace(PARAM, '').replace(/^&/, '');
  history.replaceState(history.state, '', location.pathname + location.search + (rest ? `#${rest}` : ''));

  // Only the old address's own page may hand data over, not any link to here.
  let from = '';
  try { from = new URL(document.referrer).origin; } catch { return; }
  if (!MOVED_FROM.includes(from)) return;

  try {
    const payload = found[1];
    // The old page sends the same thing every time; merge it only once, so
    // polls forgotten here don't come back with each old link.
    if (localStorage.getItem(DONE) === fingerprint(payload)) return;
    const data = JSON.parse(await decode(payload));
    for (const [key, value] of Object.entries(data)) {
      if (!key.startsWith('overlap.') || key === DONE || typeof value !== 'string') continue;
      const here = localStorage.getItem(key);
      if (here === null) { localStorage.setItem(key, value); continue; }
      const old = asObject(value);
      const mine = asObject(here);
      if (old && mine) localStorage.setItem(key, JSON.stringify({ ...old, ...mine }));
    }
    localStorage.setItem(DONE, fingerprint(payload));
  } catch {
    // Storage blocked or a damaged link: the page still works, just without the handover.
  }
}

function asObject(text) {
  try {
    const v = JSON.parse(text);
    return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
}

/** "z" + base64url(deflate-raw(text)), or "j" + base64url(text) where compression isn't available. */
export async function decode(payload) {
  const bin = atob(payload.slice(1).replace(/-/g, '+').replace(/_/g, '/'));
  let bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  if (payload[0] === 'z') {
    bytes = new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
  }
  return new TextDecoder().decode(bytes);
}

function fingerprint(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return `${text.length}.${(h >>> 0).toString(36)}`;
}
