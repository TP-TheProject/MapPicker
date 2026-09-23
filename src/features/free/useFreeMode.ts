import { useEffect, useMemo, useReducer, useRef } from "react";

import { createInitialFreeModeState, freeModeReducer } from "@/features/free/reducer";
import { FREE_MODE_ACTION } from "@/features/free/types";
import type { FreeModeState } from "@/features/free/types";

export interface UseFreeModeResult {
  state: FreeModeState;
  pick: (mapId: string) => void;
  ban: (mapId: string) => void;
  undo: () => void;
  reset: () => void;
  canUndo: boolean;
}

/**
 * React binding around the pure free-mode reducer: pick/ban/undo/reset for a set of map ids.
 * Automatically reconciles state when `mapIds` changes (e.g. the map pool is edited elsewhere)
 * via `FREE_MODE_ACTION.SYNC_POOL`, comparing the joined id list to avoid dispatching on every
 * render.
 */
export function useFreeMode(mapIds: string[]): UseFreeModeResult {
  const [state, dispatch] = useReducer(freeModeReducer, mapIds, createInitialFreeModeState);
  const lastSyncedIds = useRef(mapIds.join(","));

  useEffect(() => {
    const joined = mapIds.join(",");
    if (joined === lastSyncedIds.current) return;
    lastSyncedIds.current = joined;
    dispatch({ type: FREE_MODE_ACTION.SYNC_POOL, mapIds });
  }, [mapIds]);

  const actions = useMemo(
    () => ({
      pick: (mapId: string) => dispatch({ type: FREE_MODE_ACTION.PICK, mapId }),
      ban: (mapId: string) => dispatch({ type: FREE_MODE_ACTION.BAN, mapId }),
      undo: () => dispatch({ type: FREE_MODE_ACTION.UNDO }),
      reset: () => dispatch({ type: FREE_MODE_ACTION.RESET, mapIds }),
    }),
    [mapIds],
  );

  return { state, ...actions, canUndo: state.history.length > 0 };
}
