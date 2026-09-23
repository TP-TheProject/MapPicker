/** Data source a map list came from — surfaced in the UI when we fall back. */
export const MAP_SOURCE = {
  API: "api",
  FALLBACK: "fallback",
} as const;

export type MapSource = (typeof MAP_SOURCE)[keyof typeof MAP_SOURCE];

/** Domain representation of a pickable Valorant map, independent of the API shape. */
export interface GameMap {
  id: string;
  name: string;
  slug: string;
  /** 16:9 splash image — preferred for cards. */
  splash: string;
  /** Wide list-view icon. */
  banner: string;
  /** Tall list-view icon. */
  tall: string;
}

export interface MapsResult {
  maps: GameMap[];
  source: MapSource;
}
