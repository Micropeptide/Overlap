-- Optional passwords (hashes of keys derived in the browser) and wrong-password limits.
ALTER TABLE polls ADD COLUMN admin_pw_hash TEXT;
ALTER TABLE responses ADD COLUMN pw_hash TEXT;
CREATE TABLE IF NOT EXISTS throttle (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  reset_at INTEGER NOT NULL
);
