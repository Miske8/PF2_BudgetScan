import { createContext, useContext } from 'react';
import type { AuthState, AuthStatus, SessionUser } from '@/core/types/auth';

/**
 * Contexte d'authentification (interface publique).
 * Le provider concret est `src/components/AuthProvider.tsx` (monté dans app/_layout.tsx).
 */
export interface AuthContextValue extends AuthState {
  /** Appelé par Login/Register après un authService.login() réussi. */
  signIn: (_user: SessionUser) => Promise<void>;
  /** Purge la session SecureStore + état → redirection via AuthGuard. */
  signOut: () => Promise<void>;
  /** Mémorise "onboarding déjà vu" (AsyncStorage). */
  setOnboardingSeen: (_seen: boolean) => Promise<void>;
}

/** Préfixe `_` : signatures déclaratives, implémentées par le provider. */
const noop = async (..._args: unknown[]): Promise<void> => undefined;

export const initialAuthState: AuthState = {
  status: 'loading',
  user: null,
  onboardingSeen: false,
};

/**
 * Valeur de secours hors-provider (théoriquement inutilisable : AuthProvider
 * est monté à la racine). En cas d'usage hors provider, on reste en 'loading'
 * plutôt que de fausser un guard avec un faux 'signed-out'.
 */
export const AuthContext = createContext<AuthContextValue>({
  ...initialAuthState,
  signIn: noop as (_user: SessionUser) => Promise<void>,
  signOut: noop,
  setOnboardingSeen: noop as (_seen: boolean) => Promise<void>,
});

export function useAuthContext(): AuthContextValue {
  return useContext(AuthContext);
}

/** Status brut, pratique pour les guards de routes. */
export function useAuthStatus(): AuthStatus {
  return useAuthContext().status;
}
