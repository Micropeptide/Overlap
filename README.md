# Overlap

**Live at [overlap.runtian.uk](https://overlap.runtian.uk)** · by [Micropeptide](https://github.com/Micropeptide) · MIT License

Free group scheduling with no accounts. The organizer picks some dates and
shares one link. Guests type a display name and mark when they're free, and
everyone sees where the times overlap.

- No sign-up, sign-in, calendar connection or payment, for anyone. Email is optional.
- One guest link to share, plus a private link to manage the poll.
- Optional passwords: organizers and guests can get back in from any device
  without keeping links (the password never leaves the browser).
- Optional email: your private link sent to you, and update digests (new
  responses, the final time), with confirmation first and one-click unsubscribe.
- Specific dates or days of the week, in each person's own time zone.
- Best times first: everyone, then the closest matches.
- Mark times as available, preferred or if needed, by drag, keyboard or tap.
- Private edit links: nobody can overwrite your answer by typing your name.
- Close, finalize, export to CSV, and download a calendar invite.
- Polls stay until the organizer deletes them; guests can delete their own answers any time.

The full list of ideas considered, built and rejected is in
[docs/IMPROVEMENTS.md](docs/IMPROVEMENTS.md). Nothing is deleted automatically
unless you set `RETENTION_DAYS` (see Configuration).

Overlap is inspired by [Timeful](https://github.com/schej-it/timeful.app)
(AGPL-3.0) but shares **no code** with it. See [Why not fork Timeful?](#why-not-fork-timeful).

---

## Run it locally

You need **Node.js 22.13 or newer** (it uses the built-in `node:sqlite`). There
are no runtime dependencies to install.

```bash
npm start
```

Open http://127.0.0.1:3000. Data goes in `./data/overlap.db`.

`npm run dev` does the same with auto-restart when files change.

## Tests

```bash
npm install          # dev tools only: Playwright and axe-core
npm test             # unit + API tests (node:test), about 1 second
npm run test:e2e     # browser tests on desktop Chrome and a Pixel 7 profile
```

If Playwright says the browser is missing, run `npx playwright install chromium` once.

| What | Where |
| --- | --- |
| Time zone conversion, DST gaps and repeats, cross-zone layout, weekly reference weeks | `test/time.test.js` |
| Overlap ranking, meeting length, "if needed", preferred, unanswered times, duplicate partials | `test/overlap.test.js` |
| Calendar files: escaping, folding, weekly repeats, VTIMEZONE | `test/ics.test.js` |
| Create poll, validation, guest submit/edit/delete, name collisions, guest keys can't manage, link rotation, hidden results, close/finalize/reopen, `.ics`, expiry, security headers | `test/api.test.js` |
| Full organizer and guest flows by mouse, keyboard and touch; weekly polls; Tokyo and London viewers; no sideways scrolling on phones | `e2e/organizer`, `guest`, `weekly`, `timezones` |
| Preferred/erase/undo, notes, drafts, shortcuts, location, deadlines, CSV, duplicate, read-only closed polls, cross-midnight labels, drag auto-scroll | `e2e/features.spec.js` |
| Auto-refresh safety: during drags, after saves, keeping focus, filters and undo; link detection | `e2e/refresh.spec.js` |
| axe-core WCAG 2.1 AA scan of every main screen, light and dark | `e2e/a11y.spec.js` |

## Configuration

All settings are environment variables. Every one is optional.

| Variable | Default | Meaning |
| --- | --- | --- |
| `PORT` | `3000` | Port to listen on |
| `HOST` | `127.0.0.1` | Interface to bind. Use `0.0.0.0` in a container |
| `DATA_DIR` | `./data` | Where `overlap.db` lives |
| `RETENTION_DAYS` | `0` | `0` keeps polls until the organizer deletes them. A positive number turns on automatic deletion that many days after a poll's last date (weekly polls: after its last change). The privacy page, footer and organizer page follow this setting |
| `TRUST_PROXY` | `0` | Number of reverse proxies in front of Overlap (usually `1`). Rate limits then use the address that proxy appended to `X-Forwarded-For`, which clients can't fake |
| `PUBLIC_URL` | from request | Base URL used in calendar invites, e.g. `https://overlap.example.com` |
| `RATE_LIMIT_CREATE` | `30` | New polls per connection per hour |
| `RATE_LIMIT_WRITE` | `300` | Other changes per connection per 10 minutes |
| `RATE_LIMIT_READ` | `1200` | Page data requests per connection per 10 minutes |
| `RATE_LIMIT_EMAIL` | `10` | Emails a connection may ask for per hour (also capped at 5 per address and 40 per poll per day) |
| `RESEND_API_KEY` | none | Turns on email, together with `EMAIL_FROM`. A [Resend](https://resend.com) key with sending access only |
| `EMAIL_FROM` | none | Sender, e.g. `Overlap <overlap@example.com>`, on a domain verified in Resend |
| `EMAIL_OUTBOX` | none | Development: write each email as JSON into this folder instead of sending it |

Overlap refuses to start if a number setting isn't a sensible whole number,
rather than silently running without limits.

## Deploy

**The live copy** runs on GitHub Pages plus a free Cloudflare Worker with a D1
database. See [docs/DEPLOY-CLOUDFLARE.md](docs/DEPLOY-CLOUDFLARE.md). The same
browser tests run against that setup with `npm run test:e2e:cloudflare`.

To host it yourself on a server instead: Overlap is one Node process and one SQLite file. Any small VPS (1 vCPU, 512 MB) is plenty.
**Serve it over HTTPS.** Links carry keys, and only HTTPS protects them in transit.

### Option A: Docker

```bash
docker compose up -d
```

This builds the image, keeps data in the `overlap-data` volume, and listens on
`127.0.0.1:3000`. Put an HTTPS proxy in front: `deploy/Caddyfile` is a three-line
Caddy config that fetches certificates automatically. (The Dockerfile is
straightforward but wasn't built on the machine Overlap was developed on, because
Docker wasn't installed there. Check it builds before you rely on it.)

### Option B: plain Node with systemd

```bash
sudo useradd --system overlap
sudo mkdir -p /opt/overlap /var/lib/overlap && sudo chown overlap /var/lib/overlap
sudo cp -r package.json server shared public /opt/overlap/
sudo cp deploy/overlap.service /etc/systemd/system/
sudo systemctl enable --now overlap
```

Then run Caddy (or nginx) in front with `deploy/Caddyfile`.

### Option C: a platform host (Fly.io, Render, Railway, etc.)

Deploy the Dockerfile, attach a **persistent volume at `/data`**, set
`TRUST_PROXY=1` and `PUBLIC_URL`. Without a persistent volume, polls vanish on
every redeploy.

### Backups

The whole state is `DATA_DIR/overlap.db` (plus `-wal`/`-shm` files while running).
For a consistent copy while the server runs:

```bash
npm run backup
```

This writes `backups/overlap-<timestamp>.db` (pass a directory to change it). Backups
keep deleted polls until the backup itself is deleted, so keep them short-lived,
or say so on the privacy page.

### Upgrades

Copy the new files over the old ones and restart. The schema is created with
`CREATE TABLE IF NOT EXISTS`. If you change it later, add a migration in
`server/store.js`.

## How it works

```
public/            browser app: plain ES modules, no build step
  js/views/        home (create), guest, manage (organizer), privacy, about
  js/components/   grid (the heart), date picker, poll form, best times, results
  js/config.js     where the API lives ('' = same server; rewritten for GitHub Pages)
shared/            used by BOTH browser and server
  time.js          wall clock ↔ UTC with Intl only; slot generation; viewer layout
  overlap.js       per-slot tallies and ranked "best time" windows
server/            runs anywhere (Node or Cloudflare Workers)…
  api.js           every API route, independent of the platform
  store-core.js    storage logic over a tiny async SQL driver; hashed keys
  validate.js      input checks with human error messages
  ics.js           calendar invites (with VTIMEZONE for weekly repeats)
  ratelimit.js     in-memory request limits
server/            …plus the Node-only parts
  index.js         config, startup, optional hourly expiry sweep
  app.js           static files, security headers, Node HTTP adapter
  store.js         node:sqlite driver (secure delete, WAL checkpoints)
worker/            Cloudflare Workers adapter (D1 driver, CORS, optional cron) + D1 migrations
scripts/           build-pages (GitHub Pages), serve-pages (local stand-in), backup
```

**Time model.** A poll is "these dates, from 9:00 to 17:00, in Europe/London,
in 30-minute steps". The server expands it into *slots*: UTC instants for each
step on the organizer's wall clock. Responses store slot instants, so an answer
means the same moment for everyone. The browser groups slots into columns
(local dates) and rows (local times) in whatever zone the viewer picks. On a
spring-forward day, times that don't exist are skipped. On a fall-back day, a
repeated wall time is offered once (its first occurrence).

**Weekly polls.** The chosen weekdays are pinned to one Monday-to-Sunday
*reference week* near the poll's creation, and slots are generated in that week
exactly as for dates, so ranking and time zones need no special cases. Only the
labels change ("Mon" rather than "Mon, Oct 5"). The reference week avoids a
daylight saving change in the organizer's zone. Editing the days keeps the same
week, so existing answers keep their meaning. A weekly final time becomes a
repeating calendar event (`RRULE:FREQ=WEEKLY`) pinned to the organizer's zone,
so it stays at the same local time when clocks change.

**Identity without accounts.** Creating a poll returns a random 192-bit key. The
private link is `/m/<poll>#k=<key>`. Answering returns a separate key, and the
edit link is `/p/<poll>#r=<key>`. The part after `#` never reaches the server
in a page request; the browser sends the key only in an `Authorization` header
to the API. The database stores SHA-256 hashes of keys, never the keys themselves.
Keys are also kept in the browser's `localStorage`, so returning on the same
device just works.

**Optional passwords.** The browser turns a password into a key with
PBKDF2-SHA-256 (210,000 rounds, salted with `overlap/v1/<role>/<poll id>`), and
the server stores a SHA-256 hash of that key, as it does for link keys. An
organizer password is accepted as `Authorization: Bearer <key>` alongside the
private link. A guest signs in with `POST /sign-in {name, password: key}` and
then sends `Authorization: Password <response id>:<key>`. After 30 wrong
passwords in an hour a poll refuses all passwords (right or wrong) until the
hour is up; the count lives in the database (`throttle`), so it holds across
Worker instances. Links are never locked out.

**Optional email.** `PUT …/email {email, updates, link}` sends one email: the
private link (only a key the browser already holds, checked against its hash)
and/or a button to confirm updates. Nothing else is sent until confirmed. While
a poll has a confirmed subscriber, changes are noted in `poll_events` (kind,
time, response id; no names), and every few minutes (Node timer, Worker cron)
`sendDueDigests` sends each subscriber one digest after changes settle for 5
minutes, at most every 30 minutes, never about their own doing. Update emails
never contain private links. Addresses are deleted on unsubscribe, response
deletion or poll deletion; a link-only request stores none.

**"Unanswered" vs "unavailable".** Each response records which slots existed
when it was saved. If the organizer later adds dates, those new slots show as
"hasn't seen this time" (crosshatched) rather than "not available".

**API** (JSON). Organizer endpoints need `Authorization: Bearer <private key>`.

| Method | Path | Who |
| --- | --- | --- |
| `POST` | `/api/polls` | anyone: `kind: "dates"` with `dates`, or `kind: "weekly"` with `weekdays` (0 = Sunday … 6 = Saturday) |
| `GET` | `/api/polls/:id` | anyone with the id (responses omitted if hidden) |
| `GET` | `/api/polls/:id/manage` | organizer |
| `PATCH` | `/api/polls/:id` | organizer: any poll field (incl. `location`, `closesOn`), `status: open\|closed`, `final: {start,end}\|null` (start must be one of the poll's slots) |
| `DELETE` | `/api/polls/:id` | organizer |
| `POST` | `/api/polls/:id/private-link` | organizer: replace key |
| `POST` | `/api/polls/:id/responses` | guest (poll must be open): `name`, `available`, `preferred`, `ifNeeded` (lists of slot instants), optional `note` |
| `GET` | `/api/polls/:id/my-response` | guest, with edit key |
| `PUT` | `/api/polls/:id/responses/:rid` | that guest only |
| `DELETE` | `/api/polls/:id/responses/:rid` | that guest or the organizer |
| `GET` | `/api/polls/:id/invite.ics` | anyone, once a final time is set |
| `POST` | `/api/polls/:id/sign-in` | guest: `name` and `password` (a derived key) |
| `GET` `PUT` `DELETE` | `/api/polls/:id/email` | organizer: email status, send link / start updates, stop |
| `GET` `PUT` `DELETE` | `/api/polls/:id/responses/:rid/email` | that guest: the same |
| `POST` | `/api/email/confirm` | anyone with a confirmation key (`{token}`) |
| `POST` | `/api/email/unsubscribe` | anyone with an unsubscribe key (`{token}`, or `?t=` for one-click) |
| `GET` | `/api/config` | retention period, limits, and whether email is on |

## Privacy, as implemented

The in-app privacy page (`/privacy`, source in `public/js/views/privacy.js`)
is the user-facing statement. Every claim on it matches the code above:

- Stored: poll details (including an optional place and closing date), display
  names, marked times, optional guest notes, timestamps, key hashes, optional
  password-key hashes, per-poll wrong-password counts, and (only for people who
  ask for updates) email addresses plus a 30-day record of what changed. Nothing else.
- Email goes through Resend only when someone asks for an email.
- Deleted data is overwritten on disk (`secure_delete` plus a write-ahead-log
  checkpoint), not just unlinked.
- The browser keeps private links, the last name typed, form settings and
  unsubmitted marks in its own `localStorage`. The server never sees it.
- No cookies, analytics, ads, third-party scripts, fonts or CDNs. Fonts are self-hosted.
  A strict Content-Security-Policy (`default-src 'self'`) enforces this in the browser.
- No request logging. IP addresses are held in memory for rate limiting, for at
  most an hour, and are never written to disk. Your proxy or host may log them,
  so turn that off if you want the same guarantee.
- Not claimed: encryption at rest, or anonymity. Anyone with the guest link can
  see names and times unless the organizer picks "Only me".

**If you change behavior, update the privacy page in the same change.**

## Accessibility

- Visible focus on everything (3px outline, or an inset ring on grid cells).
- The grid is an ARIA `grid` with a roving tab stop. Each cell is labelled with
  its day, time and state.
- Keyboard: arrows move, Space or Enter marks, Shift with an arrow marks as you go,
  Home and End jump within a row.
- State is never shown by color alone: "if needed" is striped, "hasn't seen this
  time" is crosshatched, and "everyone" carries a check mark. Forced-colors
  (Windows High Contrast) mode is handled.
- `prefers-reduced-motion` and `prefers-color-scheme: dark` are respected.
- An axe-core scan runs in the e2e suite.

## Why not fork Timeful?

Timeful's core idea is the drag-to-paint availability grid with a group heatmap
and "if needed" times. Overlap keeps that idea. Most of Timeful's code serves
other things: Google, Outlook and Apple calendar sync, accounts, sign-up forms,
groups, Stripe and Polar payments, PostHog and GTM analytics, email reminders and
a Discord bot, built on Vue 2 and Vuetify 2 (both end-of-life) with Go and MongoDB.
Its guest responses are also keyed by guest name, which is the overwrite-by-name
problem Overlap avoids. A smaller implementation was simpler than removing all
of that. No Timeful code, text or assets are included, so its AGPL-3.0 terms
don't apply to Overlap.

## License and author

Overlap is made by [Micropeptide](https://github.com/Micropeptide) and released
under the [MIT License](LICENSE). The bundled fonts (Bricolage Grotesque, Atkinson
Hyperlegible Next) are under the SIL Open Font License; see `public/fonts/OFL-*.txt`.

## Known limitations

- **Anyone with a guest link can answer.** There is no way to stop someone with
  the link from adding a made-up name. The organizer can remove responses.
- **Edit links are bearer keys.** Lose the link and clear your browser storage,
  and without a password or an emailed copy, that response can only be removed
  by the organizer. Overlap can't recover it.
- **Passwords are only as strong as people make them.** Online guessing is capped
  per poll, but someone with a copy of the database could guess weak ones offline.
- **Weekly polls across time zones** convert using the offsets in effect when the
  poll was created. If the organizer's and a guest's zones change clocks on
  different dates (e.g. the US and Europe, for a few weeks each spring and
  autumn), a guest may see times shifted by an hour during those weeks. The
  organizer's own times never shift.
- **A poll can't switch** between dates and days of the week after it's created.
- **Overnight ranges** (e.g. 10 pm to 2 am) need to be set up as two dates.
- **Fall-back repeated hour:** on the night clocks go back in the organizer's zone,
  the repeated hour is offered once.
- **Phones:** marking is tap-by-tap, with "Whole day", "Clear" and "Copy to every
  day" shortcuts. There's no drag-to-select on touch, so that scrolling stays reliable.
- **Calendar links** for Google and Outlook.com are ordinary links. Clicking one
  sends the event's details to that company. The `.ics` download doesn't.
- **Rate limits are per process** and reset on restart. Run a single instance.
- **Clicking a heatmap cell** as the organizer opens "Choose the final time" for
  that slot. It's cancellable, but it can surprise people who are just exploring.
