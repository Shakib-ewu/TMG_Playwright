import fs from 'fs';
import { test, expect } from '@playwright/test';
import { env } from '../../src/config/env.js';
import { unlockStorefront } from '../../src/helpers/mailosaur.js';

function hasSession(filePath) {
  try {
    const state = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return Array.isArray(state.cookies) && state.cookies.length > 0;
  } catch {
    return false;
  }
}

test('Save storefront session', async ({ page }) => {
  // Skip if session already exists. Force refresh:
  // PowerShell: $env:FORCE_AUTH="1"; npm run auth:storefront
  test.skip(
    hasSession(env.storefrontSessionPath) && !process.env.FORCE_AUTH,
    'Session already exists. Run auth:storefront only when needed.'
  );

  await page.goto(env.storeBaseUrl, {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });
  await unlockStorefront(page);

  // Confirm the unlock stuck before saving, otherwise every test lands on /password
  await page.goto(env.storeBaseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  expect(page.url()).not.toContain('/password');

  await page.context().storageState({ path: env.storefrontSessionPath });
  console.log(`Storefront session saved to ${env.storefrontSessionPath}`);
});
