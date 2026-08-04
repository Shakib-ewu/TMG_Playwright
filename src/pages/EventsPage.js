import { env } from '../config/env.js';

export class EventsPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto(env.eventUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
  }

  heading() {
    return this.page.getByRole('heading', { name: /Events/i });
  }

  // Stub methods for upcoming Event create/edit flows (add selectors from next screenshots)
  createEventButton() {
    return this.page.getByRole('button', { name: /Create.*Event|Plan.*Event|New Event/i });
  }

  async startCreateEvent() {
    await this.createEventButton().first().click();
  }
}
