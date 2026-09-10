import { fileURLToPath } from 'node:url';

import { expect } from '@playwright/test';
import { pickRandom, randomIndex } from '../helpers/random.js';

/** Placeholder photos for the size quiz's required uploads. */
const FACING_PHOTO = fileURLToPath(new URL('../fixtures/images/facing-photo.png', import.meta.url));
const FULL_LENGTH_PHOTO = fileURLToPath(new URL('../fixtures/images/full-length-photo.png', import.meta.url));

/**
 * The Suit Builder page: pick a suit and accessories, read the running total,
 * and complete the fit quiz.
 *
 * Accessories live in accordions that are addressed by position:
 * 2 = Neck Tie, 3 = Belt, 4 = Shoe.
 */
export class SuitBuilderPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  async goto() {
    const link = this.page.getByRole('link', { name: 'SUIT BUILDER' });
    await link.scrollIntoViewIfNeeded();
    await link.click();
  }

  // --- Locators -------------------------------------------------------------

  accordionLocator() {
    return this.page.locator('.accordion_state_icon');
  }

  tieWrapperLocator() {
    return this.page.locator('.suit_item.wrapper.image_options[data-suit-item="Neck_Tie"]');
  }

  beltWrapperLocator() {
    return this.page.locator('.suit_item.wrapper.image_options[data-suit-item="Belt"]');
  }

  shoeWrapperLocator() {
    return this.page.locator('.suit_item.wrapper.image_options[data-suit-item="Shoe"]');
  }

  beltSwatches() {
    return this.beltWrapperLocator().locator('label.suit_item_image.product_image');
  }

  shoeSwatches() {
    return this.shoeWrapperLocator().locator('label.suit_item_image.product_image');
  }

  /**
   * Locator.all() does not auto-wait, so the first swatch is awaited before the
   * list is read — otherwise an early call resolves to an empty array.
   * @returns {Promise<import('@playwright/test').Locator[]>}
   */
  async getSuitSwatches() {
    const swatches = this.page.locator('[data-suit-item="suit"] .suit_item_image.swatch_image');
    await swatches.first().waitFor({ state: 'visible', timeout: 30000 });
    return swatches.all();
  }

  /** @returns {Promise<import('@playwright/test').Locator[]>} */
  async getTieSwatches() {
    const swatches = this.tieWrapperLocator().locator('label.suit_item_image.swatch_image');
    await swatches.first().waitFor({ state: 'visible', timeout: 30000 });
    return swatches.all();
  }

  getTotalPriceLocator() {
    return this.page.locator('.dynamic_price.discounted_price').first();
  }

  /**
   * The page renders more than one look-name field (one per footer panel), so
   * the visible one is the field the shopper is actually typing into.
   */
  lookNameInput() {
    return this.page.locator('input[name="lookName"]:visible').first();
  }

  /**
   * Save CTA. Its label depends on sign-in state — "Save This Look And Plan My
   * Event" when signed out, plain "Save The Look" when signed in — so the class
   * is matched instead of the text.
   */
  saveTheLookButton() {
    return this.page
      .locator('button.saveLookBtn:visible')
      .or(this.page.getByRole('button', { name: 'Save This Look And Plan My Event', exact: true }))
      .first();
  }

  /** Validation shown when the chosen look name is already taken. */
  lookNameError() {
    return this.page.getByText(/look with that name already exists/i).first();
  }

  /** Purchase CTA — the label is "Buy Swatches" or "Buy Now" depending on quiz state. */
  primaryBuyButton() {
    return this.page
      .locator('button.buyNowBtn:not(.sb_footer_v2_atc)')
      .or(this.page.getByRole('button', { name: /^(Buy Swatches|Buy Now)$/i }))
      .first();
  }

  /** The placeholder CTA shown while the fit quiz is still incomplete. */
  fitQuizGateButton() {
    return this.page.getByRole('button', { name: /complete your fit quiz first/i }).first();
  }

  checkoutButton() {
    return this.page.getByRole('button', { name: /checkout/i });
  }

  submitMeasurementsButton() {
    return this.page.getByRole('button', { name: 'Submit measurements' });
  }

  // --- Accordions -----------------------------------------------------------

  /**
   * Opens one accordion by position and leaves an already-open one alone —
   * clicking an open section collapses it, and the collapsing header then
   * swallows the clicks meant for its swatches.
   *
   * 0 = Suit, 1 = Shirt, 2 = Tie, 3 = Belt, 4 = Shoes, 5 = Socks.
   */
  async openAccordion(index) {
    const panel = this.page.locator('accordion-content').nth(index);
    const box = await panel.boundingBox();
    if (box && box.height > 0) {
      return;
    }

    await this.accordionLocator().nth(index).click();
    await expect(panel).toBeVisible();
  }

  // --- Selections -----------------------------------------------------------

  async pickRandomSuitSwatch() {
    return pickRandom(await this.getSuitSwatches());
  }

  async openTieAccordionAndSelectFirstSwatch() {
    await this.openAccordion(2);
    const swatches = await this.getTieSwatches();
    await swatches[0].click();
  }

  async openBeltAccordionAndSelectFirstSwatch() {
    await this.openAccordion(3);
    await this.beltSwatches().nth(0).click();
  }

  async selectRandomBelt() {
    await this.openAccordion(3);
    await this.beltSwatches().nth(randomIndex(2)).click();
  }

  async selectRandomShoe() {
    await this.openAccordion(4);
    await this.shoeSwatches().nth(randomIndex(2)).click();
  }

  /** Later ties are out-of-stock variants, so the random pick is capped at the first seven. */
  async selectRandomTieFromFirstSeven() {
    await this.openAccordion(2);
    const swatches = await this.getTieSwatches();
    await pickRandom(swatches.slice(0, 7));
  }

  /** Opens, closes, and reopens the tie accordion to exercise its toggle. */
  async toggleTieAccordion() {
    const accordions = this.accordionLocator();
    await accordions.nth(1).click();
    await accordions.nth(1).click();
    await accordions.nth(1).click();
  }

  // --- Looks ----------------------------------------------------------------

  /**
   * Saves the current configuration as a named look.
   * Look names must be unique per customer, so callers pass uniqueLookName().
   * @returns {Promise<string>} the name that was submitted.
   */
  async saveLook(name) {
    await this.lookNameInput().fill(name);
    await this.saveTheLookButton().click();
    return name;
  }

  // --- Price ----------------------------------------------------------------

  /** Reads the displayed price as a number, dropping currency formatting. */
  async getPriceValue(locator = this.getTotalPriceLocator()) {
    return Number((await locator.innerText()).replace(/[^0-9.]/g, ''));
  }

  // --- Fit quiz -------------------------------------------------------------

  /** Fills the measurement fields shared by the fit quiz and the event Get Sized modal. */
  async fillMeasurements() {
    await this.page.locator('#measurement_age').fill('60');
    await this.page.getByRole('radio', { name: 'Male', exact: true }).click({ force: true });
    await this.page.locator('#measurement_weight').fill('175');
    await this.page.locator('#measurement_height').fill('6');
    await this.page.locator('#measurement_height_inch').fill('7');
    await this.page.locator('#measurement_shoe_size').selectOption({ value: '9' });

    await this.#selectFitOption("img[alt='Lean icon']");
    await this.#selectFitOption("img[alt='ROUND image']");
    await this.#selectFitOption("img[alt='FLAT image']");

    // Jean waist is asked for by the size chart and the event Get Sized modal,
    // but not by the Suit Builder fit quiz, so it is filled only when present.
    const jeanWaist = this.page.locator('#measurement_jean_waist');
    if (await jeanWaist.count()) {
      await jeanWaist.fill('44');
    }

    await this.uploadFitPhotos();
  }

  /**
   * Uploads the two required fit photos. They only appear in the size quiz, so
   * each input is filled only when it is actually on the form.
   */
  async uploadFitPhotos() {
    const facing = this.page.locator('#sizeQizFacingPhoto');
    if (await facing.count()) {
      await facing.setInputFiles(FACING_PHOTO);
    }

    const fullLength = this.page.locator('#sizeQizFullPhoto');
    if (await fullLength.count()) {
      await fullLength.setInputFiles(FULL_LENGTH_PHOTO);
    }
  }

  async completeFitQuiz() {
    await this.page.getByRole('button', { name: /Get Sized/i }).first().click();

    const emailInput = this.page.locator("input[name='fitQizEmail']");
    await emailInput.waitFor({ state: 'visible', timeout: 20000 });
    await emailInput.fill('test123@example.com');

    await this.fillMeasurements();

    const submitBtn = this.submitMeasurementsButton();
    await expect(submitBtn).toBeEnabled({ timeout: 10000 });
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click();
    await this.page.waitForTimeout(5000);
  }

  async completeFitQuizAndBuy() {
    await this.completeFitQuiz();
    await this.primaryBuyButton().click();
  }

  /** Fit options hide the real input behind a label, so click the label when there is one. */
  async #selectFitOption(imgSelector) {
    const img = this.page.locator(imgSelector).first();
    const label = this.page.locator('label').filter({ has: img }).first();

    if (await label.count()) {
      await label.click({ force: true });
      return;
    }
    await img.click({ force: true });
  }

  // --- Cart -----------------------------------------------------------------

  /** The direct-purchase CTA that pushes the current swatches into the cart. */
  addToCartButton() {
    return this.page.locator('button.sb_footer_v2_atc[data-direct-purchase]').first();
  }

  /**
   * The mini-cart that slides in after Add To Cart. The theme keeps the drawer
   * twice in the DOM — only one copy is rendered — and flags the open state with
   * .is-visible, so both the class and real visibility are matched.
   */
  cartDrawer() {
    return this.page.locator('#theme-ajax-cart.is-visible:visible').first();
  }

  cartDrawerItems() {
    return this.cartDrawer().locator('.ajax-cart__product');
  }

  cartDrawerCheckoutButton() {
    return this.cartDrawer().locator('button[name="checkout"]').first();
  }

  cartDrawerCloseButton() {
    return this.cartDrawer().locator('[data-ajax-cart-close]').first();
  }

  /** Shown inside the drawer while the shopper still owes measurements. */
  fitQuizCartButton() {
    return this.cartDrawer().locator('.fitQuizCartBtn').first();
  }

  cartCountBadge() {
    return this.cartDrawer().locator('.ajax-cart__cart-count').first();
  }

  /**
   * Clicks Add To Cart and waits for the drawer to finish sliding in.
   *
   * A signed-out shopper is asked for measurements first, so the size chart is
   * completed on the way through whenever it appears.
   */
  async addToCart() {
    const button = this.addToCartButton();
    await button.scrollIntoViewIfNeeded();
    await button.click();
    await this.completeSizeChartIfShown();
    await expect(this.cartDrawer()).toBeVisible({ timeout: 20000 });
  }

  /** The measurement form shared by the Suit Builder, the size chart, and the event Get Sized modal. */
  measurementModal() {
    return this.page.locator('#measurement_age');
  }

  /**
   * Fills and submits the size chart if it blocks the current action.
   * Resolves to false when no modal appeared — an already-sized shopper.
   * @returns {Promise<boolean>} true if measurements were submitted.
   */
  async completeSizeChartIfShown(timeout = 15000) {
    try {
      await this.measurementModal().waitFor({ state: 'visible', timeout });
    } catch {
      return false;
    }

    // Email and jean waist are asked for in some variants of this form only.
    const email = this.page.locator("input[name='fitQizEmail']");
    if (await email.count()) {
      await email.fill('test123@example.com');
    }

    await this.fillMeasurements();

    const submit = this.submitMeasurementsButton();
    await expect(submit).toBeEnabled({ timeout: 10000 });
    await submit.scrollIntoViewIfNeeded();
    await submit.click();
    await this.measurementModal().waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
    return true;
  }

  /** Number of line items currently listed in the drawer. */
  async cartItemCount() {
    await expect(this.cartDrawerItems().first()).toBeVisible({ timeout: 20000 });
    return this.cartDrawerItems().count();
  }

  async closeCartDrawer() {
    const close = this.cartDrawerCloseButton();
    if (await close.count()) {
      await close.click();
    } else {
      await this.page.keyboard.press('Escape');
    }
    await expect(this.cartDrawer()).toBeHidden({ timeout: 10000 });
  }

  /** Picks one swatch from every accessory group plus the suit itself. */
  async selectAllSwatches() {
    await this.pickRandomSuitSwatch();
    await this.selectRandomTieFromFirstSeven();
    await this.selectRandomBelt();
    await this.selectRandomShoe();
  }

  /** Leaves the drawer for the hosted checkout and waits for that page to load. */
  async goToCheckout() {
    await this.cartDrawerCheckoutButton().click();
    await this.page.waitForURL(/checkouts?/i, { timeout: 60000 });
  }
}
