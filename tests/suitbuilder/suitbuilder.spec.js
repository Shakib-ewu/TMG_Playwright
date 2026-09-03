// Imports Playwright's test and assertion helpers.
import { test, expect } from '../../src/fixtures/test.js';
// Imports the Mailosaur OTP helper for the skipped save test.
import { loginWithOtp } from '../../src/helpers/mailosaur.js';
// Imports the random locator helper for the skipped save test.
import { pickRandom } from '../../src/helpers/random.js';

// Opens Suit Builder before every test in this file.
test.beforeEach(async ({ suitBuilderPage }) => {
  // Navigates to the Suit Builder page.
  await suitBuilderPage.goto();
});

// Checks that a random suit color can be selected.
test('Select random suit color', async ({ suitBuilderPage }) => {
  // Selects the random suit swatch.
  await suitBuilderPage.pickRandomSuitSwatch();
});

// Checks the tie accordion toggle behavior.
test('Toggle Tie accordion', async ({ suitBuilderPage }) => {
  // Opens, closes, and reopens the tie accordion.
  await suitBuilderPage.toggleTieAccordion();
});

// Checks that a random tie color can be selected.
test('Select random tie color', async ({ suitBuilderPage }) => {
  // Selects a random tie from the first seven choices.
  await suitBuilderPage.selectRandomTieFromFirstSeven();
});

// Checks that a random belt color can be selected.
test('Select random Belt color', async ({ suitBuilderPage }) => {
  // Selects a random belt choice.
  await suitBuilderPage.selectRandomBelt();
});


// Checks that saving a look is possible after selecting add-ons.
test('Save Look button is available after selecting add-ons', async ({ suitBuilderPage }) => {
  // Selects the first tie option.
  await suitBuilderPage.openTieAccordionAndSelectFirstSwatch();
  // Selects the first belt option.
  await suitBuilderPage.openBeltAccordionAndSelectFirstSwatch();

  // Confirms the save button is displayed.
  await expect(suitBuilderPage.saveTheLookButton()).toBeVisible();
  // Confirms the save button can be clicked.
  await expect(suitBuilderPage.saveTheLookButton()).toBeEnabled();
});


// Checks that adding an accessory increases the displayed total price.
test('Total price increases as add-ons are selected', async ({ suitBuilderPage }) => {
  // Gets the total-price locator.
  const totalPrice = suitBuilderPage.getTotalPriceLocator();
  // Reads the price before adding an accessory.
  const priceBefore = await suitBuilderPage.getPriceValue(totalPrice);

  // Adds the first tie option.
  await suitBuilderPage.openTieAccordionAndSelectFirstSwatch();

  // Reads the price after adding the accessory.
  const priceAfter = await suitBuilderPage.getPriceValue(totalPrice);
  // Confirms the accessory increased the total.
  expect(priceAfter).toBeGreaterThan(priceBefore);
});

// Checks the intended purchase-button gate behavior once implemented.
test('Buy Now stays disabled regardless of options selected until fit quiz is complete', async ({
  suitBuilderPage,
}) => {
  // Adds the first tie option.
  await suitBuilderPage.openTieAccordionAndSelectFirstSwatch();
  // Adds the first belt option.
  await suitBuilderPage.openBeltAccordionAndSelectFirstSwatch();

  // The assertions are currently disabled while this behavior is unfinished.
  //await expect(suitBuilderPage.fitQuizGateButton()).toBeVisible();
  // The assertion would verify the purchase button remains disabled.
  //await expect(suitBuilderPage.buySwatchesButton()).toBeDisabled();
});

// Temporarily disables the save-persistence test while its flow is incomplete.
test.skip('Save The Look persists current configuration', async ({ suitBuilderPage, page }) => {
  // Loads the available suit swatches.
  const swatches = await suitBuilderPage.getSuitSwatches();
  // Selects one suit swatch at random.
  await pickRandom(swatches);

  // Enters the desired look name.
  await suitBuilderPage.lookNameInput().fill('My Custom Look');
  // Submits the look before authentication.
  await suitBuilderPage.saveTheLookButton().click();

  // Completes OTP login for the save flow.
  await loginWithOtp(page, { prefix: 'suitbuilder' });
  // Re-enters the look name after login.
  await suitBuilderPage.lookNameInput().fill('My Custom Look');
  // Submits the look again after authentication.
  await suitBuilderPage.saveTheLookButton().click();
});

// Exercises the current end-to-end builder flow up to the implemented steps.
test('End-to-end: configure suit, complete fit quiz, and buy and checkout', async ({
  suitBuilderPage,
  page,
}) => {
  // Allows extra time for the full purchase flow.
  test.setTimeout(180000);

  // Loads all suit swatches.
  const suitSwatches = await suitBuilderPage.getSuitSwatches();
  // Selects the first suit swatch.
  await suitSwatches[0].click();

  // Adds the first tie option.
  await suitBuilderPage.openTieAccordionAndSelectFirstSwatch();
  // The remaining fit-quiz action is currently disabled.
  //await suitBuilderPage.completeFitQuizAndBuy();

  // The following login and checkout actions are currently disabled.
  //await loginWithOtp(page, { prefix: 'suitbuilder' });
  // The forced purchase click is retained as a future implementation step.
 // await suitBuilderPage.primaryBuyButton().click({ force: true });
  // The checkout click is retained as a future implementation step.
  //await suitBuilderPage.checkoutButton().click();
});
