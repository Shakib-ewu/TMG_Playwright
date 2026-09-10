import { test, expect } from '@playwright/test';
import { env } from '../../src/config/env.js';
import { isSessionFresh, isSessionUsable } from '../../src/helpers/session.js';
import { unlockStorefront } from '../../src/helpers/storefront.js';

/** Staying off the /password page proves the stored unlock cookie still works. */
async function isUnlocked(page) {
  return !page.url().includes('/password');
}

/**
 * Saves the Shopify storefront-password cookie so later projects start unlocked.
 *
 * The saved session is reused for 24 hours and then rebuilt, and it is also
 * re-checked against the live site each run in case it expired early.
 * Force a refresh with:  $env:FORCE_AUTH="1"; npm run auth:storefront
 */
test('Save storefront session', async ({ page, browser }) => {
  test.setTimeout(120000);

  if (!process.env.FORCE_AUTH && isSessionFresh(env.storefrontSessionPath)) {
    const stillWorks = await isSessionUsable(
      browser,
      env.storefrontSessionPath,
      env.storeBaseUrl,
      isUnlocked
    );
    test.skip(stillWorks, 'Saved storefront session is under 24 hours old and still unlocked.');
  }

  await page.goto(env.storeBaseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await unlockStorefront(page);

  // Confirm the unlock stuck before saving, otherwise every test lands on /password.
  await page.goto(env.storeBaseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  expect(page.url()).not.toContain('/password');

  await page.context().storageState({ path: env.storefrontSessionPath });
  console.log(`Storefront session saved to ${env.storefrontSessionPath}`);
});
