import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should display map cards', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check that map cards are visible
    await expect(page.locator('[data-testid="map-card"]')).toBeVisible();
    
    // Check that we have multiple maps
    const mapCards = page.locator('[data-testid="map-card"]');
    await expect(mapCards).toHaveCountGreaterThan(1);
  });

  test('should navigate to game when clicking on a map card', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Click on the first map card
    const firstMapCard = page.locator('[data-testid="map-card"]').first();
    await firstMapCard.click();
    
    // Should navigate to game page
    await expect(page).toHaveURL(/\/game\/[^\/]+/);
  });

  test('should display map metadata correctly', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check that map names are visible
    await expect(page.locator('[data-testid="map-name"]')).toBeVisible();
    
    // Check that map descriptions are visible
    await expect(page.locator('[data-testid="map-description"]')).toBeVisible();
  });
});