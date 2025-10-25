import { BaseGameMode } from './BaseGameMode';
import type { GameState, GameSettings } from '../types';
import type { QuestionData, AnswerResult, MapConfig } from '../gameModeStrategy';
import { XorShift32 } from '../rng';

export class ReverseQuizMode extends BaseGameMode {
  readonly id = 'reverse_quiz';
  readonly nameKey = 'gameModes.reverse_quiz.name';
  readonly descriptionKey = 'gameModes.reverse_quiz.description';

  getDefaultSettings(): Partial<GameSettings> {
    return {
      maxAttempts: 3,
      timerSeconds: null,
    };
  }

  generateQuestion(state: GameState, allIds: string[], seed: number): QuestionData {
    const targetId = this.getNextTarget(allIds, state.answeredIds, seed, state.currentRound);
    if (!targetId) {
      throw new Error('No more targets available');
    }

    return {
      targetId,
      type: 'reverse_quiz',
      mapConfig: this.createMapConfig(
        true,  // Enable zoom
        null,  // Will be calculated by getMapConfig
        24,    // Default padding
        false, // Don't show candidates
        false, // Don't hide labels
        false  // Don't disable hover outline
      ),
    };
  }

  processAnswer(state: GameState, answer: string, allIds: string[], seed: number, correctName?: string): AnswerResult {
    if (state.status !== "playing") {
      return { 
        isCorrect: false, 
        newState: state, 
        correctId: state.currentTargetId 
      };
    }

    const maxAttempts = state.settings.maxAttempts ?? 3;
    const targetId = state.currentTargetId;
    
    // Normalize the answer for comparison (lowercase, trim whitespace)
    const normalizedAnswer = answer.toLowerCase().trim();
    const normalizedCorrectName = correctName?.toLowerCase().trim() || '';
    
    // Check if the answer matches (exact match or close enough)
    const isCorrect = normalizedAnswer === normalizedCorrectName || 
                     normalizedCorrectName.includes(normalizedAnswer) ||
                     normalizedAnswer.includes(normalizedCorrectName);

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
    // For reverse quiz, we want to show the highlighted area clearly
    // We can use a moderate zoom level
    const difficulty = settings.difficulty ?? 'normal';
    
    if (!state.currentTargetId) {
      return this.createMapConfig(false);
    }

    const focusBounds = this.calculateFocusBounds(geojson, state.currentTargetId, seed, state.currentRound, difficulty, false); // Reverse quiz mode disables randomization
    const focusPadding = this.getFocusPadding(difficulty);

    return this.createMapConfig(
      true,  // Enable zoom
      focusBounds,
      focusPadding,
      false, // Don't show candidates
      false, // Don't hide labels
      false  // Don't disable hover outline
    );
  }

  getSettingsProps() {
    return {
      showDifficulty: false,
      showAlternatives: false,
      showMaxAttempts: true,
      showTimer: false,
    };
  }

  private advanceToNextQuestion(state: GameState, allIds: string[], seed: number, wasCorrect: boolean): AnswerResult {
    const answeredTargets = [...state.answeredIds, state.currentTargetId!];
    const revealed = [...(state.revealedIds ?? []), state.currentTargetId!];
    const remaining = allIds.filter((id) => !answeredTargets.includes(id));
    const hasMoreRounds = state.currentRound < state.settings.rounds && remaining.length > 0;

    let nextTarget: string | null = null;
    if (hasMoreRounds && remaining.length > 0) {
      nextTarget = this.getNextTarget(allIds, answeredTargets, seed, state.currentRound);
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
      candidateIds: [],
    };

    return { 
      isCorrect: wasCorrect, 
      newState, 
      correctId: state.currentTargetId,
      revealedCorrect: !wasCorrect
    };
  }

  private calculateFocusBounds(
    geojson: any, 
    targetId: string, 
    seed: number, 
    round: number, 
    difficulty: string,
    randomizeZoomLocation: boolean = true
  ): [[number, number], [number, number]] | null {
    if (!geojson || !targetId) return null;

    const featuresArray = geojson?.features;
    const feat = featuresArray?.find((f: any) => {
      return (f.id ?? f.properties?.id) === targetId;
    });
    if (!feat) return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const walk = (coords: any) => {
      if (typeof coords[0] === "number") {
        const [x, y] = coords as [number, number];
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      } else {
        for (const c of coords) walk(c);
      }
    };
    walk(feat.geometry.coordinates);
    if (minX === Infinity) return null;

    const rawBounds: [[number, number], [number, number]] = [[minX, minY], [maxX, maxY]];
    // For reverse quiz, use less aggressive padding since we want to show the area clearly
    const paddedBounds = this.padBounds(rawBounds, this.getPaddingFactor(difficulty), 0.02, 0.015);
    
    if (!randomizeZoomLocation) {
      // For reverse quiz, shift the bounds downward to account for the input card at the bottom
      // Shift the center point downward by about 20% of the bounds height
      const [[minX, minY], [maxX, maxY]] = paddedBounds;
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      const height = maxY - minY;
      const shiftY = height * 0.2; // Shift downward by 20% of height
      
      return [[minX, minY - shiftY], [maxX, maxY - shiftY]];
    }
    
    const rng = new XorShift32((seed + round * 1337) >>> 0);
    const jx = (rng.next() - 0.5) * 2;
    const jy = (rng.next() - 0.5) * 2;
    
    return this.shiftBounds(paddedBounds, jx * this.getShiftFactor(difficulty), jy * this.getShiftFactor(difficulty));
  }

  private padBounds(
    bbox: [[number, number], [number, number]], 
    factor: number, 
    minW: number, 
    minH: number
  ): [[number, number], [number, number]] {
    const [[minX, minY], [maxX, maxY]] = bbox;
    const width = Math.max(maxX - minX, minW);
    const height = Math.max(maxY - minY, minH);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const halfW = (width * factor) / 2;
    const halfH = (height * factor) / 2;
    return [[cx - halfW, cy - halfH], [cx + halfW, cy + halfH]];
  }

  private shiftBounds(
    bbox: [[number, number], [number, number]], 
    fracX: number, 
    fracY: number
  ): [[number, number], [number, number]] {
    const [[minX, minY], [maxX, maxY]] = bbox;
    const width = maxX - minX;
    const height = maxY - minY;
    const cx = (minX + maxX) / 2 + width * fracX;
    const cy = (minY + maxY) / 2 + height * fracY;
    const halfW = width / 2;
    const halfH = height / 2;
    return [[cx - halfW, cy - halfH], [cx + halfW, cy + halfH]];
  }

  private getPaddingFactor(difficulty: string): number {
    switch (difficulty) {
      case "training": return 1.8; // More padding for reverse quiz to show more context
      case "easy": return 2.2;
      case "normal": return 2.8;
      case "hard": return 3.5;
      default: return 2.8;
    }
  }

  private getShiftFactor(difficulty: string): number {
    switch (difficulty) {
      case "training": return 0.1; // Less shift for reverse quiz
      case "easy": return 0.2;
      case "normal": return 0.3;
      case "hard": return 0.4;
      default: return 0.3;
    }
  }

  private getFocusPadding(difficulty: string): number {
    switch (difficulty) {
      case "training": return 20;
      case "easy": return 24;
      case "normal": return 28;
      case "hard": return 32;
      default: return 28;
    }
  }
}