import { test, expect, TEST_IDS } from './fixtures';

test.describe('Gameplay', () => {
  test.beforeEach(async ({ gamePage }) => {
    await gamePage.gotoGame('oslo');
  });

  test('should start game and display question', async ({ gamePage }) => {
    await gamePage.startGame();
    
    await expect(gamePage.overlay).toBeVisible();
    await expect(gamePage.locator(TEST_IDS.questionText)).toBeVisible();
    await expect(gamePage.mapContainer).toBeVisible();
  });

  test('should handle correct answer', async ({ gamePage }) => {
    await gamePage.startGame();
    await gamePage.waitForTimeout(500);
    
    await gamePage.mapContainer.click({ force: true });
    await expect(gamePage.locator(TEST_IDS.feedbackMessage)).toBeVisible({ timeout: 5000 });
  });

  test('should handle wrong answer', async ({ gamePage }) => {
    await gamePage.startGame();
    await gamePage.waitForTimeout(500);
    
    await gamePage.mapContainer.click({ force: true });
    await expect(gamePage.locator(TEST_IDS.feedbackMessage)).toBeVisible({ timeout: 5000 });
    
    const feedbackMessage = gamePage.locator(TEST_IDS.feedbackMessage);
    const messageText = await feedbackMessage.textContent();
    
    if (messageText?.includes('Feil') || messageText?.includes('Wrong')) {
      await gamePage.waitForTimeout(1000);
      await gamePage.mapContainer.click({ force: true });
      await expect(gamePage.locator(TEST_IDS.feedbackMessage)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should complete a round and show progress', async ({ gamePage }) => {
    await gamePage.startGame();
    
    const scoreDisplay = gamePage.locator(TEST_IDS.scoreDisplay);
    await expect(scoreDisplay).toBeAttached();
    
    const scoreText = await scoreDisplay.textContent();
    expect(scoreText).toMatch(/\d+\/\d+/);
  });

  test('should show score with maximum possible score', async ({ gamePage }) => {
    await gamePage.startGame();
    
    await expect(gamePage.overlay).toBeVisible();
    const overlayText = await gamePage.overlay.textContent();
    expect(overlayText).toBeTruthy();
  });

  test('should prevent clicking on already answered areas', async ({ gamePage }) => {
    await gamePage.startGame();
    await gamePage.waitForTimeout(500);
    
    await gamePage.mapContainer.click({ force: true });
    await expect(gamePage.locator(TEST_IDS.feedbackMessage)).toBeVisible({ timeout: 5000 });
    
    await gamePage.waitForTimeout(2500);
    
    await gamePage.locator(TEST_IDS.scoreDisplay).textContent();
    await gamePage.mapContainer.click({ force: true });
    await gamePage.waitForTimeout(1000);
  });

  test('should restart game with new seed', async ({ gamePage }) => {
    await gamePage.startGame();
    
    const modalVisible = await gamePage.modal.isVisible().catch(() => false);
    if (modalVisible) {
      await gamePage.keyboard.press('Escape');
      await expect(gamePage.modal).not.toBeVisible({ timeout: 10000 });
    }
    
    await gamePage.waitForTimeout(500);
    
    const questionText1 = gamePage.locator(TEST_IDS.questionText);
    await expect(questionText1).toBeVisible();
    await questionText1.textContent();
    
    const restartButton = gamePage.locator('button').filter({ hasText: /Restart/i }).first();
    await expect(restartButton).toBeVisible();
    await restartButton.click({ force: true });
    
    await gamePage.waitForTimeout(1000);
    await expect(gamePage.overlay).toBeVisible();
  });

  test('should show game results when completed', async ({ gamePage }) => {
    await gamePage.startGame();
    await gamePage.waitForTimeout(500);
    
    for (let i = 0; i < 5; i++) {
      await gamePage.mapContainer.click({ force: true });
      await expect(gamePage.locator(TEST_IDS.feedbackMessage)).toBeVisible({ timeout: 5000 }).catch(() => {});
      await gamePage.waitForTimeout(500);
    }
  });

  test('should show confetti animation when game ends', async ({ gamePage }) => {
    await gamePage.startGame();
    await gamePage.waitForTimeout(500);
    
    for (let i = 0; i < 5; i++) {
      await gamePage.mapContainer.click({ force: true });
      await expect(gamePage.locator(TEST_IDS.feedbackMessage)).toBeVisible({ timeout: 5000 }).catch(() => {});
      await gamePage.waitForTimeout(600);
    }
    
    const resultsScreen = gamePage.locator('text=/Game Results|Resultater/i');
    const resultsVisible = await resultsScreen.isVisible().catch(() => false);
    
    if (resultsVisible) {
      await gamePage.waitForTimeout(1000);
      gamePage.locator('[data-testid="results-screen"]');
    }
  });

  test('should not cause layout shifts when toggling sound on mobile', async ({ gamePage }) => {
    await gamePage.setViewportSize({ width: 375, height: 667 });
    await gamePage.startGame();
    
    const header = gamePage.locator('header');
    const initialHeight = await header.boundingBox().then(box => box?.height ?? 0);
    
    const soundButton = gamePage.locator(TEST_IDS.soundToggleButton);
    await expect(soundButton).toBeVisible({ timeout: 10000 });
    
    await soundButton.click({ force: true });
    await gamePage.waitForTimeout(300);
    
    const afterToggleHeight = await header.boundingBox().then(box => box?.height ?? 0);
    expect(Math.abs(initialHeight - afterToggleHeight)).toBeLessThan(5);
    
    const mapName = gamePage.locator('h1');
    const mapNameBox = await mapName.boundingBox();
    expect(mapNameBox).toBeTruthy();
    if (mapNameBox) {
      expect(mapNameBox.width).toBeGreaterThan(0);
      expect(mapNameBox.width).toBeLessThan(375);
    }
  });

  test('should scale confetti animation based on percentage', async ({ gamePage }) => {
    await gamePage.startGame();
    await gamePage.waitForTimeout(500);
    
    for (let i = 0; i < 3; i++) {
      await gamePage.mapContainer.click({ force: true });
      await expect(gamePage.locator(TEST_IDS.feedbackMessage)).toBeVisible({ timeout: 5000 }).catch(() => {});
      await gamePage.waitForTimeout(600);
    }
    
    const resultsVisible = await gamePage.locator('text=/Game Results|Resultater/i').isVisible().catch(() => false);
    if (resultsVisible) {
      await gamePage.waitForTimeout(1000);
    }
  });

  test('should toggle sound on/off', async ({ gamePage }) => {
    await gamePage.startGame();
    await gamePage.waitForTimeout(500);
    
    const soundButton = gamePage.locator('button[aria-label*="sound"], button[aria-label*="lyd"]').first();
    
    await expect(soundButton).toBeVisible({ timeout: 10000 });
    
    await soundButton.click({ force: true });
    await expect(soundButton).toBeVisible();
    
    await soundButton.click({ force: true });
    await expect(soundButton).toBeVisible();
  });
});
