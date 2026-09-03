// Clicks one already-created Playwright locator chosen at random.
export async function pickRandom(items) {
  // Calculates a random valid array position and selects that locator.
  const item = items[Math.floor(Math.random() * items.length)];
  // Performs the click on the selected page element.
  await item.click();
  // Returns the selected locator to the caller.
  return item;
}

// Returns a random integer from zero up to, but not including, maxExclusive.
export function randomIndex(maxExclusive) {
  // Multiplies a random decimal by the exclusive maximum and rounds down.
  return Math.floor(Math.random() * maxExclusive);
}
