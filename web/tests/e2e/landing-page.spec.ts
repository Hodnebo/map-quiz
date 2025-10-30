import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should display map cards', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check that map cards are visible
    const mapCards = page.locator('[data-testid="map-card"]');
    await expect(mapCards.first()).toBeVisible();
    
    // Check that we have multiple maps
    const count = await mapCards.count();
    expect(count).toBeGreaterThan(1);
  });

  test('should navigate to game when clicking on a map card', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Click on the first map card's action button
    const firstPlayButton = page.locator('[data-testid="map-card"] button').first();
    await firstPlayButton.click();
    
    // Should navigate to game page
    await expect(page).toHaveURL(/\/game\/[^\/]+/);
  });

  test('should display map metadata correctly', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check that at least one map name is visible
    await expect(page.locator('[data-testid="map-name"]').first()).toBeVisible();
    
    // Check that at least one map description is visible
    await expect(page.locator('[data-testid="map-description"]').first()).toBeVisible();
  });
});