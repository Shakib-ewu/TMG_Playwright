export async function pickRandom(items) {
  const item = items[Math.floor(Math.random() * items.length)];
  await item.click();
  return item;
}

export function randomIndex(maxExclusive) {
  return Math.floor(Math.random() * maxExclusive);
}
