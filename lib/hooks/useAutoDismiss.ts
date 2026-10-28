"use client";

import { useEffect, useState } from "react";

/** Holds a value that clears itself after `ms`, resetting the timer whenever
 * a fresh value is set. Covers the "show this message for a bit" pattern
 * used by one-off toasts. */
export function useAutoDismiss<T>(ms: number) {
  const [value, setValue] = useState<T | null>(null);

  useEffect(() => {
    if (value === null) return;
    const timer = setTimeout(() => setValue(null), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);

  return [value, setValue] as const;
}
