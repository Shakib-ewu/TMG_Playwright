// Imports the Mailosaur API client used to read OTP emails.
import MailosaurClient from 'mailosaur';
// Imports configured credentials and store values.
import { env } from '../config/env.js';

// Creates a Mailosaur client after checking that the API key exists.
export function createMailosaurClient() {
  // Stops immediately with a useful error when the API key is missing.
  if (!env.mailosaurApiKey) {
    // Explains which environment variable must be configured.
    throw new Error('MAILOSAUR_API_KEY is not set');
  }
  // Returns a client authenticated with the configured API key.
  return new MailosaurClient(env.mailosaurApiKey);
}

// Builds a unique test email address inside the configured Mailosaur server.
export function createTestEmail(prefix = 'tmg') {
  // Reads the Mailosaur server identifier.
  const serverId = env.mailosaurServerId;
  // Stops if an address cannot be routed to a Mailosaur server.
  if (!serverId) {
    // Explains which environment variable must be configured.
    throw new Error('MAILOSAUR_SERVER_ID is not set');
  }
  // Uses the current timestamp to avoid reusing an old mailbox address.
  return `${prefix}.${Date.now()}@${serverId}.mailosaur.net`;
}

// Completes Shopify's email one-time-password login using Mailosaur.
export async function loginWithOtp(page, options = {}) {
  // Reuses an injected client or creates one from the environment.
  const mailosaur = options.mailosaur || createMailosaurClient();
  // Reuses an injected server ID or reads the configured one.
  const serverId = options.serverId || env.mailosaurServerId;
  // Reuses a supplied email or generates a unique test email.
  const testEmail = options.email || createTestEmail(options.prefix || 'tmg');

  // Locates Shopify's visible customer email field by its accessible name.
  const customerEmailInput = page.getByRole('textbox', { name: 'Email' });
  // Waits until Shopify has rendered the sign-in field.
  await customerEmailInput.waitFor({ state: 'visible', timeout: 30000 });
  // Enters the generated Mailosaur address.
  await customerEmailInput.fill(testEmail);
  // Submits the email to request an OTP.
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  // Confirms Shopify accepted the email and opened OTP verification.
  const codeInput = page.getByRole('textbox', { name: '6-digit code' });
  await codeInput.waitFor({ state: 'visible', timeout: 30000 });

  // Waits for Mailosaur to receive the message sent to this exact address.
  const message = await mailosaur.messages.get(
    // Tells Mailosaur which server to search.
    serverId,
    // Restricts the search to the generated recipient.
    { sentTo: testEmail },
    // Allows up to one minute for delivery.
    { timeout: 60000 }
  );
  // Extracts the first six-digit OTP from the email body.
  const code = message.text.body.match(/\b\d{6}\b/)?.[0];
  // Gives a clear error if the email did not contain a six-digit code.
  if (!code) {
    throw new Error(`No six-digit OTP found in the email sent to ${testEmail}`);
  }
  // Enters the OTP into Shopify's verification field.
  await codeInput.fill(code);
  // Waits for navigation to complete after OTP submission.
  await page.waitForURL('**/account**', { timeout: 60000 }).catch(() => {});
  await page.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});
  // Returns the address so the setup test can report which account was used.
  return testEmail;
}

/** Enters the store password when Shopify redirects to /password. Returns true if it unlocked. */
// Unlocks the storefront only when the current page is Shopify's password page.
export async function unlockStorefront(page, password = env.storePassword) {
  // Returns false because no unlock was needed when the URL is not a password page.
  if (!page.url().includes('/password')) {
    return false;
  }

  // isVisible() is an instant check, so wait explicitly for the form to render
  // Locates the storefront password input.
  const passwordInput = page.locator('#password');
  // Waits until Shopify has rendered the input.
  await passwordInput.waitFor({ state: 'visible', timeout: 15000 });
  // Enters the configured storefront password.
  await passwordInput.fill(password);
  // Submits the password form.
  await page.getByRole('button', { name: 'Enter' }).click();

  // The password cookie is only set once this navigation completes
  // Waits until Shopify navigates away from the password page.
  await page.waitForURL((url) => !url.pathname.includes('/password'), { timeout: 30000 });
  // Reports that this function performed an unlock.
  return true;
}
