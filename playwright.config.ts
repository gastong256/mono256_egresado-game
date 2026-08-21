import { defineConfig, devices } from '@playwright/test'

const port = 3100
const baseURL = `http://127.0.0.1:${port}`
const isCI = Boolean(process.env['CI'])
const reuseExistingServer =
  !isCI && process.env['PLAYWRIGHT_REUSE_SERVER'] === 'true'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  ...(isCI ? { workers: 1 } : {}),
  reporter: isCI ? [['html', { open: 'never' }], ['list']] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: {
    command: `pnpm start --hostname 127.0.0.1 --port ${port}`,
    url: `${baseURL}/api/health`,
    reuseExistingServer,
    timeout: 120_000,
    // The development engine harness is absent from a production build unless
    // this server-only opt-in is set, so the suite enables it explicitly rather
    // than the route being reachable by default.
    env: { EGRESADO_DEV_HARNESS: 'true' },
  },
})
