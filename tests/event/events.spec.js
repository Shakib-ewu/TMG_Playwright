import { test, expect } from '../../src/fixtures/test.js';
import { loginWithOtp } from '../../src/helpers/mailosaur.js';
import { env } from '../../src/config/env.js';
import { randomIndex } from '../../src/helpers/random.js';

function randomEventDate() {
  // Today → today + 40 days
  const daysAhead = Math.floor(Math.random() * 41);
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = date.getFullYear();
  return {
    display: `${mm}/${dd}/${yyyy}`, // mm/dd/yyyy
    iso: `${yyyy}-${mm}-${dd}`, // for input[type=date]
  };
}

async function fillEventDate(page) {
  const { display, iso } = randomEventDate();
  const input = page.locator('#eventDateInput');
  await input.waitFor({ state: 'visible', timeout: 15000 });
  await input.click();

  const type = await input.getAttribute('type');
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

test('My Events → Mailosaur sign-in', async ({ page, context, suitBuilderPage }) => {
  test.setTimeout(180000);

  // Hover opens dropdown (click on MY ACCOUNT often navigates to /account instead)
  await page.getByText(/MY ACCOUNT/i).first().hover();
  await page.getByRole('link', { name: /My Events/i }).click();

  // Sign in only if needed, then save session for next runs
  const alreadyLoggedIn = await page
    .getByRole('tab', { name: 'Events' })
    .isVisible()
    .catch(() => false);

  if (!alreadyLoggedIn) {
    await loginWithOtp(page, { prefix: 'event' });
    await context.storageState({ path: env.eventSessionPath });
    console.log(`Event login session saved → ${env.eventSessionPath}`);
  }

  // Pause so you can see My Events after login
  await page.waitForTimeout(6000);

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
  await page.waitForTimeout(3000);
  await page.locator("//button[.='Create Event']").click();
  await page.waitForTimeout(3000);
  await page.getByRole('tab', { name: 'Events' }).click();
  await page.waitForTimeout(3000);
  await expect(page.getByRole('heading', { name: 'My Events' })).toBeVisible({ timeout: 30000 });
});
