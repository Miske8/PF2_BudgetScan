/**
 * CategoryRepository — implémentation SQLite.
 */

import type { Category, CategoryIconName, NewCategoryInput } from '@/core/types/models';
import type { CategoryRepository } from '@/core/ports/repositories';
import { getDatabase } from '../database';
import { fromBool, newId, now, required, toBool } from '../mappers';

interface CategoryRow {
  id: string;
  user_id: string | null;
  name: string;
  color: string;
  icon: string;
  is_default: number;
  created_at: number;
}

function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    color: row.color,
    icon: required(row.icon, 'categories.icon') as CategoryIconName,
    isDefault: toBool(row.is_default),
    createdAt: row.created_at,
  };
}

export function createSqliteCategoryRepository(): CategoryRepository {
  return {
    async create(input: NewCategoryInput): Promise<Category> {
      const db = await getDatabase();
      const category: Category = {
        id: newId(),
        userId: input.userId,
        name: input.name,
        color: input.color,
        icon: input.icon,
        isDefault: false,
        createdAt: now(),
      };
      await db.runAsync(
        `INSERT INTO categories (id, user_id, name, color, icon, is_default, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          category.id,
          category.userId,
          category.name,
          category.color,
          category.icon,
          fromBool(category.isDefault),
          category.createdAt,
        ],
      );
      return category;
    },

    async findAllForUser(userId: string): Promise<Category[]> {
      const db = await getDatabase();
      // Catégories système (user_id IS NULL) + catégories personnalisées du user.
      const rows = await db.getAllAsync<CategoryRow>(
        `SELECT * FROM categories
         WHERE user_id IS NULL OR user_id = ?
         ORDER BY is_default DESC, name COLLATE NOCASE ASC`,
        userId,
      );
      return rows.map(toCategory);
    },

    async findById(id: string): Promise<Category | null> {
      const db = await getDatabase();
      const row = await db.getFirstAsync<CategoryRow>('SELECT * FROM categories WHERE id = ?', id);
      return row ? toCategory(row) : null;
    },

    async update(
      id: string,
      patch: Partial<Pick<Category, 'name' | 'color' | 'icon'>>,
    ): Promise<void> {
      const db = await getDatabase();
      if (patch.name !== undefined) {
        await db.runAsync('UPDATE categories SET name = ? WHERE id = ?', [patch.name, id]);
      }
      if (patch.color !== undefined) {
        await db.runAsync('UPDATE categories SET color = ? WHERE id = ?', [patch.color, id]);
      }
      if (patch.icon !== undefined) {
        await db.runAsync('UPDATE categories SET icon = ? WHERE id = ?', [patch.icon, id]);
      }
    },

    async remove(id: string): Promise<void> {
      const db = await getDatabase();
      await db.runAsync('DELETE FROM categories WHERE id = ?', id);
    },
  };
}
