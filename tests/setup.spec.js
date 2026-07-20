// tests/setup.spec.js
import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  page: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'session.json',
      viewport: null, // Use the browser window size
    });

    const page = await context.newPage();

    await page.goto('/', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    }).catch(() => {});

    await use(page);
    await context.close();
  },
});

export { expect };