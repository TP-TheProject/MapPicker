import { useMemo, useState } from "react";

import {
  applyAction,
  createVeto,
  currentStep,
  isComplete,
  isVetoError,
  summarize,
  undo as undoVeto,
} from "@/features/veto/engine";
import type {
  VetoAction,
  VetoConfig,
  VetoError,
  VetoState,
  VetoStep,
  VetoSummary,
} from "@/features/veto/types";

export interface UseVetoResult {
  state: VetoState | null;
  setupError: VetoError | null;
  step: VetoStep | undefined;
  complete: boolean;
  summary: VetoSummary | undefined;
  start: (config: VetoConfig) => void;
  dispatch: (action: VetoAction) => void;
  undo: () => void;
  reset: () => void;
  canUndo: boolean;
}

/** React binding around the pure veto engine: setup, actions, undo, and derived state. */
export function useVeto(): UseVetoResult {
  const [state, setState] = useState<VetoState | null>(null);
  const [setupError, setSetupError] = useState<VetoError | null>(null);

  function start(config: VetoConfig): void {
    const result = createVeto(config);
    if (isVetoError(result)) {
      setSetupError(result);
      setState(null);
      return;
    }
    setSetupError(null);
    setState(result);
  }

  function dispatch(action: VetoAction): void {
    setState((prev) => (prev === null ? prev : applyAction(prev, action)));
  }

  function undo(): void {
    setState((prev) => (prev === null ? prev : undoVeto(prev)));
  }

  function reset(): void {
    setState(null);
    setSetupError(null);
  }

  const step = useMemo(() => (state === null ? undefined : currentStep(state)), [state]);
  const complete = state !== null && isComplete(state);
  const summary = useMemo(
    () => (state !== null && complete ? summarize(state) : undefined),
    [state, complete],
  );

  const canUndo = state !== null && state.history.length > 0;

  return { state, setupError, step, complete, summary, start, dispatch, undo, reset, canUndo };
}
