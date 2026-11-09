"use client";

import { useEffect, useState } from "react";

export function usePersistedState(storageKey, initialValue) {
  const [value, setValue] = useState(initialValue);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) setValue(JSON.parse(stored));
    } catch {
      // Ignore malformed or unavailable browser storage.
    } finally {
      setReady(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(storageKey, JSON.stringify(value)); } catch {}
  }, [storageKey, value, ready]);

  return [value, setValue, ready];
}
