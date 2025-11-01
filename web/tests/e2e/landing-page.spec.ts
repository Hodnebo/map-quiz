import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should display map cards', async ({ page }) => {
    await page.goto('/');
    
    // Wait for map cards to be visible instead of network idle
    const mapCards = page.locator('[data-testid="map-card"]');
    await expect(mapCards.first()).toBeVisible();
    
    // Check that we have multiple maps
    const count = await mapCards.count();
    expect(count).toBeGreaterThan(1);
  });

  test('should navigate to game when clicking on a map card', async ({ page }) => {
    await page.goto('/');
    
    // Wait for map cards to be visible
    await expect(page.locator('[data-testid="map-card"]').first()).toBeVisible();
    
    // Click on the first map card's action button
    const firstPlayButton = page.locator('[data-testid="map-card"] button').first();
    await firstPlayButton.click();
    
    // Should navigate to game page
    await expect(page).toHaveURL(/\/game\/[^/]+/);
  });

  test('should display map metadata correctly', async ({ page }) => {
    await page.goto('/');
    
    // Wait for map cards to be visible
    await expect(page.locator('[data-testid="map-card"]').first()).toBeVisible();
    
    // Check that at least one map name is visible
    await expect(page.locator('[data-testid="map-name"]').first()).toBeVisible();
    
    // Check that at least one map description is visible
    await expect(page.locator('[data-testid="map-description"]').first()).toBeVisible();
  });

  test('should show game mode modal when navigating to a new map', async ({ page }) => {
    // Clear localStorage to simulate fresh visit
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    
    // Wait for map cards to be visible
    await expect(page.locator('[data-testid="map-card"]').first()).toBeVisible();
    
    // Click on the first map card's action button
    const firstPlayButton = page.locator('[data-testid="map-card"] button').first();
    await firstPlayButton.click();
    
    // Should navigate to game page
    await expect(page).toHaveURL(/\/game\/[^/]+/);
    
    // Wait for map container to be visible
    await expect(page.locator('[data-testid="map-container"]')).toBeVisible({ timeout: 15000 });
    
    // Modal should be visible automatically when opening a new map
    const modal = page.locator('[data-testid="game-mode-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
  });

  test('should show modal when navigating to a different map (per-map modal)', async ({ page }) => {
    // First, navigate to one map and start a game (this should mark modal as seen)
    await page.goto('/');
    await expect(page.locator('[data-testid="map-card"]').first()).toBeVisible();
    
    // Get the first map's URL
    const firstMapCard = page.locator('[data-testid="map-card"]').first();
    const firstMapButton = firstMapCard.locator('button').first();
    await firstMapButton.click();
    await expect(page).toHaveURL(/\/game\/[^/]+/);
    
    // Wait for map container
    await expect(page.locator('[data-testid="map-container"]')).toBeVisible({ timeout: 15000 });
    
    // If modal appears, close it by starting game
    const modal = page.locator('[data-testid="game-mode-modal"]');
    const modalVisible = await modal.isVisible().catch(() => false);
    if (modalVisible) {
      const startButton = page.locator('[data-testid="start-game-button"]');
      await expect(startButton).toBeEnabled({ timeout: 10000 });
      await startButton.click();
      await expect(page.locator('[data-testid="game-overlay"]')).toBeVisible({ timeout: 30000 });
    }
    
    // Now navigate to a different map
    await page.goto('/');
    await expect(page.locator('[data-testid="map-card"]').first()).toBeVisible();
    
    // Get a different map (if available)
    const mapCards = page.locator('[data-testid="map-card"]');
    const cardCount = await mapCards.count();
    if (cardCount > 1) {
      // Click on second map
      const secondMapButton = mapCards.nth(1).locator('button').first();
      await secondMapButton.click();
      await expect(page).toHaveURL(/\/game\/[^/]+/);
      
      // Wait for map container
      await expect(page.locator('[data-testid="map-container"]')).toBeVisible({ timeout: 15000 });
      
      // Modal should appear again for this new map (per-map behavior)
      await expect(modal).toBeVisible({ timeout: 5000 });
    }
  });

  test('should close modal with cancel button without starting game', async ({ page }) => {
    // Clear localStorage to simulate fresh visit
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    
    // Navigate to game page
    await expect(page.locator('[data-testid="map-card"]').first()).toBeVisible();
    const firstPlayButton = page.locator('[data-testid="map-card"] button').first();
    await firstPlayButton.click();
    await expect(page).toHaveURL(/\/game\/[^/]+/);
    
    // Wait for map container and modal
    await expect(page.locator('[data-testid="map-container"]')).toBeVisible({ timeout: 15000 });
    const modal = page.locator('[data-testid="game-mode-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
    
    // Click cancel button
    const cancelButton = page.locator('[data-testid="cancel-button"]');
    await expect(cancelButton).toBeVisible();
    await cancelButton.click();
    
    // Modal should close
    await expect(modal).not.toBeVisible({ timeout: 5000 });
    
    // Game should not have started - overlay should not be visible
    const overlay = page.locator('[data-testid="game-overlay"]');
    await page.waitForTimeout(1000); // Wait for any animations
    const overlayVisible = await overlay.isVisible().catch(() => false);
    expect(overlayVisible).toBe(false);
    
    // Modal should be able to be reopened via settings button
    await page.click('[data-testid="settings-button"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
  });

  test('should start game on first click of start button', async ({ page }) => {
    // Clear localStorage to simulate fresh visit
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    
    // Navigate to game page
    await expect(page.locator('[data-testid="map-card"]').first()).toBeVisible();
    const firstPlayButton = page.locator('[data-testid="map-card"] button').first();
    await firstPlayButton.click();
    await expect(page).toHaveURL(/\/game\/[^/]+/);
    
    // Wait for map container and modal
    await expect(page.locator('[data-testid="map-container"]')).toBeVisible({ timeout: 15000 });
    const modal = page.locator('[data-testid="game-mode-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
    
    // Wait for start button to be enabled
    const startButton = page.locator('[data-testid="start-game-button"]');
    await expect(startButton).toBeVisible();
    await page.waitForTimeout(1000); // Give time for canPlay to become true
    await expect(startButton).toBeEnabled({ timeout: 10000 });
    
    // Click start button once
    await startButton.click();
    
    // Game should start - overlay should appear
    const overlay = page.locator('[data-testid="game-overlay"]');
    await expect(overlay).toBeVisible({ timeout: 30000 });
    
    // Modal should close
    await expect(modal).not.toBeVisible({ timeout: 5000 });
  });
});
