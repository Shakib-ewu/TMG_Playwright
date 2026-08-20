import { test as base, expect } from '@playwright/test';
import { EventsPage } from '../pages/EventsPage.js';
import { SuitBuilderPage } from '../pages/SuitBuilderPage.js';
import { unlockStorefront } from '../helpers/mailosaur.js';
import { env } from '../config/env.js';

export const test = base.extend({
  page: async ({ page, context }, use, testInfo) => {
    await page.goto('/', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    }).catch(() => {});

    // Saved sessions expire; re-save so the next run starts already unlocked
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
