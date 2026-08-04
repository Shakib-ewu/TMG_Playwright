import { env } from '../config/env.js';

export class MyLooksPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto(env.myLooksUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
  }

  heading() {
    return this.page.getByRole('heading', { name: /My Looks/i });
  }

  myLooksTab() {
    return this.page.getByRole('link', { name: /^My Looks$/i });
  }

  eventsTab() {
    return this.page.getByRole('link', { name: /^Events$/i });
  }

  invitationsTab() {
    return this.page.getByRole('link', { name: /^Invitations$/i });
  }

  planMyEventButton() {
    return this.page.getByRole('button', { name: /Plan My Event/i });
  }

  createAnotherLookButton() {
    return this.page.getByRole('button', { name: /Create Another Look/i });
  }

  yourLooksSection() {
    return this.page.getByText(/Your Looks/i);
  }

  lookCards() {
    // Cards under "Your Looks" — titles are look names; keep flexible for theme markup
    return this.page.locator('.look-card, [class*="look_card"], [class*="my-look"], article').filter({
      has: this.page.locator('img'),
    });
  }

  async openEventsTab() {
    await this.eventsTab().click();
  }

  async openInvitationsTab() {
    await this.invitationsTab().click();
  }

  async clickPlanMyEvent() {
    await this.planMyEventButton().click();
  }
}
