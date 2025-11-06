import { BaseGameMode } from './BaseGameMode';
import type { GameState, GameSettings } from '../types';
import type { QuestionData, AnswerResult, MapConfig } from '../gameModeStrategy';
import type { GeoJSON } from 'geojson';
import { XorShift32 } from '../rng';

export class ClassicMode extends BaseGameMode {
  readonly id = 'classic';
  readonly nameKey = 'gameModes.classic.name';
  readonly descriptionKey = 'gameModes.classic.description';

  getDefaultSettings(): Partial<GameSettings> {
    return {
      difficulty: 'normal',
      alternativesCount: null,
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
      type: 'click',
      mapConfig: this.createMapConfig(true),
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

    const maxAttempts = state.settings.maxAttempts ?? 3;
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

  getMapConfig(state: GameState, settings: GameSettings, geojson: GeoJSON.FeatureCollection, seed: number): MapConfig {
    const difficulty = settings.difficulty ?? 'normal';
    // Disable zoom for training, hard and expert difficulties
    const zoomEnabled = difficulty !== 'training' && difficulty !== 'hard' && difficulty !== 'expert';
    
    if (!zoomEnabled || !state.currentTargetId) {
      return this.createMapConfig(false);
    }

    const focusBounds = this.calculateFocusBounds(geojson, state.currentTargetId, seed, state.currentRound, difficulty, true); // Classic mode uses randomization
    const focusPadding = this.getFocusPadding(difficulty);

    return this.createMapConfig(
      zoomEnabled,
      focusBounds,
      focusPadding,
      false,
      false,
      difficulty === 'hard'
    );
  }

  getSettingsProps() {
    return {
      showDifficulty: true,
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
      correctAnswers: wasCorrect ? state.correctAnswers + 1 : state.correctAnswers,
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
    geojson: GeoJSON.FeatureCollection, 
    targetId: string, 
    seed: number, 
    round: number, 
    difficulty: string,
    randomizeZoomLocation: boolean = true
  ): [[number, number], [number, number]] | null {
    if (!geojson || !targetId) return null;

    const featuresArray = geojson?.features;
    const feat = featuresArray?.find((f) => {
      return (f.id ?? f.properties?.id) === targetId;
    });
    if (!feat) return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    // coordCount removed - not used
    let invalidCoordCount = 0;
    const walk = (coords: number[] | number[][] | number[][][]): void => {
      if (typeof coords[0] === "number") {
        const [x, y] = coords as [number, number];
        // coordCount removed - not used
        
        // Check for invalid coordinates
        if (x < -180 || x > 180 || y < -90 || y > 90 || isNaN(x) || isNaN(y) || !isFinite(x) || !isFinite(y)) {
          invalidCoordCount++;
          if (invalidCoordCount <= 5) { // Only log first 5 invalid coordinates
            // Invalid coordinate detected but not logged in production
          }
        }
        
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
    
    // Log coordinate statistics
    // Debug bounds calculation removed for production

    const rawBounds: [[number, number], [number, number]] = [[minX, minY], [maxX, maxY]];
    
    // Debug logging for invalid bounds
    if (minX < -180 || maxX > 180 || minY < -90 || maxY > 90) {
      // Invalid bounds detected but not logged in production
    }
    
    const paddedBounds = this.padBounds(rawBounds, this.getPaddingFactor(difficulty), 0.02, 0.015);
    
    if (!randomizeZoomLocation) {
      return paddedBounds;
    }
    
    const rng = new XorShift32((seed + round * 1337) >>> 0);
    
    // Check if this is a very large feature (like Russia) and reduce shift factor
    const [[paddedMinX, paddedMinY], [paddedMaxX, paddedMaxY]] = paddedBounds;
    const width = paddedMaxX - paddedMinX;
    const height = paddedMaxY - paddedMinY;
    const isVeryLarge = width > 60 || height > 30; // More than 60 degrees longitude or 30 degrees latitude
    
    const baseShiftFactor = this.getShiftFactor(difficulty);
    const shiftFactor = isVeryLarge ? baseShiftFactor * 0.3 : baseShiftFactor;
    
    const jx = (rng.next() - 0.5) * 2;
    const jy = (rng.next() - 0.5) * 2;
    
    const finalBounds = this.shiftBounds(paddedBounds, jx * shiftFactor, jy * shiftFactor);
    return finalBounds;
  }

  private padBounds(
    bbox: [[number, number], [number, number]], 
    factor: number, 
    minW: number, 
    minH: number
  ): [[number, number], [number, number]] {
    const [[minX, minY], [maxX, maxY]] = bbox;
    
    // Check if this feature spans the entire world (common for islands crossing 180° meridian)
    const spansWorld = (maxX - minX) > 300; // More than 300 degrees longitude
    
    if (spansWorld) {
      // For world-spanning features, use a fixed reasonable bounds instead of padding
      // This prevents creating invalid coordinates that extend beyond -180/180
      const centerLng = (minX + maxX) / 2;
      const centerLat = (minY + maxY) / 2;
      const padding = 0.1; // 0.1 degrees padding
      
      return [
        [Math.max(centerLng - padding, -180), Math.max(centerLat - padding, -90)],
        [Math.min(centerLng + padding, 180), Math.min(centerLat + padding, 90)]
      ];
    }
    
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
    
    const shiftedBounds = [[cx - halfW, cy - halfH], [cx + halfW, cy + halfH]];
    
    // Validate and clamp bounds to valid coordinate ranges
    const [[newMinX, newMinY], [newMaxX, newMaxY]] = shiftedBounds;
    
    // Clamp longitude to [-180, 180] and latitude to [-90, 90]
    const clampedMinX = Math.max(-180, Math.min(180, newMinX));
    const clampedMinY = Math.max(-90, Math.min(90, newMinY));
    const clampedMaxX = Math.max(-180, Math.min(180, newMaxX));
    const clampedMaxY = Math.max(-90, Math.min(90, newMaxY));
    
    // If bounds were clamped, log a warning
    if (clampedMinX !== newMinX || clampedMinY !== newMinY || 
        clampedMaxX !== newMaxX || clampedMaxY !== newMaxY) {
      // Bounds were clamped but not logged in production
    }
    
    return [[clampedMinX, clampedMinY], [clampedMaxX, clampedMaxY]];
  }

  private getDifficultySettings(difficulty: string) {
    const settings = {
      training: { paddingFactor: 1.2, shiftFactor: 0.3, focusPadding: 28 },
      easy: { paddingFactor: 1.5, shiftFactor: 0.6, focusPadding: 32 },
      normal: { paddingFactor: 2.0, shiftFactor: 0.8, focusPadding: 40 },
      medium: { paddingFactor: 2.0, shiftFactor: 0.8, focusPadding: 40 },
      hard: { paddingFactor: 2.5, shiftFactor: 1.0, focusPadding: 24 },
      expert: { paddingFactor: 3.0, shiftFactor: 1.0, focusPadding: 24 },
    };
    
    return settings[difficulty as keyof typeof settings] || settings.normal;
  }

  private getPaddingFactor(difficulty: string): number {
    return this.getDifficultySettings(difficulty).paddingFactor;
  }

  private getShiftFactor(difficulty: string): number {
    return this.getDifficultySettings(difficulty).shiftFactor;
  }

  private getFocusPadding(difficulty: string): number {
    return this.getDifficultySettings(difficulty).focusPadding;
  }
}