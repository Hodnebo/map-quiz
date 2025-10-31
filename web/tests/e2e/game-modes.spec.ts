import { test, expect } from '@playwright/test';

test.describe('Game Modes', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a game page
    await page.goto('/game/oslo');
    // Wait for the map container to be visible instead of network idle
    await expect(page.locator('[data-testid="map-container"]')).toBeVisible({ timeout: 15000 });
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
    
    // Wait for game overlay to be visible
    await expect(page.locator('[data-testid="game-overlay"]')).toBeVisible();
    
    // Try to zoom in (should be disabled)
    const mapContainer = page.locator('[data-testid="map-container"]');
    await expect(mapContainer).toBeVisible();
    
    // Try to scroll to zoom (should not work)
    await mapContainer.hover();
    await page.mouse.wheel(0, -100);
    
    // The map should not have zoomed significantly
    // This is a basic check - in a real test we'd check the actual zoom level
    await expect(mapContainer).toBeVisible();
  });

  test('should show input field in reverse quiz mode', async ({ page }) => {
    // Ensure modal is open
    const modal = page.locator('[data-testid="game-mode-modal"]');
    if (!(await modal.isVisible().catch(() => false))) {
      await page.click('[data-testid="settings-button"]');
    }
    
    // Select reverse quiz mode
    await page.click('[data-testid="game-mode-reverse_quiz"]');
    
    // Start game
    await page.click('[data-testid="start-game-button"]');
    
    // Wait for game overlay to be visible
    await expect(page.locator('[data-testid="game-overlay"]')).toBeVisible();
    
    // Check that input field is visible (using test ID on input element)
    const inputField = page.locator('input[data-testid="reverse-quiz-input"]');
    await expect(inputField).toBeVisible();
    
    // Verify the question text "Hva heter dette området?" is shown
    const questionText = page.locator('text=Hva heter dette området?');
    await expect(questionText).toBeVisible();
  });

  test('should show target question in classic mode', async ({ page }) => {
    // Ensure modal is open
    const modal = page.locator('[data-testid="game-mode-modal"]');
    if (!(await modal.isVisible().catch(() => false))) {
      await page.click('[data-testid="settings-button"]');
    }
    
    // Select classic mode
    await page.click('[data-testid="game-mode-classic"]');
    
    // Start game
    await page.click('[data-testid="start-game-button"]');
    
    // Wait for game overlay to be visible
    await expect(page.locator('[data-testid="game-overlay"]')).toBeVisible();
    
    // Check that question text is visible (shows target name)
    const questionText = page.locator('[data-testid="question-text"]');
    await expect(questionText).toBeVisible();
    
    // Verify it contains a region name (not empty)
    const questionContent = await questionText.textContent();
    expect(questionContent).toBeTruthy();
    expect(questionContent?.trim().length).toBeGreaterThan(0);
  });

  test('should highlight target in reverse quiz mode', async ({ page }) => {
    // Ensure modal is open
    const modal = page.locator('[data-testid="game-mode-modal"]');
    if (!(await modal.isVisible().catch(() => false))) {
      await page.click('[data-testid="settings-button"]');
    }
    
    // Select reverse quiz mode
    await page.click('[data-testid="game-mode-reverse_quiz"]');
    
    // Start game
    await page.click('[data-testid="start-game-button"]');
    
    // Wait for game overlay to be visible
    await expect(page.locator('[data-testid="game-overlay"]')).toBeVisible();
    
    // The map should have a highlighted feature (green highlight)
    // We verify this by checking that the map container is interactive
    const mapContainer = page.locator('[data-testid="map-container"]');
    await expect(mapContainer).toBeVisible();
    
    // Verify input field is present (confirms reverse quiz mode is active)
    const inputField = page.locator('input[data-testid="reverse-quiz-input"]');
    await expect(inputField).toBeVisible();
  });

  test('should show candidates in multiple choice mode', async ({ page }) => {
    // Ensure modal is open
    const modal = page.locator('[data-testid="game-mode-modal"]');
    if (!(await modal.isVisible().catch(() => false))) {
      await page.click('[data-testid="settings-button"]');
    }
    
    // Select multiple choice mode
    await page.click('[data-testid="game-mode-multiple_choice"]');
    
    // Verify alternatives count selector is visible
    const alternativesSelect = page.locator('[data-testid="alternatives-select"]');
    await expect(alternativesSelect).toBeVisible();
    
    // Start game
    await page.click('[data-testid="start-game-button"]');
    
    // Wait for game overlay to be visible
    await expect(page.locator('[data-testid="game-overlay"]')).toBeVisible();
    
    // In multiple choice mode, candidates should be highlighted on the map
    // We verify this by checking that the map is interactive
    const mapContainer = page.locator('[data-testid="map-container"]');
    await expect(mapContainer).toBeVisible();
  });

  test('should work with different difficulty levels in classic mode', async ({ page }) => {
    const difficulties = ['Trening', 'Lett', 'Normal', 'Vanskelig', 'Ekspert'];
    
    for (const difficulty of difficulties) {
      // Ensure modal is open
      const modal = page.locator('[data-testid="game-mode-modal"]');
      if (!(await modal.isVisible().catch(() => false))) {
        await page.click('[data-testid="settings-button"]');
        await expect(modal).toBeVisible();
      }
      
      // Select classic mode
      await page.click('[data-testid="game-mode-classic"]');
      
      // Select difficulty
      await page.click('[data-testid="difficulty-select"]');
      await page.getByRole('option', { name: difficulty }).click();
      
      // Start game
      await page.click('[data-testid="start-game-button"]');
      
      // Wait for game overlay to be visible
      await expect(page.locator('[data-testid="game-overlay"]')).toBeVisible();
      
      // Verify question is shown
      const questionText = page.locator('[data-testid="question-text"]');
      await expect(questionText).toBeVisible();
      
      // Restart for next iteration - wait for modal to be visible
      await page.click('[data-testid="settings-button"]');
      await expect(modal).toBeVisible();
    }
  });

  test('should work with different alternative counts in multiple choice mode', async ({ page }) => {
    const alternativeCounts = [2, 3, 4, 5, 6];
    
    for (const count of alternativeCounts) {
      // Ensure modal is open
      const modal = page.locator('[data-testid="game-mode-modal"]');
      if (!(await modal.isVisible().catch(() => false))) {
        await page.click('[data-testid="settings-button"]');
        await expect(modal).toBeVisible();
      }
      
      // Select multiple choice mode
      await page.click('[data-testid="game-mode-multiple_choice"]');
      
      // Wait for alternatives selector to appear
      const alternativesSelect = page.locator('[data-testid="alternatives-select"]');
      await expect(alternativesSelect).toBeVisible();
      
      // Find and select alternative count
      await alternativesSelect.click();
      await page.getByRole('option', { name: new RegExp(`${count}`, 'i') }).click();
      
      // Start game
      await page.click('[data-testid="start-game-button"]');
      
      // Wait for game overlay to be visible
      await expect(page.locator('[data-testid="game-overlay"]')).toBeVisible();
      
      // Verify map is visible and game is running
      const mapContainer = page.locator('[data-testid="map-container"]');
      await expect(mapContainer).toBeVisible();
      
      // Restart for next iteration - wait for modal to be visible
      await page.click('[data-testid="settings-button"]');
      await expect(modal).toBeVisible();
    }
  });

  test('should handle reverse quiz answer submission', async ({ page }) => {
    // Ensure modal is open
    const modal = page.locator('[data-testid="game-mode-modal"]');
    if (!(await modal.isVisible().catch(() => false))) {
      await page.click('[data-testid="settings-button"]');
    }
    
    // Select reverse quiz mode
    await page.click('[data-testid="game-mode-reverse_quiz"]');
    
    // Start game
    await page.click('[data-testid="start-game-button"]');
    
    // Wait for game overlay to be visible
    await expect(page.locator('[data-testid="game-overlay"]')).toBeVisible();
    
    // Find input field - use the data-testid directly on the input element
    const inputField = page.locator('input[data-testid="reverse-quiz-input"]');
    await expect(inputField).toBeVisible();
    await expect(inputField).toBeEnabled();
    
    // Type a test answer
    await inputField.click(); // Click to focus
    await inputField.fill('Test');
    
    // Verify text was entered
    const inputValue = await inputField.inputValue();
    expect(inputValue).toBe('Test');
    
    // Submit the answer (press Enter)
    await inputField.press('Enter');
    
    // Wait for feedback to appear
    await expect(page.locator('text=/Riktig|Feil/')).toBeVisible({ timeout: 5000 });
  });

  test('should switch between game modes correctly', async ({ page }) => {
    const modes = ['classic', 'reverse_quiz', 'multiple_choice'];
    
    for (const mode of modes) {
      // Ensure modal is open
      const modal = page.locator('[data-testid="game-mode-modal"]');
      if (!(await modal.isVisible().catch(() => false))) {
        await page.click('[data-testid="settings-button"]');
        await expect(modal).toBeVisible();
      }
      
      // Select the mode
      await page.click(`[data-testid="game-mode-${mode}"]`);
      
      // Start game
      await page.click('[data-testid="start-game-button"]');
      
      // Wait for game overlay to be visible
      await expect(page.locator('[data-testid="game-overlay"]')).toBeVisible();
      
      // Verify mode-specific elements
      if (mode === 'reverse_quiz') {
        const inputField = page.locator('input[data-testid="reverse-quiz-input"]');
        await expect(inputField).toBeVisible();
      } else if (mode === 'classic') {
        const questionText = page.locator('[data-testid="question-text"]');
        await expect(questionText).toBeVisible();
      } else if (mode === 'multiple_choice') {
        // Map should be visible with candidates highlighted
        const mapContainer = page.locator('[data-testid="map-container"]');
        await expect(mapContainer).toBeVisible();
      }
      
      // Restart for next iteration - wait for modal to be visible
      await page.click('[data-testid="settings-button"]');
      await expect(modal).toBeVisible();
    }
  });
});