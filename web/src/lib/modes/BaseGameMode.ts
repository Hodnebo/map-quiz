import type { GameModeStrategy, QuestionData, AnswerResult, MapConfig, ValidationResult } from '../gameModeStrategy';
import type { GameState, GameSettings } from '../types';
import type { GeoJSON } from 'geojson';
import { XorShift32, shuffleInPlace, pickOne } from '../rng';

export abstract class BaseGameMode implements GameModeStrategy {
  abstract readonly id: string;
  abstract readonly nameKey: string; // i18n key for the game mode name
  abstract readonly descriptionKey: string; // i18n key for the game mode description

  // For backward compatibility with code that expects .name and .description
  get name(): string {
    return this.nameKey;
  }

  get description(): string {
    return this.descriptionKey;
  }

  // Abstract methods that must be implemented by subclasses
  abstract generateQuestion(state: GameState, allIds: string[], seed: number): QuestionData;
  abstract processAnswer(state: GameState, answer: string, allIds: string[], seed: number): AnswerResult;
  abstract getDefaultSettings(): Partial<GameSettings>;
  abstract getMapConfig(state: GameState, settings: GameSettings, geojson: GeoJSON.FeatureCollection, seed: number): MapConfig;

  // Common validation logic
  validateSettings(settings: Partial<GameSettings>): ValidationResult {
    const errors: string[] = [];
    
    if (settings.rounds !== undefined && (settings.rounds < 1 || settings.rounds > 100)) {
      errors.push('Rounds must be between 1 and 100');
    }
    
    if (settings.maxAttempts !== undefined && (settings.maxAttempts < 1 || settings.maxAttempts > 10)) {
      errors.push('Max attempts must be between 1 and 10');
    }
    
    if (settings.alternativesCount !== undefined && settings.alternativesCount !== null && 
        (settings.alternativesCount < 2 || settings.alternativesCount > 10)) {
      errors.push('Alternatives count must be between 2 and 10');
    }
    
    if (settings.timerSeconds !== undefined && settings.timerSeconds !== null && 
        (settings.timerSeconds < 5 || settings.timerSeconds > 300)) {
      errors.push('Timer must be between 5 and 300 seconds');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Common settings props
  getSettingsProps() {
    return {
      showDifficulty: true,
      showAlternatives: false,
      showMaxAttempts: true,
      showTimer: false,
    };
  }

  // Helper methods for common functionality
  protected buildCandidates(allIds: string[], targetId: string, count: number, seed: number, excludeIds: string[]): string[] {
    const rng = new XorShift32((seed ^ 0x9e3779b9) >>> 0);
    const exclude = new Set<string>([...excludeIds, targetId]);
    const pool = allIds.filter((id) => !exclude.has(id));
    shuffleInPlace(pool, rng);
    const subset = pool.slice(0, Math.max(0, count - 1));
    const cands = [targetId, ...subset];
    shuffleInPlace(cands, rng);
    return cands;
  }

  protected getNextTarget(allIds: string[], answeredIds: string[], seed: number, round: number): string | null {
    const remaining = allIds.filter((id) => !answeredIds.includes(id));
    if (remaining.length === 0) return null;
    
    const rng = new XorShift32((seed + round * 9973) >>> 0);
    return pickOne(remaining, rng);
  }

  protected calculateScore(currentScore: number, streak: number): number {
    return currentScore + 1 + Math.floor((streak + 1) / 3);
  }

  /**
   * Calculate maximum possible score for a given number of rounds
   * Assumes perfect answers with maximum streak bonuses
   */
  protected calculateMaxScore(rounds: number): number {
    let maxScore = 0;
    let streak = 0;
    for (let round = 1; round <= rounds; round++) {
      const basePoints = 1;
      const streakBonus = Math.floor((streak + 1) / 3);
      maxScore += basePoints + streakBonus;
      streak++;
    }
    return maxScore;
  }

  protected createMapConfig(
    zoomEnabled: boolean = true,
    focusBounds?: [[number, number], [number, number]] | null,
    focusPadding: number = 24,
    showCandidates: boolean = false,
    hideLabels: boolean = false,
    disableHoverOutline: boolean = false
  ): MapConfig {
    return {
      zoomEnabled,
      focusBounds,
      focusPadding,
      showCandidates,
      hideLabels,
      disableHoverOutline,
    };
  }
}