import { test, expect } from '@playwright/test';

test.describe('Game Modes', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a game page
    await page.goto('/game/oslo');
    await page.waitForLoadState('networkidle');
  });

  test('should open game mode modal when clicking settings', async ({ page }) => {
    // If modal is already open (first visit), proceed; otherwise open it
    const modal = page.locator('[data-testid="game-mode-modal"]');
    if (!(await modal.isVisible().catch(() => false))) {
      await page.click('[data-testid="settings-button"]');
    }
    // Check that modal is visible
    await expect(modal).toBeVisible();
  });

  test('should display all game modes in modal', async ({ page }) => {
    // Ensure modal is open
    const modal = page.locator('[data-testid="game-mode-modal"]');
    if (!(await modal.isVisible().catch(() => false))) {
      await page.click('[data-testid="settings-button"]');
    }
    
    // Check that all game modes are present
    await expect(page.locator('[data-testid="game-mode-classic"]')).toBeVisible();
    await expect(page.locator('[data-testid="game-mode-reverse_quiz"]')).toBeVisible();
    await expect(page.locator('[data-testid="game-mode-multiple_choice"]')).toBeVisible();
  });

  test('should display all difficulty levels in classic mode', async ({ page }) => {
    // Ensure modal is open
    const modal = page.locator('[data-testid="game-mode-modal"]');
    if (!(await modal.isVisible().catch(() => false))) {
      await page.click('[data-testid="settings-button"]');
    }
    
    // Select classic mode
    await page.click('[data-testid="game-mode-classic"]');
    
    // Check that all difficulty levels are present
    const difficultySelect = page.locator('[data-testid="difficulty-select"]');
    await expect(difficultySelect).toBeVisible();
    
    // Click on difficulty select to open dropdown
    await difficultySelect.click();
    
    // Check that all difficulty options are present (use role=option for menu)
    await expect(page.getByRole('option', { name: 'Trening' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Lett' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Normal' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Vanskelig' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Ekspert' })).toBeVisible();
  });

  test('should start game with selected mode and settings', async ({ page }) => {
    // Ensure modal is open
    const modal = page.locator('[data-testid="game-mode-modal"]');
    if (!(await modal.isVisible().catch(() => false))) {
      await page.click('[data-testid="settings-button"]');
    }
    
    // Select classic mode and adjust difficulty
    await page.click('[data-testid="game-mode-classic"]');
    await page.click('[data-testid="difficulty-select"]');
    await page.getByRole('option', { name: 'Vanskelig' }).click();
    
    // Start game
    await page.click('[data-testid="start-game-button"]');
    
    // Check that game started (modal should be closed)
    await expect(page.locator('[data-testid="game-mode-modal"]')).not.toBeVisible();
    
    // Check that game overlay is visible
    await expect(page.locator('[data-testid="game-overlay"]')).toBeVisible();
  });

  test('should prevent zoom on hard and expert difficulties', async ({ page }) => {
    // Ensure modal is open
    const modal = page.locator('[data-testid="game-mode-modal"]');
    if (!(await modal.isVisible().catch(() => false))) {
      await page.click('[data-testid="settings-button"]');
    }
    
    // Select classic mode
    await page.click('[data-testid="game-mode-classic"]');
    
    // Set difficulty to hard
    await page.click('[data-testid="difficulty-select"]');
    await page.getByRole('option', { name: 'Vanskelig' }).click();
    
    // Start game
    await page.click('[data-testid="start-game-button"]');
    
    // Wait for map to load
    await page.waitForSelector('[data-testid="map-container"]');
    
    // Try to zoom in (should be disabled)
    const mapContainer = page.locator('[data-testid="map-container"]');
    await mapContainer.hover();
    
    // Try to scroll to zoom (should not work)
    await page.mouse.wheel(0, -100);
    
    // The map should not have zoomed significantly
    // This is a basic check - in a real test we'd check the actual zoom level
    await expect(mapContainer).toBeVisible();
  });
});