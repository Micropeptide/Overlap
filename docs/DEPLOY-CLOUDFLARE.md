# Deploying Overlap on Cloudflare (free)

This is how `https://overlap.runtianwu.com` runs. It costs nothing and there is no
server to maintain.

```
Browser ──> https://overlap.runtianwu.com     Cloudflare Worker "overlap-pages" (static assets only)
   │
   └─────> https://overlap-api.<you>.workers.dev  Cloudflare Worker (API) + D1 database

https://overlap.runtian.uk                     the old address: GitHub Pages, Micropeptide/overlap-runtian-uk,
                                               now only a page that moves people on (see "Moving to a new address")
```

- **Pages** are a static build of `public/` + `shared/` made by `scripts/build-pages.mjs`,
  served by a Worker with static assets. Paths that aren't files (`/p/<id>`, `/m/<id>`,
  `/about`, …) get `index.html` with a 200, and the app routes from the address.
- **API** is `worker/index.js`: the same `server/api.js` used by the Node server,
  backed by Cloudflare D1 (SQLite). Only the page origins may call it from a
  browser (CORS, `ALLOWED_ORIGINS`). `PUBLIC_URL` is the address emails link to.
- Polls stay until the organizer deletes them (`RETENTION_DAYS = "0"`). Setting
  `RETENTION_DAYS` turns on automatic deletion, run by the same 5-minute cron
  that sends update emails.

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

Then build the pages against that address and publish them with a static-assets
Worker on your domain (the domain's DNS must be on Cloudflare):

```bash
node scripts/build-pages.mjs --api https://overlap-api.<you>.workers.dev --out <dir>/dist
rm -rf <dir>/dist/404.html <dir>/dist/CNAME <dir>/dist/.nojekyll <dir>/dist/README.md <dir>/dist/about <dir>/dist/privacy
```

with `<dir>/wrangler.jsonc`:

```jsonc
{
  "name": "overlap-pages",
  "compatibility_date": "2026-10-01",
  "assets": { "directory": "./dist", "not_found_handling": "single-page-application" },
  "routes": [{ "pattern": "overlap.example.com", "custom_domain": true }],
  "workers_dev": false
}
```

and `npx wrangler deploy` from `<dir>`. Put the page address in `ALLOWED_ORIGINS`
and `PUBLIC_URL` in `worker/wrangler.toml` and deploy the API again.

GitHub Pages works too: build with `--domain <your domain>` (writes `CNAME`;
`404.html` is the app shell there, so `/p/<id>` links work), push the output to
a repo, turn on Pages for `main` at the root, and point a CNAME at
`<user>.github.io`. Overlap ran like this until October 2026.

## Moving to a new address

Old links must keep working, and so must what each browser remembers: the
"Your polls" list, organizer and edit links, drafts and the chosen language live
in that address's localStorage, which a new address can't read. So the old
address doesn't answer with a plain redirect; it serves a small page from
`scripts/build-moved.mjs` that

1. reads this browser's `overlap.*` entries,
2. sends the browser to the same path, query and fragment at the new address,
   with the entries added to the fragment as `moved=…` (compressed), and
3. sends only its origin as the referrer.

Fragments never reach a server. At the new address `public/js/lib/moved.js`
takes `moved=` out of the address bar before anything reads it and, if the
referrer is an address listed with `build-pages.mjs --moved-from`, merges the
entries in: anything the new address already has wins, and the same hand-over
is merged only once, so a poll forgotten at the new address stays forgotten.
A link from anywhere else carrying `moved=` is ignored.

The move from `overlap.runtian.uk` to `overlap.runtianwu.com`:

```bash
# the new address, built with --moved-from https://overlap.runtian.uk, is live first
node scripts/build-moved.mjs --to https://overlap.runtianwu.com \
  --out ../sites/runtian-uk/overlap-pages --domain overlap.runtian.uk
cd ../sites/runtian-uk/overlap-pages && git add -A && git commit -m "Overlap has moved" && git push
```

Keep the old address serving that page for as long as old links may be out
there; `ALLOWED_ORIGINS` keeps it too, for tabs that were left open.

## Email (optional, off until set up)

Email uses [Resend](https://resend.com) (free tier: 3,000 emails a month, 100 a day).
Cloudflare's own email sending needs a paid Workers plan, so it isn't used.

1. **Resend → Domains → Add domain:** `mail.runtian.uk` (a subdomain keeps the
   main domain's reputation separate). Resend lists a few DNS records (an MX
   and an SPF TXT on `send.mail`, and a DKIM TXT on `resend._domainkey.mail`).
2. **Add those records** at WordPress.com (Domains → runtian.uk → DNS), then
   click Verify in Resend.
3. **Resend → API Keys → Create:** permission *Sending access*, domain
   `mail.runtian.uk`. Never paste the key into chat or a file; store it straight
   in Cloudflare:

   ```bash
   cd worker && npx wrangler secret put RESEND_API_KEY
   ```
4. **Set the sender** in `worker/wrangler.toml`:
   `EMAIL_FROM = "Overlap <overlap@mail.runtian.uk>"`, then `npm run worker:deploy`.

`/api/config` then reports `"emails": true` and the "Email me" controls appear.
The Worker's cron (every 5 minutes) sends update digests. To turn email off
again, set `EMAIL_FROM = ""` or delete the secret (`npx wrangler secret delete RESEND_API_KEY`).

## Updating

- **API change:** `npm run worker:deploy`. This applies any new migration file in
  `worker/migrations/` first, then deploys.
- **Page change:** rebuild with `scripts/build-pages.mjs` (same arguments) and
  `npx wrangler deploy` the pages Worker.
- **Before either:** run `npm test`, `npm run test:e2e` (Node), and
  `npm run test:e2e:cloudflare`. The last one runs the browser tests against a
  local Worker and D1, with the pages on a separate origin, just like production.

## Schema changes

Add the column to `SCHEMA` and `MIGRATIONS` in `server/store-core.js`, which the
Node server applies itself. For D1, also add a numbered file such as
`worker/migrations/0004_<what>.sql` with the matching `ALTER TABLE` (0002 added
passwords, 0003 email).
