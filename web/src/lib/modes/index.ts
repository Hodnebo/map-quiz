import { gameModeRegistry } from '../gameModeRegistry';
import { ClassicMode } from './ClassicMode';
import { MultipleChoiceMode } from './MultipleChoiceMode';

// Register all game modes
gameModeRegistry.register(new ClassicMode());
gameModeRegistry.register(new MultipleChoiceMode());

// Export the registry and individual modes
export { gameModeRegistry };
export { ClassicMode };
export { MultipleChoiceMode };