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

export async function unlockStorefront(page, password = env.storePassword) {
  const passwordInput = page.locator('#password');
  if (await passwordInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await passwordInput.fill(password);
    await page.getByRole('button', { name: 'Enter' }).click();
  }
}
