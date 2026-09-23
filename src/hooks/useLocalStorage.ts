import { useCallback, useState } from "react";

/**
 * Persists a JSON-serializable value to localStorage under `key`. Falls back to
 * `initialValue` when storage is unavailable, empty, or holds invalid JSON.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored === null ? initialValue : (JSON.parse(stored) as T);
    } catch {
      return initialValue;
    }
  });

  const setPersistedValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = next instanceof Function ? next(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // Storage unavailable (private mode, quota) — keep the in-memory value only.
        }
        return resolved;
      });
    },
    [key],
  );

  return [value, setPersistedValue];
}
