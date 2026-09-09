import { env } from '../config/env.js';

/**
 * Enters the store password when Shopify redirects to /password.
 * @returns {Promise<boolean>} true if an unlock was actually performed.
 */
export async function unlockStorefront(page, password = env.storePassword) {
  if (!page.url().includes('/password')) {
    return false;
  }

  const passwordInput = page.locator('#password');
  // isVisible() is an instant check, so wait explicitly for the form to render.
  await passwordInput.waitFor({ state: 'visible', timeout: 15000 });
  await passwordInput.fill(password);
  await page.getByRole('button', { name: 'Enter' }).click();

  // The password cookie is only set once this navigation completes.
  await page.waitForURL((url) => !url.pathname.includes('/password'), { timeout: 30000 });
  return true;
}
