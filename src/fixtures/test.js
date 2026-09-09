import { test as base, expect } from '@playwright/test';
import { EventsPage } from '../pages/EventsPage.js';
import { SuitBuilderPage } from '../pages/SuitBuilderPage.js';
import { unlockStorefront } from '../helpers/storefront.js';
import { env } from '../config/env.js';

/** Strips the browser automation indicators that Cloudflare and similar services detect. */
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

/**
 * Every test starts on an unlocked storefront and gets ready-made page objects.
 *
 *   test('...', async ({ suitBuilderPage, eventsPage, page }) => { ... })
 */
export const test = base.extend({
  page: async ({ page, context }, use, testInfo) => {
    await context.addInitScript(stealthScript());

    // A failed first navigation is tolerated so the unlock check can inspect the result.
    await page
      .goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 })
      .catch(() => {});

    // Saved sessions expire, so re-save whenever an unlock was needed.
    if (await unlockStorefront(page)) {
      const sessionPath = testInfo.project.use.storageState || env.storefrontSessionPath;
      await context.storageState({ path: sessionPath });
    }

    await use(page);
  },

  suitBuilderPage: async ({ page }, use) => {
    await use(new SuitBuilderPage(page));
  },

  eventsPage: async ({ page }, use) => {
    await use(new EventsPage(page));
  },
});

export { expect };
