/** Clicks one randomly chosen locator from the given list and returns it. */
export async function pickRandom(items) {
  const item = items[Math.floor(Math.random() * items.length)];
  await item.click();
  return item;
}

/** Returns a random integer in the range [0, maxExclusive). */
export function randomIndex(maxExclusive) {
  return Math.floor(Math.random() * maxExclusive);
}
