// Imports the configured Playwright test fixture.
import { test } from '../../src/fixtures/test.js';

// Verifies that a random suit color can be selected.
test('Select random suit color', async ({ suitBuilderPage }) => {
  // Opens the Suit Builder page.
  await suitBuilderPage.goto();
  // Selects one suit swatch at random.
  await suitBuilderPage.pickRandomSuitSwatch();
});

// Verifies that the tie accordion can be toggled.
test('Toggle Tie accordion', async ({ suitBuilderPage }) => {
  // Opens the Suit Builder page.
  await suitBuilderPage.goto();
  // Performs the tie accordion toggle sequence.
  await suitBuilderPage.toggleTieAccordion();
});

// Verifies that a random tie color can be selected.
test('Select random tie color', async ({ suitBuilderPage }) => {
  // Opens the Suit Builder page.
  await suitBuilderPage.goto();
  // Selects one of the first seven tie swatches.
  await suitBuilderPage.selectRandomTieFromFirstSeven();
});

// Verifies that a random belt color can be selected.
test('Select random Belt color', async ({ suitBuilderPage }) => {
  // Opens the Suit Builder page.
  await suitBuilderPage.goto();
  // Selects a belt swatch at random.
  await suitBuilderPage.selectRandomBelt();
});

// Verifies that a random shoe color can be selected.
test('Select random Shoe color', async ({ suitBuilderPage }) => {
  // Opens the Suit Builder page.
  await suitBuilderPage.goto();
  // Selects a shoe swatch at random.
  await suitBuilderPage.selectRandomShoe();
});
