/**
 * Storefront navigation and product pages reached through the SHOP menu.
 *
 * Every category behind SHOP sells through the same pair of buttons — Add To
 * Cart and Build Your Look — except Shirts, which drops Add To Cart entirely
 * and only ever sends the shopper to the Suit Builder.
 */
export class ShopPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  /**
   * The header repeats "SHOP" for the mobile menu as well as the desktop one,
   * so :visible picks out the desktop trigger a hover can actually open.
   */
  shopMenuTrigger() {
    return this.page.locator(':text-is("SHOP"):visible').first();
  }

  /**
   * The dropdown renders each category twice — once for the desktop menu,
   * once for the mobile menu — so the :visible copy is the one a hover on a
   * desktop-width page actually opens.
   */
  categoryLink(name) {
    return this.page.locator('a.navbar-item:visible', { hasText: name }).first();
  }

  /** Hovers SHOP to open the dropdown and clicks one category inside it. */
  async goToCategory(name) {
    await this.shopMenuTrigger().hover();
    const link = this.categoryLink(name);
    await link.waitFor({ state: 'visible', timeout: 10000 });
    await Promise.all([
      this.page.waitForURL(/\/collections\//, { timeout: 30000 }),
      link.click(),
    ]);
  }

  /**
   * Opens the first real product in a collection, skipping the upsell items
   * (a garment bag, a placeholder "example product") that every collection
   * page also lists alongside its actual category members.
   * @returns {Promise<string>} the product page's path.
   */
  async openFirstProduct() {
    const productLinks = this.page.locator('a[href*="/products/"]');
    await productLinks.first().waitFor({ state: 'attached', timeout: 20000 });

    const hrefs = await productLinks.evaluateAll((links) => [
      ...new Set(links.map((a) => a.getAttribute('href'))),
    ]);
    const productHref = hrefs.find((href) => href && !/black-garment-bag|example-product/i.test(href));
    if (!productHref) {
      throw new Error('No real product link found on this collection page.');
    }

    await this.page.goto(productHref, { waitUntil: 'domcontentloaded', timeout: 60000 });
    return productHref;
  }

  /** Present on every category's product pages except Shirts. */
  addToCartButton() {
    return this.page
      .locator('button, a.button')
      .filter({ hasText: /add to cart/i })
      .first();
  }

  /** Present on every product page; the only purchase path Shirts offers. */
  buildYourLookButton() {
    return this.page
      .locator('button, a.button')
      .filter({ hasText: /build your look/i })
      .first();
  }

  async addToCart() {
    const button = this.addToCartButton();
    await button.scrollIntoViewIfNeeded();
    await button.click();
  }
}
