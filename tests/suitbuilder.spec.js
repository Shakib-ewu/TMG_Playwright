import { test, expect } from './setup.spec.js';
import MailosaurClient from 'mailosaur';
import 'dotenv/config';

const mailosaur = new MailosaurClient(process.env.MAILOSAUR_API_KEY);
const serverId = process.env.MAILOSAUR_SERVER_ID;

// ---------- Shared helpers (locators unchanged) ----------

async function goToSuitBuilder(page) {
  await page.getByRole('link', { name: 'SUIT BUILDER' }).click();
}

function accordionLocator(page) {
  return page.locator('.accordion_state_icon');
}

async function getSuitSwatches(page) {
  return page.locator('[data-suit-item="suit"] .suit_item_image.swatch_image').all();
}

function tieWrapperLocator(page) {
  return page.locator('.suit_item.wrapper.image_options[data-suit-item="Neck_Tie"]');
}

async function getTieSwatches(page) {
  return tieWrapperLocator(page).locator('label.suit_item_image.swatch_image').all();
}

function beltWrapperLocator(page) {
  return page.locator('.suit_item.wrapper.image_options[data-suit-item="Belt"]');
}

function beltSwatches(page) {
  return beltWrapperLocator(page).locator('label.suit_item_image.product_image');
}

function shoeWrapperLocator(page) {
  return page.locator('.suit_item.wrapper.image_options[data-suit-item="Shoe"]');
}

function shoeSwatches(page) {
  return shoeWrapperLocator(page).locator('label.suit_item_image.product_image');
}

function getTotalPriceLocator(page) {
  return page.locator('.dynamic_price.discounted_price').first();
}

async function getPriceValue(locator) {
  return Number((await locator.innerText()).replace(/[^0-9.]/g, ''));
}

async function pickRandom(items) {
  const item = items[Math.floor(Math.random() * items.length)];
  await item.click();
  return item;
}

async function openTieAccordionAndSelectFirstSwatch(page) {
  await accordionLocator(page).nth(2).click();
  const swatches = await getTieSwatches(page);
  await swatches[0].click();
}

async function openBeltAccordionAndSelectFirstSwatch(page) {
  await accordionLocator(page).nth(3).click();
  await beltSwatches(page).nth(0).click();
}

async function completeFitQuiz(page) {
  await page.getByRole('button', { name: /Start Fit Quiz/i }).first().click();

  const emailInput = page.locator("input[name='fitQizEmail']");
  await emailInput.fill("test123@example.com");

  await page.locator("#measurement_age").fill("60");
  await page.getByRole('radio', { name: 'Male', exact: true }).click({ force: true });
  await page.locator("#measurement_weight").fill("175");
  await page.locator("#measurement_height").fill("6");
  await page.locator("#measurement_height_inch").fill("7");

  await page.locator('#measurement_shoe_size').selectOption({ value: '9' });

  await page.locator("img[alt='Lean icon']").click({ force: true });
  await page.locator("img[alt='ROUND image']").click({ force: true });
  await page.locator("img[alt='FLAT image']").click({ force: true });

  await page.getByRole('button', { name: 'Submit' }).click();
}

async function loginWithOtp(page, mailosaur, serverId) {
  const testEmail = `suitbuilder.${Date.now()}@${serverId}.mailosaur.net`;

  await page.getByPlaceholder(/Email/i).fill(testEmail);
  await page.locator("//button[@aria-label='Continue']").click({ force: true });

  const email = await mailosaur.messages.get(
    serverId,
    { sentTo: testEmail },
    { timeout: 60000 }
  );
  const code = email.text.body.match(/\d{6}/)[0];
  await page.getByRole('textbox', { name: '6-digit code' }).fill(code);
  console.log(await page.url());
}

// ---------- Tests ----------

test.beforeEach(async ({ page }) => {
  await goToSuitBuilder(page);
});

test('Select random suit color', async ({ page }) => {
  const swatches = await getSuitSwatches(page);
  await pickRandom(swatches);
});

test('Toggle Tie accordion', async ({ page }) => {
  const accordions = accordionLocator(page);
  await accordions.nth(1).click(); // First accordion
  await accordions.nth(1).click(); // Open
  await accordions.nth(1).click(); // Close
});

test("Select random tie color", async ({ page }) => {
  await accordionLocator(page).nth(2).click();
  const swatches = await getTieSwatches(page);
  const firstSeven = swatches.slice(0, 7);
  await pickRandom(firstSeven);
});

test("Select random Belt color", async ({ page }) => {
  await accordionLocator(page).nth(3).click();
  const randomIndex = Math.floor(Math.random() * 2);
  await beltSwatches(page).nth(randomIndex).click();
});

test("Select random Shoe color", async ({ page }) => {
  await accordionLocator(page).nth(5).click();
  const randomIndex = Math.floor(Math.random() * 2);
  await shoeSwatches(page).nth(randomIndex).click();
});

test("Total price increases as add-ons are selected", async ({ page }) => {
  const totalPrice = getTotalPriceLocator(page);
  const priceBefore = await getPriceValue(totalPrice);

  await openTieAccordionAndSelectFirstSwatch(page);

  const priceAfter = await getPriceValue(totalPrice);
  expect(priceAfter).toBeGreaterThan(priceBefore);
});

test("Buy Now stays disabled regardless of options selected until fit quiz is complete", async ({ page }) => {
  // select tie + belt to prove gating is independent of configuration
  await openTieAccordionAndSelectFirstSwatch(page);
  await openBeltAccordionAndSelectFirstSwatch(page);

  await expect(
    page.getByRole('button', { name: /complete your fit quiz first/i }).first()
  ).toBeVisible();

  await expect(page.getByRole('button', { name: /buy now/i })).toBeDisabled(); // TODO
});

test.skip("Save The Look persists current configuration", async ({ page }) => {
  const swatches = await getSuitSwatches(page);
  await pickRandom(swatches);

  await page.locator('input[placeholder*="Suit" i]').fill('My Custom Look');

  // Click Save The Look first
  await page.getByRole('button', { name: /save the look/i }).click();

  // NOW complete the OTP flow
  await loginWithOtp(page, mailosaur, serverId);
  await page.locator('input[placeholder*="Suit" i]').fill('My Custom Look');
   await page.getByRole('button', { name: /save the look/i }).click();
});

test("End-to-end: configure suit, complete fit quiz, and buy", async ({ page }) => {
  test.setTimeout(120000);

  const suitSwatches = await getSuitSwatches(page);
  await suitSwatches[0].click();

  await openTieAccordionAndSelectFirstSwatch(page);

  await completeFitQuiz(page);

  const buyNowBtn = page.getByRole('button', { name: 'Buy Now' });

  await expect(buyNowBtn).toBeEnabled({ timeout: 20000 });

  await buyNowBtn.click();

  await loginWithOtp(page, mailosaur, serverId);

    await buyNowBtn.click();


  await page.getByRole('button', { name: /checkout/i }).click();
});
