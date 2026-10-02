# Deploying Overlap on GitHub Pages + Cloudflare (free)

This is how `https://overlap.runtian.uk` runs. It costs nothing and there is no
server to maintain.

```
Browser ──> https://overlap.runtian.uk        GitHub Pages (static pages, HTTPS by GitHub)
   │                                           repo: Micropeptide/overlap-runtian-uk
   └─────> https://overlap-api.<you>.workers.dev  Cloudflare Worker (API) + D1 database
```

- **Pages** are a static build of `public/` + `shared/` made by `scripts/build-pages.mjs`.
  GitHub Pages serves them, and `404.html` is the app shell, so `/p/<id>` links work.
- **API** is `worker/index.js`: the same `server/api.js` used by the Node server,
  backed by Cloudflare D1 (SQLite). Only the page origin may call it from a
  browser (CORS, `ALLOWED_ORIGINS`).
- An hourly Cron Trigger deletes expired polls.

## Free-tier limits (checked 2026-10)

- Workers Free allows 100,000 requests a day and 10 ms of CPU per request.
  Overlap's heaviest work is generating time slots. A fast path brings a 60-day,
  15-minute poll to about 1 ms.
- D1 Free allows 500 MB per database, far beyond what polls need.
- D1 keeps a 7-day point-in-time restore history ("Time Travel") on the free
  plan. The privacy page says so, because a deleted poll stays recoverable by
  the account owner for that long.

## One-time setup (already done for runtian.uk)

```bash
cd worker
npx wrangler login --use-keyring --scopes account:read user:read workers:write workers_scripts:write d1:write
npx wrangler d1 create overlap        # put the printed database_id into wrangler.toml
npx wrangler d1 migrations apply overlap --remote
npx wrangler deploy                   # prints https://overlap-api.<you>.workers.dev
```

Then build the pages against that address and publish them:

```bash
node scripts/build-pages.mjs --api https://overlap-api.<you>.workers.dev \
  --out ../sites/runtian-uk/overlap-pages --domain overlap.runtian.uk
cd ../sites/runtian-uk/overlap-pages && git add -A && git commit -m "Publish Overlap" && git push
```

Finally:

- **GitHub Pages:** in the repo, turn on Pages for `main` at the root, with custom domain `overlap.runtian.uk`.
- **DNS:** add `overlap` CNAME → `micropeptide.github.io` at WordPress.com.
- **HTTPS:** follow `docs/runtian-uk-website.md`, gotcha #3. Once the certificate shows `CN=overlap.runtian.uk`, enforce HTTPS.

## Updating

- **API change:** `npm run worker:deploy`. This applies any new migration file in
  `worker/migrations/` first, then deploys.
- **Page change:** rebuild with `scripts/build-pages.mjs` (same arguments) and push the pages repo.
- **Before either:** run `npm test`, `npm run test:e2e` (Node), and
  `npm run test:e2e:cloudflare`. The last one runs the browser tests against a
  local Worker and D1, with the pages on a separate origin, just like production.

## Schema changes

Add the column to `SCHEMA` and `MIGRATIONS` in `server/store-core.js`, which the
Node server applies itself. For D1, also add a numbered file such as
`worker/migrations/0002_<what>.sql` with the matching `ALTER TABLE`.
