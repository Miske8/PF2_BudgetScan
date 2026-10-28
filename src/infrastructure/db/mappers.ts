/**
 * Helpers communs aux repositories SQLite : mapping snake_case (lignes SQL)
 * <-> camelCase (modèles domain), génération d'ids et conversions sûres.
 */

import type { EpochMs, UUID } from '@/core/types/models';

/** UUID v4 sans dépendance externe (crypto.getRandomValues dispo via Hermes/Web). */
export function newId(): UUID {
  const bytes = new Uint8Array(16);
  const c = globalThis.crypto;
  if (c && typeof c.getRandomValues === 'function') {
    c.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6]! & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8]! & 0x3f) | 0x80; // variant
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function now(): EpochMs {
  return Date.now();
}

/** Ligne SQL -> valeur non nulle (colonnes NOT NULL). */
export function required<T>(value: T | null | undefined, column: string): T {
  if (value === null || value === undefined) {
    throw new Error(`Colonne requise manquante en base : "${column}"`);
  }
  return value;
}

/** Reconstruit un booléen stocké en INTEGER 0/1. */
export function toBool(value: number | null | undefined): boolean {
  return value === 1;
}

export function fromBool(value: boolean): 0 | 1 {
  return value ? 1 : 0;
}

/** Bornes epoch ms [début mois, début mois suivant) — fuseau local. */
export function monthRange(month: number, year: number): { start: number; end: number } {
  return {
    start: new Date(year, month - 1, 1, 0, 0, 0, 0).getTime(),
    end: new Date(year, month, 1, 0, 0, 0, 0).getTime(),
  };
}

/** Échappe LIKE %...% (%, _ et \ sont des méta-caractères SQLite). */
export function escapeLike(input: string): string {
  return input.replace(/[\\%_]/g, (c) => `\\${c}`);
}
