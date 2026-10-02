// "Times shown in …" line with a control to change the viewing time zone.

import { h, icon } from '../lib/dom.js';
import * as f from '../lib/format.js';

export function zoneLine({ timeZone, organizerZone, atMs, onChange, id = 'zone-line', expanded = false }) {
  const select = h('select', { id: `${id}-select`, class: 'zone-select' },
    f.allTimeZones(timeZone).map((z) => h('option', { value: z, selected: z === timeZone }, z.replace(/_/g, ' '))));
  const pickerWrap = h('div', { class: 'zone-picker', hidden: !expanded },
    h('label', { for: `${id}-select` }, 'Show times in'),
    select,
  );
  const toggle = h('button', {
    type: 'button',
    class: 'link-btn',
    'aria-expanded': expanded ? 'true' : 'false',
    'aria-controls': `${id}-picker`,
    onclick: () => {
      const open = pickerWrap.hidden;
      pickerWrap.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      if (open) select.focus();
    },
  }, 'Change');
  pickerWrap.id = `${id}-picker`;
  select.addEventListener('change', () => onChange(select.value));

  const different = organizerZone && organizerZone !== timeZone;
  return h('div', { class: 'zone-line', id },
    h('p', { class: 'zone-current' },
      icon('globe'),
      h('span', null, 'Times shown in ', h('strong', null, f.zoneLabel(timeZone, atMs))),
      toggle),
    different ? h('p', { class: 'zone-organizer muted small' }, `The organizer set this poll up in ${f.zoneLabel(organizerZone, atMs)}.`) : null,
    pickerWrap,
  );
}
