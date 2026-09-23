import {
  FREE_MODE_ACTION,
  MAP_CELL_STATUS,
  type FreeModeAction,
  type FreeModeCells,
  type FreeModeState,
} from "@/features/free/types";

const MAX_HISTORY = 100;

export function createInitialFreeModeState(mapIds: string[]): FreeModeState {
  return { cells: createInitialCells(mapIds), history: [] };
}

function createInitialCells(mapIds: string[]): FreeModeCells {
  return Object.fromEntries(mapIds.map((id) => [id, { status: MAP_CELL_STATUS.AVAILABLE }]));
}

/** Renumbers picked maps to a contiguous 1..n sequence, preserving relative pick order. */
function renumberPicks(cells: FreeModeCells): FreeModeCells {
  const pickedIds = Object.entries(cells)
    .filter(([, cell]) => cell.status === MAP_CELL_STATUS.PICKED)
    .sort(([, a], [, b]) => (a.order ?? 0) - (b.order ?? 0))
    .map(([id]) => id);

  const next = { ...cells };
  pickedIds.forEach((id, index) => {
    next[id] = { status: MAP_CELL_STATUS.PICKED, order: index + 1 };
  });
  return next;
}

function nextPickOrder(cells: FreeModeCells): number {
  const orders = Object.values(cells)
    .filter((cell) => cell.status === MAP_CELL_STATUS.PICKED)
    .map((cell) => cell.order ?? 0);
  return orders.length === 0 ? 1 : Math.max(...orders) + 1;
}

function pick(cells: FreeModeCells, mapId: string): FreeModeCells {
  const cell = cells[mapId];
  if (cell === undefined || cell.status === MAP_CELL_STATUS.BANNED) return cells;

  if (cell.status === MAP_CELL_STATUS.PICKED) {
    return renumberPicks({ ...cells, [mapId]: { status: MAP_CELL_STATUS.AVAILABLE } });
  }

  return { ...cells, [mapId]: { status: MAP_CELL_STATUS.PICKED, order: nextPickOrder(cells) } };
}

/**
 * Reconciles `cells` with a new set of pool map ids: keeps cells for maps still present, adds
 * newly added maps as available, and drops maps no longer in the pool — renumbering the
 * remaining picks to stay contiguous. Not a user action, so it intentionally clears undo
 * history (see `FREE_MODE_ACTION.SYNC_POOL` in the reducer) rather than trying to keep history
 * entries consistent with a pool that may no longer contain the maps they reference.
 */
function syncPool(cells: FreeModeCells, mapIds: string[]): FreeModeCells {
  const next: FreeModeCells = {};
  for (const id of mapIds) {
    next[id] = cells[id] ?? { status: MAP_CELL_STATUS.AVAILABLE };
  }
  return renumberPicks(next);
}

function ban(cells: FreeModeCells, mapId: string): FreeModeCells {
  const cell = cells[mapId];
  if (cell === undefined) return cells;

  if (cell.status === MAP_CELL_STATUS.BANNED) {
    return { ...cells, [mapId]: { status: MAP_CELL_STATUS.AVAILABLE } };
  }

  const wasPicked = cell.status === MAP_CELL_STATUS.PICKED;
  const withBan = { ...cells, [mapId]: { status: MAP_CELL_STATUS.BANNED } };
  return wasPicked ? renumberPicks(withBan) : withBan;
}

export function freeModeReducer(state: FreeModeState, action: FreeModeAction): FreeModeState {
  switch (action.type) {
    case FREE_MODE_ACTION.PICK: {
      const cells = pick(state.cells, action.mapId);
      if (cells === state.cells) return state;
      return { cells, history: pushHistory(state.history, state.cells) };
    }
    case FREE_MODE_ACTION.BAN: {
      const cells = ban(state.cells, action.mapId);
      if (cells === state.cells) return state;
      return { cells, history: pushHistory(state.history, state.cells) };
    }
    case FREE_MODE_ACTION.UNDO: {
      if (state.history.length === 0) return state;
      const previous = state.history[state.history.length - 1];
      if (previous === undefined) return state;
      return { cells: previous, history: state.history.slice(0, -1) };
    }
    case FREE_MODE_ACTION.RESET:
      return createInitialFreeModeState(action.mapIds);
    case FREE_MODE_ACTION.SYNC_POOL:
      // Not a user board action — clears undo history rather than keep entries that could
      // reference maps no longer in the pool (see `syncPool` above).
      return { cells: syncPool(state.cells, action.mapIds), history: [] };
    default:
      return state;
  }
}

function pushHistory(history: FreeModeCells[], cells: FreeModeCells): FreeModeCells[] {
  const next = [...history, cells];
  return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
}
