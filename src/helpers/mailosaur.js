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

export async function loginWithOtp(page, options = {}) {
  const mailosaur = options.mailosaur || createMailosaurClient();
  const serverId = options.serverId || env.mailosaurServerId;
  const testEmail = options.email || createTestEmail(options.prefix || 'tmg');

  await page.getByPlaceholder(/Email/i).fill(testEmail);
  await page.locator("//button[@aria-label='Continue']").click({ force: true });

  const message = await mailosaur.messages.get(
    serverId,
    { sentTo: testEmail },
    { timeout: 60000 }
  );
  const code = message.text.body.match(/\d{6}/)[0];
  await page.getByRole('textbox', { name: '6-digit code' }).fill(code);
  return testEmail;
}

/** Enters the store password when Shopify redirects to /password. Returns true if it unlocked. */
export async function unlockStorefront(page, password = env.storePassword) {
  if (!page.url().includes('/password')) {
    return false;
  }

  // isVisible() is an instant check, so wait explicitly for the form to render
  const passwordInput = page.locator('#password');
  await passwordInput.waitFor({ state: 'visible', timeout: 15000 });
  await passwordInput.fill(password);
  await page.getByRole('button', { name: 'Enter' }).click();

  // The password cookie is only set once this navigation completes
  await page.waitForURL((url) => !url.pathname.includes('/password'), { timeout: 30000 });
  return true;
}
