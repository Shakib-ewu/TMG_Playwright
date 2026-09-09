import { test, expect } from '@playwright/test';
import { env } from '../../src/config/env.js';
import { hasSession } from '../../src/helpers/session.js';
import { unlockStorefront } from '../../src/helpers/storefront.js';

/**
 * Saves the Shopify storefront-password cookie so later projects start unlocked.
 * Force a refresh with:  $env:FORCE_AUTH="1"; npm run auth:storefront
 */
test('Save storefront session', async ({ page }) => {
  test.skip(
    hasSession(env.storefrontSessionPath) && !process.env.FORCE_AUTH,
    'Session already exists. Run auth:storefront only when needed.'
  );

  await page.goto(env.storeBaseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await unlockStorefront(page);

  // Confirm the unlock stuck before saving, otherwise every test lands on /password.
  await page.goto(env.storeBaseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  expect(page.url()).not.toContain('/password');

  await page.context().storageState({ path: env.storefrontSessionPath });
  console.log(`Storefront session saved to ${env.storefrontSessionPath}`);
});
