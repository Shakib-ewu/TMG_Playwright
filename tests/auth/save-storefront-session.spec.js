import fs from 'fs';
import { test } from '@playwright/test';
import { env } from '../../src/config/env.js';
import { unlockStorefront } from '../../src/helpers/mailosaur.js';

function hasExistingSession(filePath) {
  try {
    const state = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return Array.isArray(state.cookies) && state.cookies.length > 0;
  } catch {
    return false;
  }
}

test('Save storefront session', async ({ page }) => {
  test.skip(
    hasExistingSession(env.storefrontSessionPath) && !process.env.FORCE_AUTH,
    'Storefront session already exists. Set FORCE_AUTH=1 to regenerate.'
  );

  await page.goto(env.storeBaseUrl, {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });
  await unlockStorefront(page);
  await page.context().storageState({ path: env.storefrontSessionPath });
  console.log(`Storefront session saved to ${env.storefrontSessionPath}`);
});
