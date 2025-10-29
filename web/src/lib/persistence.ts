const NS = "oslo-map-quiz";

export function save<T>(key: string, value: T) {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(`${NS}:${key}`, JSON.stringify(value));
  } catch {
    // Ignore errors - silently continue
  }
}

export function load<T>(key: string, fallback: T): T {
  try {
    if (typeof window === "undefined") return fallback;
    const raw = localStorage.getItem(`${NS}:${key}`);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function hasSeenModal(): boolean {
  return load('hasSeenModal', false);
}

export function markModalAsSeen(): void {
  save('hasSeenModal', true);
}
