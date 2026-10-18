import { test } from 'node:test';
import assert from 'node:assert/strict';
import jsQR from 'jsqr';
import { qrModules, qrSvg } from '../shared/qr.js';

/** Decode our modules with an independent reader, as a phone camera would. */
function decode(modules, scale = 4) {
  const quiet = 4;
  const n = modules.length + quiet * 2;
  const w = n * scale;
  const px = new Uint8ClampedArray(w * w * 4).fill(255);
  modules.forEach((row, y) => row.forEach((dark, x) => {
    if (!dark) return;
    for (let dy = 0; dy < scale; dy++) {
      for (let dx = 0; dx < scale; dx++) {
        const i = (((y + quiet) * scale + dy) * w + (x + quiet) * scale + dx) * 4;
        px[i] = px[i + 1] = px[i + 2] = 0;
      }
    }
  }));
  return jsQR(px, w, w, { inversionAttempts: 'dontInvert' })?.data ?? null;
}

test('QR codes decode back to their text, at every version it uses', () => {
  const versions = new Set();
  for (let len = 1; len <= 213; len += 7) {
    const text = 'https://overlap.runtianwu.com/p/'.slice(0, len) + 'x'.repeat(Math.max(0, len - 32));
    const m = qrModules(text);
    versions.add((m.length - 17) / 4);
    assert.equal(decode(m), text, `length ${len}`);
  }
  assert.deepEqual([...versions].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
});

test('real poll links, and text that isn’t ASCII', () => {
  for (const text of ['https://overlap.runtianwu.com/p/8r7bxvmvdfuv', 'https://overlap.runtianwu.com/p/example', 'Café 日本語 العربية ✓']) {
    assert.equal(decode(qrModules(text)), text);
  }
});

test('too much text is refused rather than producing a broken code', () => {
  assert.throws(() => qrModules('x'.repeat(214)), RangeError);
});

test('the SVG is labelled for screen readers and keeps a light background', () => {
  const svg = qrSvg('https://example.com', { label: 'QR code for "the" link' });
  assert.match(svg, /role="img" aria-label="QR code for &quot;the&quot; link"/);
  assert.match(svg, /<rect [^>]*fill="#fff"/);
});
