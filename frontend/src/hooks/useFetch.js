import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Generic data-fetching hook covering the loading/error/data/empty pattern
 * every page needs (Section "Data fetching" of the spec). `fetcher` is a
 * function returning a Promise resolving to `{ data, pagination? }` (i.e.
 * the shape every services/*.js function already returns).
 *
 * `deps` re-runs the fetch when any dependency changes (e.g. page number,
 * selected hospital). Pass `enabled: false` to skip fetching (e.g. while
 * a required id hasn't been resolved yet).
 */
export function useFetch(fetcher, deps = [], { enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      setData(result?.data ?? null);
      setPagination(result?.pagination ?? null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  useEffect(() => {
    run();
  }, [run]);

  return { data, pagination, loading, error, refetch: run };
}
