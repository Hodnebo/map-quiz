export type Coordinates = [number, number];

export interface Bydel {
  id: string;
  name: string;
  centroid: Coordinates;
  areaKm2: number;
  slug: string;
}

// Generic region type for multi-map support
export interface Region {
  id: string;
  name: string;
  centroid: Coordinates;
  areaKm2: number;
  slug: string;
}

// Map configuration interface
export interface MapConfig {
  id: string;
  name?: string; // Deprecated: use nameKey with i18n instead
  dataPath: string;
  center: Coordinates;
  initialZoom: number;
  bounds?: [[number, number], [number, number]]; // [[minLng, minLat], [maxLng, maxLat]]
  language: string;
  description?: string;
  featureCount?: number;
  previewImage?: string;
}

// Map metadata for UI display
export interface MapMetadata {
  description: string;
  featureCount: number;
  language: string;
  region: string;
  previewImage?: string;
  difficulty?: "easy" | "medium" | "hard";
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