import { test, expect } from '../../src/fixtures/test.js';
import { loginWithOtp } from '../../src/helpers/mailosaur.js';
import { pickRandom } from '../../src/helpers/random.js';

test.beforeEach(async ({ suitBuilderPage }) => {
  await suitBuilderPage.goto();
});

test('Select random suit color', async ({ suitBuilderPage }) => {
  await suitBuilderPage.pickRandomSuitSwatch();
});

test('Toggle Tie accordion', async ({ suitBuilderPage }) => {
  await suitBuilderPage.toggleTieAccordion();
});

test('Select random tie color', async ({ suitBuilderPage }) => {
  await suitBuilderPage.selectRandomTieFromFirstSeven();
});

test('Select random Belt color', async ({ suitBuilderPage }) => {
  await suitBuilderPage.selectRandomBelt();
});

test('Select random Shoe color', async ({ suitBuilderPage }) => {
  await suitBuilderPage.selectRandomShoe();
});

test('Total price increases as add-ons are selected', async ({ suitBuilderPage }) => {
  const totalPrice = suitBuilderPage.getTotalPriceLocator();
  const priceBefore = await suitBuilderPage.getPriceValue(totalPrice);

  await suitBuilderPage.openTieAccordionAndSelectFirstSwatch();

  const priceAfter = await suitBuilderPage.getPriceValue(totalPrice);
  expect(priceAfter).toBeGreaterThan(priceBefore);
});

test('Buy Now stays disabled regardless of options selected until fit quiz is complete', async ({
  suitBuilderPage,
}) => {
  await suitBuilderPage.openTieAccordionAndSelectFirstSwatch();
  await suitBuilderPage.openBeltAccordionAndSelectFirstSwatch();

  await expect(suitBuilderPage.fitQuizGateButton()).toBeVisible();
  await expect(suitBuilderPage.buySwatchesButton()).toBeDisabled();
});

test.skip('Save The Look persists current configuration', async ({ suitBuilderPage, page }) => {
  const swatches = await suitBuilderPage.getSuitSwatches();
  await pickRandom(swatches);

  await suitBuilderPage.lookNameInput().fill('My Custom Look');
  await suitBuilderPage.saveTheLookButton().click();

  await loginWithOtp(page, { prefix: 'suitbuilder' });
  await suitBuilderPage.lookNameInput().fill('My Custom Look');
  await suitBuilderPage.saveTheLookButton().click();
});

test('End-to-end: configure suit, complete fit quiz, and buy and checkout', async ({
  suitBuilderPage,
  page,
}) => {
  test.setTimeout(180000);

  const suitSwatches = await suitBuilderPage.getSuitSwatches();
  await suitSwatches[0].click();

  await suitBuilderPage.openTieAccordionAndSelectFirstSwatch();
  await suitBuilderPage.completeFitQuiz();

  await loginWithOtp(page, { prefix: 'suitbuilder' });
  await suitBuilderPage.primaryBuyButton().click({ force: true });
  await suitBuilderPage.checkoutButton().click();
});
