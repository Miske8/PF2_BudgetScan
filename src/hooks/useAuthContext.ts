import { createContext, useContext } from 'react';
import type { AuthState, AuthStatus, SessionUser } from '@/core/types/auth';

/**
 * Contexte d'authentification (interface publique).
 * Le provider concret est branché dans `app/(app)/_layout.tsx`.
 * À l'étape 6, il sera alimenté par le authService (SecureStore + SQLite).
 */
export interface AuthContextValue extends AuthState {
  signIn: (user: SessionUser) => Promise<void>;
  signOut: () => Promise<void>;
  setOnboardingSeen: (seen: boolean) => Promise<void>;
}

/** Préfixe `_` : signatures déclaratives, implémentées par le provider (étape 6). */
const noop = async (..._args: unknown[]): Promise<void> => undefined;

export const initialAuthState: AuthState = {
  status: 'loading',
  user: null,
  onboardingSeen: false,
};

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
