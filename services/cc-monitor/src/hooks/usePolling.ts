import { useEffect, useRef, useCallback, useState } from "react";

export function usePolling<T>(
  fetcher: () => Promise<T>,
  intervalMs: number = 10_000
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const poll = useCallback(async () => {
    try {
      const result = await fetcher();
      setData(result);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    }
  }, [fetcher]);

  useEffect(
    function startPolling() {
      poll();
      timerRef.current = setInterval(poll, intervalMs);
      return () => clearInterval(timerRef.current);
    },
    [poll, intervalMs]
  );

  return { data, error, refetch: poll };
}
