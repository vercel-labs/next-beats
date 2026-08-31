import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3002';

export default defineConfig({
  forbidOnly: !!process.env.CI,
  fullyParallel: true,
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  reporter: 'html',
  retries: process.env.CI ? 2 : 0,
  testDir: './tests',
  use: {
    baseURL,
    storageState: {
      cookies: [
        {
          domain: 'localhost',
          expires: -1,
          httpOnly: false,
          name: 'beats-user',
          path: '/',
          sameSite: 'Lax',
          secure: false,
          value: 'e2e',
        },
      ],
      origins: [],
    },
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm dev --port 3002',
    reuseExistingServer: true,
    stdout: 'pipe',
    url: `${baseURL}/login`,
  },
  workers: process.env.CI ? 1 : undefined,
});
