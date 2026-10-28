/**
 * Hook générique de chargement asynchrone — gère les 3 états UI imposés :
 * loading / error / data (l'état "vide" se traite dans l'écran via data).
 *
 * Usage :
 *   const { data, loading, error, refetch } = useAsync(() => svc.list(id), [id]);
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface AsyncState<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useAsync<T>(factory: () => Promise<T>, deps: readonly unknown[]): AsyncState<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);
  // Compteur pour ignorer les réponses des runs obsolètes (race conditions).
  const runIdRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const run = useCallback(() => {
    const runId = ++runIdRef.current;
    setLoading(true);
    setError(null);
    factory()
      .then((result) => {
        if (!mountedRef.current || runId !== runIdRef.current) return;
        setData(result);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!mountedRef.current || runId !== runIdRef.current) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- factory recréée à chaque rendu, ce sont deps qui pilotent le re-run
  }, deps);

  useEffect(() => {
    run();
  }, [run]);

  return { data, loading, error, refetch: run };
}
