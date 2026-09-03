// Loads values from the local .env file into process.env.
import 'dotenv/config';
// Provides path utilities for building platform-independent file paths.
import path from 'path';
// Converts the current module URL into a normal file-system path.
import { fileURLToPath } from 'url';

// Finds the directory containing this configuration file.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Moves from src/config to the project root directory.
const rootDir = path.resolve(__dirname, '../..');

// Reads the store URL from the environment or uses the development store URL.
const storeBaseUrl = (
  // Allows the store URL to be changed without editing source code.
  process.env.STORE_BASE_URL ||
  // Provides the default Shopify development store URL.
  'https://the-modern-groom-dev-bcbxaupc.myshopify.com/'
// Ensures the base URL always ends with exactly one slash.
).replace(/\/?$/, '/');

// Identifies the Shopify preview theme to use.
const previewThemeId = process.env.PREVIEW_THEME_ID || '190707466519';
// Defines the page containing the user's events.
const eventPath = process.env.EVENT_PATH || '/pages/my-events';
// Defines the page containing the user's saved looks.
const myLooksPath = process.env.MY_LOOKS_PATH || '/pages/my-looks';

// Adds the preview theme query parameter to a relative store path.
function withPreviewTheme(pathname) {
  // Resolves the requested path against the store base URL.
  const url = new URL(pathname.replace(/^\//, ''), storeBaseUrl);
  // Selects the configured Shopify preview theme.
  url.searchParams.set('preview_theme_id', previewThemeId);
  // Returns the complete URL as text.
  return url.toString();
}

// Exposes all environment values and derived URLs used by the tests.
export const env = {
  // Stores the project root for other path calculations.
  rootDir,
  // Stores the normalized Shopify base URL.
  storeBaseUrl,
  // Stores the preview theme identifier.
  previewThemeId,
  // Stores the events page path.
  eventPath,
  // Stores the saved looks page path.
  myLooksPath,
  // Reads the storefront password, defaulting to the current development value.
  storePassword: process.env.STORE_PASSWORD || '1',
  // Reads an optional fixed customer email.
  customerEmail: process.env.CUSTOMER_EMAIL || '',
  // Reads the Mailosaur API key.
  mailosaurApiKey: process.env.MAILOSAUR_API_KEY || '',
  // Reads the Mailosaur server identifier.
  mailosaurServerId: process.env.MAILOSAUR_SERVER_ID || '',
  // Points to the saved storefront password session.
  storefrontSessionPath: path.join(rootDir, 'auth', 'session.storefront.json'),
  // Points to the saved customer OTP session.
  eventSessionPath: path.join(rootDir, 'auth', 'session.event.json'),
  // Builds the complete events page URL.
  eventUrl: withPreviewTheme(eventPath),
  // Builds the complete looks page URL.
  myLooksUrl: withPreviewTheme(myLooksPath),
  // Exposes the URL builder for callers that need another preview URL.
  withPreviewTheme,
};
