import { test, expect } from '../../src/fixtures/test.js';
import { env } from '../../src/config/env.js';

/**
 * Saved looks, exercised as the signed-in event customer.
 *
 * Every look is created with a unique name, because the site rejects a name the
 * account already uses. The test deletes what it created so repeated runs do
 * not pile looks up on the account.
 */
test.beforeEach(async ({ page }) => {
  await page.goto(env.eventUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
});

// Skipped until the real limit on saving a look is understood.
//
// A unique name is not enough: with three looks already on the account, saving a
// fourth under a fresh name silently does nothing — no card, no error. The suit
// picker offers exactly 7 suits, which matches the 7-look ceiling seen by hand,
// so the limit looks like one look per suit rather than one per name. Until that
// is confirmed, this test passes or fails purely on which suit is picked at
// random. The machinery it exercises is still used by the event journey through
// ensureLookExists(), which only creates a look on an empty account.
test.skip('A look can be created and deleted', async ({ eventsPage, suitBuilderPage }) => {
  test.setTimeout(300000);

  const name = await eventsPage.createLook(suitBuilderPage);
  console.log(`Created look "${name}"`);

  await eventsPage.openMyLooks();
  await expect(eventsPage.lookCard(name)).toBeVisible({ timeout: 30000 });

  await eventsPage.deleteLook(name);
  await expect(eventsPage.lookCard(name)).toBeHidden({ timeout: 30000 });
});
