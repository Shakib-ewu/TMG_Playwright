// @ts-check
// Imports Playwright's configuration builder.
import { defineConfig } from '@playwright/test';
// Imports URLs, credentials, and session file paths.
import { env } from './src/config/env.js';

// Defines the test runner's global settings and named projects.
export default defineConfig({
  // Tells Playwright where test files live.
  testDir: './tests',
  // Allows independent tests to run in parallel when the project permits it.
  fullyParallel: true,
  // Fails the run if test.only is used in CI.
  forbidOnly: !!process.env.CI,
  // Retries failures only in CI environments.
  retries: process.env.CI ? 2 : 0,
  // Limits the run to one browser worker because tests share accounts and state.
  workers: 1,
  // Generates an HTML report after the run.
  reporter: 'html',
  // Provides defaults inherited by every project.
 use: {
  headless: false,
  viewport: null,

  launchOptions: {
    args: [
      '--start-maximized',
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-extensions',
      '--disable-gpu',
    ],
  },
    ignoreHTTPSErrors: true,
    baseURL: env.storeBaseUrl,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  // Defines setup, Suit Builder, and Events test projects.
  projects: [
    {
      // Unlocks and saves the storefront password session.
      name: 'setup-storefront',
      // Selects only the storefront setup spec.
      testMatch: '**/auth/save-storefront-session.spec.js',
    },
    {
      // Logs in a customer with an OTP and saves the event session.
      name: 'setup-event',
      // Selects only the event authentication setup spec.
      testMatch: '**/auth/save-event-session.spec.js',
      // Runs storefront setup before this project.
      dependencies: ['setup-storefront'],
      // Uses the unlocked storefront session as its starting state.
      use: {
        // Runs this project in Chromium.
        browserName: 'chromium',
        // Uses the configured store as the base URL.
        baseURL: env.storeBaseUrl,
        // Loads the storefront password cookie before the OTP login.
        storageState: env.storefrontSessionPath,
      },
    },
    {
      // Runs the standalone Suit Builder tests.
      name: 'suitbuilder',
      // Selects all specs in the Suit Builder test folder.
      testMatch: '**/suitbuilder/**/*.spec.js',
      // Configures the browser and saved storefront state for these tests.
      use: {
        // Runs this project in Chromium.
        browserName: 'chromium',
        // Uses the configured store as the base URL.
        baseURL: env.storeBaseUrl,
        // Loads the storefront password cookie before each test.
        storageState: env.storefrontSessionPath,
      },
    },
    {
      // Runs the complete My Events workflow.
      name: 'event',
      // Selects all specs in the event test folder.
      testMatch: '**/event/**/*.spec.js',
      // Runs customer authentication setup before the event workflow.
      dependencies: ['setup-event'],
      // Configures the browser and authenticated customer state.
      use: {
        // Runs this project in Chromium.
        browserName: 'chromium',
        // Uses the configured store as the base URL.
        baseURL: env.storeBaseUrl,
        // Loads the customer session created by the OTP setup.
        storageState: env.eventSessionPath,
      },
    },
  ],
});