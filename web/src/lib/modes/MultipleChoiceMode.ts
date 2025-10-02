import { BaseGameMode } from './BaseGameMode';
import type { GameState, GameSettings } from '../types';
import type { QuestionData, AnswerResult, MapConfig } from '../gameModeStrategy';

export class MultipleChoiceMode extends BaseGameMode {
  readonly id = 'multiple_choice';
  readonly name = 'Flervalgsspørsmål';
  readonly description = 'Velg riktig område fra flere alternativer';

  getDefaultSettings(): Partial<GameSettings> {
    return {
      alternativesCount: 4,
      maxAttempts: 3,
      timerSeconds: null,
    };
  }

  generateQuestion(state: GameState, allIds: string[], seed: number): QuestionData {
    const targetId = this.getNextTarget(allIds, state.answeredIds, seed, state.currentRound);
    if (!targetId) {
      throw new Error('No more targets available');
    }

    const alternativesCount = state.settings.alternativesCount ?? 4;
    const candidates = alternativesCount > 1 
      ? this.buildCandidates(allIds, targetId, alternativesCount, seed, state.answeredIds)
      : [];

    return {
      targetId,
      type: 'multiple_choice',
      candidates,
      mapConfig: this.createMapConfig(false, null, 24, true),
    };
  }

  processAnswer(state: GameState, answer: string, allIds: string[], seed: number): AnswerResult {
    if (state.status !== "playing") {
      return { 
        isCorrect: false, 
        newState: state, 
        correctId: state.currentTargetId 
      };
    }

    const maxAttempts = state.settings.maxAttempts ?? 1;
    const targetId = state.currentTargetId;
    const isCorrect = answer === targetId;

    if (!isCorrect) {
      const nextAttempts = (state.attemptsThisRound ?? 0) + 1;
      if (nextAttempts < maxAttempts) {
        const stayState: GameState = {
          ...state,
          attemptsThisRound: nextAttempts,
          streak: 0,
        };
        return { isCorrect: false, newState: stayState, correctId: targetId };
      }
      
      // Exceeded attempts: reveal correct and advance
      return this.advanceToNextQuestion(state, allIds, seed, false);
    }

    // Correct answer flow
    return this.advanceToNextQuestion(state, allIds, seed, true);
  }

  getMapConfig(state: GameState, settings: GameSettings, geojson: any, seed: number): MapConfig {
    return this.createMapConfig(
      false, // No zoom for multiple choice
      null,  // No focus bounds
      24,    // Default padding
      true,  // Show candidates
      false, // Don't hide labels
      false  // Don't disable hover outline
    );
  }

  getSettingsProps() {
    return {
      showDifficulty: false,
      showAlternatives: true,
      showMaxAttempts: true,
      showTimer: false,
    };
  }

  private advanceToNextQuestion(state: GameState, allIds: string[], seed: number, wasCorrect: boolean): AnswerResult {
    const answeredTargets = [...state.answeredIds, state.currentTargetId!];
    const revealed = [...(state.revealedIds ?? []), state.currentTargetId!];
    const remaining = allIds.filter((id) => !answeredTargets.includes(id));
    const hasMoreRounds = state.currentRound < state.settings.rounds;

    let nextTarget: string | null = null;
    let nextCandidates: string[] = [];
    
    if (hasMoreRounds && remaining.length > 0) {
      nextTarget = this.getNextTarget(allIds, answeredTargets, seed, state.currentRound);
      if (nextTarget) {
        const alternativesCount = state.settings.alternativesCount ?? 4;
        nextCandidates = alternativesCount > 1 
          ? this.buildCandidates(allIds, nextTarget, alternativesCount, seed, answeredTargets)
          : [];
      }
    }

    const newScore = wasCorrect ? this.calculateScore(state.score, state.streak) : state.score;
    const newStreak = wasCorrect ? state.streak + 1 : 0;

    const newState: GameState = {
      ...state,
      score: newScore,
      streak: newStreak,
      answeredIds: answeredTargets,
      currentRound: hasMoreRounds && nextTarget ? state.currentRound + 1 : state.currentRound,
      currentTargetId: nextTarget,
      status: hasMoreRounds && nextTarget ? "playing" : "ended",
      attemptsThisRound: 0,
      revealedIds: revealed,
      candidateIds: nextCandidates,
    };

    return { 
      isCorrect: wasCorrect, 
      newState, 
      correctId: state.currentTargetId,
      revealedCorrect: !wasCorrect
    };
  }
}