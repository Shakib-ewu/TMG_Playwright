import { test, expect } from '../../src/fixtures/test.js';

/**
 * Every category behind the SHOP menu, and the two ways a signed-out shopper
 * can buy from a product page: Add To Cart (with a sizing form on suits
 * only), or Build Your Look, which sends the shopper to the Suit Builder.
 *
 * Shirts is the one category with no Add To Cart at all — only Build Your
 * Look — so it is handled on its own rather than in the shared loop below.
 */
const ADD_TO_CART_CATEGORIES = [
  'Neck Ties',
  'Bow Ties',
  'Pocket Squares',
  'Shoes',
  'Socks',
  'Belts',
];

test.beforeEach(async ({ suitBuilderPage, page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  // The saved storefront session reuses the same cart run after run, so every
  // test starts from a genuinely empty one rather than accumulating whatever
  // earlier runs today added.
  await suitBuilderPage.clearCart();
});

test('SHOP menu: add a suit to the cart, with sizing', async ({ shopPage, suitBuilderPage, page }) => {
  test.setTimeout(300000);

  await test.step('Open SHOP and go to Suits and Tuxedos', async () => {
    await shopPage.goToCategory('Suits and Tuxedos');
    await expect(page).toHaveURL(/\/collections\/suit/);
  });

  await test.step('Open the first suit', async () => {
    await shopPage.openFirstProduct();
    await expect(shopPage.addToCartButton()).toBeVisible();
  });

  await test.step('Add to cart and complete the sizing form', async () => {
    await shopPage.addToCart();
    // Not a bare fillMeasurements() + submit: this form also asks for an
    // email address on a signed-out visit, and only completeSizeChartIfShown()
    // fills that field before filling the rest.
    await suitBuilderPage.completeSizeChartIfShown();
  });

  await test.step('Cart drawer opens with the suit', async () => {
    await expect(suitBuilderPage.cartDrawer()).toBeVisible({ timeout: 20000 });
    expect(await suitBuilderPage.cartItemCount()).toBeGreaterThan(0);
  });

  await test.step('Checkout, then go back', async () => {
    await suitBuilderPage.goToCheckout();
    await expect(page).toHaveURL(/checkouts?/i);

    await page.goBack();
    await expect(page).not.toHaveURL(/checkouts?/i);
  });
});

test('SHOP menu: every category offers the right way to buy', async ({
  shopPage,
  suitBuilderPage,
  page,
}) => {
  test.setTimeout(400000);

  for (const category of ADD_TO_CART_CATEGORIES) {
    await test.step(`${category}: add to cart and check out`, async () => {
      await shopPage.goToCategory(category);
      await shopPage.openFirstProduct();
      await expect(shopPage.addToCartButton()).toBeVisible();

      await shopPage.addToCart();

      // None of these categories ask for a size, unlike the whole suit, so
      // the size form is only handled here in case that ever changes.
      const sizeChartShown = await suitBuilderPage
        .measurementModal()
        .isVisible({ timeout: 3000 })
        .catch(() => false);
      if (sizeChartShown) {
        await suitBuilderPage.fillMeasurements();
        await suitBuilderPage.submitMeasurementsButton().click();
      }

      await expect(suitBuilderPage.cartDrawer()).toBeVisible({ timeout: 20000 });
      expect(await suitBuilderPage.cartItemCount()).toBeGreaterThan(0);

      await suitBuilderPage.goToCheckout();
      await expect(page).toHaveURL(/checkouts?/i);

      await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });
      await suitBuilderPage.clearCart();
    });
  }

  await test.step('Shirts: no Add To Cart, only Build Your Look', async () => {
    await shopPage.goToCategory('Shirts');
    await shopPage.openFirstProduct();

    await expect(shopPage.addToCartButton()).toBeHidden();
    await expect(shopPage.buildYourLookButton()).toBeVisible();

    await shopPage.buildYourLookButton().click();
    await expect(page).toHaveURL(/\/pages\/suit-builder/);

    // Build Your Look drops the shopper on a blank Suit Builder — it does not
    // carry the shirt over — so a suit is picked here to reach checkout.
    await suitBuilderPage.pickRandomSuitSwatch();
    await suitBuilderPage.addToCart();
    await suitBuilderPage.goToCheckout();
    await expect(page).toHaveURL(/checkouts?/i);
  });
});
