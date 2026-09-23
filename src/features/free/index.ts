export { createInitialFreeModeState, freeModeReducer } from "@/features/free/reducer";
export { MAP_CELL_STATUS, FREE_MODE_ACTION } from "@/features/free/types";
export type {
  FreeModeAction,
  FreeModeCells,
  FreeModeState,
  MapCellState,
  MapCellStatus,
} from "@/features/free/types";
export { useFreeMode } from "@/features/free/useFreeMode";
export type { UseFreeModeResult } from "@/features/free/useFreeMode";
