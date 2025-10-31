import type { Region } from "@/lib/types";
import { useRegionData } from "./useRegionData";

/**
 * Legacy hook for backward compatibility
 * Use useRegionData for new code
 */
export function useRegionerData() {
  const { regions, geojson, error, loading } = useRegionData("oslo");

  // Map regions to bydeler for backward compatibility
  const bydeler: Region[] | null = regions ? regions : null;

  return { bydeler, geojson, error, loading } as const;
} 