// What this copy of Overlap's server is set up to do, fetched once per page.

import { api } from './api.js';

let pending = null;
export function serverConfig() {
  pending ||= api('GET', '/api/config').catch(() => ({}));
  return pending;
}
