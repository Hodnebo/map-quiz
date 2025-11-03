import { test, expect, TEST_IDS } from './fixtures';

test.describe('Landing Page', () => {
  test('should display map cards', async ({ gamePage }) => {
    await gamePage.gotoLanding();
    
    const mapCards = gamePage.locator(TEST_IDS.mapCard);
    await expect(mapCards.first()).toBeVisible();
    
    const count = await mapCards.count();
    expect(count).toBeGreaterThan(1);
  });

  test('should navigate to game when clicking on a map card', async ({ gamePage }) => {
    await gamePage.gotoLanding();
    await gamePage.clickMapCard(0);
  });

  test('should display map metadata correctly', async ({ gamePage }) => {
    await gamePage.gotoLanding();
    
    await expect(gamePage.locator('[data-testid="map-name"]').first()).toBeVisible();
    await expect(gamePage.locator('[data-testid="map-description"]').first()).toBeVisible();
  });

  test('should show game mode modal when navigating to a new map', async ({ gamePage }) => {
    await gamePage.gotoLanding();
    await gamePage.clearLocalStorage();
    await gamePage.clickMapCard(0);
    
    await gamePage.waitForMapReady();
    await expect(gamePage.modal).toBeVisible({ timeout: 5000 });
  });

  test('should show modal when navigating to a different map (per-map modal)', async ({ gamePage }) => {
    await gamePage.gotoLanding();
    await gamePage.clickMapCard(0);
    await gamePage.waitForMapReady();
    
    // If modal appears, close it by starting game
    const modalVisible = await gamePage.modal.isVisible().catch(() => false);
    if (modalVisible) {
      await expect(gamePage.startButton).toBeEnabled({ timeout: 10000 });
      await gamePage.startButton.click();
      await gamePage.waitForGameOverlay();
    }
    
    // Navigate to a different map
    await gamePage.gotoLanding();
    const mapCards = gamePage.locator(TEST_IDS.mapCard);
    const cardCount = await mapCards.count();
    
    if (cardCount > 1) {
      await gamePage.clickMapCard(1);
      await gamePage.waitForMapReady();
      await expect(gamePage.modal).toBeVisible({ timeout: 5000 });
    }
  });

  test('should close modal with cancel button without starting game', async ({ gamePage }) => {
    await gamePage.gotoLanding();
    await gamePage.clearLocalStorage();
    await gamePage.clickMapCard(0);
    await gamePage.waitForMapReady();
    
    await expect(gamePage.modal).toBeVisible({ timeout: 5000 });
    await expect(gamePage.cancelButton).toBeVisible();
    await gamePage.cancelButton.click();
    await gamePage.waitForModalClose();
    
    // Game should not have started
    await gamePage.waitForTimeout(1000);
    const overlayVisible = await gamePage.overlay.isVisible().catch(() => false);
    expect(overlayVisible).toBe(false);
    
    // Modal should be able to be reopened
    await gamePage.settingsButton.click();
    await expect(gamePage.modal).toBeVisible({ timeout: 5000 });
  });

  test('should start game on first click of start button', async ({ gamePage }) => {
    await gamePage.gotoLanding();
    await gamePage.clearLocalStorage();
    await gamePage.clickMapCard(0);
    await gamePage.waitForMapReady();
    
    await expect(gamePage.modal).toBeVisible({ timeout: 5000 });
    await expect(gamePage.startButton).toBeVisible();
    await gamePage.waitForTimeout(1000);
    await expect(gamePage.startButton).toBeEnabled({ timeout: 10000 });
    
    await gamePage.startButton.click();
    await gamePage.waitForGameOverlay();
    await expect(gamePage.modal).not.toBeVisible({ timeout: 5000 });
  });
});
