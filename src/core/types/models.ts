/**
 * Modèle de données BudgetScan — Domain Layer.
 * Ces types sont la source de vérité partagée entre :
 *  - les repositories (src/infrastructure/db)
 *  - les services (src/services)
 *  - l'UI et les schémas Zod (src/core/schemas)
 *
 * Un futur backend REST renverra exactement ces formes (camelCase),
 * ce qui rend le remplacement SQLite -> API transparent pour l'UI.
 */

export type UUID = string;
/** Timestamp epoch en millisecondes. */
export type EpochMs = number;

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

export interface User {
  id: UUID;
  name: string;
  email: string;
  /** Hash local (sha256(salt + mot de passe)). Ne quitte JAMAIS la couche infra. */
  passwordHash: string;
  createdAt: EpochMs;
}

/** Version sûre du user exposée aux écrans (sans hash). */
export type PublicUser = Omit<User, 'passwordHash'>;

// ---------------------------------------------------------------------------
// Category
// ---------------------------------------------------------------------------

/** Noms des icônes Ionicons utilisés par le badge de catégorie. */
export type CategoryIconName =
  | 'cart'
  | 'car'
  | 'home'
  | 'basketball'
  | 'medkit'
  | 'shirt'
  | 'ellipse';

export interface Category {
  id: UUID;
  /** null = catégorie système disponible pour tous les utilisateurs. */
  userId: UUID | null;
  name: string;
  /** Couleur hex, ex. '#16A34A'. */
  color: string;
  icon: CategoryIconName;
  isDefault: boolean;
  createdAt: EpochMs;
}

export interface NewCategoryInput {
  userId: UUID | null;
  name: string;
  color: string;
  icon: CategoryIconName;
}

// ---------------------------------------------------------------------------
// Budget
// ---------------------------------------------------------------------------

/** Période budgétaire : mois 1-12 + année. */
export interface BudgetPeriod {
  month: number;
  year: number;
}

export interface Budget {
  id: UUID;
  userId: UUID;
  /** null = budget mensuel GLOBAL ; sinon budget dédié à une catégorie. */
  categoryId: UUID | null;
  month: number;
  year: number;
  amount: number;
  createdAt: EpochMs;
  updatedAt: EpochMs;
}

export interface NewBudgetInput extends BudgetPeriod {
  userId: UUID;
  categoryId: UUID | null;
  amount: number;
}

// ---------------------------------------------------------------------------
// Expense
// ---------------------------------------------------------------------------

export interface Expense {
  id: UUID;
  userId: UUID;
  title: string;
  /** Strictement positif (garanti par règle métier + CHECK SQL). */
  amount: number;
  date: EpochMs;
  categoryId: UUID;
  note: string | null;
  receiptImageUri: string | null;
  /** Lien de traçabilité vers le ticket scanné d'origine, si applicable. */
  ticketId: UUID | null;
  createdAt: EpochMs;
  updatedAt: EpochMs;
}

export interface NewExpenseInput {
  userId: UUID;
  title: string;
  amount: number;
  date: EpochMs;
  categoryId: UUID;
  note?: string | null;
  receiptImageUri?: string | null;
  ticketId?: UUID | null;
}

/** Filtre de liste / historique. Tous les champs optionnels = sans filtre. */
export interface ExpenseFilter extends Partial<BudgetPeriod> {
  categoryId?: UUID | null;
  /** Recherche insensible à la casse sur titre + note. */
  search?: string;
  limit?: number;
}

// ---------------------------------------------------------------------------
// ScannedTicket
// ---------------------------------------------------------------------------

export interface ScannedTicket {
  id: UUID;
  userId: UUID;
  imageUri: string;
  extractedAmount: number | null;
  extractedDate: EpochMs | null;
  rawText: string | null;
  createdAt: EpochMs;
}

export interface NewScannedTicketInput {
  userId: UUID;
  imageUri: string;
  extractedAmount?: number | null;
  extractedDate?: EpochMs | null;
  rawText?: string | null;
}

// ---------------------------------------------------------------------------
// Utilitaires période (partagés UI + services)
// ---------------------------------------------------------------------------

/** Clé stable "YYYY-MM" pour regrouper/indexer côté mémoire. */
export function periodKey(month: number, year: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function currentPeriod(): BudgetPeriod {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}
