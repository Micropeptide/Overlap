-- Optional email updates: subscriptions (address kept only while subscribed)
-- and a short record of changes for polls that someone follows by email.
CREATE TABLE IF NOT EXISTS email_subs (
  id TEXT PRIMARY KEY,
  poll_id TEXT NOT NULL,
  response_id TEXT,
  email TEXT NOT NULL,
  confirmed INTEGER NOT NULL DEFAULT 0,
  confirm_hash TEXT NOT NULL,
  unsub_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  last_sent_at INTEGER,
  pending_at INTEGER
);
CREATE UNIQUE INDEX IF NOT EXISTS email_subs_owner ON email_subs(poll_id, IFNULL(response_id, ''));
CREATE INDEX IF NOT EXISTS email_subs_pending ON email_subs(pending_at);
CREATE TABLE IF NOT EXISTS poll_events (
  poll_id TEXT NOT NULL,
  at INTEGER NOT NULL,
  kind TEXT NOT NULL,
  response_id TEXT
);
CREATE INDEX IF NOT EXISTS poll_events_poll ON poll_events(poll_id, at);
