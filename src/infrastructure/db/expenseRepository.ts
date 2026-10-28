/**
 * ExpenseRepository — implémentation SQLite.
 * Inclut les agrégats nécessaires au dashboard et aux statistiques
 * (somme par catégorie, total mois, tendances mensuelles) en SQL pur.
 */

import type {
  Expense,
  ExpenseFilter,
  NewExpenseInput,
} from '@/core/types/models';
import type { ExpenseRepository } from '@/core/ports/repositories';
import { getDatabase } from '../database';
import { escapeLike, monthRange, newId, now } from '../mappers';

interface ExpenseRow {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  date: number;
  category_id: string;
  note: string | null;
  receipt_image_uri: string | null;
  ticket_id: string | null;
  created_at: number;
  updated_at: number;
}

function toExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    amount: row.amount,
    date: row.date,
    categoryId: row.category_id,
    note: row.note,
    receiptImageUri: row.receipt_image_uri,
    ticketId: row.ticket_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createSqliteExpenseRepository(): ExpenseRepository {
  return {
    async create(input: NewExpenseInput): Promise<Expense> {
      const db = await getDatabase();
      const timestamp = now();
      const expense: Expense = {
        id: newId(),
        userId: input.userId,
        title: input.title,
        amount: input.amount,
        date: input.date,
        categoryId: input.categoryId,
        note: input.note ?? null,
        receiptImageUri: input.receiptImageUri ?? null,
        ticketId: input.ticketId ?? null,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      await db.runAsync(
        `INSERT INTO expenses
           (id, user_id, title, amount, date, category_id, note, receipt_image_uri, ticket_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          expense.id,
          expense.userId,
          expense.title,
          expense.amount,
          expense.date,
          expense.categoryId,
          expense.note,
          expense.receiptImageUri,
          expense.ticketId,
          expense.createdAt,
          expense.updatedAt,
        ],
      );
      return expense;
    },

    async findById(id: string): Promise<Expense | null> {
      const db = await getDatabase();
      const row = await db.getFirstAsync<ExpenseRow>('SELECT * FROM expenses WHERE id = ?', id);
      return row ? toExpense(row) : null;
    },

    async findMany(userId: string, filter?: ExpenseFilter): Promise<Expense[]> {
      const db = await getDatabase();
      const clauses: string[] = ['user_id = ?'];
      const params: (string | number)[] = [userId];

      if (filter?.month !== undefined && filter?.year !== undefined) {
        const { start, end } = monthRange(filter.month, filter.year);
        clauses.push('date >= ? AND date < ?');
        params.push(start, end);
      }
      if (filter?.categoryId) {
        clauses.push('category_id = ?');
        params.push(filter.categoryId);
      }
      if (filter?.search?.trim()) {
        clauses.push(`(title LIKE ? ESCAPE '\\' OR note LIKE ? ESCAPE '\\')`);
        const like = `%${escapeLike(filter.search.trim().toLowerCase())}%`;
        params.push(like, like);
      }

      let sql = `SELECT * FROM expenses WHERE ${clauses.join(' AND ')} ORDER BY date DESC, created_at DESC`;
      if (filter?.limit !== undefined) {
        sql += ' LIMIT ?';
        params.push(filter.limit);
      }
      const rows = await db.getAllAsync<ExpenseRow>(sql, params);
      return rows.map(toExpense);
    },

    async update(id: string, patch: Partial<Omit<NewExpenseInput, 'userId'>>): Promise<void> {
      const db = await getDatabase();
      const sets: string[] = [];
      const params: (string | number | null)[] = [];

      const add = (column: string, value: string | number | null) => {
        sets.push(`${column} = ?`);
        params.push(value);
      };
      if (patch.title !== undefined) add('title', patch.title);
      if (patch.amount !== undefined) add('amount', patch.amount);
      if (patch.date !== undefined) add('date', patch.date);
      if (patch.categoryId !== undefined) add('category_id', patch.categoryId);
      if (patch.note !== undefined) add('note', patch.note);
      if (patch.receiptImageUri !== undefined) add('receipt_image_uri', patch.receiptImageUri);
      if (patch.ticketId !== undefined) add('ticket_id', patch.ticketId);

      if (sets.length === 0) return;
      params.push(now(), id);
      await db.runAsync(
        `UPDATE expenses SET ${sets.join(', ')}, updated_at = ? WHERE id = ?`,
        params,
      );
    },

    async remove(id: string): Promise<void> {
      const db = await getDatabase();
      await db.runAsync('DELETE FROM expenses WHERE id = ?', id);
    },

    async sumByCategory(
      userId: string,
      month: number,
      year: number,
    ): Promise<Record<string, number>> {
      const db = await getDatabase();
      const { start, end } = monthRange(month, year);
      const rows = await db.getAllAsync<{ category_id: string; total: number }>(
        `SELECT category_id, SUM(amount) AS total
         FROM expenses
         WHERE user_id = ? AND date >= ? AND date < ?
         GROUP BY category_id`,
        [userId, start, end],
      );
      const result: Record<string, number> = {};
      for (const row of rows) result[row.category_id] = row.total;
      return result;
    },

    async sumTotal(userId: string, month: number, year: number): Promise<number> {
      const db = await getDatabase();
      const { start, end } = monthRange(month, year);
      const row = await db.getFirstAsync<{ total: number | null }>(
        `SELECT SUM(amount) AS total FROM expenses
         WHERE user_id = ? AND date >= ? AND date < ?`,
        [userId, start, end],
      );
      return row?.total ?? 0;
    },

    async monthlyTotals(
      userId: string,
      lastMonths: number,
    ): Promise<Array<{ month: number; year: number; total: number }>> {
      const db = await getDatabase();
      // Agrégat par période locale via strftime sur date (epoch ms -> jours).
      const rows = await db.getAllAsync<{ m: number; y: number; total: number }>(
        `SELECT CAST(strftime('%m', date / 1000, 'unixepoch', 'localtime') AS INTEGER) AS m,
                CAST(strftime('%Y', date / 1000, 'unixepoch', 'localtime') AS INTEGER) AS y,
                SUM(amount) AS total
         FROM expenses
         WHERE user_id = ?
         GROUP BY y, m
         ORDER BY y DESC, m DESC
         LIMIT ?`,
        [userId, lastMonths],
      );
      return rows.map((r) => ({ month: r.m, year: r.y, total: r.total })).reverse();
    },
  };
}
