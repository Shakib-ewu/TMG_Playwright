import { test, expect } from '../../src/fixtures/test.js';

test.describe('My Looks (account)', () => {
  test('shows My Looks heading and Create Another Look', async ({ myLooksPage }) => {
    await myLooksPage.goto();

    await expect(myLooksPage.heading()).toBeVisible({ timeout: 30000 });
    await expect(myLooksPage.createAnotherLookButton()).toBeVisible();
  });

  test('shows Plan My Event CTA', async ({ myLooksPage }) => {
    await myLooksPage.goto();

    await expect(myLooksPage.planMyEventButton()).toBeVisible({ timeout: 30000 });
  });

  test('can switch to Events tab', async ({ myLooksPage, page }) => {
    await myLooksPage.goto();
    await myLooksPage.openEventsTab();

    await expect(page).toHaveURL(/my-events|events/i, { timeout: 30000 });
  });

  test('Plan My Event navigates into event planning', async ({ myLooksPage, page }) => {
    await myLooksPage.goto();
    await myLooksPage.clickPlanMyEvent();

    await expect(page).toHaveURL(/event/i, { timeout: 30000 });
  });

  test('Your Looks section is visible', async ({ myLooksPage }) => {
    await myLooksPage.goto();

    await expect(myLooksPage.yourLooksSection()).toBeVisible({ timeout: 30000 });
  });
});
