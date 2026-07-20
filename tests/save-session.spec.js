// save-session.spec.js
import { test } from '@playwright/test';

test('Save session', async ({ page }) => {
  await page.goto('/');
  await page.locator('#password').fill('1');
  await page.getByRole('button', { name: 'Enter' }).click();
  await page.context().storageState({ path: 'session.json' });
  console.log('Session saved!');
});