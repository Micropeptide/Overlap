// Locale-aware formatting. Every function takes the time zone explicitly so
// nothing silently falls back to the device's zone.

import { describeTimeZone, parseDateKey } from '/shared/time.js';
import { locale, t } from './i18n.js';

export const deviceTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

const cache = new Map();
function fmt(opts) {
  const key = JSON.stringify(opts);
  if (!cache.has(key)) cache.set(key, new Intl.DateTimeFormat(locale(), opts));
  return cache.get(key);
}

export function time(ms, timeZone) {
  return fmt({ hour: 'numeric', minute: '2-digit', timeZone }).format(ms);
}

export function minuteOfDay(min) {
  if (min === 1440) return t('format.midnight', { time: fmt({ hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(Date.UTC(2000, 0, 2, 0, 0)) });
  return fmt({ hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(Date.UTC(2000, 0, 1, 0, min));
}

const keyToUtc = (dateKey) => {
  const { year, month, day } = parseDateKey(dateKey);
  return Date.UTC(year, month - 1, day, 12);
};

export const weekdayShort = (dateKey) => fmt({ weekday: 'short', timeZone: 'UTC' }).format(keyToUtc(dateKey));
export const monthDay = (dateKey) => fmt({ month: 'short', day: 'numeric', timeZone: 'UTC' }).format(keyToUtc(dateKey));
export const dayNumber = (dateKey) => fmt({ day: 'numeric', timeZone: 'UTC' }).format(keyToUtc(dateKey));
export const dateLong = (dateKey) => fmt({ weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(keyToUtc(dateKey));
export const dateMedium = (dateKey) => fmt({ weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(keyToUtc(dateKey));

/** "Tue, Oct 7, 9:00 – 10:30 AM" (handles ranges that cross midnight). */
export function range(start, end, timeZone, { withZone = false, year = false } = {}) {
  const f = fmt({
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone,
    ...(year ? { year: 'numeric' } : {}),
    ...(withZone ? { timeZoneName: 'short' } : {}),
  });
  return f.formatRange ? f.formatRange(start, end) : `${f.format(start)} – ${f.format(end)}`;
}

const dayKey = (ms, timeZone) => fmt({ year: 'numeric', month: '2-digit', day: '2-digit', timeZone }).format(ms);

/**
 * "9:00 – 10:30 AM". A range ending exactly at midnight stays on one line
 * ("11:00 PM – 12:00 AM"); one that runs into the next day names both days
 * ("Wed 11:00 PM – Thu 2:00 AM") instead of Intl's numeric dates.
 */
export function timeRange(start, end, timeZone) {
  const f = fmt({ hour: 'numeric', minute: '2-digit', timeZone });
  if (dayKey(start, timeZone) === dayKey(end, timeZone)) {
    return f.formatRange ? f.formatRange(start, end) : `${f.format(start)} – ${f.format(end)}`;
  }
  if (dayKey(start, timeZone) === dayKey(end - 1, timeZone)) return `${f.format(start)} – ${f.format(end)}`;
  const wd = fmt({ weekday: 'short', timeZone });
  return `${wd.format(start)} ${f.format(start)} – ${wd.format(end)} ${f.format(end)}`;
}

/** True when a range runs past midnight into another day. */
export const crossesDays = (start, end, timeZone) => dayKey(start, timeZone) !== dayKey(end - 1, timeZone);

export function dayOf(ms, timeZone) {
  return fmt({ weekday: 'short', month: 'short', day: 'numeric', timeZone }).format(ms);
}

export function longDayOf(ms, timeZone) {
  return fmt({ weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone }).format(ms);
}

/** "45 minutes", "1 hour", "1 hour 30 min", in the page's language. */
export function duration(minutes) {
  if (!minutes) return '';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const unit = (n, u, unitDisplay) => new Intl.NumberFormat(locale(), { style: 'unit', unit: u, unitDisplay }).format(n);
  if (!hrs) return unit(mins, 'minute', 'long');
  return mins ? `${unit(hrs, 'hour', 'long')} ${unit(mins, 'minute', 'short')}` : unit(hrs, 'hour', 'long');
}

export const zoneLabel = (timeZone, atMs) => describeTimeZone(timeZone, atMs);

/** Deprecated: English-only. Use t('…', { count }) with plural forms instead. */
export function plural(n, one, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

/**
 * Every zone the browser knows, plus `include` if it is missing. Browsers
 * disagree on some names (Chrome lists Asia/Calcutta, others Asia/Kolkata), so a
 * poll's own zone is always added rather than silently replaced by the first option.
 */
export function allTimeZones(include) {
  let zones = [];
  try { zones = Intl.supportedValuesOf('timeZone'); } catch { zones = []; }
  if (!zones.includes('UTC')) zones = ['UTC', ...zones];
  if (include && !zones.includes(include)) zones = [include, ...zones];
  return zones;
}

// ---------- dates or weekdays ----------
// Weekly polls name days ("Monday"); date polls name dates ("Mon, Oct 5").

export const weekdayLong = (dateKey) => fmt({ weekday: 'long', timeZone: 'UTC' }).format(keyToUtc(dateKey));
const weekdayShortOf = (ms, timeZone) => fmt({ weekday: 'short', timeZone }).format(ms);
const weekdayLongOf = (ms, timeZone) => fmt({ weekday: 'long', timeZone }).format(ms);

/** A column/day key as text. style: 'long' ("Monday" / "Monday, October 5") or 'medium'. */
export function dayName(dateKey, weekly, style = 'medium') {
  if (weekly) return style === 'long' ? weekdayLong(dateKey) : weekdayShort(dateKey);
  return style === 'long' ? dateLong(dateKey) : dateMedium(dateKey);
}

export function slotDay(ms, timeZone, weekly) {
  return weekly ? weekdayShortOf(ms, timeZone) : dayOf(ms, timeZone);
}

export function slotRange(start, end, timeZone, weekly) {
  if (!weekly) return range(start, end, timeZone);
  // A range across midnight already names both weekdays.
  return crossesDays(start, end, timeZone) ? timeRange(start, end, timeZone) : t('format.dayAndTime', { day: weekdayShortOf(start, timeZone), time: timeRange(start, end, timeZone) });
}

/** Headline day for a final time: "Every Monday" or "Monday, October 5, 2026". */
export function finalDay(ms, timeZone, weekly) {
  return weekly ? t('format.everyWeekday', { day: weekdayLongOf(ms, timeZone) }) : longDayOf(ms, timeZone);
}

/** "5 minutes ago", "yesterday", "3 days ago". */
export function ago(ms, now = Date.now()) {
  const rtf = new Intl.RelativeTimeFormat(locale(), { numeric: 'auto' });
  const sec = Math.round((ms - now) / 1000);
  const abs = Math.abs(sec);
  if (abs < 45) return t('format.justNow');
  if (abs < 3600) return rtf.format(Math.round(sec / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(sec / 3600), 'hour');
  if (abs < 30 * 86400) return rtf.format(Math.round(sec / 86400), 'day');
  return rtf.format(Math.round(sec / (30 * 86400)), 'month');
}
