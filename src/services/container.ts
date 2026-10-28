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
import { hashPassword, verifyPassword } from '@/infrastructure/secure/passwordHasher';
import { secureSessionStore } from '@/infrastructure/secure/sessionStore';
import { newId as uuid, now as epochNow } from '@/infrastructure/db/mappers';
import type { OcrService } from '@/core/ports/ocr';
import { createMockOcrService } from '@/infrastructure/ocr/mockOcrService';
import { createRemoteOcrService } from '@/infrastructure/ocr/remoteOcrService';
import { createAuthService } from './authService';

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

/** authService câblé avec les adapters locaux (hasher expo-crypto + SecureStore). */
export const authService = createAuthService({
  users: getRepositories().users,
  hasher: { hash: hashPassword, verify: verifyPassword },
  sessionStore: secureSessionStore,
  newId: uuid,
  now: epochNow,
});

// ---------------------------------------------------------------------------
// OCR — résolu à partir des variables d'environnement publiques.
// EXPO_PUBLIC_OCR_API_URL vide  → MockOcrService (simulation, hors ligne).
// EXPO_PUBLIC_OCR_API_URL rempli → RemoteOcrService (future API cloud).
// ---------------------------------------------------------------------------

let ocrService: OcrService | null = null;

export function resolveOcrService(): OcrService {
  if (!ocrService) {
    const apiUrl = process.env.EXPO_PUBLIC_OCR_API_URL?.trim();
    const apiKey = process.env.EXPO_PUBLIC_OCR_API_KEY?.trim();
    ocrService = apiUrl
      ? createRemoteOcrService({ baseUrl: apiUrl, apiKey: apiKey || undefined })
      : createMockOcrService();
  }
  return ocrService;
}

/** Forcer un moteur (tests, settings dev). Passer `null` → re-résolution via .env. */
export function setOcrService(service: OcrService | null): void {
  ocrService = service;
}

/** Réinitialise le graphe (tests / logout destructif / changement de backend). */
export function resetContainer(): void {
  repositories = null;
  ocrService = null;
}
