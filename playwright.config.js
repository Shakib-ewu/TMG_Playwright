// @ts-check
import fs from 'fs';
import { defineConfig } from '@playwright/test';
import { env } from './src/config/env.js';

/** Prefer saved Event login session; fall back to storefront password session */
function eventStorageState() {
  try {
    const state = JSON.parse(fs.readFileSync(env.eventSessionPath, 'utf8'));
    if (Array.isArray(state.cookies) && state.cookies.length > 0) {
      return env.eventSessionPath;
    }
  } catch {
    // ignore
  }
  return env.storefrontSessionPath;
}

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
      use: {
        browserName: 'chromium',
        baseURL: env.storeBaseUrl,
        storageState: env.storefrontSessionPath,
      },
    },
    {
      name: 'suitbuilder',
      testMatch: '**/suitbuilder/**/*.spec.js',
      use: {
        browserName: 'chromium',
        baseURL: env.storeBaseUrl,
        storageState: env.storefrontSessionPath,
      },
    },
    {
      name: 'event',
      testMatch: '**/event/**/*.spec.js',
      use: {
        browserName: 'chromium',
        baseURL: env.storeBaseUrl,
        storageState: eventStorageState(),
      },
    },
  ],
});
