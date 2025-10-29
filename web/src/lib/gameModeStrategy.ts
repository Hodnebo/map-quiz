import type { GameState, GameSettings } from './types';

export interface MapConfig {
  zoomEnabled: boolean;
  focusBounds?: [[number, number], [number, number]] | null;
  focusPadding?: number;
  showCandidates?: boolean;
  hideLabels?: boolean;
  disableHoverOutline?: boolean;
}

export interface QuestionData {
  targetId: string;
  type: 'click' | 'multiple_choice' | 'timed' | 'memory' | 'reverse_quiz';
  candidates?: string[];
  timeLimit?: number;
  hints?: string[];
  mapConfig: MapConfig;
}

export interface AnswerResult {
  isCorrect: boolean;
  newState: GameState;
  correctId: string | null;
  revealedCorrect?: boolean;
  feedback?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface GameModeStrategy {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  
  // Core game behavior
  generateQuestion(state: GameState, allIds: string[], seed: number): QuestionData;
  processAnswer(state: GameState, answer: string, allIds: string[], seed: number, correctName?: string): AnswerResult;
  
  // Settings and validation
  getDefaultSettings(): Partial<GameSettings>;
  validateSettings(settings: Partial<GameSettings>): ValidationResult;
  
  // UI behavior
  getMapConfig(state: GameState, settings: GameSettings, geojson: any, seed: number): MapConfig;
  
  // Component props
  getSettingsProps(): {
    showDifficulty?: boolean;
    showAlternatives?: boolean;
    showMaxAttempts?: boolean;
    showTimer?: boolean;
  };
}
