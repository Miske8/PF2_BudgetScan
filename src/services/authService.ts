/**
 * authService — Application Layer (Étape 6).
 *
 * Responsabilités :
 *  - register : crée un compte local (email unique, mot de passe hashé + sel)
 *  - login    : vérifie le mot de passe puis ouvre la session (SecureStore)
 *  - restore  : recharge la session au démarrage (AuthGuard / index)
 *  - logout   : efface la session sécurisée
 *
 * Dépendances injectées via AuthDependencies pour rester testable :
 * en prod on passe les adapters SQLite/SecureStore ; en test, des fakes.
 */

import type { PublicUser, User } from '@/core/types/models';
import type { SessionUser } from '@/core/types/auth';
import type { UserRepository } from '@/core/ports/repositories';
import { DomainError } from '@/core/rules/businessRules';
import { emailSchema, passwordSchema, nameSchema } from '@/core/schemas/auth';

export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(password: string, stored: string): Promise<boolean>;
}

export interface ISessionStore {
  read(): Promise<string | null>;
  write(userId: string): Promise<void>;
  clear(): Promise<void>;
}

export interface AuthDependencies {
  users: Pick<UserRepository, 'create' | 'findByEmail' | 'findById'>;
  hasher: PasswordHasher;
  sessionStore: ISessionStore;
  /** Générateur d'id — injecté pour les tests (déterminisme). */
  newId: () => string;
  now: () => number;
}

function toSessionUser(user: User): SessionUser {
  return { id: user.id, name: user.name, email: user.email };
}

function toPublicUser(user: User): PublicUser {
  const { passwordHash: _hash, ...rest } = user;
  return rest;
}

export function createAuthService(deps: AuthDependencies) {
  return {
    /**
     * Création d'un compte 100 % local.
     * @throws DomainError si email déjà pris ou champs invalides.
     */
    async register(input: { name: string; email: string; password: string }): Promise<SessionUser> {
      const name = nameSchema.parse(input.name);
      const email = emailSchema.parse(input.email).toLowerCase();
      passwordSchema.parse(input.password);

      const existing = await deps.users.findByEmail(email);
      if (existing) {
        throw new DomainError('Un compte existe déjà avec cette adresse email.');
      }

      const passwordHash = await deps.hasher.hash(input.password);
      const user: User = {
        id: deps.newId(),
        name,
        email,
        passwordHash,
        createdAt: deps.now(),
      };
      await deps.users.create(user);
      await deps.sessionStore.write(user.id); // ouvre la session directement après inscription
      return toSessionUser(user);
    },

    /**
     * Connexion locale. Message d'erreur volontairement générique
     * (pas de révélation "email inconnu" vs "mauvais mot de passe").
     */
    async login(email: string, password: string): Promise<SessionUser> {
      const normalized = emailSchema.parse(email).toLowerCase();
      const user = await deps.users.findByEmail(normalized);
      if (!user) {
        throw new DomainError('Email ou mot de passe incorrect.');
      }
      const ok = await deps.hasher.verify(password, user.passwordHash);
      if (!ok) {
        throw new DomainError('Email ou mot de passe incorrect.');
      }
      await deps.sessionStore.write(user.id);
      return toSessionUser(user);
    },

    /** Recharge la session au démarrage — appelé par le provider racine. */
    async restoreSession(): Promise<SessionUser | null> {
      const userId = await deps.sessionStore.read();
      if (!userId) return null;
      const user = await deps.users.findById(userId);
      return user ? toSessionUser(user) : null;
    },

    /** Déconnexion : purge SecureStore uniquement (les données restent en base). */
    async logout(): Promise<void> {
      await deps.sessionStore.clear();
    },

    /** Version publique du compte (sans hash) — pour l'écran Paramètres. */
    async getProfile(): Promise<PublicUser | null> {
      const session = await this.restoreSession();
      return session ? toPublicUser({ ...session, passwordHash: '', createdAt: 0 }) : null;
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
