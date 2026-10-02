// Private links remembered in this browser only (localStorage). Every access is
// guarded: private windows and strict settings can block storage entirely.

const KEYS = { managed: 'overlap.managed', answered: 'overlap.answered', tz: 'overlap.viewTz', drafts: 'overlap.drafts', name: 'overlap.name', prefs: 'overlap.formPrefs', copy: 'overlap.copyFrom' };

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export const storage = {
  managed() {
    return read(KEYS.managed, {});
  },
  getManaged(pollId) {
    return this.managed()[pollId] || null;
  },
  saveManaged(pollId, entry) {
    const all = this.managed();
    all[pollId] = { ...all[pollId], ...entry, savedAt: Date.now() };
    return write(KEYS.managed, all);
  },
  forgetManaged(pollId) {
    const all = this.managed();
    delete all[pollId];
    write(KEYS.managed, all);
  },

  getAnswer(pollId) {
    return read(KEYS.answered, {})[pollId] || null;
  },
  saveAnswer(pollId, entry) {
    const all = read(KEYS.answered, {});
    all[pollId] = { ...all[pollId], ...entry };
    return write(KEYS.answered, all);
  },
  forgetAnswer(pollId) {
    const all = read(KEYS.answered, {});
    delete all[pollId];
    write(KEYS.answered, all);
  },

  // Unsaved marks, kept so a reload or a closed tab doesn't lose them.
  getDraft(pollId) {
    return read(KEYS.drafts, {})[pollId] || null;
  },
  saveDraft(pollId, draft) {
    const all = read(KEYS.drafts, {});
    all[pollId] = { ...draft, savedAt: Date.now() };
    // Keep only the 20 most recent drafts.
    const keep = Object.entries(all).sort((x, y) => y[1].savedAt - x[1].savedAt).slice(0, 20);
    write(KEYS.drafts, Object.fromEntries(keep));
  },
  forgetDraft(pollId) {
    const all = read(KEYS.drafts, {});
    delete all[pollId];
    write(KEYS.drafts, all);
  },

  lastName() {
    return read(KEYS.name, '');
  },
  setLastName(name) {
    write(KEYS.name, name);
  },

  formPrefs() {
    return read(KEYS.prefs, {});
  },
  setFormPrefs(prefs) {
    write(KEYS.prefs, prefs);
  },

  /** Hand a poll's settings to the create form ("Duplicate poll"). Read once. */
  setCopySource(poll) {
    try { sessionStorage.setItem(KEYS.copy, JSON.stringify(poll)); } catch { /* ignore */ }
  },
  takeCopySource() {
    try {
      const raw = sessionStorage.getItem(KEYS.copy);
      sessionStorage.removeItem(KEYS.copy);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  viewTimeZone() {
    return read(KEYS.tz, null);
  },
  setViewTimeZone(tz) {
    write(KEYS.tz, tz);
  },
};

/** Read "#k=…&r=…" style fragments. */
export function hashParams() {
  return new URLSearchParams(location.hash.replace(/^#/, ''));
}
