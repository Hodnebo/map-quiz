import { answer, createInitialState, startGame } from '../game';
import type { GameSettings } from '../types';

describe('Game Logic', () => {
  let mockSettings: GameSettings;
  let allIds: string[];

  beforeEach(() => {
    mockSettings = {
      gameMode: 'classic',
      rounds: 15,
      audioEnabled: true,
      mapStyle: 'basic-v2',
      difficulty: 'normal',
      maxAttempts: 3,
    };
    allIds = ['0508', '1302', '0301', '1201', '0601'];
  });

  describe('answer function', () => {
    it('should return revealedCorrect=true for wrong answers when attempts exhausted', () => {
      const initialState = createInitialState(mockSettings);
      const startedState = startGame(initialState, allIds, 12345);
      
      // Simulate 2 wrong attempts
      let currentState = startedState;
      for (let i = 0; i < 2; i++) {
        const result = answer(currentState, 'wrong-id', allIds, 12345);
        currentState = result.newState;
      }
      
      // Third wrong attempt should exhaust attempts
      const finalResult = answer(currentState, 'wrong-id', allIds, 12345);
      
      expect(finalResult.revealedCorrect).toBe(true);
      expect(finalResult.correctId).toBe(currentState.currentTargetId);
      expect(finalResult.isCorrect).toBe(false);
    });

    it('should return revealedCorrect=false for correct answers', () => {
      const initialState = createInitialState(mockSettings);
      const startedState = startGame(initialState, allIds, 12345);
      
      const result = answer(startedState, startedState.currentTargetId!, allIds, 12345);
      
      expect(result.revealedCorrect).toBe(false);
      expect(result.correctId).toBe(startedState.currentTargetId);
      expect(result.isCorrect).toBe(true);
    });

    it('should work with reverse quiz mode', () => {
      const reverseSettings = { ...mockSettings, gameMode: 'reverse_quiz' as const };
      const initialState = createInitialState(reverseSettings);
      const startedState = startGame(initialState, allIds, 12345);
      
      // Wrong answer that exhausts attempts
      const stateWithAttempts = {
        ...startedState,
        attemptsThisRound: 2,
      };
      
      const result = answer(stateWithAttempts, 'wrong-answer', allIds, 12345, 'Skillebekk');
      
      expect(result.revealedCorrect).toBe(true);
      expect(result.correctId).toBe(stateWithAttempts.currentTargetId);
      expect(result.isCorrect).toBe(false);
    });
  });

  describe('createInitialState', () => {
    it('should create initial state with correct structure', () => {
      const state = createInitialState(mockSettings);
      
      expect(state.status).toBe('idle');
      expect(state.score).toBe(0);
      expect(state.streak).toBe(0);
      expect(state.currentRound).toBe(1);
      expect(state.currentTargetId).toBeNull();
      expect(state.answeredIds).toEqual([]);
      expect(state.settings).toEqual(mockSettings);
      expect(state.attemptsThisRound).toBe(0);
      expect(state.revealedIds).toEqual([]);
      expect(state.candidateIds).toEqual([]);
    });
  });

  describe('startGame', () => {
    it('should start game with first target', () => {
      const initialState = createInitialState(mockSettings);
      const startedState = startGame(initialState, allIds, 12345);
      
      expect(startedState.status).toBe('playing');
      expect(startedState.currentTargetId).toBeTruthy();
      expect(allIds).toContain(startedState.currentTargetId!);
      expect(startedState.attemptsThisRound).toBe(0);
    });
  });
});