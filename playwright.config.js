// @ts-check
const { defineConfig, devices } = require("@playwright/test");

/**
 * Playwright E2E configuration.
 *
 * Tests live in ./e2e and run against a production build served statically on
 * port 3000 (`serve -s` gives SPA fallback so client-side routes like /users
 * resolve to index.html). The webServer builds + serves automatically, and
 * reuses an already-running server locally.
 *
 * These tests intentionally avoid real Firebase auth: authenticated views are
 * reached by seeding localStorage (the app derives its role UI from the
 * "subject" key), which keeps E2E deterministic and offline-friendly in CI.
 */
module.exports = defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["html", { open: "never" }], ["list"]] : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run build && npx serve -s build -l 3000",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180 * 1000,
  },
});
