/**
 * Seed — catégories par défaut du système (user_id = NULL).
 * Exécuté après chaque migration ; INSERT OR IGNORE + UNIQUE(user_id, name)
 * rendent l'opération idempotente.
 */

import type { CategoryIconName } from '@/core/types/models';
import { getDatabase } from '../database';
import { newId, now } from '../mappers';

export interface DefaultCategorySeed {
  name: string;
  color: string;
  icon: CategoryIconName;
}

export const DEFAULT_CATEGORIES: DefaultCategorySeed[] = [
  { name: 'Alimentation', color: '#16A34A', icon: 'cart' },
  { name: 'Transport', color: '#2563EB', icon: 'car' },
  { name: 'Logement', color: '#7C3AED', icon: 'home' },
  { name: 'Loisirs', color: '#EA580C', icon: 'basketball' },
  { name: 'Santé', color: '#DC2626', icon: 'medkit' },
  { name: 'Shopping', color: '#DB2777', icon: 'shirt' },
  { name: 'Autres', color: '#64748B', icon: 'ellipse' },
];

export async function seedDefaultCategories(): Promise<void> {
  const db = await getDatabase();
  const createdAt = now();
  for (const category of DEFAULT_CATEGORIES) {
    await db.runAsync(
      `INSERT OR IGNORE INTO categories
         (id, user_id, name, color, icon, is_default, created_at)
       VALUES (?, NULL, ?, ?, ?, 1, ?)`,
      [newId(), category.name, category.color, category.icon, createdAt],
    );
  }
}
