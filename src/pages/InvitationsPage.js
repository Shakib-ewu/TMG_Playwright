export class InvitationsPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  heading() {
    return this.page.getByRole('heading', { name: /Invitations/i });
  }

  // Stub for invite/RSVP flows once UI screenshots are available
  invitationsList() {
    return this.page.locator('[class*="invitation"], [data-invitation]');
  }
}
