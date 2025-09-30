export type Coordinates = [number, number];

export interface Bydel {
  id: string;
  name: string;
  centroid: Coordinates;
  areaKm2: number;
  slug: string;
}

export interface GameSettings {
  rounds: number;
  timerSeconds: number | null;
  difficulty: "training" | "easy" | "normal" | "hard";
  maxAttempts?: number;
  alternativesCount?: number | null;
  audioEnabled?: boolean;
}

export interface GameState {
  status: "idle" | "playing" | "paused" | "ended";
  score: number;
  streak: number;
  currentRound: number;
  currentTargetId: string | null;
  answeredIds: string[];
  settings: GameSettings;
  attemptsThisRound?: number;
  revealedIds?: string[];
  candidateIds?: string[];
} 