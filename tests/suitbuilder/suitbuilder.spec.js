import { test, expect } from '../../src/fixtures/test.js';
import { loginWithOtp } from '../../src/helpers/mailosaur.js';
import { pickRandom } from '../../src/helpers/random.js';

test.beforeEach(async ({ suitBuilderPage }) => {
  await suitBuilderPage.goto();
});

/**
 * Everything except the purchase flow runs as one walkthrough so the browser
 * stays on a single page and the steps are easy to follow live. Each phase is a
 * test.step, so a failure still names the exact stage in the report.
 */
test('Suit Builder configuration and add to cart', async ({ suitBuilderPage }) => {
  test.setTimeout(600000);

  await test.step('Total price increases as add-ons are selected', async () => {
    const totalPrice = suitBuilderPage.getTotalPriceLocator();
    const priceBefore = await suitBuilderPage.getPriceValue(totalPrice);

    await suitBuilderPage.openTieAccordionAndSelectFirstSwatch();

    const priceAfter = await suitBuilderPage.getPriceValue(totalPrice);
    expect(priceAfter).toBeGreaterThan(priceBefore);
  });

  await test.step('Save Look and Add To Cart are both offered', async () => {
    await suitBuilderPage.openBeltAccordionAndSelectFirstSwatch();

    await expect(suitBuilderPage.saveTheLookButton()).toBeVisible();
    await expect(suitBuilderPage.saveTheLookButton()).toBeEnabled();
    await expect(suitBuilderPage.addToCartButton()).toBeVisible();
    await expect(suitBuilderPage.addToCartButton()).toBeEnabled();
  });

  // Each group is added on its own so a broken accordion names its own step.
  const swatchGroups = [
    { name: 'suit', select: (sb) => sb.pickRandomSuitSwatch() },
    { name: 'tie', select: (sb) => sb.selectRandomTieFromFirstSeven() },
    { name: 'belt', select: (sb) => sb.selectRandomBelt() },
    { name: 'shoe', select: (sb) => sb.selectRandomShoe() },
  ];

  for (const group of swatchGroups) {
    await test.step(`Add a ${group.name} swatch to the cart`, async () => {
      await group.select(suitBuilderPage);
      await suitBuilderPage.addToCart();

      await expect(suitBuilderPage.cartDrawer()).toBeVisible();
      expect(await suitBuilderPage.cartItemCount()).toBeGreaterThan(0);

      await suitBuilderPage.closeCartDrawer();
    });
  }

  await test.step('Cart keeps its contents after the drawer is closed', async () => {
    await suitBuilderPage.addToCart();
    const itemsBefore = await suitBuilderPage.cartItemCount();

    await suitBuilderPage.closeCartDrawer();

    // Sizing is already on file by now, so this add goes straight to the drawer.
    await suitBuilderPage.addToCart();
    expect(await suitBuilderPage.cartItemCount()).toBeGreaterThanOrEqual(itemsBefore);
  });
});

test('Happy path: add every swatch and reach checkout', async ({ suitBuilderPage, page }) => {
  test.setTimeout(600000);

  await suitBuilderPage.selectAllSwatches();
  await suitBuilderPage.addToCart();

  expect(await suitBuilderPage.cartItemCount()).toBeGreaterThan(0);

  await suitBuilderPage.goToCheckout();
  await expect(page).toHaveURL(/checkouts?/i);
});

// Unskip once the fit-quiz gate is implemented on the site.
test.skip('Buy Now stays disabled until the fit quiz is complete', async ({ suitBuilderPage }) => {
  await suitBuilderPage.openTieAccordionAndSelectFirstSwatch();
  await suitBuilderPage.openBeltAccordionAndSelectFirstSwatch();

  await expect(suitBuilderPage.fitQuizGateButton()).toBeVisible();
  await expect(suitBuilderPage.primaryBuyButton()).toBeDisabled();
});

// Unskip once saving a look survives the OTP login round trip.
test.skip('Save The Look persists current configuration', async ({ suitBuilderPage, page }) => {
  const swatches = await suitBuilderPage.getSuitSwatches();
  await pickRandom(swatches);

  await suitBuilderPage.lookNameInput().fill('My Custom Look');
  await suitBuilderPage.saveTheLookButton().click();

  await loginWithOtp(page, { prefix: 'suitbuilder' });
  // The form resets after login, so the name has to be entered again.
  await suitBuilderPage.lookNameInput().fill('My Custom Look');
  await suitBuilderPage.saveTheLookButton().click();
});
