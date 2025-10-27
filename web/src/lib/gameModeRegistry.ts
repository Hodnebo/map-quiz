import type { GameModeStrategy } from './gameModeStrategy';

class GameModeRegistry {
  private modes = new Map<string, GameModeStrategy>();
  private defaultModeId = 'classic';

  register(mode: GameModeStrategy): void {
    this.modes.set(mode.id, mode);
  }

  getMode(id: string): GameModeStrategy {
    const mode = this.modes.get(id);
    if (!mode) {
      console.warn(`Game mode '${id}' not found, falling back to '${this.defaultModeId}'`);
      return this.modes.get(this.defaultModeId) || this.modes.values().next().value;
    }
    return mode;
  }

  getAllModes(): GameModeStrategy[] {
    return Array.from(this.modes.values());
  }
}

// Create singleton instance
export const gameModeRegistry = new GameModeRegistry();

// Export the class for testing
export { GameModeRegistry };