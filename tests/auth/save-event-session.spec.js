import fs from 'fs';
import { test, expect } from '@playwright/test';
import { env } from '../../src/config/env.js';
import { loginWithOtp, unlockStorefront } from '../../src/helpers/mailosaur.js';

function hasSession(filePath) {
  try {
    const state = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return Array.isArray(state.cookies) && state.cookies.length > 0;
  } catch {
    return false;
  }
}

test('Save event sign-in session', async ({ page }) => {
  test.setTimeout(180000);

  // Skip if session already exists. Force a new customer:
  
  // PowerShell: $env:FORCE_AUTH="1"; npm run auth:event
  test.skip(
    hasSession(env.eventSessionPath) && !process.env.FORCE_AUTH,
    'Event session already exists. Run auth:event only when needed.'
  );

  await page.goto(env.eventUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await unlockStorefront(page);
  await page.goto(env.eventUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

  const email = await loginWithOtp(page, { prefix: 'event' });

  // Only save once we are actually inside My Events
  await expect(page.getByRole('tab', { name: 'Events' })).toBeVisible({ timeout: 60000 });

  await page.context().storageState({ path: env.eventSessionPath });
  console.log(`Event session saved for ${email} → ${env.eventSessionPath}`);
});
