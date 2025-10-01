export type Coordinates = [number, number];

export interface Bydel {
  id: string;
  name: string;
  centroid: Coordinates;
  areaKm2: number;
  slug: string;
}

export interface GameMode {
  id: string;
  name: string;
  description: string;
  settings: {
    difficulty?: "training" | "easy" | "normal" | "hard";
    alternativesCount?: number | null;
    maxAttempts?: number;
    zoomEnabled?: boolean;
    timerSeconds?: number | null;
  };
}

export type MapStyle = "backdrop" | "dataviz" | "basic-v2";

export interface GameSettings {
  gameMode: string;
  rounds: number;
  audioEnabled?: boolean;
  mapStyle?: MapStyle;
  // Mode-specific overrides
  difficulty?: "training" | "easy" | "normal" | "hard";
  alternativesCount?: number | null;
  maxAttempts?: number;
  timerSeconds?: number | null;
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