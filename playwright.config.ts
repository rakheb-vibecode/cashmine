import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:8091';

export default defineConfig({
  testDir: 'e2e',
  testMatch: /.*\.e2e\.ts/,
  timeout: 30_000,
  use: { ...devices['Desktop Chrome'], baseURL, viewport: { width: 390, height: 844 } },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: 'npx expo start --web --port 8091', url: baseURL, reuseExistingServer: true, timeout: 120_000 },
});
