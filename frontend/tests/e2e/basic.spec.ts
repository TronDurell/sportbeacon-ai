import { test, expect } from '@playwright/test';

test.describe('Dashboard Page', () => {
  test('should load and display dashboard content', async ({ page }) => {
    await page.goto('/');
    // Adjust selector/text below to match your dashboard/home page
    await expect(page).toHaveTitle(/SportBeacon/i);
    await expect(page.locator('body')).toContainText(["dashboard", "profile", "team", "game"]);
  });
}); 