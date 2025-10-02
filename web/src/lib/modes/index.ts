import { gameModeRegistry } from '../gameModeRegistry';
import { ClassicMode } from './ClassicMode';
import { MultipleChoiceMode } from './MultipleChoiceMode';
import { ReverseQuizMode } from './ReverseQuizMode';

// Register all game modes
gameModeRegistry.register(new ClassicMode());
gameModeRegistry.register(new MultipleChoiceMode());
gameModeRegistry.register(new ReverseQuizMode());

// Export the registry and individual modes
export { gameModeRegistry };
export { ClassicMode };
export { MultipleChoiceMode };
export { ReverseQuizMode };