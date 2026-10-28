/**
 * Types d'authentification locale (Étape 4 — squelette de navigation).
 * L'implémentation complète (hashing, SecureStore) arrive à l'étape 6.
 */

export type AuthStatus = 'loading' | 'signed-in' | 'signed-out';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthState {
  status: AuthStatus;
  user: SessionUser | null;
  /** Onboarding déjà vu ? (AsyncStorage, étape 6) */
  onboardingSeen: boolean;
}
