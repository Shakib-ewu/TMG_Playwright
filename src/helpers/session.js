import fs from 'fs';

/** How long a saved session is trusted before it is thrown away and rebuilt. */
export const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** Reports whether a saved Playwright storage-state file holds at least one cookie. */
export function hasSession(filePath) {
  try {
    const state = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return Array.isArray(state.cookies) && state.cookies.length > 0;
  } catch {
    // A missing or malformed file means setup still needs to run.
    return false;
  }
}

/**
 * True when the session file has cookies and is younger than the age limit.
 * The file's own timestamp is the clock, so a daily run rebuilds it once a day.
 */
export function isSessionFresh(filePath, maxAgeMs = SESSION_MAX_AGE_MS) {
  if (!hasSession(filePath)) {
    return false;
  }

  const ageMs = Date.now() - fs.statSync(filePath).mtimeMs;
  return ageMs < maxAgeMs;
}

/**
 * Opens the saved session in a throwaway browser context to confirm the site
 * still accepts it. Age alone cannot catch a session the server killed early.
 *
 * @param {import('@playwright/test').Browser} browser
 * @param {string} filePath saved storage state
 * @param {string} url page to land on
 * @param {(page: import('@playwright/test').Page) => Promise<boolean>} isSignedIn
 * @returns {Promise<boolean>} true if the session still works.
 */
export async function isSessionUsable(browser, filePath, url, isSignedIn) {
  if (!hasSession(filePath)) {
    return false;
  }

  const context = await browser.newContext({ storageState: filePath });
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    return await isSignedIn(page);
  } catch {
    // Any failure here means we cannot trust the session, so rebuild it.
    return false;
  } finally {
    await context.close();
  }
}
