// A tiny stand-in for GitHub Pages, for testing a build locally:
//   node scripts/serve-pages.mjs <dir> <port> [api-origin]
// Unknown paths get 404.html with status 404, as on GitHub Pages. If an API
// origin is given, /api/* is proxied there (used only by the test runner's own
// requests; the pages themselves call the API cross-origin, as in production).
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';

const [dir, port, apiOrigin] = process.argv.slice(2);
const root = resolve(dir);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain' };

createServer(async (req, res) => {
  const { pathname, search } = new URL(req.url, 'http://x');
  if (apiOrigin && pathname.startsWith('/api/')) {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const headers = { ...req.headers };
    delete headers.host;
    const r = await fetch(apiOrigin + pathname + search, { method: req.method, headers, body: chunks.length ? Buffer.concat(chunks) : undefined });
    // fetch() has already decompressed the body, so drop the encoding headers.
    const out = Object.fromEntries([...r.headers].filter(([k]) => !['content-encoding', 'content-length', 'transfer-encoding'].includes(k)));
    res.writeHead(r.status, out);
    return res.end(Buffer.from(await r.arrayBuffer()));
  }
  let file = normalize(join(root, decodeURIComponent(pathname)));
  if (!file.startsWith(root)) file = root;
  let info = await stat(file).catch(() => null);
  if (info?.isDirectory()) { file = join(file, 'index.html'); info = await stat(file).catch(() => null); }
  let status = 200;
  if (!info) { file = join(root, '404.html'); status = 404; }
  const body = await readFile(file);
  res.writeHead(status, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
  res.end(body);
}).listen(Number(port), '127.0.0.1', () => console.log(`Serving ${root} on http://127.0.0.1:${port}`));
