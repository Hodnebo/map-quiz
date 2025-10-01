import type { GameMode } from './types';

export const GAME_MODES: Record<string, GameMode> = {
  classic: {
    id: 'classic',
    name: 'Klassisk',
    description: 'Finn områder på kartet med zoom-hint basert på vanskelighet',
    settings: {
      difficulty: 'normal',
      alternativesCount: null,
      maxAttempts: 3,
      zoomEnabled: true,
      timerSeconds: null,
    }
  },

  multiple_choice: {
    id: 'multiple_choice',
    name: 'Flervalgsspørsmål',
    description: 'Velg riktig område fra flere alternativer',
    settings: {
      alternativesCount: 4,
      maxAttempts: 1,
      zoomEnabled: false,
      timerSeconds: null,
    }
  }
};

export function getGameMode(id: string): GameMode {
  return GAME_MODES[id] || GAME_MODES.classic;
}

export function getEffectiveSettings(gameSettings: { gameMode: string; difficulty?: string; alternativesCount?: number | null; maxAttempts?: number; timerSeconds?: number | null }) {
  const mode = getGameMode(gameSettings.gameMode);

  return {
    difficulty: gameSettings.difficulty ?? mode.settings.difficulty,
    alternativesCount: gameSettings.alternativesCount ?? mode.settings.alternativesCount,
    maxAttempts: gameSettings.maxAttempts ?? mode.settings.maxAttempts,
    zoomEnabled: mode.settings.zoomEnabled,
    timerSeconds: gameSettings.timerSeconds ?? mode.settings.timerSeconds,
  };
}