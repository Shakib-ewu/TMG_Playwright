import { test as base, expect } from '@playwright/test';
import { env } from '../config/env.js';
import { SuitBuilderPage } from '../pages/SuitBuilderPage.js';
import { MyLooksPage } from '../pages/MyLooksPage.js';
import { EventsPage } from '../pages/EventsPage.js';
import { InvitationsPage } from '../pages/InvitationsPage.js';

/**
 * Shared fixtures. Project `use.storageState` + `use.baseURL` come from playwright.config.js.
 * Specs import `{ test, expect }` from here instead of `@playwright/test`.
 */
export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    const projectName = testInfo.project.name;
    const startUrl =
      projectName === 'event' || projectName === 'setup-event'
        ? env.myLooksUrl
        : '/';

    await page.goto(startUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    }).catch(() => {});

    await use(page);
  },

  suitBuilderPage: async ({ page }, use) => {
    await use(new SuitBuilderPage(page));
  },

  myLooksPage: async ({ page }, use) => {
    await use(new MyLooksPage(page));
  },

  eventsPage: async ({ page }, use) => {
    await use(new EventsPage(page));
  },

  invitationsPage: async ({ page }, use) => {
    await use(new InvitationsPage(page));
  },
});

export { expect };
