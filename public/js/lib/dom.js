// Tiny DOM helpers. All user text goes in through textContent, never innerHTML.

export function h(tag, props, ...children) {
  const el = document.createElement(tag);
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k === 'style') Object.assign(el.style, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'value' || k === 'checked' || k === 'selected') el[k] = v;
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, String(v));
    }
  }
  append(el, children);
  return el;
}

export function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

/** Text with http(s) links made clickable. Built from DOM nodes, never HTML. */
export function linkify(text) {
  const out = [];
  const re = /\bhttps?:\/\/[^\s<>"]+/gi;
  let last = 0;
  for (const m of text.matchAll(re)) {
    // Trailing punctuation and closing quotes belong to the sentence, and a ")"
    // only belongs to the link when the link opened one.
    let url = m[0];
    for (;;) {
      const trimmed = url.replace(/[.,;:!?\]»”’'>]+$/, '');
      const unbalanced = trimmed.endsWith(')') && (trimmed.match(/\(/g) || []).length < (trimmed.match(/\)/g) || []).length;
      const next = unbalanced ? trimmed.slice(0, -1) : trimmed;
      if (next === url) break;
      url = next;
    }
    let host = '';
    try { host = new URL(url).hostname; } catch { /* not a usable address */ }
    if (!/[a-z0-9]/i.test(host)) continue;
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(h('a', { href: url, target: '_blank', rel: 'noopener noreferrer nofollow' }, url));
    last = m.index + url.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function clear(el) {
  while (el.firstChild) el.firstChild.remove();
  return el;
}

const ICONS = {
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 3.6 5.4 3.6 8.5S14.5 17.9 12 20.5C9.5 17.9 8.4 15.1 8.4 12S9.5 6.1 12 3.5z"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  people: '<circle cx="9" cy="9" r="3.2"/><path d="M3.5 19c.6-3 2.8-4.6 5.5-4.6s4.9 1.6 5.5 4.6"/><circle cx="16.5" cy="9.5" r="2.6"/><path d="M15.5 14.5c2.4-.2 4.4 1.1 5 4"/>',
  download: '<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14"/>',
  edit: '<path d="M15.5 5.5l3 3L9 18H6v-3z"/>',
  trash: '<path d="M5 7h14M10 7V5h4v2M7 7l1 12.5h8L17 7"/>',
  chevronLeft: '<path d="M14.5 6l-6 6 6 6"/>',
  chevronRight: '<path d="M9.5 6l6 6-6 6"/>',
  refresh: '<path d="M19 12a7 7 0 1 1-2.1-5"/><path d="M19 4.5V9h-4.5"/>',
  external: '<path d="M14 5h5v5M19 5l-8 8M17 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h4"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  share: '<path d="M12 15V4M7.5 8.5L12 4l4.5 4.5M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6"/>',
  undo: '<path d="M9 7L4.5 11.5 9 16"/><path d="M5 11.5h9a5 5 0 0 1 0 10h-2"/>',
  mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 7l8 6 8-6"/>',
};

/** Decorative stroke icon (static markup, hidden from screen readers). */
export function icon(name, cls = '') {
  const span = document.createElement('span');
  span.className = `icon ${cls}`.trim();
  span.setAttribute('aria-hidden', 'true');
  span.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
  return span;
}

let liveTimer;
/** Announce a short message to screen readers and show it as a toast. */
export function announce(message, { tone = 'info' } = {}) {
  const live = document.getElementById('live');
  const toast = document.getElementById('toast');
  if (live) {
    live.textContent = '';
    setTimeout(() => { live.textContent = message; }, 30);
  }
  if (toast) {
    toast.textContent = message;
    toast.dataset.tone = tone;
    toast.hidden = false;
    clearTimeout(liveTimer);
    liveTimer = setTimeout(() => { toast.hidden = true; }, 3200);
  }
}

export async function copyText(text, label = 'Copied') {
  try {
    await navigator.clipboard.writeText(text);
    announce(label);
    return true;
  } catch {
    // Fallback for browsers that block the async clipboard.
    const ta = h('textarea', { class: 'visually-hidden', 'aria-hidden': 'true' });
    ta.value = text;
    document.body.append(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { /* ignore */ }
    ta.remove();
    announce(ok ? label : 'Copy did not work. Select the text and copy it manually.', { tone: ok ? 'info' : 'error' });
    return ok;
  }
}

/** Accessible modal built on <dialog>. Resolves with the value of the button pressed. */
export function openDialog({ title, body, actions, describedBy }) {
  return new Promise((resolve) => {
    const titleId = `dlg-${Math.random().toString(36).slice(2)}`;
    const footer = h('div', { class: 'dialog-actions' });
    const dlg = h('dialog', { class: 'dialog', 'aria-labelledby': titleId },
      h('form', { method: 'dialog', class: 'dialog-inner' },
        h('h2', { id: titleId, class: 'dialog-title' }, title),
        body,
        footer,
      ),
    );
    for (const a of actions) {
      footer.append(h('button', {
        class: `btn ${a.kind || 'secondary'}`,
        value: a.value,
        type: a.submit ? 'submit' : 'button',
        onclick: a.submit ? null : () => dlg.close(a.value),
      }, a.label));
    }
    dlg.addEventListener('submit', (e) => {
      const btn = e.submitter;
      if (btn && actions.find((a) => a.value === btn.value)?.validate?.() === false) {
        e.preventDefault();
        return;
      }
    });
    dlg.addEventListener('close', () => {
      resolve(dlg.returnValue || 'cancel');
      dlg.remove();
    });
    if (describedBy) dlg.setAttribute('aria-describedby', describedBy);
    document.body.append(dlg);
    dlg.showModal();
  });
}

/**
 * A dialog holding a small form. `onSubmit(form)` runs on submit; if it throws,
 * the dialog stays open and shows the message. Resolves with what onSubmit
 * returned, or null if cancelled.
 */
export function formDialog({ title, intro, fields, submitLabel }, onSubmit) {
  return new Promise((resolve) => {
    const titleId = `dlg-${Math.random().toString(36).slice(2)}`;
    const error = h('p', { class: 'form-error', role: 'alert', hidden: true });
    const submit = h('button', { type: 'submit', class: 'btn primary' }, submitLabel);
    const form = h('form', { class: 'dialog-inner', novalidate: true },
      h('h2', { id: titleId, class: 'dialog-title' }, title),
      intro || null,
      fields,
      error,
      h('div', { class: 'dialog-actions' },
        h('button', { type: 'button', class: 'btn secondary', onclick: () => dlg.close() }, 'Cancel'),
        submit));
    const dlg = h('dialog', { class: 'dialog', 'aria-labelledby': titleId }, form);
    let result = null;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      error.hidden = true;
      submit.disabled = true;
      submit.dataset.busy = 'true';
      try {
        result = await onSubmit(form);
        dlg.close();
      } catch (err) {
        error.textContent = err.message;
        error.hidden = false;
        form.querySelector('input:not([type=hidden])')?.focus();
      } finally {
        submit.disabled = false;
        delete submit.dataset.busy;
      }
    });
    dlg.addEventListener('close', () => { resolve(result); dlg.remove(); });
    document.body.append(dlg);
    dlg.showModal();
  });
}

/** A labelled password box for dialogs and forms. */
export function passwordField({ id, label, hint, autocomplete = 'current-password' }) {
  const input = h('input', { id, name: id, class: 'input', type: 'password', autocomplete, minlength: '8', maxlength: '200', 'aria-describedby': hint ? `${id}-hint` : null });
  const show = h('button', {
    type: 'button', class: 'link-btn small pw-toggle', 'aria-controls': id, 'aria-pressed': 'false',
    onclick: () => {
      const visible = input.type === 'password';
      input.type = visible ? 'text' : 'password';
      show.textContent = visible ? 'Hide' : 'Show';
      show.setAttribute('aria-pressed', String(visible));
    },
  }, 'Show');
  const el = h('div', { class: 'field' },
    h('div', { class: 'label-row' }, h('label', { for: id, class: 'field-label' }, label), show),
    input,
    hint ? h('p', { class: 'field-hint', id: `${id}-hint` }, hint) : null);
  return { el, input };
}

export function confirmDialog({ title, message, confirm, danger = false }) {
  return openDialog({
    title,
    body: h('p', { class: 'dialog-text' }, message),
    actions: [
      { label: 'Cancel', value: 'cancel' },
      { label: confirm, value: 'ok', kind: danger ? 'danger' : 'primary', submit: true },
    ],
  }).then((v) => v === 'ok');
}
