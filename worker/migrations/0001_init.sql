-- Overlap schema (generated from server/store-core.js SCHEMA)
CREATE TABLE IF NOT EXISTS polls (
  id TEXT PRIMARY KEY,
  admin_hash TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'dates',
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  timezone TEXT NOT NULL,
  dates TEXT NOT NULL,
  start_minute INTEGER NOT NULL,
  end_minute INTEGER NOT NULL,
  slot_minutes INTEGER NOT NULL,
  duration_minutes INTEGER,
  results_visibility TEXT NOT NULL DEFAULT 'everyone',
  location TEXT NOT NULL DEFAULT '',
  closes_on TEXT,
  closed INTEGER NOT NULL DEFAULT 0,
  final_start INTEGER,
  final_end INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS responses (
  id TEXT PRIMARY KEY,
  poll_id TEXT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_key TEXT NOT NULL,
  edit_hash TEXT NOT NULL,
  available TEXT NOT NULL,
  if_needed TEXT NOT NULL,
  preferred TEXT NOT NULL DEFAULT '[]',
  note TEXT NOT NULL DEFAULT '',
  answered TEXT NOT NULL,
  answered_config TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE (poll_id, name_key)
);
CREATE INDEX IF NOT EXISTS responses_poll ON responses(poll_id);
CREATE INDEX IF NOT EXISTS responses_edit ON responses(poll_id, edit_hash);
CREATE INDEX IF NOT EXISTS polls_expiry ON polls(expires_at);
