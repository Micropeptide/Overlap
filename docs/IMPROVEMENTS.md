# Improvement log

Ideas considered for Overlap, what was built, and why the rest weren't. Each
idea was judged against the product's rules:

- No accounts, email, calendar access or payments, for anyone.
- Collect only what scheduling needs.
- Nothing that adds ongoing administration for the one person running it.
- Keep the default interaction simple.

Status: **Built**, **Fixed** (a bug found in review), **Later** (good, but not
worth the complexity yet), **No** (conflicts with the product's rules).

## Marking availability

| Idea | Status | Notes |
| --- | --- | --- |
| "Preferred" mark, beyond Available and If needed | Built | Counts as available; breaks ties between equally good times; shown with a dot in the grid and a star in results |
| Eraser brush | Built | Clear times without toggling. Useful on touch |
| Undo / redo (buttons, Ctrl/Cmd+Z, Shift+Ctrl+Z, Ctrl+Y) | Built | 100 steps; covers drags, taps, headings, Clear all |
| Click a day heading to fill or clear the day | Built | Keyboard-reachable when there are 14 days or fewer |
| Click a time heading to fill that time on every day | Built | |
| Clear all | Built | Undoable |
| Keys 1–4 switch brushes | Built | Ignored while typing in a text field |
| Drag auto-scrolls near screen edges | Built | Paints a tall range in one drag, even past the sticky submit bar |
| Show when others are free while marking | Built | Grey bar at the cell edge, with counts for screen readers; off by default |
| Optional note per response | Built | 200 characters, shown beside the name |
| Remember your name for the next poll | Built | Local to the browser |
| Draft saved locally; restored after reload, with Discard | Built | |
| Warn before leaving with unsaved marks | Built | Only for changes made since the page loaded |
| Unsaved-changes dot on the tab | Built | |
| Column hover highlight, bolded row label | Built | |
| Sticky time labels on wide grids | Fixed | Labels scrolled away on 60-day polls |
| Explicit "Busy" mark, separate from unmarked | No | Unmarked already means busy; another state adds confusion |
| Ranked choice (1st, 2nd, 3rd) | No | Preferred covers the useful part |
| Per-slot comments | No | One note per response is enough |
| Paste availability from a calendar file | No | Calendar parsing invites a calendar-permission mindset; complex |
| Import from Google or Outlook free/busy | No | Needs accounts or OAuth, which the product rules out |
| "Same as last week" for weekly polls | Later | Weekly polls already ask for a typical week |
| Long-press drag on phones | Later | Conflicts with scrolling; day tools cover it |
| Copy one day to another (desktop) | Later | Phones have "Copy to every day" |

## Results and choosing a time

| Idea | Status | Notes |
| --- | --- | --- |
| Preferred counts in Best times and in the slot detail | Built | |
| Hovering or focusing a best time outlines it on the grid | Built | |
| "Show numbers" in heatmap cells | Built | |
| Answered "2 hours ago" in the people list | Built | |
| Notes in the people list | Built | |
| CSV export (one row per person, one column per time) | Built | Formula-like values neutralised for spreadsheets |
| Results refresh when you return to the tab, and every minute | Built | Never interrupts a half-edited form |
| De-duplicated partial matches | Fixed | The old filter never fired; now hides options that repeat a better one |
| Meeting-length label ("45 min" not "1 hour") | Fixed | |
| Cross-midnight times read "Wed 11:00 PM – Thu 2:00 AM" | Fixed | Intl printed numeric dates, and leaked the weekly reference week |
| Required vs optional attendees | Later | Useful for work meetings; makes "everyone" ambiguous |
| Minimum attendees filter | Later | |
| Suggest a time automatically when everyone has answered | No | The organizer decides; Overlap ranks |
| Polls with time-limited "holds" or booking slots | No | A different product (sign-up sheets) |

## Organizer tools

| Idea | Status | Notes |
| --- | --- | --- |
| Location or video-call link, shown and added to invites | Built | Links are clickable |
| Clickable links in the description | Built | http and https only, built from DOM nodes |
| Closing date (auto-close at end of a day) | Built | Reopening clears a passed deadline |
| Duplicate poll | Built | Copies settings, not responses; drops past dates |
| Share sheet on phones | Built | Web Share API, only where available |
| "Copy an invitation message" | Built | |
| Add to Google Calendar or Outlook.com | Built | Plain links; only sends data when clicked, as the privacy page says |
| Weekly calendar invites include VTIMEZONE | Fixed | Outlook needs it; also fixes repeats around clock changes |
| Final time cleared when an edit removes its slot | Fixed | |
| Focus kept after close, reopen, save, cancel and remove | Fixed | |
| Email reminders or notifications | No | Needs email infrastructure and addresses |
| Organizer accounts or a dashboard across devices | No | The private link plus "Polls you manage on this device" covers it |
| Poll passwords | No | Friction for guests; the link is already the secret |
| Custom branding or themes per poll | No | Administration without scheduling value |
| Webhooks or Slack integration | No | Third-party services and upkeep |
| QR code for the guest link | Later | Would need a vendored encoder; low demand |
| Expected-guest list showing who hasn't answered | Later | Name matching is fuzzy without accounts |

## Creating a poll

| Idea | Status | Notes |
| --- | --- | --- |
| Quick picks: next 7 days, next 10 weekdays, clear | Built | |
| Shift+click a date range | Built | |
| Time presets: morning, afternoon, evening, work day, all day | Built | |
| Remember last-used times, step, length and visibility | Built | Local to the browser |
| Weekly polls | Built | Earlier round |
| Different hours on different days | Later | Doubles the form's complexity |
| Overnight ranges (10 pm to 2 am) | Later | Use two dates for now |
| Templates gallery | No | Duplicate covers it |

## Safety, privacy and operations

| Idea | Status | Notes |
| --- | --- | --- |
| Deleted data overwritten on disk (`secure_delete` plus WAL checkpoint) | Fixed | The privacy page had overstated it |
| Hidden-results polls don't reveal names through duplicate-name errors | Fixed | |
| Rate limits use the proxy-appended address, validated | Fixed | Leftmost `X-Forwarded-For` was spoofable |
| Read rate limit; bounded limiter memory | Built | |
| Settings validated at startup | Fixed | Bad values silently disabled limits |
| Dates limited to a year back and three years ahead | Fixed | Year 9999 crashed requests |
| Expiry correct where midnight can be skipped (Santiago, Beirut, Cairo…) | Fixed | Polls were deleted months early |
| Time zone names canonicalised; bare offsets rejected | Fixed | |
| Carriage returns and bidi overrides stripped from text | Fixed | Invite injection and look-alike names |
| Invisible characters ignored when comparing names | Fixed | |
| Request body read before any checks | Fixed | Stale "open" checks during slow uploads |
| Null in an edit no longer resets settings | Fixed | |
| Final time must start on a poll slot | Fixed | |
| `answered` stored compactly; slot lists cached; edit-key lookup indexed | Fixed | Large polls were slow and responses huge |
| Browser time zone aliases (Asia/Calcutta vs Asia/Kolkata) | Fixed | The edit form showed "UTC" |
| Closed polls read-only for keyboard users too | Fixed | |
| Dark-mode contrast for final-card hover and error toast | Fixed | |
| Refresh during a drag no longer leaves the page scrolling by itself | Fixed | Refreshes wait for the drag; the grid cleans up its timer |
| A refresh that started before a save can't undo it | Fixed | Requests carry an epoch; stale ones are dropped |
| Guests see organizer edits (dates, place, note) on refresh | Fixed | The server now sends `updatedAt` |
| Refresh keeps focus, the person filter, the numbers toggle and the phone's day | Fixed | |
| Undo history survives tab and time zone switches | Fixed | |
| Undoing back to what was saved isn't "unsaved" | Fixed | |
| Edits made while a save is in flight are kept | Fixed | |
| Switching "Only me" to "Everyone" keeps names unique | Fixed | SQLite's `substr` stopped at the NUL separator |
| Past closing dates and invisible-only names refused | Fixed | |
| Link detection handles brackets, quotes and empty hosts | Fixed | |
| Drag auto-scroll only near the real scrolling edge, after a short pause | Fixed | |
| `X-Robots-Tag: noindex` | Built | |
| Web app manifest (installable) | Built | |
| Link-preview metadata (generic, no poll titles) | Built | Poll titles stay out of link previews |
| `npm run backup` (consistent `VACUUM INTO` snapshot) | Built | |
| Server-rendered previews with poll titles | No | Would expose titles to chat-app crawlers |
| Analytics, even "privacy-friendly" | No | Not needed to schedule |
| End-to-end encryption of poll data | Later | Real but large: keys in links, encrypted search and ranking in the browser |
| Multi-instance deployment (shared rate limits) | Later | One process handles small-group scheduling comfortably |
| Translations | Later | Intl already localises dates and times |
| Offline support (service worker) | No | Responses need the server anyway |
| Automatic deletion after a poll's last date | Changed | Off by default (the maintainer's choice): polls stay until the organizer deletes them. `RETENTION_DAYS` turns it back on for self-hosters |
| Joined, rounded marking blocks; no focus box on mouse/touch | Built | "Not smooth, weird blue box" |
| Brighter palette (teal, violet, amber, blue heat, emerald "everyone") | Built | |
| Results above "Best times"; Best times collapsible | Built | |
| Date picker: month/year menus, Today, two months on wide screens | Built | Far-off dates took many clicks |
| "Your polls on this device": organizing and answered, with live status | Built | |
| Optional organizer and guest passwords | Built | Keys derived in the browser; per-poll guess limit in the database |
| Optional email: link by email, confirmed update digests, one-click unsubscribe | Built | Resend; off until configured |
| Accounts / sign-in (passkeys, Google, Microsoft, GitHub) | No | The maintainer's choice: keep "no login, nothing stored about you" |
| Organizer can lock answers after sending (`allowEdits`) | Built | Guests can still delete their own answer, as the privacy page promises |
| "Copy my edit link" any time, not only right after sending | Built | |
| First email update waited 30 minutes after confirming | Fixed | Confirming counted as "last emailed" |
| Phone "Select a range": tap first and last time | Built | Long blocks took a tap per half hour |
