import { test, expect } from '../../src/fixtures/test.js';
import { randomIndex } from '../../src/helpers/random.js';

function randomEventDate(earliest) {
  // The form enforces a minimum lead time, so start from the field's own min
  const date = earliest ? new Date(`${earliest}T00:00:00`) : new Date();
  date.setDate(date.getDate() + Math.floor(Math.random() * 46));
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = date.getFullYear();

  return {
    display: `${mm}/${dd}/${yyyy}`,
    iso: `${yyyy}-${mm}-${dd}`,
  };
}

/** Opens a custom dropdown and picks a random item, skipping the "Select ..." placeholder */
async function pickRandomDropdownItem(dropdown) {
  await dropdown.click();

  const items = dropdown.locator('.srs-dropdown-item');
  await expect(items.first()).toBeVisible({ timeout: 10000 });

  const labels = await items.allInnerTexts();
  const choices = labels
    // Items carry a trailing "Apply All" action, so keep only the first line
    .map((label, index) => ({ label: label.trim().split('\n')[0].trim(), index }))
    .filter(({ label }) => label && !/^select\b/i.test(label));

  const choice = choices[randomIndex(choices.length)];
  // Click the label side of the item, not the "Apply All" action on the right
  await items.nth(choice.index).click({ position: { x: 10, y: 10 } });
  return choice.label;
}

async function fillEventDate(page) {
  const input = page.locator('#eventDateInput');
  await input.waitFor({ state: 'visible', timeout: 15000 });
  await input.click();

  const type = await input.getAttribute('type');
  const { display, iso } = randomEventDate(await input.getAttribute('min'));
  const value = type === 'date' ? iso : display;

  // Custom date fields often ignore fill() — set value + fire events
  await input.evaluate((el, v) => {
    el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);

  if (type !== 'date') {
    await input.fill('');
    await input.pressSequentially(display, { delay: 40 });
  }
}

test('My Events → create look and event', async ({ page, suitBuilderPage }) => {
  test.setTimeout(180000);

  // Hover opens dropdown (click on MY ACCOUNT often navigates to /account instead)
  await page.getByText(/MY ACCOUNT/i).first().hover();
  await page.getByRole('link', { name: /My Events/i }).click();

  // Signed in already via `npm run auth:event`
  await expect(page.getByRole('tab', { name: 'Events' })).toBeVisible({ timeout: 30000 });
  await page.locator('button[data-target="section-looks"]').click();
  await expect(page.getByRole('heading', { name: 'My Looks' })).toBeVisible({ timeout: 30000 });

  await page.waitForTimeout(3000);
  await expect(page.getByRole('heading', { name: 'My Looks' })).toBeVisible({ timeout: 30000 });

  await page.getByRole('link', { name: /Create (First|Another) Look/i }).or(
    page.getByRole('button', { name: /Create (First|Another) Look/i })
  ).first().click();

  await suitBuilderPage.pickRandomSuitSwatch();
  await suitBuilderPage.saveTheLookButton().click();

  // Back on My Looks — assert at least one look card exists
  await page.locator('button[data-target="section-looks"]').click().catch(() => {});
  const lookCards = page.locator('.srs-event-v2-look-card');
  await expect(lookCards.first()).toBeVisible({ timeout: 30000 });
  await expect(lookCards).not.toHaveCount(0);

  // Plan My Event modal
  await page.getByRole('button', { name: 'Plan My Event' }).or(
    page.getByRole('link', { name: 'Plan My Event' })
  ).first().click();

  // Random event type: Wedding / Prom / Other
  const eventTypes = page.locator('.srs-event-v2-radio-card');
  await eventTypes.nth(randomIndex(await eventTypes.count())).click();

  await page.locator('#eventName').fill(`E2E Event ${Date.now()}`);
  await fillEventDate(page);
  await expect
    .poll(() => page.locator('#eventDateInput').evaluate((el) => el.checkValidity()))
    .toBe(true);
  await page.locator("//button[.='Create Event']").click();
  await page.waitForTimeout(3000);
  await page.getByRole('tab', { name: 'Events' }).click();
  await page.waitForTimeout(3000);
  await expect(page.getByRole('heading', { name: 'My Events' })).toBeVisible({ timeout: 30000 });

  // Scene 2 — assign a random role and look on my own attendee card
  const myCard = page.locator('.srs-event-v2-attendee-card.owner-card').first();
  await expect(myCard).toBeVisible({ timeout: 30000 });

  const dropdowns = myCard.locator('.srs-custom-dropdown');
  const role = await pickRandomDropdownItem(dropdowns.nth(0));
  const look = await pickRandomDropdownItem(dropdowns.nth(1));
  console.log(`Assigned role "${role}" and look "${look}"`);

  // Scene 3 — Get Sized
  await myCard.getByRole('button', { name: /Get Sized/i }).click();
  await expect(page.locator('#measurement_age')).toBeVisible({ timeout: 30000 });

  await suitBuilderPage.fillMeasurements();
  await page.locator('#measurement_jean_waist').fill('44');
  await suitBuilderPage.submitMeasurementsButton().click();

  // Scene 4 — Add to Cart, then checkout
  const addToCart = myCard.locator('.v2-add-to-cart-btn');
  await expect(addToCart).toBeVisible({ timeout: 60000 });
  await addToCart.click();

  await page.getByRole('button', { name: /check ?out/i }).first().click();
  await expect(page).toHaveURL(/checkout/, { timeout: 60000 });
});
