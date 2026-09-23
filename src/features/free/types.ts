export const MAP_CELL_STATUS = {
  AVAILABLE: "available",
  PICKED: "picked",
  BANNED: "banned",
} as const;

export type MapCellStatus = (typeof MAP_CELL_STATUS)[keyof typeof MAP_CELL_STATUS];

export interface MapCellState {
  status: MapCellStatus;
  /** 1-based pick order, contiguous across all picked maps. Only set when status is "picked". */
  order?: number;
}

export type FreeModeCells = Record<string, MapCellState>;

export interface FreeModeState {
  cells: FreeModeCells;
  history: FreeModeCells[];
}

export const FREE_MODE_ACTION = {
  PICK: "pick",
  BAN: "ban",
  UNDO: "undo",
  RESET: "reset",
  SYNC_POOL: "sync_pool",
} as const;

export type FreeModeAction =
  | { type: typeof FREE_MODE_ACTION.PICK; mapId: string }
  | { type: typeof FREE_MODE_ACTION.BAN; mapId: string }
  | { type: typeof FREE_MODE_ACTION.UNDO }
  | { type: typeof FREE_MODE_ACTION.RESET; mapIds: string[] }
  | { type: typeof FREE_MODE_ACTION.SYNC_POOL; mapIds: string[] };
