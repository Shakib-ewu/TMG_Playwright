import { expect } from '@playwright/test';
import { pickRandom, randomIndex } from '../helpers/random.js';

export class SuitBuilderPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  async goto() {
    await this.page.getByRole('link', { name: 'SUIT BUILDER' }).click();
  }

  accordionLocator() {
    return this.page.locator('.accordion_state_icon');
  }

  async getSuitSwatches() {
    return this.page.locator('[data-suit-item="suit"] .suit_item_image.swatch_image').all();
  }

  tieWrapperLocator() {
    return this.page.locator('.suit_item.wrapper.image_options[data-suit-item="Neck_Tie"]');
  }

  async getTieSwatches() {
    return this.tieWrapperLocator().locator('label.suit_item_image.swatch_image').all();
  }

  beltWrapperLocator() {
    return this.page.locator('.suit_item.wrapper.image_options[data-suit-item="Belt"]');
  }

  beltSwatches() {
    return this.beltWrapperLocator().locator('label.suit_item_image.product_image');
  }

  shoeWrapperLocator() {
    return this.page.locator('.suit_item.wrapper.image_options[data-suit-item="Shoe"]');
  }

  shoeSwatches() {
    return this.shoeWrapperLocator().locator('label.suit_item_image.product_image');
  }

  getTotalPriceLocator() {
    return this.page.locator('.dynamic_price.discounted_price').first();
  }

  async getPriceValue(locator = this.getTotalPriceLocator()) {
    return Number((await locator.innerText()).replace(/[^0-9.]/g, ''));
  }

  async pickRandomSuitSwatch() {
    const swatches = await this.getSuitSwatches();
    return pickRandom(swatches);
  }

  async openTieAccordionAndSelectFirstSwatch() {
    await this.accordionLocator().nth(2).click();
    const swatches = await this.getTieSwatches();
    await swatches[0].click();
  }

  async openBeltAccordionAndSelectFirstSwatch() {
    await this.accordionLocator().nth(3).click();
    await this.beltSwatches().nth(0).click();
  }

  async selectRandomBelt() {
    await this.accordionLocator().nth(3).click();
    await this.beltSwatches().nth(randomIndex(2)).click();
  }

  async selectRandomShoe() {
    await this.accordionLocator().nth(5).click();
    await this.shoeSwatches().nth(randomIndex(2)).click();
  }

  async selectRandomTieFromFirstSeven() {
    await this.accordionLocator().nth(2).click();
    const swatches = await this.getTieSwatches();
    await pickRandom(swatches.slice(0, 7));
  }

  async toggleTieAccordion() {
    const accordions = this.accordionLocator();
    await accordions.nth(1).click();
    await accordions.nth(1).click();
    await accordions.nth(1).click();
  }

  /** Measurement fields shared by the Suit Builder quiz and the event Get Sized modal */
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
  }

  submitMeasurementsButton() {
    return this.page.getByRole('button', { name: 'Submit measurements' });
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

  /** Suit Builder path: submit fit quiz then click Buy Swatches */
  async completeFitQuizAndBuy() {
    await this.completeFitQuiz();
    await this.primaryBuyButton().click();
  }

  /**
   * Minimal save-look path used from My Looks → Create First Look.
   * @param {string} lookName
   */
  async createAndSaveLook(lookName = `Auto Look ${Date.now()}`) {
    const swatches = await this.getSuitSwatches();
    if (swatches.length) {
      await swatches[0].click();
    }
    const nameInput = this.lookNameInput();
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill(lookName);
    }
    await this.saveTheLookButton().click();
    await this.page.waitForTimeout(3000);
    return lookName;
  }

  async #selectFitOption(imgSelector) {
    const img = this.page.locator(imgSelector).first();
    const label = this.page.locator('label').filter({ has: img }).first();
    if (await label.count()) {
      await label.click({ force: true });
      return;
    }
    await img.click({ force: true });
  }

  /** Primary purchase CTA — label can be "Buy Swatches" or "Buy Now" depending on quiz state */
  primaryBuyButton() {
    return this.page.locator('button.buyNowBtn').or(
      this.page.getByRole('button', { name: /^(Buy Swatches|Buy Now)$/i })
    ).first();
  }

  buySwatchesButton() {
    return this.primaryBuyButton();
  }

  fitQuizGateButton() {
    return this.page.getByRole('button', { name: /complete your fit quiz first/i }).first();
  }

  checkoutButton() {
    return this.page.getByRole('button', { name: /checkout/i });
  }

  lookNameInput() {
    return this.page.locator('input[placeholder*="Suit" i]');
  }

  saveTheLookButton() {
    return this.page.getByRole('button', { name: /save the look/i });
  }
}
