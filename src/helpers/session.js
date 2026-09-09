import fs from 'fs';

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
