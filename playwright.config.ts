import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PORT ?? 3000);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 60_000,
  expect: {
    timeout: 10_000
  },
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  webServer: {
    command: "yarn dev:next",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      AUTH_SECRET: "e2e-smoke-secret-change-me",
      NEXTAUTH_SECRET: "e2e-smoke-secret-change-me",
      AUTH_URL: baseURL,
      NEXTAUTH_URL: baseURL,
      NEXT_PUBLIC_APP_URL: baseURL,
      DATABASE_URL: "file:./storage/e2e-smoke.db",
      HOSTNAME: "localhost",
      PORT: String(port)
    }
  }
});
