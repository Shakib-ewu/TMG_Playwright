import { test, expect } from '../../src/fixtures/test.js';

test.describe('Events page', () => {
  test('opens My Events under preview theme', async ({ eventsPage, page }) => {
    await eventsPage.goto();

    await expect(page).toHaveURL(/my-events/i, { timeout: 30000 });
    await expect(page).toHaveURL(/preview_theme_id=190707466519/);
  });

  test('Events heading or create CTA is reachable', async ({ eventsPage }) => {
    await eventsPage.goto();

    const headingVisible = await eventsPage.heading().isVisible().catch(() => false);
    const createVisible = await eventsPage.createEventButton().first().isVisible().catch(() => false);

    expect(headingVisible || createVisible).toBeTruthy();
  });
});
