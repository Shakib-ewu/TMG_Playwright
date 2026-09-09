import MailosaurClient from 'mailosaur';
import { env } from '../config/env.js';

/** Creates a Mailosaur client from the configured API key. */
export function createMailosaurClient() {
  if (!env.mailosaurApiKey) {
    throw new Error('MAILOSAUR_API_KEY is not set');
  }
  return new MailosaurClient(env.mailosaurApiKey);
}

/** Builds a unique inbox address on the configured Mailosaur server. */
export function createTestEmail(prefix = 'tmg') {
  const serverId = env.mailosaurServerId;
  if (!serverId) {
    throw new Error('MAILOSAUR_SERVER_ID is not set');
  }
  // The timestamp keeps each run from reusing a previous run's mailbox.
  return `${prefix}.${Date.now()}@${serverId}.mailosaur.net`;
}

/**
 * Completes Shopify's email one-time-password login by reading the code from Mailosaur.
 * @returns {Promise<string>} the address that was signed in.
 */
export async function loginWithOtp(page, options = {}) {
  const mailosaur = options.mailosaur || createMailosaurClient();
  const serverId = options.serverId || env.mailosaurServerId;
  const testEmail = options.email || createTestEmail(options.prefix || 'tmg');

  const customerEmailInput = page.getByRole('textbox', { name: 'Email' });
  await customerEmailInput.waitFor({ state: 'visible', timeout: 30000 });
  await customerEmailInput.fill(testEmail);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  // Reaching the code field confirms Shopify accepted the address and sent a mail.
  const codeInput = page.getByRole('textbox', { name: '6-digit code' });
  await codeInput.waitFor({ state: 'visible', timeout: 30000 });

  const message = await mailosaur.messages.get(
    serverId,
    { sentTo: testEmail },
    { timeout: 60000 }
  );
  const code = message.text.body.match(/\b\d{6}\b/)?.[0];
  if (!code) {
    throw new Error(`No six-digit OTP found in the email sent to ${testEmail}`);
  }

  await codeInput.fill(code);
  await page.waitForURL('**/account**', { timeout: 60000 }).catch(() => {});
  await page.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});

  return testEmail;
}
