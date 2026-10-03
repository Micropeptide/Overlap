import { h, clear } from '../lib/dom.js';
import { api } from '../lib/api.js';

// Every statement here describes what the code actually does. If you change
// the server's behavior, update this page in the same commit.
export async function renderPrivacy(main) {
  document.title = 'Privacy · Overlap';
  let days = 0;
  let hosting = null;
  let restoreDays = 7;
  let emails = false;
  try { ({ retentionDays: days, hosting = null, restoreDays = 7, emails = false } = await api('GET', '/api/config')); } catch { /* keep defaults */ }
  const cloudflare = hosting === 'cloudflare';

  const section = (title, ...body) => h('section', { class: 'prose-section' }, h('h2', null, title), ...body);
  const list = (...items) => h('ul', null, items.filter(Boolean).map((i) => h('li', null, i)));

  clear(main).append(h('article', { class: 'page narrow prose' },
    h('h1', { class: 'page-title' }, 'Privacy'),
    h('p', { class: 'lede' }, days
      ? 'Overlap collects only what it needs to find a time, keeps it for a limited time, and lets you delete it whenever you want.'
      : 'Overlap collects only what it needs to find a time, and lets you delete it whenever you want.'),

    section('What Overlap stores',
      list(
        'For each poll: its name, and if the organizer adds them, a note, a place or call link, and a closing date. Also the dates (or days of the week) and times offered, the time zone, the meeting length, who can see responses, and whether it is open, closed or has a final time.',
        'For each response: the display name the guest typed, the times they marked (preferred, available or if needed), and their optional note.',
        'When each poll and response was created and last changed.',
        'A scrambled fingerprint (a SHA-256 hash) of each private link, so the server can check a link without keeping a copy of it.',
        'If an organizer or guest adds an optional password: a SHA-256 hash of a key made from it in their browser. Never the password itself.',
        'How many wrong passwords were tried for each poll in the last hour (a number per poll, with no connection or device details), to stop guessing.',
        emails ? 'Only if you ask for email updates: your email address, whether you confirmed it, and when you were last emailed. While a poll has someone following it by email, Overlap also keeps a short list of what changed and when (for example “a response was added”, with the response’s id), so the next email can say what’s new. That list is cleared after 30 days.' : null,
      )),

    section('What Overlap does not collect',
      list(
        emails ? 'No accounts or phone numbers, and no email address unless you ask for emails.' : 'No accounts, email addresses or phone numbers.',
        'Optional passwords never leave your browser. It turns the password into a key (PBKDF2-SHA-256, 210,000 rounds, salted with the poll), sends only that key, and the server keeps only a hash of the key.',
        'No calendar access.',
        'No cookies, analytics, ads, tracking pixels or third-party scripts. Fonts are served from this site.',
        'Overlap doesn’t write IP addresses to its database or logs. To slow down abuse it counts requests per connection in memory for about an hour and then forgets them.',
        cloudflare
          ? 'This copy of Overlap is hosted by two companies: GitHub Pages serves the pages, and Cloudflare runs the part that stores polls (in its D1 database). Both see your IP address when you connect and may keep their own network logs. Overlap turns off Cloudflare’s optional request logging.'
          : 'The company hosting a copy of Overlap may keep its own network logs.',
        emails ? 'Emails are sent by Resend (resend.com), which receives the address and the email’s contents to deliver it and keeps its own delivery records under its privacy policy. Overlap sends nothing to Resend unless you ask for an email.' : null,
        'If a poll has a final time, you can open it in Google Calendar or Outlook.com. Clicking one of those links sends that company the event’s name, time, place, note and the poll’s guest link, and anyone with the guest link can see the poll (and, unless results are hidden, everyone’s names and times). Nothing is sent unless you click.',
      )),

    section('Who can see what',
      list(
        'The guest link shows the poll to anyone who has it. By default, guests can also see each other’s names and times. The organizer can switch this to “Only me”, and the server then stops sending other people’s responses to guests.',
        'The private link lets whoever has it edit, close or delete the poll and remove responses. The organizer can replace it at any time, which makes the old one stop working.',
        'Each guest gets a private edit link that lets them change or delete only their own response. Typing someone else’s name doesn’t give access to their response.',
        'A guest who adds a password can also open their response on another device with their name and that password. An organizer who sets a password can open the organizer view from the guest link with it. Either password can be changed or removed later.',
        'When results are set to “Only me”, guests still see how many people have responded, but not who. Names don’t have to be unique in that case, so trying a name reveals nothing either.',
        emails ? 'Your email address is never shown to the organizer, to guests, or on any page. Only the person who added it can see or change it, from the page they added it on. Update emails don’t contain private links; only an email you ask for your link in does.' : null,
        'Your browser keeps some things in its own storage, on your device only: the private links you use (or the password-derived keys you signed in with), the last name you typed, your preferred time zone and form settings, and a response you haven’t submitted yet (its marks, name and note, so a reload doesn’t lose them). “Duplicate poll” briefly holds the poll’s settings, title, note and place in the tab’s session storage. Clearing your browser data removes all of this; Overlap’s server never sees it.',
      )),

    section('How long data is kept',
      h('p', null, `${days
        ? `A poll and all its responses are deleted automatically ${days} days after the last date in the poll. A weekly poll has no last date, so it is deleted ${days} days after its last change: an edit, or a response being added or updated.`
        : 'Overlap does not delete polls on its own: a poll and its responses stay until the organizer deletes the poll.'} Organizers can delete a poll at any time, and guests can delete their own response at any time, even after the poll closes. ${emails ? 'An email address is deleted when you stop emails (from the poll page or the link in any email), when you delete your response, or when the poll is deleted. An address used only to send you your link is not stored at all. ' : ''}${cloudflare
        ? `Deleted data is removed from the live database right away. Cloudflare’s database keeps an automatic restore history for ${restoreDays} days, so for that long a deleted poll could still be recovered by whoever runs this copy of Overlap; after that it is gone.`
        : 'Deleted data is overwritten in the database file right away (SQLite’s secure delete, plus flushing its write-ahead log). If whoever runs this copy of Overlap keeps backups, a copy can remain in them until those backups expire.'}`)),

    section('Security, honestly',
      h('p', null, 'Links contain long random keys that are impractical to guess. Private keys travel after the “#” in the link, which browsers don’t send to the server or to other sites, and the server only ever receives them in a request header. Pages use a strict content security policy and send no referrer.'),
      h('p', null, 'A password is only as strong as you make it. After 30 wrong passwords in an hour, a poll stops accepting passwords (right or wrong) until the hour is up, while links keep working. Someone who obtained a copy of the database could still try to guess a weak password offline, so use one you don’t use anywhere else.'),
      h('p', null, `Overlap does not encrypt poll contents in its database, and responses are not anonymous: anyone you give the guest link to may see names and times. ${cloudflare ? 'This copy is only reachable over HTTPS, so connections are encrypted in transit.' : 'Connections are encrypted only when this copy of Overlap is served over HTTPS.'} Don’t use Overlap for anything sensitive.`)),

    section('Source',
      h('p', null, 'Overlap is a small, independent, open-source app (MIT License) by Micropeptide: ',
        h('a', { href: 'https://github.com/Micropeptide/Overlap', target: '_blank', rel: 'noopener' }, 'github.com/Micropeptide/Overlap'),
        '. It was inspired by the open-source scheduler Timeful, but shares no code with it.')),
  ));
}
