"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { setByPath } from "@json-render/core";

const STORAGE_PREFIX = "prism:state:";

type StateChange = { path: string; value: unknown };
type StateModel = Record<string, unknown>;

function storageKey(key: string): string {
  return `${STORAGE_PREFIX}${key}`;
}

function readStored(key: string): StateModel | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(key));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as StateModel)
      : null;
  } catch {
    return null;
  }
}

function clone<T>(value: T): T {
  try {
    return structuredClone(value);
  } catch {
    return JSON.parse(JSON.stringify(value)) as T;
  }
}

/**
 * Personal, per-browser state for a rendered app. Returns props for
 * <JSONUIProvider> (uncontrolled mode):
 * - `initialState`: the persisted nested state merged over the spec's seed.
 * - `onStateChange`: writes every change back to localStorage.
 *
 * State is stored as a nested object with bare keys (the shape JSONUIProvider
 * flattens to JSON Pointer paths), so it round-trips cleanly. `key` scopes the
 * storage to one app; pass null to disable persistence (in-memory only).
 *
 * This is the Phase-1 personal-state layer. Swapping localStorage for a
 * networked StateStore here is the seam for real-time cross-session state.
 */
export function usePersistentState(
  key: string | null,
  seed: StateModel,
): { initialState: StateModel; onStateChange: (changes: StateChange[]) => void } {
  const initialState = useMemo<StateModel>(() => {
    const base = clone(seed ?? {});
    const stored = key ? readStored(key) : null;
    return stored ? { ...base, ...stored } : base;
  }, [key, seed]);

  // Live nested snapshot we mutate as changes arrive, then persist.
  const snapshotRef = useRef<StateModel>(initialState);

  useEffect(() => {
    snapshotRef.current = initialState;
  }, [initialState]);

  const onStateChange = useCallback(
    (changes: StateChange[]) => {
      if (!key || typeof window === "undefined") return;
      for (const { path, value } of changes) {
        setByPath(snapshotRef.current, path, value);
      }
      try {
        window.localStorage.setItem(
          storageKey(key),
          JSON.stringify(snapshotRef.current),
        );
      } catch {
        // Ignore quota / serialization errors — persistence is best-effort.
      }
    },
    [key],
  );

  return { initialState, onStateChange };
}
