// Runs the same browser tests against the production-shaped setup: the static
// GitHub Pages build on one origin, calling the Cloudflare Worker (local
// workerd + local D1) on another.   npm run test:e2e:cloudflare
import { defineConfig } from '@playwright/test';
import base from './playwright.config.js';

const API = 'http://127.0.0.1:8788';
const PAGES = 'http://127.0.0.1:4331';
const state = '.wrangler-test';

export default defineConfig({
  ...base,
  use: { ...base.use, baseURL: PAGES },
  webServer: [
    {
      command: `rm -rf ${state} && cd worker && npx wrangler d1 migrations apply overlap --local --persist-to ../${state} && npx wrangler dev --local --persist-to ../${state} --port 8788 --ip 127.0.0.1 --var ALLOWED_ORIGINS:${PAGES} --var RATE_LIMIT_CREATE:100000 --var RATE_LIMIT_WRITE:100000 --var RATE_LIMIT_READ:1000000 --var PUBLIC_URL:${PAGES}`,
      url: `${API}/api/config`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `node scripts/build-pages.mjs --api ${API} --out data-test-pages && node scripts/serve-pages.mjs data-test-pages 4331 ${API}`,
      url: PAGES,
      reuseExistingServer: false,
    },
  ],
});
