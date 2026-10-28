/**
 * Container d'injection de dépendances — racine de composition de l'app.
 *
 * C'est LE seul fichier qui connaît les implémentations concrètes
 * (SQLite, Mock OCR, futurs adapters HTTP). Services et écrans ne
 * dépendent que des ports (interfaces).
 *
 * Pour brancher une API distante plus tard :
 *   1. créer createHttpExpenseRepository(baseUrl, token) dans infrastructure/http/
 *   2. remplacer ci-dessous le factory SQLite par le factory HTTP
 *   3. aucun autre fichier de l'app à modifier.
 */

import type { Repositories } from '@/core/ports/repositories';
import {
  createSqliteBudgetRepository,
  createSqliteCategoryRepository,
  createSqliteExpenseRepository,
  createSqliteScannedTicketRepository,
  createSqliteUserRepository,
} from '@/infrastructure/db';

let repositories: Repositories | null = null;

export function getRepositories(): Repositories {
  if (!repositories) {
    repositories = {
      users: createSqliteUserRepository(),
      categories: createSqliteCategoryRepository(),
      budgets: createSqliteBudgetRepository(),
      expenses: createSqliteExpenseRepository(),
      tickets: createSqliteScannedTicketRepository(),
    };
  }
  return repositories;
}

/** Réinitialise le graphe (tests / logout destructif / changement de backend). */
export function resetContainer(): void {
  repositories = null;
}
