import fs from 'fs';
import { test, expect } from '@playwright/test';
import { env } from '../../src/config/env.js';
import { unlockStorefront, loginWithOtp } from '../../src/helpers/mailosaur.js';

function hasExistingSession(filePath) {
  try {
    const state = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return Array.isArray(state.cookies) && state.cookies.length > 0;
  } catch {
    return false;
  }
}

test('Save event session (password + customer OTP)', async ({ page }) => {
  test.skip(
    hasExistingSession(env.eventSessionPath) && !process.env.FORCE_AUTH,
    'Event session already exists. Set FORCE_AUTH=1 to regenerate.'
  );

  test.setTimeout(120000);

  await page.goto(env.eventUrl, {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });

  await unlockStorefront(page);

  await page.goto(env.myLooksUrl, {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });

  const emailField = page.getByPlaceholder(/Email/i);
  const alreadyLoggedIn = await page
    .getByRole('heading', { name: /My Looks/i })
    .isVisible()
    .catch(() => false);

  if (!alreadyLoggedIn) {
    const myAccount = page.getByRole('link', { name: /MY ACCOUNT/i });
    if (await myAccount.isVisible().catch(() => false)) {
      await myAccount.click();
    }

    if (!(await emailField.isVisible({ timeout: 10000 }).catch(() => false))) {
      await page.getByRole('button', { name: /log in|sign in|login/i }).first().click().catch(() => {});
    }

    await expect(emailField).toBeVisible({ timeout: 20000 });
    await loginWithOtp(page, {
      email: env.customerEmail || undefined,
      prefix: 'event',
    });
  }

  await page.goto(env.myLooksUrl, {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });

  await page.context().storageState({ path: env.eventSessionPath });
  console.log(`Event session saved to ${env.eventSessionPath}`);
});
