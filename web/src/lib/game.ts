import type { GameSettings, GameState } from "@/lib/types";
import { XorShift32, shuffleInPlace, pickOne } from "@/lib/rng";

export interface AnswerResult {
  isCorrect: boolean;
  newState: GameState;
  correctId: string | null;
  revealedCorrect?: boolean;
}

const DEFAULT_MAX_ATTEMPTS = 3;

export function createInitialState(settings: GameSettings, seed: number): GameState {
  return {
    status: "idle",
    score: 0,
    streak: 0,
    currentRound: 0,
    currentTargetId: null,
    answeredIds: [],
    settings,
    attemptsThisRound: 0,
    revealedIds: [],
    candidateIds: [],
  };
}

function buildCandidates(allIds: string[], targetId: string, count: number, seed: number, excludeIds: string[]): string[] {
  const rng = new XorShift32((seed ^ 0x9e3779b9) >>> 0);
  const exclude = new Set<string>([...excludeIds, targetId]);
  const pool = allIds.filter((id) => !exclude.has(id));
  shuffleInPlace(pool, rng);
  const subset = pool.slice(0, Math.max(0, count - 1));
  const cands = [targetId, ...subset];
  shuffleInPlace(cands, rng);
  return cands;
}

export function startGame(state: GameState, allIds: string[], seed: number): GameState {
  const rng = new XorShift32(seed >>> 0);
  const pool = [...allIds];
  shuffleInPlace(pool, rng);
  const target = pool.find((id) => !state.answeredIds.includes(id)) ?? null;
  const alternatives = state.settings.alternativesCount ?? null;
  const candidateIds = target && alternatives && alternatives > 1 ? buildCandidates(allIds, target, alternatives, seed, state.answeredIds) : [];
  return {
    ...state,
    status: target ? "playing" : "ended",
    currentRound: target ? 1 : 0,
    currentTargetId: target,
    answeredIds: [],
    score: 0,
    streak: 0,
    attemptsThisRound: 0,
    revealedIds: [],
    candidateIds,
  };
}

export function answer(state: GameState, clickedId: string, allIds: string[], seed: number): AnswerResult {
  if (state.status !== "playing") return { isCorrect: false, newState: state, correctId: state.currentTargetId };
  const maxAttempts = state.settings.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const targetId = state.currentTargetId;
  const isCorrect = clickedId === targetId;

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
    const answeredTargets = [...state.answeredIds, targetId!];
    const revealed = [...(state.revealedIds ?? []), targetId!];
    const remaining = allIds.filter((id) => !answeredTargets.includes(id));
    const hasMoreRounds = state.currentRound < state.settings.rounds;

    let nextTarget: string | null = null;
    if (hasMoreRounds && remaining.length > 0) {
      const rng = new XorShift32((seed + state.currentRound * 9973) >>> 0);
      nextTarget = pickOne(remaining, rng);
    }

    const alternatives = state.settings.alternativesCount ?? null;
    const nextCandidates = nextTarget && alternatives && alternatives > 1
      ? buildCandidates(allIds, nextTarget, alternatives, seed + state.currentRound, answeredTargets)
      : [];

    const newState: GameState = {
      ...state,
      score: state.score,
      streak: 0,
      answeredIds: answeredTargets,
      currentRound: hasMoreRounds && nextTarget ? state.currentRound + 1 : state.currentRound,
      currentTargetId: nextTarget,
      status: hasMoreRounds && nextTarget ? "playing" : "ended",
      attemptsThisRound: 0,
      revealedIds: revealed,
      candidateIds: nextCandidates,
    };
    return { isCorrect: false, newState, correctId: targetId, revealedCorrect: true };
  }

  // Correct answer flow
  const answeredTargets = [...state.answeredIds, targetId!];
  const revealed = [...(state.revealedIds ?? []), targetId!];
  const remaining = allIds.filter((id) => !answeredTargets.includes(id));
  const hasMoreRounds = state.currentRound < state.settings.rounds;

  let nextTarget: string | null = null;
  if (hasMoreRounds && remaining.length > 0) {
    const rng = new XorShift32((seed + state.currentRound * 9973) >>> 0);
    nextTarget = pickOne(remaining, rng);
  }

  const nextScore = state.score + 1 + Math.floor((state.streak + 1) / 3);
  const nextStreak = state.streak + 1;

  const alternatives = state.settings.alternativesCount ?? null;
  const nextCandidates = nextTarget && alternatives && alternatives > 1
    ? buildCandidates(allIds, nextTarget, alternatives, seed + state.currentRound, answeredTargets)
    : [];

  const newState: GameState = {
    ...state,
    score: nextScore,
    streak: nextStreak,
    answeredIds: answeredTargets,
    currentRound: hasMoreRounds && nextTarget ? state.currentRound + 1 : state.currentRound,
    currentTargetId: nextTarget,
    status: hasMoreRounds && nextTarget ? "playing" : "ended",
    attemptsThisRound: 0,
    revealedIds: revealed,
    candidateIds: nextCandidates,
  };

  return { isCorrect: true, newState, correctId: targetId };
}
