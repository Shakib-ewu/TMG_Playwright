import MailosaurClient from 'mailosaur';
import { env } from '../config/env.js';

export function createMailosaurClient() {
  if (!env.mailosaurApiKey) {
    throw new Error('MAILOSAUR_API_KEY is not set');
  }
  return new MailosaurClient(env.mailosaurApiKey);
}

export function createTestEmail(prefix = 'tmg') {
  const serverId = env.mailosaurServerId;
  if (!serverId) {
    throw new Error('MAILOSAUR_SERVER_ID is not set');
  }
  return `${prefix}.${Date.now()}@${serverId}.mailosaur.net`;
}

/**
 * Completes Shopify/Shop email OTP login.
 * @param {import('@playwright/test').Page} page
 * @param {object} [options]
 * @param {string} [options.email] - Use a fixed inbox/account email when provided
 * @param {string} [options.prefix] - Prefix for generated Mailosaur addresses
 * @param {import('mailosaur').default} [options.mailosaur]
 * @param {string} [options.serverId]
 */
export async function loginWithOtp(page, options = {}) {
  const mailosaur = options.mailosaur || createMailosaurClient();
  const serverId = options.serverId || env.mailosaurServerId;
  const testEmail = options.email || createTestEmail(options.prefix || 'tmg');

  await page.getByPlaceholder(/Email/i).fill(testEmail);
  await page.locator("//button[@aria-label='Continue']").click({ force: true });

  const email = await mailosaur.messages.get(
    serverId,
    { sentTo: testEmail },
    { timeout: 60000 }
  );
  const code = email.text.body.match(/\d{6}/)[0];
  await page.getByRole('textbox', { name: '6-digit code' }).fill(code);
  return testEmail;
}

/**
 * Unlocks the Shopify storefront password gate when present.
 * @param {import('@playwright/test').Page} page
 * @param {string} [password]
 */
export async function unlockStorefront(page, password = env.storePassword) {
  const passwordInput = page.locator('#password');
  if (await passwordInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await passwordInput.fill(password);
    await page.getByRole('button', { name: 'Enter' }).click();
  }
}
