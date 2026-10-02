import { defineConfig, devices } from '@playwright/test';

const PORT = 4319;

export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    locale: 'en-US',
    timezoneId: 'America/New_York',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `rm -rf data-test && node server/index.js`,
    url: `http://127.0.0.1:${PORT}/api/config`,
    reuseExistingServer: false,
    env: { PORT: String(PORT), DATA_DIR: 'data-test', RATE_LIMIT_CREATE: '10000', RATE_LIMIT_WRITE: '10000', RATE_LIMIT_READ: '100000' },
  },
});
