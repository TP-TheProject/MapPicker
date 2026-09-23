import { useEffect, useMemo, useRef } from "react";

import type { GameMap } from "@/features/maps/types";
import { useLocalStorage } from "@/hooks/useLocalStorage";

const POOL_STORAGE_KEY = "mappicker:pool";

function hasStoredPoolPreference(): boolean {
  try {
    return window.localStorage.getItem(POOL_STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

/**
 * Tracks the user's selected map pool (a subset of `maps`), persisted to localStorage by
 * map id. Unknown ids (e.g. a map removed from the API) are silently dropped. Defaults to
 * every known map.
 *
 * `maps` arrives asynchronously (it's `[]` on first render, before `useMaps` resolves), so the
 * "every known map" default can't be baked into the initial `useLocalStorage` value — it's
 * seeded once, the first time `maps` is non-empty, but only when the user has no stored
 * preference yet (so an intentional empty selection is never silently overwritten).
 */
export function usePoolSelection(maps: GameMap[]) {
  const [selectedIds, setSelectedIds] = useLocalStorage<string[]>(POOL_STORAGE_KEY, []);
  const seededRef = useRef(hasStoredPoolPreference());

  useEffect(() => {
    if (seededRef.current || maps.length === 0) return;
    seededRef.current = true;
    setSelectedIds(maps.map((map) => map.id));
  }, [maps, setSelectedIds]);

  const validIds = useMemo(() => new Set(maps.map((map) => map.id)), [maps]);
  const selectedPool = useMemo(
    () => maps.filter((map) => selectedIds.includes(map.id)),
    [maps, selectedIds],
  );

  /** Replaces the persisted pool selection outright (used to commit a staged draft). */
  function setSelection(ids: string[]): void {
    setSelectedIds(ids);
  }

  return {
    selectedIds: selectedIds.filter((id) => validIds.has(id)),
    selectedPool,
    setSelection,
  };
}
