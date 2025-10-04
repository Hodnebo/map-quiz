import { ReverseQuizMode } from '../../../lib/modes/ReverseQuizMode';
import type { GameState, GameSettings } from '../../../lib/types';

describe('ReverseQuizMode', () => {
  let reverseQuizMode: ReverseQuizMode;
  let mockState: GameState;
  let mockSettings: GameSettings;

  beforeEach(() => {
    reverseQuizMode = new ReverseQuizMode();
    mockSettings = {
      gameMode: 'reverse_quiz',
      rounds: 15,
      audioEnabled: true,
      mapStyle: 'basic-v2',
      difficulty: 'normal',
      maxAttempts: 3,
    };
    mockState = {
      status: 'playing',
      score: 0,
      streak: 0,
      currentRound: 1,
      currentTargetId: '0508',
      answeredIds: [],
      settings: mockSettings,
      attemptsThisRound: 0,
      revealedIds: [],
      candidateIds: [],
    };
  });

  describe('processAnswer', () => {
    it('should return revealedCorrect=true when attempts are exhausted with wrong answer', () => {
      // Set up state with 2 attempts already used (1 attempt left)
      const stateWithAttempts = {
        ...mockState,
        attemptsThisRound: 2,
      };

      const result = reverseQuizMode.processAnswer(
        stateWithAttempts,
        'wrong-answer', // Wrong text answer
        ['0508', 'wrong-id'],
        12345,
        'Skillebekk' // Correct name
      );

      expect(result.revealedCorrect).toBe(true);
      expect(result.correctId).toBe('0508');
      expect(result.isCorrect).toBe(false);
    });

    it('should return revealedCorrect=false when answer is correct', () => {
      const result = reverseQuizMode.processAnswer(
        mockState,
        'Skillebekk', // Correct text answer
        ['0508', 'wrong-id'],
        12345,
        'Skillebekk'
      );

      expect(result.revealedCorrect).toBe(false);
      expect(result.correctId).toBe('0508');
      expect(result.isCorrect).toBe(true);
    });

    it('should return revealedCorrect=false when wrong answer but attempts remaining', () => {
      const result = reverseQuizMode.processAnswer(
        mockState,
        'wrong-answer', // Wrong answer, but first attempt
        ['0508', 'wrong-id'],
        12345,
        'Skillebekk'
      );

      expect(result.revealedCorrect).toBe(false);
      expect(result.correctId).toBe('0508');
      expect(result.isCorrect).toBe(false);
      expect(result.newState.attemptsThisRound).toBe(1);
    });

    it('should handle case-insensitive matching', () => {
      const result = reverseQuizMode.processAnswer(
        mockState,
        'skillebekk', // Lowercase correct answer
        ['0508', 'wrong-id'],
        12345,
        'Skillebekk'
      );

      expect(result.isCorrect).toBe(true);
      expect(result.revealedCorrect).toBe(false);
    });
  });

  describe('getDefaultSettings', () => {
    it('should return correct default settings', () => {
      const defaults = reverseQuizMode.getDefaultSettings();
      
      expect(defaults.difficulty).toBe('normal');
      expect(defaults.maxAttempts).toBe(3);
      expect(defaults.alternativesCount).toBeNull();
      expect(defaults.timerSeconds).toBeNull();
    });
  });
});