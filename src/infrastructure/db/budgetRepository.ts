/**
 * BudgetRepository — implémentation SQLite.
 * Règle d'unicité (user, category, month, year) garantie par le schéma ;
 * upsert() s'appuie sur ON CONFLICT DO UPDATE.
 */

import type { Budget, NewBudgetInput } from '@/core/types/models';
import type { BudgetRepository } from '@/core/ports/repositories';
import { getDatabase } from '../database';
import { newId, now } from '../mappers';

interface BudgetRow {
  id: string;
  user_id: string;
  category_id: string | null;
  month: number;
  year: number;
  amount: number;
  created_at: number;
  updated_at: number;
}

function toBudget(row: BudgetRow): Budget {
  return {
    id: row.id,
    userId: row.user_id,
    categoryId: row.category_id,
    month: row.month,
    year: row.year,
    amount: row.amount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createSqliteBudgetRepository(): BudgetRepository {
  return {
    async upsert(input: NewBudgetInput): Promise<Budget> {
      const db = await getDatabase();
      const timestamp = now();
      // ON CONFLICT avec colonne nullable : la cible UNIQUE inclut category_id.
      await db.runAsync(
        `INSERT INTO budgets (id, user_id, category_id, month, year, amount, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (user_id, category_id, month, year)
         DO UPDATE SET amount = excluded.amount, updated_at = excluded.updated_at`,
        [
          newId(),
          input.userId,
          input.categoryId,
          input.month,
          input.year,
          input.amount,
          timestamp,
          timestamp,
        ],
      );
      const row = await db.getFirstAsync<BudgetRow>(
        `SELECT * FROM budgets
         WHERE user_id = ? AND month = ? AND year = ?
           AND ((? IS NULL AND category_id IS NULL) OR category_id = ?)`,
        [input.userId, input.month, input.year, input.categoryId, input.categoryId],
      );
      if (!row) throw new Error('Budget introuvable après upsert (conflit inattendu).');
      return toBudget(row);
    },

    async findGlobal(userId: string, month: number, year: number): Promise<Budget | null> {
      const db = await getDatabase();
      const row = await db.getFirstAsync<BudgetRow>(
        `SELECT * FROM budgets
         WHERE user_id = ? AND category_id IS NULL AND month = ? AND year = ?`,
        [userId, month, year],
      );
      return row ? toBudget(row) : null;
    },

    async findByCategory(
      userId: string,
      categoryId: string,
      month: number,
      year: number,
    ): Promise<Budget | null> {
      const db = await getDatabase();
      const row = await db.getFirstAsync<BudgetRow>(
        `SELECT * FROM budgets
         WHERE user_id = ? AND category_id = ? AND month = ? AND year = ?`,
        [userId, categoryId, month, year],
      );
      return row ? toBudget(row) : null;
    },

    async findAllForPeriod(userId: string, month: number, year: number): Promise<Budget[]> {
      const db = await getDatabase();
      const rows = await db.getAllAsync<BudgetRow>(
        `SELECT * FROM budgets WHERE user_id = ? AND month = ? AND year = ?
         ORDER BY category_id IS NOT NULL, updated_at DESC`,
        [userId, month, year],
      );
      return rows.map(toBudget);
    },

    async remove(id: string): Promise<void> {
      const db = await getDatabase();
      await db.runAsync('DELETE FROM budgets WHERE id = ?', id);
    },
  };
}
