-- The language update emails are written in (a code from shared/i18n/languages.js).
-- Null for subscriptions made before languages existed: those get English.
ALTER TABLE email_subs ADD COLUMN lang TEXT;
