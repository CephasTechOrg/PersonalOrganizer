"use client";

import { useCallback, useEffect, useState } from "react";
import { useDataChanged } from "./events";

interface ResourceState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Fetch a resource with a loader, exposing loading/error/data and refetching
 * automatically when a global data-changed event fires.
 */
export function useResource<T>(
  loader: () => Promise<T>,
  deps: unknown[],
  options: { refetchOnChange?: boolean } = {},
): ResourceState<T> {
  const { refetchOnChange = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableLoader = useCallback(loader, deps);

  const run = useCallback(
    async (showSpinner: boolean) => {
      if (showSpinner) setLoading(true);
      setError(null);
      try {
        const result = await stableLoader();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setLoading(false);
      }
    },
    [stableLoader],
  );

  useEffect(() => {
    run(true);
  }, [run]);

  const onChange = useCallback(() => {
    if (refetchOnChange) run(false);
  }, [run, refetchOnChange]);

  useDataChanged(onChange);

  return { data, loading, error, reload: () => run(true) };
}
