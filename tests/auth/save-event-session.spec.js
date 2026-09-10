import { test, expect } from '@playwright/test';
import { env } from '../../src/config/env.js';
import { isSessionFresh, isSessionUsable } from '../../src/helpers/session.js';
import { loginWithOtp } from '../../src/helpers/mailosaur.js';
import { unlockStorefront } from '../../src/helpers/storefront.js';

/** The Events tab only renders for a signed-in customer, so it proves the session works. */
async function isSignedIn(page) {
  return page
    .getByRole('tab', { name: 'Events' })
    .isVisible({ timeout: 30000 })
    .catch(() => false);
}

/**
 * Signs a customer in with an email OTP and saves the session used by the event tests.
 *
 * The saved session is reused for 24 hours and then rebuilt, and it is also
 * re-checked against the live site each run in case it died early.
 * Force a brand-new customer with:  $env:FORCE_AUTH="1"; npm run auth:event
 */
test('Save event sign-in session', async ({ page, browser }) => {
  // Shopify, Mailosaur delivery, and the OTP round trip together need the extra time.
  test.setTimeout(180000);

  if (!process.env.FORCE_AUTH && isSessionFresh(env.eventSessionPath)) {
    const stillWorks = await isSessionUsable(
      browser,
      env.eventSessionPath,
      env.eventUrl,
      isSignedIn
    );
    test.skip(stillWorks, 'Saved event session is under 24 hours old and still signs in.');
  }

  await page.goto(env.storeBaseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await unlockStorefront(page);
  // Reload after unlocking so the account menu is present.
  await page.goto(env.storeBaseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

  await page.getByText(/MY ACCOUNT/i).first().hover();
  await page.getByRole('link', { name: /My Events/i }).click();

  const email = await loginWithOtp(page, { prefix: 'event' });
  await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {});

  // Only save once we are actually inside My Events.
  await expect(page.getByRole('tab', { name: 'Events' })).toBeVisible({ timeout: 60000 });

  await page.context().storageState({ path: env.eventSessionPath });
  console.log(`Event session saved for ${email} → ${env.eventSessionPath}`);
});
