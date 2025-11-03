import { test as base, expect, Page, Locator } from '@playwright/test';

// Common test IDs
export const TEST_IDS = {
  mapCard: '[data-testid="map-card"]',
  mapContainer: '[data-testid="map-container"]',
  gameModeModal: '[data-testid="game-mode-modal"]',
  gameOverlay: '[data-testid="game-overlay"]',
  reverseQuizOverlay: '[data-testid="reverse-quiz-overlay"]',
  startGameButton: '[data-testid="start-game-button"]',
  settingsButton: '[data-testid="settings-button"]',
  cancelButton: '[data-testid="cancel-button"]',
  questionText: '[data-testid="question-text"]',
  feedbackMessage: '[data-testid="feedback-message"]',
  scoreDisplay: '[data-testid="score-display"]',
  soundToggleButton: '[data-testid="sound-toggle-button"]',
  reverseQuizInput: 'input[data-testid="reverse-quiz-input"]',
  gameModeClassic: '[data-testid="game-mode-classic"]',
  gameModeReverseQuiz: '[data-testid="game-mode-reverse_quiz"]',
  gameModeMultipleChoice: '[data-testid="game-mode-multiple_choice"]',
  difficultySelect: '[data-testid="difficulty-select"]',
  alternativesSelect: '[data-testid="alternatives-select"]',
} as const;

// Extended page with game-specific helpers
type GamePage = Page & {
  // Locators
  mapContainer: Locator;
  modal: Locator;
  overlay: Locator;
  reverseQuizOverlay: Locator;
  startButton: Locator;
  settingsButton: Locator;
  cancelButton: Locator;
  
  // Navigation helpers
  gotoLanding: () => Promise<void>;
  gotoGame: (mapId?: string) => Promise<void>;
  clickMapCard: (index?: number) => Promise<void>;
  
  // Modal helpers
  ensureModalOpen: () => Promise<Locator>;
  waitForModalClose: (timeout?: number) => Promise<void>;
  closeModal: () => Promise<void>;
  
  // Game helpers
  startGame: (options?: { waitForOverlay?: boolean; timeout?: number }) => Promise<void>;
  selectGameMode: (mode: 'classic' | 'reverse_quiz' | 'multiple_choice') => Promise<void>;
  selectDifficulty: (difficulty: string) => Promise<void>;
  selectAlternatives: (count: number) => Promise<void>;
  
  // Wait helpers
  waitForMapReady: (timeout?: number) => Promise<void>;
  waitForGameOverlay: (timeout?: number) => Promise<void>;
  waitForReverseQuizOverlay: (timeout?: number) => Promise<void>;
  
  // Utility helpers
  clearLocalStorage: () => Promise<void>;
};

export const test = base.extend<{ gamePage: GamePage }>({
  gamePage: async ({ page }, use) => {
    const gamePage = page as GamePage;
    
    // Initialize locators
    gamePage.mapContainer = page.locator(TEST_IDS.mapContainer);
    gamePage.modal = page.locator(TEST_IDS.gameModeModal);
    gamePage.overlay = page.locator(TEST_IDS.gameOverlay);
    gamePage.reverseQuizOverlay = page.locator(TEST_IDS.reverseQuizOverlay);
    gamePage.startButton = page.locator(TEST_IDS.startGameButton);
    gamePage.settingsButton = page.locator(TEST_IDS.settingsButton);
    gamePage.cancelButton = page.locator(TEST_IDS.cancelButton);
    
    // Navigation helpers
    gamePage.gotoLanding = async () => {
      await page.goto('/');
      await expect(page.locator(TEST_IDS.mapCard).first()).toBeVisible();
    };
    
    gamePage.gotoGame = async (mapId = 'oslo') => {
      await page.goto(`/game/${mapId}`);
      await gamePage.waitForMapReady();
    };
    
    gamePage.clickMapCard = async (index = 0) => {
      const mapCard = page.locator(TEST_IDS.mapCard).nth(index);
      await expect(mapCard).toBeVisible();
      const button = mapCard.locator('button').first();
      await expect(button).toBeVisible();
      await expect(button).toBeEnabled();
      
      // Small wait to ensure page is fully interactive
      await page.waitForTimeout(500);
      
      // Click button - Next.js uses client-side routing
      await button.click({ force: true });
      // Wait for URL to change (expect handles Next.js client-side navigation better)
      await expect(page).toHaveURL(/\/game\/[^/]+/, { timeout: 15000 });
    };
    
    // Modal helpers
    gamePage.ensureModalOpen = async () => {
      const modal = page.locator(TEST_IDS.gameModeModal);
      const isVisible = await modal.isVisible().catch(() => false);
      if (!isVisible) {
        await page.click(TEST_IDS.settingsButton);
        await expect(modal).toBeVisible({ timeout: 5000 });
      }
      return modal;
    };
    
    gamePage.waitForModalClose = async (timeout = 15000) => {
      await expect(gamePage.modal).not.toBeVisible({ timeout });
    };
    
    gamePage.closeModal = async () => {
      await gamePage.cancelButton.click();
      await gamePage.waitForModalClose();
    };
    
    // Game helpers
    gamePage.startGame = async (options = {}) => {
      const { waitForOverlay = true, timeout = 30000 } = options;
      
      await gamePage.waitForMapReady();
      
      const modalVisible = await gamePage.modal.isVisible().catch(() => false);
      if (modalVisible) {
        await page.waitForTimeout(1000); // Give time for canPlay to become true
        await expect(gamePage.startButton).toBeEnabled({ timeout: 10000 });
        await gamePage.startButton.click();
        await gamePage.waitForModalClose(5000);
      } else {
        await gamePage.startButton.click();
      }
      
      if (waitForOverlay) {
        await expect(gamePage.overlay).toBeVisible({ timeout });
      }
    };
    
    gamePage.selectGameMode = async (mode) => {
      const modal = await gamePage.ensureModalOpen();
      await page.click(`[data-testid="game-mode-${mode}"]`);
    };
    
    gamePage.selectDifficulty = async (difficulty) => {
      await page.click(TEST_IDS.difficultySelect);
      await page.getByRole('option', { name: difficulty }).click();
    };
    
    gamePage.selectAlternatives = async (count) => {
      await page.click(TEST_IDS.alternativesSelect);
      await page.getByRole('option', { name: new RegExp(`${count}`, 'i') }).click();
    };
    
    // Wait helpers
    gamePage.waitForMapReady = async (timeout = 15000) => {
      await expect(gamePage.mapContainer).toBeVisible({ timeout });
    };
    
    gamePage.waitForGameOverlay = async (timeout = 30000) => {
      await expect(gamePage.overlay).toBeVisible({ timeout });
    };
    
    gamePage.waitForReverseQuizOverlay = async (timeout = 20000) => {
      await expect(gamePage.reverseQuizOverlay).toBeVisible({ timeout });
    };
    
    // Utility helpers
    gamePage.clearLocalStorage = async () => {
      // Clear localStorage and reload the page to reset state
      try {
        await page.evaluate(() => localStorage.clear());
        // Reload to ensure clean state
        await page.reload({ waitUntil: 'networkidle' });
        // Wait for map cards to be visible and interactive
        await expect(page.locator(TEST_IDS.mapCard).first()).toBeVisible({ timeout: 10000 });
        // Small wait to ensure React has fully hydrated
        await page.waitForTimeout(1000);
      } catch (e) {
        // If we're not on a page yet, navigate first
        await page.goto('/', { waitUntil: 'networkidle' });
        await page.evaluate(() => localStorage.clear());
        await expect(page.locator(TEST_IDS.mapCard).first()).toBeVisible({ timeout: 10000 });
        await page.waitForTimeout(1000);
      }
    };
    
    await use(gamePage);
  },
});

export { expect };

