/**
 * Hook générique de chargement asynchrone — états UI : loading / error / data.
 *
 * Design compatible React Compiler / ESLint react-hooks v6 :
 *  - aucune écriture de ref au rendu,
 *  - aucun setState synchrone dans l'effet : les mises à jour d’état
 *    n'arrivent que dans les callbacks asynchrones (.then/.catch),
 *  - le re-run est piloté par `deps` (signature explicite du hook).
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface AsyncState<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
  /** Relance manuellement la requête (pull-to-refresh, après mutation). */
  refetch: () => void;
}

export function useAsync<T>(factory: () => Promise<T>, deps: readonly unknown[]): AsyncState<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  // Compteur pour ignorer les réponses des runs obsolètes (race conditions).
  const runIdRef = useRef(0);
  const mountedRef = useRef(true);
  const factoryRef = useRef(factory);

  useEffect(() => {
    factoryRef.current = factory;
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  });

  const run = useCallback(() => {
    const runId = ++runIdRef.current;
    // setLoading ici est sûr : exécuté soit en réaction à un event user
    // (refetch), soit dans un microtask (voir effet ci-dessous).
    Promise.resolve().then(() => {
      if (!mountedRef.current || runId !== runIdRef.current) return;
      setLoading(true);
      setError(null);
      factoryRef
        .current()
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
    });
  }, []);

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- relance volontaire quand deps change
  }, [...deps, run]);

  return { data, loading, error, refetch: run };
}
