import { test } from '../../src/fixtures/test.js';

test('Select random suit color', async ({ suitBuilderPage }) => {
  await suitBuilderPage.goto();
  await suitBuilderPage.pickRandomSuitSwatch();
});

test('Toggle Tie accordion', async ({ suitBuilderPage }) => {
  await suitBuilderPage.goto();
  await suitBuilderPage.toggleTieAccordion();
});

test('Select random tie color', async ({ suitBuilderPage }) => {
  await suitBuilderPage.goto();
  await suitBuilderPage.selectRandomTieFromFirstSeven();
});

test('Select random Belt color', async ({ suitBuilderPage }) => {
  await suitBuilderPage.goto();
  await suitBuilderPage.selectRandomBelt();
});

test('Select random Shoe color', async ({ suitBuilderPage }) => {
  await suitBuilderPage.goto();
  await suitBuilderPage.selectRandomShoe();
});
