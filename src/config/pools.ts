import type { GameMap } from "@/features/maps/types";

// TODO(verify): confirm current competitive pool — Riot rotates it roughly every Act and
// this list is not auto-verified. Update the map names below when the pool changes.
export const COMPETITIVE_POOL: readonly string[] = [
  "Abyss",
  "Ascent",
  "Bind",
  "Corrode",
  "Haven",
  "Lotus",
  "Sunset",
];

export const POOL_PRESET = {
  ALL: "all",
  COMPETITIVE: "competitive",
} as const;

export type PoolPreset = (typeof POOL_PRESET)[keyof typeof POOL_PRESET];

/** Resolves a preset to the map ids it selects, given the full known map list. */
export function resolvePresetMapIds(maps: GameMap[], preset: PoolPreset): string[] {
  if (preset === POOL_PRESET.ALL) {
    return maps.map((map) => map.id);
  }
  return maps.filter((map) => COMPETITIVE_POOL.includes(map.name)).map((map) => map.id);
}
