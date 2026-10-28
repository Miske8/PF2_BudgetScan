/**
 * AuthProvider — provider React du contexte d'authentification (Étape 6).
 *
 * - Au montage : initialise la base (migrations + seed catégories), restaure
 *   la session depuis SecureStore, lit la préférence "onboarding vu".
 * - Met à jour le `AuthContext` consommé par les écrans et l'AuthGuard.
 * - Consomme le `authService` (Application Layer) ; l'UI ne parle jamais
 *   directement à SQLite ou SecureStore.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from '@/hooks/useAuthContext';
import type { AuthStatus, SessionUser } from '@/core/types/auth';
import { authService } from '@/services';
import { getDatabase } from '@/infrastructure/db';
import { seedDefaultCategories } from '@/infrastructure/db/seed';
import { prefs } from '@/infrastructure/secure/preferences';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<SessionUser | null>(null);
  const [onboardingSeen, setOnboardingSeenState] = useState(false);

  // --- Démarrage : DB + session + préférences ---------------------------------
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await getDatabase(); // ouvre budgetscan.db + applique les migrations
        await seedDefaultCategories(); // idempotent : 7 catégories système

        const [session, seen] = await Promise.all([
          authService.restoreSession(),
          prefs.getOnboardingSeen(),
        ]);

        if (cancelled) return;
        setOnboardingSeenState(seen);
        if (session) {
          setUser(session);
          setStatus('signed-in');
        } else {
          setStatus('signed-out');
        }
      } catch (error) {
        console.error('[AuthProvider] échec du démarrage :', error);
        if (!cancelled) setStatus('signed-out');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // --- Actions ----------------------------------------------------------------
  const signIn = useCallback(async (nextUser: SessionUser) => {
    setUser(nextUser);
    setStatus('signed-in');
  }, []);

  const signOut = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setStatus('signed-out');
  }, []);

  const setOnboardingSeen = useCallback(async (seen: boolean) => {
    await prefs.setOnboardingSeen(seen);
    setOnboardingSeenState(seen);
  }, []);

  const value = useMemo(
    () => ({ status, user, onboardingSeen, signIn, signOut, setOnboardingSeen }),
    [status, user, onboardingSeen, signIn, signOut, setOnboardingSeen],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
