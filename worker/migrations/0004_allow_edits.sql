-- Whether guests may change an answer after submitting it (1 = yes, the default).
ALTER TABLE polls ADD COLUMN allow_edits INTEGER NOT NULL DEFAULT 1;
