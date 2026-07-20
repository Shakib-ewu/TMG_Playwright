import { test, expect } from './setup.spec.js';

test('Select random suit color', async ({ page }) => {
  await page.getByRole('link', { name: 'SUIT BUILDER' }).click();

  const swatches = await page.locator('[data-suit-item="suit"] .suit_item_image.swatch_image').all();
  const randomSwatch = swatches[Math.floor(Math.random() * swatches.length)];

  await randomSwatch.click();
});

test('Toggle Tie accordion', async ({ page }) => {
  await page.getByRole('link', { name: 'SUIT BUILDER' }).click();

  

  const accordions = page.locator('.accordion_state_icon');
   await accordions.nth(1).click(); // First accordion
  
  await accordions.nth(1).click(); // Open
  await accordions.nth(1).click(); // Close
});

test("Select random tie color", async ({ page }) => {
  await page.getByRole('link', { name: 'SUIT BUILDER' }).click();

   const accordions = page.locator('.accordion_state_icon');
   await accordions.nth(2).click();

  const wrapper = page.locator('.suit_item.wrapper.image_options[data-suit-item="Neck_Tie"]');

  // get only the swatch labels, not product_image ones
  const swatches = await wrapper.locator('label.suit_item_image.swatch_image').all();

  // take only the first 7
  const firstSeven = swatches.slice(0, 7);

  const randomSwatch = firstSeven[Math.floor(Math.random() * firstSeven.length)];
  await randomSwatch.click();
});

test("Select random Belt color", async ({ page }) => {
  await page.getByRole('link', { name: 'SUIT BUILDER' }).click();

   const accordions = page.locator('.accordion_state_icon');
   await accordions.nth(3).click();

  const wrapper = page.locator('.suit_item.wrapper.image_options[data-suit-item="Belt"]');
  const swatches = await wrapper.locator('label.suit_item_image.product_image');

 const randomIndex = Math.floor(Math.random() * 2);
await swatches.nth(randomIndex).click();
})

test("Select random Shoe color", async ({ page }) => {
  await page.getByRole('link', { name: 'SUIT BUILDER' }).click();

   const accordions = page.locator('.accordion_state_icon');
   await accordions.nth(5).click();

  const wrapper = page.locator('.suit_item.wrapper.image_options[data-suit-item="Shoe"]');
  const swatches = await wrapper.locator('label.suit_item_image.product_image');

 const randomIndex = Math.floor(Math.random() * 2);
await swatches.nth(randomIndex).click();
})