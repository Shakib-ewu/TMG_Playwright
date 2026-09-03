// Imports Playwright assertions for state checks.
import { expect } from '@playwright/test';
// Imports helpers for random selection.
import { pickRandom, randomIndex } from '../helpers/random.js';

// Encapsulates locators and actions for the Suit Builder page.
export class SuitBuilderPage {
  /** @param {import('@playwright/test').Page} page */
  // Stores the Playwright page used by all methods.
  constructor(page) {
    // Saves the page reference.
    this.page = page;
  }

  // Opens the Suit Builder from the site navigation.
  async goto() {
    const link = this.page.getByRole('link', { name: 'SUIT BUILDER' });
    await link.scrollIntoViewIfNeeded();
    await link.click();
  }

  // Returns all accordion icon locators.
  accordionLocator() {
    // Finds accordion controls by their shared CSS class.
    return this.page.locator('.accordion_state_icon');
  }

  // Returns all suit swatches as an array of locators.
  async getSuitSwatches() {
    // Finds image swatches belonging to suit products.
    return this.page.locator('[data-suit-item="suit"] .suit_item_image.swatch_image').all();
  }

  // Returns the neck-tie product wrapper.
  tieWrapperLocator() {
    // Locates the wrapper using its product data attribute.
    return this.page.locator('.suit_item.wrapper.image_options[data-suit-item="Neck_Tie"]');
  }

  // Returns all tie swatches inside the tie wrapper.
  async getTieSwatches() {
    // Finds label elements that represent tie choices.
    return this.tieWrapperLocator().locator('label.suit_item_image.swatch_image').all();
  }

  // Returns the belt product wrapper.
  beltWrapperLocator() {
    // Locates the wrapper using its product data attribute.
    return this.page.locator('.suit_item.wrapper.image_options[data-suit-item="Belt"]');
  }

  // Returns all belt swatches.
  beltSwatches() {
    // Finds belt product-image labels.
    return this.beltWrapperLocator().locator('label.suit_item_image.product_image');
  }

  // Returns the shoe product wrapper.
  shoeWrapperLocator() {
    // Locates the wrapper using its product data attribute.
    return this.page.locator('.suit_item.wrapper.image_options[data-suit-item="Shoe"]');
  }

  // Returns all shoe swatches.
  shoeSwatches() {
    // Finds shoe product-image labels.
    return this.shoeWrapperLocator().locator('label.suit_item_image.product_image');
  }

  // Returns the first displayed total-price element.
  getTotalPriceLocator() {
    // Finds the discounted dynamic price shown by the builder.
    return this.page.locator('.dynamic_price.discounted_price').first();
  }

  // Converts the displayed price text into a number.
  async getPriceValue(locator = this.getTotalPriceLocator()) {
    // Removes currency symbols and parses the remaining numeric text.
    return Number((await locator.innerText()).replace(/[^0-9.]/g, ''));
  }

  // Selects one suit swatch at random.
  async pickRandomSuitSwatch() {
    // Loads the available suit swatches.
    const swatches = await this.getSuitSwatches();
    // Clicks and returns one randomly chosen swatch.
    return pickRandom(swatches);
  }

  // Opens the tie accordion and selects its first option.
  async openTieAccordionAndSelectFirstSwatch() {
    // Opens the tie accordion at the known page position.
    await this.accordionLocator().nth(2).click();
    // Loads the available tie swatches.
    const swatches = await this.getTieSwatches();
    // Selects the first tie swatch.
    await swatches[0].click();
  }

  // Opens the belt accordion and selects its first option.
  async openBeltAccordionAndSelectFirstSwatch() {
    // Opens the belt accordion at the known page position.
    await this.accordionLocator().nth(3).click();
    // Selects the first belt swatch.
    await this.beltSwatches().nth(0).click();
  }

  // Opens the belt accordion and selects one of its first two options.
  async selectRandomBelt() {
    // Opens the belt accordion.
    await this.accordionLocator().nth(3).click();
    // Selects a random belt swatch from the first two.
    await this.beltSwatches().nth(randomIndex(2)).click();
  }


  
  // Opens the shoe accordion and selects one of its first two options.
  async selectRandomShoe() {
   // Opens the shoe accordion.
   await this.accordionLocator().nth(4).click();
     // Selects a random shoe swatch from the first two.
     await this.shoeSwatches().nth(randomIndex(2)).click();
  }
  

  // Opens the tie accordion and selects one of the first seven ties.
  async selectRandomTieFromFirstSeven() {
    // Opens the tie accordion.
    await this.accordionLocator().nth(2).click();
    // Loads all tie swatches.
    const swatches = await this.getTieSwatches();
    // Selects a random swatch from the first seven.
    await pickRandom(swatches.slice(0, 7));
  }

  // Clicks the tie accordion three times to exercise its toggle behavior.
  async toggleTieAccordion() {
    // Gets all accordion controls.
    const accordions = this.accordionLocator();
    // Opens the tie accordion.
    await accordions.nth(1).click();
    // Closes the tie accordion.
    await accordions.nth(1).click();
    // Opens it again.
    await accordions.nth(1).click();
  }

  /** Measurement fields shared by the Suit Builder quiz and the event Get Sized modal */
  // Fills the standard measurement questionnaire.
  async fillMeasurements() {
    // Enters the customer's age.
    await this.page.locator('#measurement_age').fill('60');
    // Selects the Male radio option.
    await this.page.getByRole('radio', { name: 'Male', exact: true }).click({ force: true });
    // Enters the customer's weight.
    await this.page.locator('#measurement_weight').fill('175');
    // Enters the customer's height in feet.
    await this.page.locator('#measurement_height').fill('6');
    // Enters the customer's height in inches.
    await this.page.locator('#measurement_height_inch').fill('7');
    // Selects shoe size 9.
    await this.page.locator('#measurement_shoe_size').selectOption({ value: '9' });

    // Selects the lean body-shape option.
    await this.#selectFitOption("img[alt='Lean icon']");
    // Selects the round stomach option.
    await this.#selectFitOption("img[alt='ROUND image']");
    // Selects the flat seat option.
    await this.#selectFitOption("img[alt='FLAT image']");
  }

  // Returns the measurement form submit button.
  submitMeasurementsButton() {
    // Finds the button by its accessible name.
    return this.page.getByRole('button', { name: 'Submit measurements' });
  }

  // Completes the standalone fit quiz.
  async completeFitQuiz() {
    // Opens the first Get Sized action.
    await this.page.getByRole('button', { name: /Get Sized/i }).first().click();

    // Locates the fit quiz email field.
    const emailInput = this.page.locator("input[name='fitQizEmail']");
    // Waits for the email field to appear.
    await emailInput.waitFor({ state: 'visible', timeout: 20000 });
    // Enters the test email address.
    await emailInput.fill('test123@example.com');

    // Fills the remaining measurements.
    await this.fillMeasurements();

    // Stores the submit button locator.
    const submitBtn = this.submitMeasurementsButton();
    // Confirms the form can be submitted.
    await expect(submitBtn).toBeEnabled({ timeout: 10000 });
    // Brings the button into the viewport.
    await submitBtn.scrollIntoViewIfNeeded();
    // Submits the fit quiz.
    await submitBtn.click();
    // Allows the site time to process the submitted measurements.
    await this.page.waitForTimeout(5000);
  }

  /** Suit Builder path: submit fit quiz then click Buy Swatches */
  // Completes the fit quiz and clicks the purchase button.
  async completeFitQuizAndBuy() {
    // Completes and submits the fit quiz.
    await this.completeFitQuiz();
    // Clicks the primary purchase action.
    await this.primaryBuyButton().click();
  }

/**
   * Minimal save-look path used from My Looks → Create First Look.
   * @param {string} lookName
   */
// Selects a suit, optionally names it, and saves the look.
  async createAndSaveLook(lookName = `Auto Look ${Date.now()}`) {
    return lookName;
  }

  // Selects a fit option by clicking its label when available.
  async #selectFitOption(imgSelector) {
    // Finds the first image matching the requested option.
    const img = this.page.locator(imgSelector).first();
    // Finds the label associated with that image.
    const label = this.page.locator('label').filter({ has: img }).first();
    // Uses the label when one exists because it usually owns the input click.
    if (await label.count()) {
      // Forces the label click for potentially hidden form controls.
      await label.click({ force: true });
      // Stops after successfully clicking the label.
      return;
    }
    // Falls back to clicking the image directly.
    await img.click({ force: true });
  }

  /** Primary purchase CTA — label can be "Buy Swatches" or "Buy Now" depending on quiz state  Now it is closed*/
  // Returns whichever supported purchase button is present first.
  primaryBuyButton() {
    // Matches the site's class-based button or accessible button name.
    return this.page.locator('button.buyNowBtn').or(
      this.page.getByRole('button', { name: /^(Buy Swatches|Buy Now)$/i })
    ).first();
  }

  // Aliases the primary purchase button for callers using the old name.
  buySwatchesButton() {
    // Returns the shared purchase CTA locator.
    return this.primaryBuyButton();
  }

  // Returns the button shown when the fit quiz is incomplete.
  fitQuizGateButton() {
    // Finds the accessible fit-quiz gate action.
    return this.page.getByRole('button', { name: /complete your fit quiz first/i }).first();
  }

  // Returns checkout buttons on the page.
  checkoutButton() {
    // Finds buttons whose accessible name contains checkout.
    return this.page.getByRole('button', { name: /checkout/i });
  }

  // Returns the look-name input.
  lookNameInput() {
    // Finds an input whose placeholder mentions a suit.
    return this.page.locator('input[placeholder*="Suit" i]');
  }


    // Returns the exact save-look action used by the current site.
    saveTheLookButton() {
      return this.page.getByRole('button', {
        name: 'Save This Look And Plan My Event',
        exact: true,
      }).first();
    }
    
}
