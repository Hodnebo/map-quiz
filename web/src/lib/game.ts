import type { GameSettings, GameState } from "@/lib/types";
import type { AnswerResult } from "./gameModeStrategy";
import { gameModeRegistry } from "./gameModeRegistry";


export function createInitialState(settings: GameSettings): GameState {
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


export function startGame(state: GameState, allIds: string[], seed: number): GameState {
  const mode = gameModeRegistry.getMode(state.settings.gameMode);
  const questionData = mode.generateQuestion(state, allIds, seed);
  
  return {
    ...state,
    status: questionData.targetId ? "playing" : "ended",
    currentRound: questionData.targetId ? 1 : 0,
    currentTargetId: questionData.targetId,
    answeredIds: [],
    score: 0,
    streak: 0,
    attemptsThisRound: 0,
    revealedIds: [],
    candidateIds: questionData.candidates || [],
  };
}

export function answer(state: GameState, clickedId: string, allIds: string[], seed: number): AnswerResult {
  const mode = gameModeRegistry.getMode(state.settings.gameMode);
  return mode.processAnswer(state, clickedId, allIds, seed);
}
