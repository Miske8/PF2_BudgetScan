/**
 * Règles métier transverses (Domain Layer — sans dépendance technique).
 */

import type { ExpenseFilter } from '../types/models';

export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

/** Montant d'une dépense strictement positif. */
export function assertPositiveAmount(amount: number): void {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new DomainError('Le montant doit être un nombre strictement positif.');
  }
}

/** Une dépense doit toujours avoir une catégorie. */
export function assertHasCategory(categoryId: string | null | undefined): void {
  if (!categoryId) {
    throw new DomainError('Une dépense doit avoir une catégorie.');
  }
}

/** Date dans le passé ou aujourd'hui (pas de dépenses futures). */
export function assertNotFuture(dateMs: number): void {
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  if (dateMs > endOfToday.getTime()) {
    throw new DomainError('La date ne peut pas être dans le futur.');
  }
}

/** Normalise un filtre : month/year doivent arriver ensemble. */
export function normalizeExpenseFilter(filter?: ExpenseFilter): ExpenseFilter | undefined {
  if (!filter) return undefined;
  const hasMonth = filter.month !== undefined;
  const hasYear = filter.year !== undefined;
  if (hasMonth !== hasYear) {
    throw new DomainError('Un filtre par mois exige aussi une année.');
  }
  if (hasMonth && hasYear && (filter.month! < 1 || filter.month! > 12)) {
    throw new DomainError('Le mois doit être compris entre 1 et 12.');
  }
  return filter;
}
