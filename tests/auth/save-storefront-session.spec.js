// Imports Node's file-system API for reading an existing session file.
import fs from 'fs';
// Imports Playwright's test and assertion functions.
import { test, expect } from '@playwright/test';
// Imports environment paths and store settings.
import { env } from '../../src/config/env.js';
// Imports the storefront unlock helper.
import { unlockStorefront } from '../../src/helpers/mailosaur.js';

// Checks whether a saved session file contains at least one cookie.
function hasSession(filePath) {
  // Attempts to read and parse the session JSON.
  try {
    // Loads the file contents and converts them into a JavaScript object.
    const state = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    // Reports whether Playwright has any cookies to restore.
    return Array.isArray(state.cookies) && state.cookies.length > 0;
  // Treats missing or invalid files as having no usable session.
  } catch {
    // Signals that authentication setup must run.
    return false;
  }
}

// Saves a reusable Shopify storefront-password session.
test('Save storefront session', async ({ page }) => {
  // Skip if session already exists. Force refresh:
  // PowerShell: $env:FORCE_AUTH="1"; npm run auth:storefront
  // Avoids overwriting a usable session unless FORCE_AUTH is set.
  test.skip(
    // Skips when the session has cookies and a forced refresh was not requested.
    hasSession(env.storefrontSessionPath) && !process.env.FORCE_AUTH,
    // Explains how to bypass the skip.
    'Session already exists. Run auth:storefront only when needed.'
  );

  // Opens the configured storefront.
  await page.goto(env.storeBaseUrl, {
    // Waits for the document HTML to load.
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });
  // Enters the password if Shopify displayed the password page.
  await unlockStorefront(page);

  // Confirm the unlock stuck before saving, otherwise every test lands on /password
  // Reloads the store to verify the password cookie persists.
  await page.goto(env.storeBaseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  // Fails if Shopify still redirects to its password page.
  expect(page.url()).not.toContain('/password');

  // Writes the browser cookies to the configured session file.
  await page.context().storageState({ path: env.storefrontSessionPath });
  // Reports where the reusable session was saved.
  console.log(`Storefront session saved to ${env.storefrontSessionPath}`);
});
