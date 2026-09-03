// Imports Playwright's base test and assertion helper.
import { test as base, expect } from '@playwright/test';
// Imports the page object for the My Events workflow.
import { EventsPage } from '../pages/EventsPage.js';
// Imports the page object for the Suit Builder workflow.
import { SuitBuilderPage } from '../pages/SuitBuilderPage.js';
// Imports the helper that unlocks a password-protected Shopify storefront.
import { unlockStorefront } from '../helpers/mailosaur.js';
// Imports environment-derived paths used when saving refreshed sessions.
import { env } from '../config/env.js';

// Strips browser automation indicators that Cloudflare and similar services detect.
function stealthScript() {
  return `
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    window.chrome = { runtime: {} };
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
    Object.defineProperty(navigator, 'connection', { get: () => ({ effectiveType: '4g', downlink: 10, rtt: 50 }) });
    document.documentElement.removeAttribute('webdriver');
    window.outerWidth = 1280;
    window.outerHeight = 720;
    window.innerWidth = 1280;
    window.innerHeight = 720;
    Object.defineProperty(screen, 'colorDepth', { get: () => 24 });
    Object.defineProperty(screen, 'pixelDepth', { get: () => 24 });
  `;
}

// Extends Playwright's base test with project-specific fixtures.
export const test = base.extend({
  // Replaces the default page fixture with one that prepares the storefront.
  page: async ({ page, context }, use, testInfo) => {
    // Injects stealth script before any page content loads to avoid Cloudflare detection.
    await context.addInitScript(stealthScript());

    // Opens the store before each test; a failed initial navigation is tolerated here.
    await page.goto('/', {
      // Waits for the initial HTML document rather than every asset.
      waitUntil: 'domcontentloaded',
      // Allows slow Shopify responses up to one minute.
      timeout: 60000,
      // Ignores navigation errors so the unlock check can inspect the current page.
    }).catch(() => {});

    // Saved sessions expire; re-save so the next run starts already unlocked
    // Unlocks the store if the initial page redirected to Shopify's password form.
    if (await unlockStorefront(page)) {
      // Uses the project storage path, falling back to the storefront session path.
      const sessionPath = testInfo.project.use.storageState || env.storefrontSessionPath;
      // Persists the newly acquired storefront cookie for later tests.
      await context.storageState({ path: sessionPath });
    }

    // Makes the prepared page available to the actual test body.
    await use(page);
  },

  // Creates a SuitBuilderPage object around the prepared Playwright page.
  suitBuilderPage: async ({ page }, use) => {
    // Passes the page object into the test and disposes it after the test completes.
    await use(new SuitBuilderPage(page));
  },

  // Creates an EventsPage object around the prepared Playwright page.
  eventsPage: async ({ page }, use) => {
    // Passes the page object into the test and disposes it after the test completes.
    await use(new EventsPage(page));
  },
});

// Re-exports expect so tests can import it from this fixture module if needed.
export { expect };