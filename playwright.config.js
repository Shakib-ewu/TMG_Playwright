// @ts-check
import { defineConfig } from '@playwright/test';
import { env } from './src/config/env.js';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    headless: false,
    viewport: null,
    launchOptions: {
      args: ['--start-maximized'],
      slowMo: 1000,
    },
    baseURL: env.storeBaseUrl,
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'setup-storefront',
      testMatch: '**/auth/save-storefront-session.spec.js',
    },
    {
      name: 'setup-event',
      testMatch: '**/auth/save-event-session.spec.js',
    },
    {
      name: 'suitbuilder',
      dependencies: ['setup-storefront'],
      testMatch: '**/suitbuilder/**/*.spec.js',
      use: {
        browserName: 'chromium',
        baseURL: env.storeBaseUrl,
        storageState: env.storefrontSessionPath,
      },
    },
    {
      name: 'event',
      dependencies: ['setup-event'],
      testMatch: '**/event/**/*.spec.js',
      use: {
        browserName: 'chromium',
        baseURL: env.storeBaseUrl,
        storageState: env.eventSessionPath,
      },
    },
  ],
});
