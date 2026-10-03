// Meeting length choices shared by the poll form and the "choose a final time" dialog.

import { t, locale } from '../lib/i18n.js';

const MINUTES = [0, 15, 30, 45, 60, 90, 120, 180, 240, 480];

/** "45 minutes", "1 hour 30 minutes", "2 hours", in the page's language. */
export function lengthLabel(minutes) {
  if (!minutes) return t('lengths.notSet');
  const unit = (n, u) => new Intl.NumberFormat(locale(), { style: 'unit', unit: u, unitDisplay: 'long' }).format(n);
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (!hrs) return unit(mins, 'minute');
  return mins ? `${unit(hrs, 'hour')} ${unit(mins, 'minute')}` : unit(hrs, 'hour');
}

/** [minutes, label] pairs. A function, so labels are read after the language has loaded. */
export const lengthOptions = () => MINUTES.map((m) => [m, lengthLabel(m)]);
