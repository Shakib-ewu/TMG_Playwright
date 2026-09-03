// Imports Node's file-system API for reading an existing session file.
import fs from 'fs';
// Imports Playwright's test and assertion functions.
import { test, expect } from '@playwright/test';
// Imports environment paths and store settings.
import { env } from '../../src/config/env.js';
// Imports the OTP login and storefront unlock helpers.
import { loginWithOtp, unlockStorefront } from '../../src/helpers/mailosaur.js';

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

// Logs in a customer and saves the resulting event session.
test('Save event sign-in session', async ({ page }) => {
  // Allows time for Shopify, Mailosaur, and OTP delivery.
  test.setTimeout(180000);

  // Skip if session already exists. Force a new customer:
  
  // PowerShell: $env:FORCE_AUTH="1"; npm run auth:event
  // Avoids a new Mailosaur login unless a refresh was requested.
  test.skip(
    // Skips when a usable event session exists and FORCE_AUTH is absent.
    hasSession(env.eventSessionPath) && !process.env.FORCE_AUTH,
    // Explains how to force a fresh customer session.
    'Event session already exists. Run auth:event only when needed.'
  );

  // Opens the Shopify store homepage first.
  await page.goto(env.storeBaseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  // Unlocks the store if the storefront password is requested.
  await unlockStorefront(page);
  // Reloads the homepage after unlocking so the account menu is available.
  await page.goto(env.storeBaseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Opens the account dropdown from the homepage.
  await page.getByText(/MY ACCOUNT/i).first().hover();
  // Follows the same My Events navigation as the real user.
  await page.getByRole('link', { name: /My Events/i }).click();

  // Requests an OTP, reads it from Mailosaur, and enters it in Shopify.
  const email = await loginWithOtp(page, { prefix: 'event' });
  // Waits for the post-login navigation to complete.
  await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {});

  // Only save once we are actually inside My Events
  // Confirms the OTP login reached the Events tab.
  await expect(page.getByRole('tab', { name: 'Events' })).toBeVisible({ timeout: 60000 });

  // Saves cookies and other storage required by later event tests.
  await page.context().storageState({ path: env.eventSessionPath });
  // Reports which generated Mailosaur account was authenticated.
  console.log(`Event session saved for ${email} → ${env.eventSessionPath}`);
});
