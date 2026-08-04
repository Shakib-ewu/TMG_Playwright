import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');

const storeBaseUrl = (
  process.env.STORE_BASE_URL ||
  'https://the-modern-groom-dev-bcbxaupc.myshopify.com/'
).replace(/\/?$/, '/');

const previewThemeId = process.env.PREVIEW_THEME_ID || '190707466519';
const eventPath = process.env.EVENT_PATH || '/pages/my-events';
const myLooksPath = process.env.MY_LOOKS_PATH || '/pages/my-looks';

function withPreviewTheme(pathname) {
  const url = new URL(pathname.replace(/^\//, ''), storeBaseUrl);
  url.searchParams.set('preview_theme_id', previewThemeId);
  return url.toString();
}

export const env = {
  rootDir,
  storeBaseUrl,
  previewThemeId,
  eventPath,
  myLooksPath,
  storePassword: process.env.STORE_PASSWORD || '1',
  customerEmail: process.env.CUSTOMER_EMAIL || '',
  mailosaurApiKey: process.env.MAILOSAUR_API_KEY || '',
  mailosaurServerId: process.env.MAILOSAUR_SERVER_ID || '',
  storefrontSessionPath: path.join(rootDir, 'auth', 'session.storefront.json'),
  eventSessionPath: path.join(rootDir, 'auth', 'session.event.json'),
  eventUrl: withPreviewTheme(eventPath),
  myLooksUrl: withPreviewTheme(myLooksPath),
  withPreviewTheme,
};
