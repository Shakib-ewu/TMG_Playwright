import { test as base, expect } from '@playwright/test';
import { SuitBuilderPage } from '../pages/SuitBuilderPage.js';

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.goto('/', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    }).catch(() => {});
    await use(page);
  },

  suitBuilderPage: async ({ page }, use) => {
    await use(new SuitBuilderPage(page));
  },
});

export { expect };
