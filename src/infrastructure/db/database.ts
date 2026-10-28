/**
 * Connexion SQLite (expo-sqlite) — Infrastructure Layer.
 *
 * - Singleton : une seule connexion ouverte pour toute l'app.
 * - userVersion = gestion de migrations incrémentales (0 -> 1 -> ...).
 * - Les fichiers .sql sont importés en "raw" par Metro (ruleEngine: unstable,
 *   activé par défaut dans les projets SDK 50+). En cas de doute sur le
 *   bundler, le schéma est aussi disponible en constante TS (fallback).
 */

import * as SQLite from 'expo-sqlite';

/**
 * Les migrations sont définies en TypeScript (constantes SQL) plutôt qu'en
 * fichiers .sql importés : zéro dépendance au bundler, types stricts, et le
 * fichier de référence reste src/infrastructure/db/migrations/001_init.sql
 * (documenté + versionné à part).
 */
import { MIGRATION_001_INIT } from './migrations/001_init';

export const DB_NAME = 'budgetscan.db';

interface Migration {
  version: number;
  sql: string;
}

const MIGRATIONS: Migration[] = [{ version: 1, sql: MIGRATION_001_INIT }];

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let current = row?.user_version ?? 0;

  for (const migration of MIGRATIONS) {
    if (migration.version <= current) continue;
    await db.withTransactionAsync(async () => {
      await db.execAsync(migration.sql);
      // PRAGMA ne supporte pas les placeholders bindés -> interpolation d'un nombre sûr.
      await db.execAsync(`PRAGMA user_version = ${migration.version}`);
    });
    current = migration.version;
  }
}

/** Ouvre (ou retourne) la connexion partagée. Idempotent. */
export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await runMigrations(db);
      return db;
    })().catch((error: unknown) => {
      // Ne pas mettre en cache une ouverture échouée.
      dbPromise = null;
      throw error;
    });
  }
  return dbPromise;
}

/** Ferme la connexion (utile tests / reset complet). */
export async function closeDatabase(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise;
    await db.closeAsync();
    dbPromise = null;
  }
}
