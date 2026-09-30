import { test as base, expect } from '@playwright/test';
import { EventsPage } from '../pages/EventsPage.js';
import { ShopPage } from '../pages/ShopPage.js';
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

    // Every run already starts with a brand-new, empty browser profile, so
    // there is no local disk cache to carry stale content between runs. When
    // a preview theme still looks out of date, the stale response is coming
    // over the wire — from Shopify's CDN, not from anything on this machine.
    // Disabling the cache and asking intermediaries to skip theirs rules that
    // out completely, so a stale page always points back at the site itself.
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    await page.setExtraHTTPHeaders({ 'Cache-Control': 'no-cache', Pragma: 'no-cache' });

    // previewStoreUrl, not a bare '/': a relative goto('/') resolves against
    // baseURL and drops any query string baseURL might carry, so this has to
    // be the absolute preview-theme URL to guarantee every test starts on the
    // configured preview theme rather than the published one.
    // A failed first navigation is tolerated so the unlock check can inspect the result.
    await page
      .goto(env.previewStoreUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
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

  shopPage: async ({ page }, use) => {
    await use(new ShopPage(page));
  },
});

export { expect };
