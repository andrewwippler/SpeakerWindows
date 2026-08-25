import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './',
  timeout: 60000,
  retries: 1,
  use: {
    baseURL: process.env.APP_URL || 'http://localhost:3333',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
  webServer: {
    command: 'npm run dev',
    port: 3333,
    reuseExistingServer: true,
  },
})
