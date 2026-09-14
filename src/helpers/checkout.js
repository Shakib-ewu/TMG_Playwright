/**
 * Fills the shipping section of Shopify's hosted checkout.
 *
 * A signed-in customer's checkout has no editable email field — the email is
 * already known from the session and shown as plain text — so this only ever
 * fills the name, address, and phone fields.
 */
export async function fillShippingAddress(page, { firstName, lastName, address1, city, state, zip, phone }) {
  await page.locator('input[name="firstName"]:visible').first().fill(firstName);
  await page.locator('input[name="lastName"]:visible').first().fill(lastName);
  // Every other address field gets a build-hashed id, but this one is stable.
  await page.locator('#shipping-address1').fill(address1);
  await page.locator('input[name="city"]:visible').first().fill(city);
  await page.locator('select[name="zone"]:visible').first().selectOption(state);
  await page.locator('input[name="postalCode"]:visible').first().fill(zip);
  await page.locator('input[name="phone"]:visible').first().fill(phone);
}

/**
 * Fills Shopify's sandbox card fields and pays.
 *
 * Each field lives in its own PCI-compliant iframe hosted on
 * checkout.pci.shopifyinc.com, and Shopify appends a fresh random identifier
 * to each iframe's name on every checkout, so frames are matched by a
 * "/<field>-ltr.html?" fragment of the src instead.
 *
 * The default values are Shopify's own documented Bogus Gateway test card —
 * shown on the checkout page itself under "Testing instruction": card number
 * "1" simulates an approved transaction, and any future expiry with any
 * 3-digit code is accepted. This is a real store in test/sandbox mode; no
 * live card or charge is ever involved.
 */
export async function payWithTestCard(page, { number = '1', expiry = '12 / 34', cvc = '111' } = {}) {
  await page.frameLocator('iframe[src*="/number-ltr.html?"]').getByPlaceholder('Card number').fill(number);
  await page
    .frameLocator('iframe[src*="/expiry-ltr.html?"]')
    .getByPlaceholder('Expiration date (MM / YY)')
    .fill(expiry);
  await page
    .frameLocator('iframe[src*="/verification_value-ltr.html?"]')
    .getByPlaceholder('Security code')
    .fill(cvc);
}

/** Clicks Pay now and waits for the order confirmation page. */
export async function placeOrder(page) {
  await page.getByRole('button', { name: /pay now/i }).click();
  await page.waitForURL(/\/thank-you/i, { timeout: 60000 });
}
