import { useQuery } from "@tanstack/react-query";

import { fetchMaps } from "@/features/maps/api";
import { FALLBACK_MAPS } from "@/features/maps/fallback";
import { MAP_SOURCE, type MapsResult } from "@/features/maps/types";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

async function fetchMapsResult(): Promise<MapsResult> {
  try {
    const maps = await fetchMaps();
    if (maps.length === 0) {
      return { maps: FALLBACK_MAPS, source: MAP_SOURCE.FALLBACK };
    }
    return { maps, source: MAP_SOURCE.API };
  } catch {
    return { maps: FALLBACK_MAPS, source: MAP_SOURCE.FALLBACK };
  }
}

/**
 * Loads the standard map pool from valorant-api.com. Falls back to the local static list
 * (`FALLBACK_MAPS`) when the request fails, times out, or resolves to an empty list — the
 * query never surfaces an error state to consumers, only `data.source`.
 */
export function useMaps() {
  return useQuery({
    queryKey: ["maps"],
    queryFn: fetchMapsResult,
    staleTime: ONE_DAY_MS,
    gcTime: ONE_DAY_MS,
    retry: 1,
  });
}
