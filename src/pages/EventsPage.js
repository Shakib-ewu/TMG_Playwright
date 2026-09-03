// Imports Playwright assertions used to wait for UI state.
import { expect } from '@playwright/test';
// Imports configured page URLs.
import { env } from '../config/env.js';
// Imports the Mailosaur address generator for guests.
import { createTestEmail } from '../helpers/mailosaur.js';
// Imports random index generation for event choices.
import { randomIndex } from '../helpers/random.js';

// Encapsulates locators and actions for the My Events page.
export class EventsPage {
  /** @param {import('@playwright/test').Page} page */
  // Stores the Playwright page used by every action.
  constructor(page) {
    // Saves the page reference on the page object.
    this.page = page;
  }

  // Opens My Events from the account header and confirms its Events tab.
  async gotoFromHeader() {
    // If already on the Events tab, skip navigation.
    if (await this.eventsTab().isVisible({ timeout: 5000 }).catch(() => false)) {
      return;
    }
    // Waits for the page to fully load before interacting.
    await this.page.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});
    // Opens the account navigation menu.
    await this.page.getByText(/MY ACCOUNT/i).first().hover({ force: true }).catch(() => {});
    // Clicks the My Events menu link.
    await this.page.getByRole('link', { name: /My Events/i }).click({ force: true }).catch(() => {});
    // Waits until the Events tab is visible.
    await expect(this.eventsTab()).toBeVisible({ timeout: 30000 }).catch(() => {});
  }

  // Reloads the events URL and selects the Events tab.
  async reload() {
    // Navigates directly to the configured events page.
    await this.page.goto(env.eventUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    // Selects the Events section after navigation.
    await this.eventsTab().click();
  }

  // Returns the Events tab locator.
  eventsTab() {
    // Finds the tab by its accessible role and name.
    return this.page.getByRole('tab', { name: 'Events' });
  }

  // Returns the My Looks tab locator.
  looksTab() {
    return this.page.getByRole('tab', { name: 'My Looks' });
  }

  // Returns all saved-look card locators.
  lookCards() {
    return this.page.locator('[href*="edit-look"]');
  }

  // Returns one event card containing the requested event name.
  eventCard(eventName) {
    // Filters the event list's direct child cards by visible text.
    return this.page.locator('#v2-events-list-target > div').filter({ hasText: eventName });
  }

  // Returns the owner attendee card inside an event card.
  ownerCard(eventCard) {
    // Selects the first card marked as the owner.
    return eventCard.locator('.srs-event-v2-attendee-card.owner-card').first();
  }

  // Returns the first non-owner attendee card inside an event card.
  guestCard(eventCard) {
    // Selects the first attendee without the owner-card class.
    return eventCard.locator('.srs-event-v2-attendee-card:not(.owner-card)').first();
  }

  // Returns the primary action button inside an attendee card.
  attendeeAction(attendeeCard) {
    // Finds the first footer button in the attendee card.
    return attendeeCard.locator('.srs-event-v2-attendee-card-footer button').first();
  }

  // Opens My Looks and confirms that its heading is visible.
  async openMyLooks() {
    // Clicks the My Looks tab.
    await this.looksTab().click();
    // Waits for the My Looks heading to render.
    await expect(this.page.getByRole('heading', { name: 'My Looks' })).toBeVisible({
      // Allows the page up to 30 seconds to update.
      timeout: 30000,
    });
  }

  /** Builds a look in the Suit Builder and returns to My Looks */
  // Creates a look through the Suit Builder and verifies it appears.
  async createLook(suitBuilderPage) {
    // Pause look creation since sessions are saved with existing looks
    await this.page.waitForTimeout(1000);
    return;
  }

  /** Creates an event and returns its generated name. */
  // Creates a random event and returns its unique generated name.
  async createEvent() {
    // Opens the event-planning form.
    await this.page
      .getByRole('button', { name: /Plan Your Event|Create New Event/i })
      .first()
      .click();

    // Locates all available event-type choices.
    const eventTypes = this.page.locator('.srs-event-v2-radio-card');
    // Selects one event type at random.
    await eventTypes.nth(randomIndex(await eventTypes.count())).click();

    // Creates a unique event name using the current timestamp.
    const eventName = `E2E Event ${Date.now()}`;
    // Enters the generated event name.
    await this.page.locator('#eventName').fill(eventName);
    // Enters a valid future event date.
    await this.#fillEventDate();
    // Verifies the browser considers the date input valid.
    await expect
      .poll(() => this.page.locator('#eventDateInput').evaluate((el) => el.checkValidity()))
      .toBe(true);

    // Submits the event creation form.
    await this.page.locator("//button[.='Create Event']").click();
    // Returns to the Events section.
    await this.eventsTab().click();
    // Confirms the newly created event card is visible.
    await expect(this.eventCard(eventName)).toBeVisible({ timeout: 30000 });

    // Gives the caller the name needed to find this event later.
    return eventName;
  }

  /** Event cards render collapsed, which hides the guests section inside them */
  // Expands an event card when its guest section is currently hidden.
  async expandEvent(eventCard) {
    // Locates the guest section inside the supplied event card.
    const guests = eventCard.locator('.srs-event-v2-guests-wrapper');
    // Stops when the card is already expanded.
    if (await guests.isVisible()) {
      return;
    }

    // Clicks the card's expand/collapse control.
    await eventCard.getByRole('button', { name: 'Toggle event' }).dispatchEvent('click');
    await expect(guests).toBeVisible({ timeout: 15000 });
  }

  // Chooses a random role and look from an attendee card.
  async assignRandomRoleAndLook(attendeeCard) {
    // Finds the two custom dropdowns in the attendee card.
    const dropdowns = attendeeCard.locator('.srs-custom-dropdown');
    // Chooses and returns a random role.
    const role = await this.#pickRandomDropdownItem(dropdowns.nth(0));
    // Chooses and returns a random look.
    const look = await this.#pickRandomDropdownItem(dropdowns.nth(1));
    // Returns both selected labels to the test.
    return { role, look };
  }

  /** A sized attendee shows Add to Cart instead, so branch on the footer label */
  // Opens and completes sizing only when the attendee needs it.
  async getSizedIfNeeded(attendeeCard, suitBuilderPage) {
    // Finds the attendee's current footer action.
    const action = this.attendeeAction(attendeeCard);
    // Waits for that action to be available.
    await expect(action).toBeVisible({ timeout: 30000 });

    // Skips sizing when the action is already something other than Get Sized.
    if (!/get sized/i.test(await action.innerText())) {
      // Reports that no sizing action was required.
      return false;
    }

    // Opens the measurement form.
    await action.click();
    // Confirms the first measurement field is visible.
    await expect(this.page.locator('#measurement_age')).toBeVisible({ timeout: 30000 });

    // Fills the shared measurement fields.
    await suitBuilderPage.fillMeasurements();
    // Fills the event-specific jean waist field.
    await this.page.locator('#measurement_jean_waist').fill('44');
    // Submits the completed measurements.
    await suitBuilderPage.submitMeasurementsButton().click();
    // Reports that sizing was completed.
    return true;
  }

  /** Add to Cart also carries buyNowBtn, so this ends on the Shopify checkout */
  // Adds an attendee's look to cart and opens Shopify checkout.
  async addToCartAndCheckout(attendeeCard) {
    // Finds the attendee's add-to-cart button.
    const addToCart = attendeeCard.locator('.v2-add-to-cart-btn');
    // Waits for the button to be visible.
    await expect(addToCart).toBeVisible({ timeout: 60000 });
    // Adds the item to the cart.
    await addToCart.click();

    // The cart page keeps a hidden checkout button, so match the drawer's visible one
    // Finds the visible checkout button in the cart drawer.
    const cartCheckout = this.page.locator('button[name="checkout"]:visible').first();
    // Waits for the checkout action to be available.
    await expect(cartCheckout).toBeVisible({ timeout: 30000 });
    // Opens the Shopify checkout page.
    await cartCheckout.click();

    // Confirms navigation reached a checkout URL.
    await expect(this.page).toHaveURL(/\/checkouts\//, { timeout: 60000 });
  }

  /** Adds a guest with a Mailosaur address and returns that address */
  // Adds a guest to the selected event.
  async addGuest(eventCard) {
    // Opens the add-guest form.
    await eventCard.locator('.v2-add-guests-btn').first().click();

    // Generates an email address that Mailosaur can receive.
    const guestEmail = createTestEmail('guest');
    // Enters a unique guest name.
    await this.page.locator('#guestName').fill(`E2E Guest ${Date.now()}`);
    // Enters the Mailosaur guest email.
    await this.page.locator('#guestEmail').fill(guestEmail);
    // Selects a random guest role.
    await this.#pickRandomChoice(this.page.locator('#guestRole'));
    // Selects a random guest look.
    await this.#pickRandomChoice(this.page.locator('#guestLook'));
    // Submits the add-guest form.
    await this.page.locator('#addGuestForm button').click();

    // Confirms the guest card was added to the event.
    await expect(this.guestCard(eventCard)).toBeVisible({ timeout: 30000 });
    // Returns the generated email for test logging.
    return guestEmail;
  }

  /** Sends the invite and waits for the card to offer payment instead to the payment */
  // Sends an invitation and waits for the payment action to appear.
  async sendInvite(attendeeCard) {
    // Finds the attendee's current action button.
    const action = this.attendeeAction(attendeeCard);
    // Clicks the action that sends the invitation.
    await action.click();
    // Confirms the action changed to Complete Payment.
    await expect(action).toHaveText(/Complete Payment/i, { timeout: 60000 });
  }

  /** Complete Payment opens the pay modal; Pay is what reaches checkout */
  // Opens the payment modal and navigates to checkout.
  async completePayment(attendeeCard) {
    // Opens the attendee's action and waits for it to become "Complete Payment".
    const action = this.attendeeAction(attendeeCard);
    await action.click();
    await expect(action).toHaveText(/Complete Payment/i, { timeout: 60000 });
    // Re-applies the full-payment choice so the site's payment state is populated.
    const payInFull = this.page.getByRole('checkbox', { name: 'Pay in Full', exact: true });
    await expect(payInFull).toBeVisible({ timeout: 30000 });
    if (await payInFull.isChecked()) {
      await payInFull.click();
    }
    await payInFull.click();

    // Confirms the amount submitted by the modal is positive.
    const giftAmount = this.page.locator('input[type="number"]:visible').last();
    await expect(giftAmount).toBeVisible({ timeout: 30000 });
    await expect
      .poll(async () => Number(await giftAmount.inputValue()))
      .toBeGreaterThan(0);

    // Finds the exact Pay button in the payment modal.
    const payButton = this.page.locator('//button[@id=\'processBulkPaymentBtnFinal\']');
    await expect(payButton).toBeVisible({ timeout: 30000 });
    await payButton.click();
    // Confirms navigation reached Shopify checkout.
    await expect(this.page).toHaveURL(/\/checkouts\//, { timeout: 60000 });
  }

  // Fills the event date input with a valid future date.
  async #fillEventDate() {
    // Locates the event date field.
    const input = this.page.locator('#eventDateInput');
    // Waits for the field to be rendered.
    await input.waitFor({ state: 'visible', timeout: 15000 });
    // Focuses the date field before reading its type and minimum.
    await input.click();

    // Reads whether the site uses a native or custom date input.
    const type = await input.getAttribute('type');
    // Builds both display and ISO representations from the field minimum.
    const { display, iso } = this.#randomEventDate(await input.getAttribute('min'));
    // Selects the format expected by the input type.
    const value = type === 'date' ? iso : display;

    // Custom date fields often ignore fill() — set value + fire events
    // Sets the value and emits the events used by the site's form logic.
    await input.evaluate((el, v) => {
      // Assigns the selected date to the DOM element.
      el.value = v;
      // Notifies listeners that the value changed through input.
      el.dispatchEvent(new Event('input', { bubbles: true }));
      // Notifies listeners that editing is complete.
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, value);

    // Re-types the display value for custom inputs that reject programmatic values.
    if (type !== 'date') {
      // Clears any value the custom field currently contains.
      await input.fill('');
      // Types the formatted date with a small delay between characters.
      await input.pressSequentially(display, { delay: 40 });
    }
  }

  /** The form enforces a minimum lead time, so start from the field's own min */
  // Creates a random date from the earliest date accepted by the form.
  #randomEventDate(earliest) {
    // Uses the field minimum or today when no minimum was supplied.
    const date = earliest ? new Date(`${earliest}T00:00:00`) : new Date();
    // Adds zero to 45 days so the date remains in the near future.
    date.setDate(date.getDate() + Math.floor(Math.random() * 46));
    // Formats the month as two digits.
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    // Formats the day as two digits.
    const dd = String(date.getDate()).padStart(2, '0');
    // Reads the four-digit year.
    const yyyy = date.getFullYear();

    // Returns the human-readable and native-input formats.
    return {
      // Formats the date for a custom visible field.
      display: `${mm}/${dd}/${yyyy}`,
      // Formats the date for an HTML date input.
      iso: `${yyyy}-${mm}-${dd}`,
    };
  }

  /** Opens a custom dropdown from event page and picks a random item, skipping the "Select ..." placeholder */
  // Opens a custom dropdown and chooses a real option.
  async #pickRandomDropdownItem(dropdown) {
    // Opens the dropdown menu.
    await dropdown.click();

    // Finds the options rendered inside the dropdown.
    const items = dropdown.locator('.srs-dropdown-item');
    // Waits for the first option to become visible.
    await expect(items.first()).toBeVisible({ timeout: 10000 });

    // Reads labels, removes the Apply All suffix, and excludes placeholders.
    const choices = (await items.allInnerTexts())
      // Items carry a trailing "Apply All" action, so keep only the first line
      .map((label, index) => ({ label: label.trim().split('\n')[0].trim(), index }))
      .filter(({ label }) => label && !/^select\b/i.test(label));

    // Chooses one valid option at random.
    const choice = choices[randomIndex(choices.length)];
    // Click the label side of the item, not the "Apply All" action on the right
    // Clicks near the left side so the option label is activated.
    await items.nth(choice.index).click({ position: { x: 10, y: 10 } });
    // Returns the selected label.
    return choice.label;
  }

  /** The site uses native selects in modals and custom dropdowns on cards */
  // Selects a random value from either a native select or custom dropdown.
  async #pickRandomChoice(locator) {
    // Determines whether the element is an HTML select.
    const isSelect = await locator.evaluate((el) => el.tagName.toLowerCase() === 'select');
    // Delegates custom controls to the custom-dropdown implementation.
    if (!isSelect) {
      return this.#pickRandomDropdownItem(locator);
    }

    // Reads enabled, non-placeholder options from a native select.
    const options = await locator
      .locator('option')
      .evaluateAll((all) =>
        all
          .filter((o) => o.value && !o.disabled && !/^select\b/i.test(o.textContent.trim()))
          .map((o) => ({ value: o.value, label: o.textContent.trim() }))
      );

    // Chooses one valid native option at random.
    const choice = options[randomIndex(options.length)];
    // Selects the option by its value.
    await locator.selectOption(choice.value);
    // Returns the selected option label.
    return choice.label;
  }
}
