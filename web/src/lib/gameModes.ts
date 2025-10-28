import type { GameMode, GameSettings } from './types';
import { gameModeRegistry } from './gameModeRegistry';

// Import modes to register them
import './modes';

// Legacy compatibility - convert strategy to old GameMode format
export const GAME_MODES: Record<string, GameMode> = {};

// Initialize GAME_MODES from registry for backward compatibility
gameModeRegistry.getAllModes().forEach(mode => {
  GAME_MODES[mode.id] = {
    id: mode.id,
    name: mode.name,
    description: mode.description,
    settings: mode.getDefaultSettings() as any,
  };
});

export function getGameMode(id: string): GameMode {
  const strategy = gameModeRegistry.getMode(id);
  return {
    id: strategy.id,
    name: strategy.name,
    description: strategy.description,
    settings: strategy.getDefaultSettings() as any,
  };
}

export function getEffectiveSettings(gameSettings: GameSettings): Partial<GameSettings> {
  const mode = gameModeRegistry.getMode(gameSettings.gameMode);
  const defaultSettings = mode.getDefaultSettings();

  return {
    difficulty: gameSettings.difficulty ?? defaultSettings.difficulty,
    alternativesCount: gameSettings.alternativesCount ?? defaultSettings.alternativesCount,
    maxAttempts: gameSettings.maxAttempts ?? defaultSettings.maxAttempts,
    zoomEnabled: true, // This will be handled by the mode's getMapConfig method
    timerSeconds: gameSettings.timerSeconds ?? defaultSettings.timerSeconds,
  };
}