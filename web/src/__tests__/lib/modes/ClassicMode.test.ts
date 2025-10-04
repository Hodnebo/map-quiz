import { ClassicMode } from '../../../lib/modes/ClassicMode';
import type { GameState, GameSettings } from '../../../lib/types';

describe('ClassicMode', () => {
  let classicMode: ClassicMode;
  let mockState: GameState;
  let mockSettings: GameSettings;

  beforeEach(() => {
    classicMode = new ClassicMode();
    mockSettings = {
      gameMode: 'classic',
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

      const result = classicMode.processAnswer(
        stateWithAttempts,
        'wrong-id', // Wrong answer
        ['0508', 'wrong-id'],
        12345
      );

      expect(result.revealedCorrect).toBe(true);
      expect(result.correctId).toBe('0508');
      expect(result.isCorrect).toBe(false);
    });

    it('should return revealedCorrect=false when answer is correct', () => {
      const result = classicMode.processAnswer(
        mockState,
        '0508', // Correct answer
        ['0508', 'wrong-id'],
        12345
      );

      expect(result.revealedCorrect).toBe(false);
      expect(result.correctId).toBe('0508');
      expect(result.isCorrect).toBe(true);
    });

    it('should return revealedCorrect=false when wrong answer but attempts remaining', () => {
      const result = classicMode.processAnswer(
        mockState,
        'wrong-id', // Wrong answer, but first attempt
        ['0508', 'wrong-id'],
        12345
      );

      expect(result.revealedCorrect).toBe(false);
      expect(result.correctId).toBe('0508');
      expect(result.isCorrect).toBe(false);
      expect(result.newState.attemptsThisRound).toBe(1);
    });

    it('should advance to next question when attempts exhausted', () => {
      const stateWithAttempts = {
        ...mockState,
        attemptsThisRound: 2,
      };

      const result = classicMode.processAnswer(
        stateWithAttempts,
        'wrong-id',
        ['0508', 'wrong-id', 'next-target'],
        12345
      );

      expect(result.revealedCorrect).toBe(true);
      expect(result.newState.currentRound).toBe(2);
      expect(result.newState.attemptsThisRound).toBe(0);
      expect(result.newState.answeredIds).toContain('0508');
      expect(result.newState.revealedIds).toContain('0508');
    });
  });

  describe('getDefaultSettings', () => {
    it('should return correct default settings', () => {
      const defaults = classicMode.getDefaultSettings();
      
      expect(defaults.difficulty).toBe('normal');
      expect(defaults.maxAttempts).toBe(3);
      expect(defaults.alternativesCount).toBeNull();
      expect(defaults.timerSeconds).toBeNull();
    });
  });
});