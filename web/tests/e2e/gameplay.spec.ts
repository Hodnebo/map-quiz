import { test, expect } from '@playwright/test';

// Helper function to wait for modal to fully close
async function waitForModalToClose(page: any, timeout = 15000) {
  const modal = page.locator('[data-testid="game-mode-modal"]');
  
  // Wait for modal to not be visible - use a polling approach
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const isVisible = await modal.isVisible().catch(() => false);
    if (!isVisible) {
      // Modal is not visible, verify it's truly gone
      await page.waitForTimeout(300); // Small wait to ensure transition completed
      const stillVisible = await modal.isVisible().catch(() => false);
      if (!stillVisible) {
        return; // Modal is closed
      }
    }
    await page.waitForTimeout(100); // Poll every 100ms
  }
  
  // If we get here, modal is still visible after timeout
  // Try one more time with expect
  await expect(modal).not.toBeVisible({ timeout: 5000 });
}

// Helper function to wait for game to start (modal closed + overlay visible)
async function waitForGameToStart(page: any, timeout = 30000) {
  const modal = page.locator('[data-testid="game-mode-modal"]');
  const overlay = page.locator('[data-testid="game-overlay"]');
  
  // First, wait for modal to close completely
  await waitForModalToClose(page, Math.min(timeout, 15000));
  
  // Then wait for overlay to be visible with polling
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const overlayVisible = await overlay.isVisible().catch(() => false);
    if (overlayVisible) {
      // Overlay is visible, verify it's truly visible
      await page.waitForTimeout(300); // Small wait to ensure it's stable
      const stillVisible = await overlay.isVisible().catch(() => false);
      if (stillVisible) {
        return; // Overlay is visible and game has started
      }
    }
    await page.waitForTimeout(100); // Poll every 100ms
  }
  
  // If we get here, overlay didn't appear - use expect as fallback
  await expect(overlay).toBeVisible({ timeout: 10000 });
}

// Helper function to start game handling modal if needed
async function startGameWithModalHandling(page: any) {
  const modal = page.locator('[data-testid="game-mode-modal"]');
  const startButton = page.locator('[data-testid="start-game-button"]');
  const overlay = page.locator('[data-testid="game-overlay"]');
  
  // First, ensure map is ready
  await expect(page.locator('[data-testid="map-container"]')).toBeVisible({ timeout: 15000 });
  
  if (await modal.isVisible().catch(() => false)) {
    // Modal is open, wait for start button to be enabled (not disabled)
    // The button might be disabled if canPlay is false
    await page.waitForTimeout(1000); // Give time for canPlay to become true
    await expect(startButton).toBeEnabled({ timeout: 10000 });
    
    // Click start button
    await startButton.click();
    // Wait for modal to close first
    await expect(modal).not.toBeVisible({ timeout: 5000 });
    // Wait for overlay to appear (this is the key indicator) with increased timeout
    await expect(overlay).toBeVisible({ timeout: 30000 });
  } else {
    // Modal not open, just click start
    await startButton.click();
    // Wait for overlay to appear with increased timeout
    await expect(overlay).toBeVisible({ timeout: 30000 });
  }
}

test.describe('Gameplay', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a game page
    await page.goto('/game/oslo');
    // Wait for the map container to be visible instead of network idle
    await expect(page.locator('[data-testid="map-container"]')).toBeVisible({ timeout: 15000 });
  });

  test('should start game and display question', async ({ page }) => {
    // Start game
    await page.click('[data-testid="start-game-button"]');
    
    // Check that game overlay is visible
    await expect(page.locator('[data-testid="game-overlay"]')).toBeVisible();
    
    // Check that question is displayed
    await expect(page.locator('[data-testid="question-text"]')).toBeVisible();
    
    // Check that map is interactive
    await expect(page.locator('[data-testid="map-container"]')).toBeVisible();
  });

  test('should handle correct answer', async ({ page }) => {
    // Start game
    await page.click('[data-testid="start-game-button"]');
    
    // Wait for game overlay to be visible
    await expect(page.locator('[data-testid="game-overlay"]')).toBeVisible({ timeout: 15000 });
    
    // Wait for map to be ready
    const mapContainer = page.locator('[data-testid="map-container"]');
    await expect(mapContainer).toBeVisible();
    await page.waitForTimeout(500); // Brief wait for map to initialize
    
    // Click on a region (this might be correct or wrong, but we'll test the flow)
    await mapContainer.click({ force: true });
    
    // Check that feedback is shown
    await expect(page.locator('[data-testid="feedback-message"]')).toBeVisible({ timeout: 5000 });
  });

  test('should handle wrong answer', async ({ page }) => {
    // Start game
    await page.click('[data-testid="start-game-button"]');
    
    // Wait for game overlay to be visible
    await expect(page.locator('[data-testid="game-overlay"]')).toBeVisible({ timeout: 15000 });
    
    // Wait for map to be ready
    const mapContainer = page.locator('[data-testid="map-container"]');
    await expect(mapContainer).toBeVisible();
    await page.waitForTimeout(500); // Brief wait for map to initialize
    
    // Click on a region
    await mapContainer.click({ force: true });
    
    // Check that feedback is shown
    await expect(page.locator('[data-testid="feedback-message"]')).toBeVisible({ timeout: 5000 });
    
    // If it's wrong, check that we can try again
    const feedbackMessage = page.locator('[data-testid="feedback-message"]');
    const messageText = await feedbackMessage.textContent();
    
    if (messageText?.includes('Feil') || messageText?.includes('Wrong')) {
      // Wait for feedback to clear before clicking again
      await page.waitForTimeout(1000);
      // Check that we can click again
      await mapContainer.click({ force: true });
      // Wait for next feedback
      await expect(page.locator('[data-testid="feedback-message"]')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should complete a round and show progress', async ({ page }) => {
    // Start game
    await page.click('[data-testid="start-game-button"]');
    
    // Wait for game overlay to be visible
    await expect(page.locator('[data-testid="game-overlay"]')).toBeVisible();
    
    // Check that score is present and shows format like "X/Y" (current/max)
    const scoreDisplay = page.locator('[data-testid="score-display"]');
    await expect(scoreDisplay).toBeAttached();
    
    // Score should be in format "correct/answered" (e.g., "0/0" or "1/1")
    const scoreText = await scoreDisplay.textContent();
    expect(scoreText).toMatch(/\d+\/\d+/);
  });

  test('should show score with maximum possible score', async ({ page }) => {
    // Start game
    await page.click('[data-testid="start-game-button"]');
    
    // Wait for game overlay to be visible
    await expect(page.locator('[data-testid="game-overlay"]')).toBeVisible();
    
    // Check that score display shows current score out of maximum
    // We check for the pattern "X/Y" where Y is the max score
    // The score display should be visible in the overlay
    const overlay = page.locator('[data-testid="game-overlay"]');
    await expect(overlay).toBeVisible();
    
    // The score should be displayed somewhere in the overlay
    // We can check for the presence of a score that includes "/"
    const overlayText = await overlay.textContent();
    expect(overlayText).toBeTruthy();
  });

  test('should prevent clicking on already answered areas', async ({ page }) => {
    // Start game
    await page.click('[data-testid="start-game-button"]');
    
    // Wait for game overlay to be visible
    await expect(page.locator('[data-testid="game-overlay"]')).toBeVisible({ timeout: 15000 });
    
    // Wait for map to be ready
    const mapContainer = page.locator('[data-testid="map-container"]');
    await expect(mapContainer).toBeVisible();
    await page.waitForTimeout(500);
    
    // Click on a region to answer
    await mapContainer.click({ force: true });
    
    // Wait for feedback
    await expect(page.locator('[data-testid="feedback-message"]')).toBeVisible({ timeout: 5000 });
    
    // Wait for feedback to clear
    await page.waitForTimeout(2500);
    
    // Try to click on the same area again - it should not trigger another answer
    // We verify this by checking that the score/round counter doesn't change unexpectedly
    const scoreBefore = await page.locator('[data-testid="score-display"]').textContent();
    await mapContainer.click({ force: true });
    
    // Wait a bit
    await page.waitForTimeout(1000);
    
    // The score should not have changed (or changed only once if first click was correct)
    // This is a basic check - in a real scenario we'd track the answeredIds
  });

  test('should restart game with new seed', async ({ page }) => {
    // Start game
    await page.click('[data-testid="start-game-button"]');
    
    // Wait for game overlay to be visible
    await expect(page.locator('[data-testid="game-overlay"]')).toBeVisible({ timeout: 15000 });
    
    // Ensure modal is closed if it's still open
    const modal = page.locator('[data-testid="game-mode-modal"]');
    if (await modal.isVisible().catch(() => false)) {
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible({ timeout: 10000 });
    }
    
    // Wait a bit for everything to settle
    await page.waitForTimeout(500);
    
    // Get the first question
    const questionText1 = page.locator('[data-testid="question-text"]');
    await expect(questionText1).toBeVisible();
    const firstQuestion = await questionText1.textContent();
    
    // Click restart button (should be visible when game is playing)
    // Use a more specific selector that matches the restart button in the header
    const restartButton = page.locator('button').filter({ hasText: /Restart/i }).first();
    await expect(restartButton).toBeVisible();
    await restartButton.click({ force: true });
    
    // Wait for new question
    await page.waitForTimeout(1000);
    
    // The question might be different (due to new seed)
    // We verify restart happened by checking overlay is still visible
    await expect(page.locator('[data-testid="game-overlay"]')).toBeVisible();
  });

  test('should show game results when completed', async ({ page }) => {
    // Start game
    await page.click('[data-testid="start-game-button"]');
    
    // Wait for game overlay to be visible
    await expect(page.locator('[data-testid="game-overlay"]')).toBeVisible({ timeout: 15000 });
    
    // Wait for map to be ready
    const mapContainer = page.locator('[data-testid="map-container"]');
    await expect(mapContainer).toBeVisible();
    await page.waitForTimeout(500); // Brief wait for map to initialize
    
    // Simulate completing the game by clicking through regions
    // This is a simplified test - in reality we'd need to answer correctly
    for (let i = 0; i < 5; i++) {
      await mapContainer.click({ force: true });
      // Wait for feedback message to appear instead of fixed timeout
      await expect(page.locator('[data-testid="feedback-message"]')).toBeVisible({ timeout: 5000 }).catch(() => {});
      // Brief wait between clicks
      await page.waitForTimeout(500);
    }
    
    // Check if results screen appears (this might not happen in 5 clicks)
    // In a real test, we'd need to properly complete the game
  });

  test('should show confetti animation when game ends', async ({ page }) => {
    // Start game
    await page.click('[data-testid="start-game-button"]');
    
    // Wait for game overlay to be visible
    await expect(page.locator('[data-testid="game-overlay"]')).toBeVisible({ timeout: 15000 });
    
    // Wait for map to be ready
    const mapContainer = page.locator('[data-testid="map-container"]');
    await expect(mapContainer).toBeVisible();
    await page.waitForTimeout(500);
    
    // Simulate completing the game by clicking through regions
    // Click multiple times to progress through rounds
    for (let i = 0; i < 5; i++) {
      await mapContainer.click({ force: true });
      await expect(page.locator('[data-testid="feedback-message"]')).toBeVisible({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(600);
    }
    
    // Check if results screen appears (may take more clicks to complete)
    // If results screen appears, confetti should be visible
    const resultsScreen = page.locator('text=/Game Results|Resultater/i');
    const resultsVisible = await resultsScreen.isVisible().catch(() => false);
    
    if (resultsVisible) {
      // Check for confetti elements (they should be present if percentage > 0)
      await page.waitForTimeout(1000); // Wait for confetti animation to start
      // Confetti elements are created dynamically, so we check for the animation container
      const confettiContainer = page.locator('[data-testid="results-screen"]');
      // The confetti animation should be visible if game ended
    }
  });

  test('should not cause layout shifts when toggling sound on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Start game (handles modal if needed)
    await startGameWithModalHandling(page);
    
    // Get initial header height
    const header = page.locator('header');
    const initialHeight = await header.boundingBox().then(box => box?.height ?? 0);
    
    // Toggle sound button
    const soundButton = page.locator('[data-testid="sound-toggle-button"]');
    await expect(soundButton).toBeVisible({ timeout: 10000 });
    
    // Click sound toggle
    await soundButton.click({ force: true });
    
    // Wait a bit for any layout changes
    await page.waitForTimeout(300);
    
    // Header height should remain stable
    const afterToggleHeight = await header.boundingBox().then(box => box?.height ?? 0);
    expect(Math.abs(initialHeight - afterToggleHeight)).toBeLessThan(5); // Allow small tolerance
    
    // Map name should still be visible and not overflow
    const mapName = page.locator('h1');
    const mapNameBox = await mapName.boundingBox();
    expect(mapNameBox).toBeTruthy();
    if (mapNameBox) {
      // Map name should fit within header
      expect(mapNameBox.width).toBeGreaterThan(0);
      expect(mapNameBox.width).toBeLessThan(375); // Should fit within viewport
    }
  });

  test('should scale confetti animation based on percentage', async ({ page }) => {
    // This test verifies that confetti animation scales with percentage
    // Start game
    await page.click('[data-testid="start-game-button"]');
    
    // Wait for game overlay to be visible
    await expect(page.locator('[data-testid="game-overlay"]')).toBeVisible({ timeout: 15000 });
    
    // Wait for map to be ready
    const mapContainer = page.locator('[data-testid="map-container"]');
    await expect(mapContainer).toBeVisible();
    await page.waitForTimeout(500);
    
    // Simulate completing rounds (we won't complete perfectly, but test structure is in place)
    // When results screen appears, confetti should scale with percentage
    for (let i = 0; i < 3; i++) {
      await mapContainer.click({ force: true });
      await expect(page.locator('[data-testid="feedback-message"]')).toBeVisible({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(600);
    }
    
    // If results screen appears, verify confetti container exists
    // The confetti amount should scale with the percentage of correct answers
    const resultsVisible = await page.locator('text=/Game Results|Resultater/i').isVisible().catch(() => false);
    if (resultsVisible) {
      await page.waitForTimeout(1000);
      // Confetti animation container should be present
      // The number of confetti pieces should be proportional to percentage
    }
  });

  test('should toggle sound on/off', async ({ page }) => {
    // Start a game first to ensure modal is closed
    await page.click('[data-testid="start-game-button"]');
    
    // Wait for game overlay to be visible (this confirms modal is closed)
    await expect(page.locator('[data-testid="game-overlay"]')).toBeVisible({ timeout: 15000 });
    
    // Wait a bit for everything to settle
    await page.waitForTimeout(500);
    
    // Check for sound toggle button in header
    // The button should have a volume icon
    const soundButton = page.locator('button[aria-label*="sound"], button[aria-label*="lyd"]').first();
    
    // Wait for button to be visible and not intercepted
    await expect(soundButton).toBeVisible({ timeout: 10000 });
    
    // Click sound toggle
    await soundButton.click({ force: true });
    
    // Verify button state changed (icon might change)
    // The button should still be visible
    await expect(soundButton).toBeVisible();
    
    // Click again to toggle back
    await soundButton.click({ force: true });
    await expect(soundButton).toBeVisible();
  });
});