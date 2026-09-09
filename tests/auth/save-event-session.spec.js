import { test, expect } from '@playwright/test';
import { env } from '../../src/config/env.js';
import { hasSession } from '../../src/helpers/session.js';
import { loginWithOtp } from '../../src/helpers/mailosaur.js';
import { unlockStorefront } from '../../src/helpers/storefront.js';

/**
 * Signs a customer in with an email OTP and saves the session used by the event tests.
 * Force a brand-new customer with:  $env:FORCE_AUTH="1"; npm run auth:event
 */
test('Save event sign-in session', async ({ page }) => {
  // Shopify, Mailosaur delivery, and the OTP round trip together need the extra time.
  test.setTimeout(180000);

  test.skip(
    hasSession(env.eventSessionPath) && !process.env.FORCE_AUTH,
    'Event session already exists. Run auth:event only when needed.'
  );

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
