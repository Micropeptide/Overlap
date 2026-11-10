-- Different hours on some days: JSON { day: [startMinute, endMinute] }, keyed by
-- date (or by weekday number for weekly polls). NULL when every day has the usual hours.
ALTER TABLE polls ADD COLUMN day_hours TEXT;
