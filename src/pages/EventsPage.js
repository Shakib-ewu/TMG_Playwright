import { expect } from '@playwright/test';
import { env } from '../config/env.js';
import { createTestEmail } from '../helpers/mailosaur.js';
import { randomIndex } from '../helpers/random.js';

export class EventsPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  async gotoFromHeader() {
    // Hover opens the dropdown; clicking MY ACCOUNT navigates to /account instead
    await this.page.getByText(/MY ACCOUNT/i).first().hover();
    await this.page.getByRole('link', { name: /My Events/i }).click();
    await expect(this.eventsTab()).toBeVisible({ timeout: 30000 });
  }

  async reload() {
    await this.page.goto(env.eventUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await this.eventsTab().click();
  }

  eventsTab() {
    return this.page.getByRole('tab', { name: 'Events' });
  }

  looksTab() {
    return this.page.locator('button[data-target="section-looks"]');
  }

  lookCards() {
    return this.page.locator('.srs-event-v2-look-card');
  }

  eventCard(eventName) {
    return this.page.locator('#v2-events-list-target > div').filter({ hasText: eventName });
  }

  ownerCard(eventCard) {
    return eventCard.locator('.srs-event-v2-attendee-card.owner-card').first();
  }

  guestCard(eventCard) {
    return eventCard.locator('.srs-event-v2-attendee-card:not(.owner-card)').first();
  }

  attendeeAction(attendeeCard) {
    return attendeeCard.locator('.srs-event-v2-attendee-card-footer button').first();
  }

  async openMyLooks() {
    await this.looksTab().click();
    await expect(this.page.getByRole('heading', { name: 'My Looks' })).toBeVisible({
      timeout: 30000,
    });
  }

  /** Builds a look in the Suit Builder and returns to My Looks */
  async createLook(suitBuilderPage) {
    await this.page
      .getByRole('link', { name: /Create (First|Another) Look/i })
      .or(this.page.getByRole('button', { name: /Create (First|Another) Look/i }))
      .first()
      .click();

    await suitBuilderPage.pickRandomSuitSwatch();
    await suitBuilderPage.saveTheLookButton().click();

    await this.looksTab().click().catch(() => {});
    await expect(this.lookCards().first()).toBeVisible({ timeout: 30000 });
    await expect(this.lookCards()).not.toHaveCount(0);
  }

  /** Creates an event with a random type and date, and returns its name */
  async createEvent() {
    await this.page
      .getByRole('button', { name: 'Plan My Event' })
      .or(this.page.getByRole('link', { name: 'Plan My Event' }))
      .first()
      .click();

    const eventTypes = this.page.locator('.srs-event-v2-radio-card');
    await eventTypes.nth(randomIndex(await eventTypes.count())).click();

    const eventName = `E2E Event ${Date.now()}`;
    await this.page.locator('#eventName').fill(eventName);
    await this.#fillEventDate();
    await expect
      .poll(() => this.page.locator('#eventDateInput').evaluate((el) => el.checkValidity()))
      .toBe(true);

    await this.page.locator("//button[.='Create Event']").click();
    await this.eventsTab().click();
    await expect(this.eventCard(eventName)).toBeVisible({ timeout: 30000 });

    return eventName;
  }

  /** Event cards render collapsed, which hides the guests section inside them */
  async expandEvent(eventCard) {
    const guests = eventCard.locator('.srs-event-v2-guests-wrapper');
    if (await guests.isVisible()) {
      return;
    }

    await eventCard.getByRole('button', { name: 'Toggle event' }).click();
    await expect(guests).toBeVisible({ timeout: 15000 });
  }

  async assignRandomRoleAndLook(attendeeCard) {
    const dropdowns = attendeeCard.locator('.srs-custom-dropdown');
    const role = await this.#pickRandomDropdownItem(dropdowns.nth(0));
    const look = await this.#pickRandomDropdownItem(dropdowns.nth(1));
    return { role, look };
  }

  /** A sized attendee shows Add to Cart instead, so branch on the footer label */
  async getSizedIfNeeded(attendeeCard, suitBuilderPage) {
    const action = this.attendeeAction(attendeeCard);
    await expect(action).toBeVisible({ timeout: 30000 });

    if (!/get sized/i.test(await action.innerText())) {
      return false;
    }

    await action.click();
    await expect(this.page.locator('#measurement_age')).toBeVisible({ timeout: 30000 });

    await suitBuilderPage.fillMeasurements();
    await this.page.locator('#measurement_jean_waist').fill('44');
    await suitBuilderPage.submitMeasurementsButton().click();
    return true;
  }

  /** Add to Cart also carries buyNowBtn, so this ends on the Shopify checkout */
  async addToCartAndCheckout(attendeeCard) {
    const addToCart = attendeeCard.locator('.v2-add-to-cart-btn');
    await expect(addToCart).toBeVisible({ timeout: 60000 });
    await addToCart.click();

    // The cart page keeps a hidden checkout button, so match the drawer's visible one
    const cartCheckout = this.page.locator('button[name="checkout"]:visible').first();
    await expect(cartCheckout).toBeVisible({ timeout: 30000 });
    await cartCheckout.click();

    await expect(this.page).toHaveURL(/\/checkouts\//, { timeout: 60000 });
  }

  /** Adds a guest with a Mailosaur address and returns that address */
  async addGuest(eventCard) {
    await eventCard.locator('.v2-add-guests-btn').first().click();

    const guestEmail = createTestEmail('guest');
    await this.page.locator('#guestName').fill(`E2E Guest ${Date.now()}`);
    await this.page.locator('#guestEmail').fill(guestEmail);
    await this.#pickRandomChoice(this.page.locator('#guestRole'));
    await this.#pickRandomChoice(this.page.locator('#guestLook'));
    await this.page.locator('#addGuestForm button').click();

    await expect(this.guestCard(eventCard)).toBeVisible({ timeout: 30000 });
    return guestEmail;
  }

  /** Sends the invite and waits for the card to offer payment instead */
  async sendInvite(attendeeCard) {
    const action = this.attendeeAction(attendeeCard);
    await action.click();
    await expect(action).toHaveText(/Complete Payment/i, { timeout: 60000 });
  }

  /** Complete Payment opens the pay modal; Pay is what reaches checkout */
  async completePayment(attendeeCard) {
    await this.attendeeAction(attendeeCard).click();

    const payButton = this.page.getByRole('button', { name: 'Pay', exact: true });
    await expect(payButton).toBeVisible({ timeout: 30000 });
    await payButton.click();
    await expect(this.page).toHaveURL(/\/checkouts\//, { timeout: 60000 });
  }

  async #fillEventDate() {
    const input = this.page.locator('#eventDateInput');
    await input.waitFor({ state: 'visible', timeout: 15000 });
    await input.click();

    const type = await input.getAttribute('type');
    const { display, iso } = this.#randomEventDate(await input.getAttribute('min'));
    const value = type === 'date' ? iso : display;

    // Custom date fields often ignore fill() — set value + fire events
    await input.evaluate((el, v) => {
      el.value = v;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, value);

    if (type !== 'date') {
      await input.fill('');
      await input.pressSequentially(display, { delay: 40 });
    }
  }

  /** The form enforces a minimum lead time, so start from the field's own min */
  #randomEventDate(earliest) {
    const date = earliest ? new Date(`${earliest}T00:00:00`) : new Date();
    date.setDate(date.getDate() + Math.floor(Math.random() * 46));
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();

    return {
      display: `${mm}/${dd}/${yyyy}`,
      iso: `${yyyy}-${mm}-${dd}`,
    };
  }

  /** Opens a custom dropdown and picks a random item, skipping the "Select ..." placeholder */
  async #pickRandomDropdownItem(dropdown) {
    await dropdown.click();

    const items = dropdown.locator('.srs-dropdown-item');
    await expect(items.first()).toBeVisible({ timeout: 10000 });

    const choices = (await items.allInnerTexts())
      // Items carry a trailing "Apply All" action, so keep only the first line
      .map((label, index) => ({ label: label.trim().split('\n')[0].trim(), index }))
      .filter(({ label }) => label && !/^select\b/i.test(label));

    const choice = choices[randomIndex(choices.length)];
    // Click the label side of the item, not the "Apply All" action on the right
    await items.nth(choice.index).click({ position: { x: 10, y: 10 } });
    return choice.label;
  }

  /** The site uses native selects in modals and custom dropdowns on cards */
  async #pickRandomChoice(locator) {
    const isSelect = await locator.evaluate((el) => el.tagName.toLowerCase() === 'select');
    if (!isSelect) {
      return this.#pickRandomDropdownItem(locator);
    }

    const options = await locator
      .locator('option')
      .evaluateAll((all) =>
        all
          .filter((o) => o.value && !o.disabled && !/^select\b/i.test(o.textContent.trim()))
          .map((o) => ({ value: o.value, label: o.textContent.trim() }))
      );

    const choice = options[randomIndex(options.length)];
    await locator.selectOption(choice.value);
    return choice.label;
  }
}
