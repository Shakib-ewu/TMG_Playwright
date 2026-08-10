import { test, expect } from '../../src/fixtures/test.js';
import { loginWithOtp } from '../../src/helpers/mailosaur.js';

test('My Events → Mailosaur sign-in', async ({ page }) => {
  test.setTimeout(180000);

  // Hover opens dropdown (click on MY ACCOUNT often navigates to /account instead)
  await page.getByText(/MY ACCOUNT/i).first().hover();
  await page.getByRole('link', { name: /My Events/i }).click();

  await loginWithOtp(page, { prefix: 'event' });

  // Pause so you can see My Events after login
  await page.waitForTimeout(10000);

  await expect(page.getByRole('tab', { name: 'Events' })).toBeVisible({ timeout: 30000 });
  await page.locator('button[data-target="section-looks"]').click();
  await expect(page.getByRole('heading', { name: 'My Looks' })).toBeVisible({ timeout: 30000 });
});
