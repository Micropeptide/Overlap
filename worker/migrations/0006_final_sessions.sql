-- A final time can be several sessions (e.g. Monday and Wednesday afternoons).
-- The first stays in final_start/final_end; the rest are JSON [{start, end}, …].
ALTER TABLE polls ADD COLUMN final_more TEXT;
