import { apiMapsResponseSchema, type ApiMap } from "@/features/maps/schema";
import { slugifyMapName } from "@/features/maps/slug";
import type { GameMap } from "@/features/maps/types";

const VALORANT_API_MAPS_URL = "https://valorant-api.com/v1/maps";
const FETCH_TIMEOUT_MS = 5000;

/** Standard (pickable) maps expose a tactical description; unranked/Skirmish/TDM maps don't. */
function isStandardMap(map: ApiMap): boolean {
  return map.tacticalDescription !== null;
}

function toGameMap(map: ApiMap): GameMap | null {
  if (map.splash === null || map.listViewIcon === null || map.listViewIconTall === null) {
    return null;
  }

  return {
    id: map.uuid,
    name: map.displayName,
    slug: slugifyMapName(map.displayName),
    splash: map.splash,
    banner: map.listViewIcon,
    tall: map.listViewIconTall,
  };
}

/** Fetches, validates, filters, dedupes (by name), and sorts the standard map pool. */
export async function fetchMaps(): Promise<GameMap[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(VALORANT_API_MAPS_URL, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json: unknown = await response.json();
    const parsed = apiMapsResponseSchema.parse(json);

    const byName = new Map<string, GameMap>();
    for (const apiMap of parsed.data) {
      if (!isStandardMap(apiMap)) continue;
      const gameMap = toGameMap(apiMap);
      if (gameMap === null) continue;
      byName.set(gameMap.name, gameMap);
    }

    return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    throw new Error("Failed to fetch maps from valorant-api.com", { cause: err });
  } finally {
    clearTimeout(timeout);
  }
}
