// Helper to get the correct base path for assets
export function getBasePath(): string {
  return process.env.NODE_ENV === 'production' ? '/map-quiz' : '';
}

// Helper to get full asset URL
export function getAssetUrl(path: string): string {
  return `${getBasePath()}${path}`;
}