/**
 * expenseService — Application Layer.
 * Applique les règles métier puis délègue au port ExpenseRepository.
 * L'UI passe TOUJOURS par ce service, jamais par le repository directement.
 */

import type {
  Expense,
  ExpenseFilter,
  NewExpenseInput,
} from '@/core/types/models';
import {
  assertHasCategory,
  assertNotFuture,
  assertPositiveAmount,
  normalizeExpenseFilter,
} from '@/core/rules/businessRules';
import { getRepositories } from './container';

export interface ExpenseService {
  list(userId: string, filter?: ExpenseFilter): Promise<Expense[]>;
  get(id: string): Promise<Expense | null>;
  create(input: NewExpenseInput): Promise<Expense>;
  update(id: string, patch: Partial<Omit<NewExpenseInput, 'userId'>>): Promise<Expense>;
  remove(id: string): Promise<void>;
  totalForPeriod(userId: string, month: number, year: number): Promise<number>;
  totalsByCategory(userId: string, month: number, year: number): Promise<Record<string, number>>;
  monthlyTotals(
    userId: string,
    lastMonths: number,
  ): Promise<Array<{ month: number; year: number; total: number }>>;
}

export function createExpenseService(): ExpenseService {
  const repo = () => getRepositories().expenses;

  return {
    async list(userId, filter) {
      return repo().findMany(userId, normalizeExpenseFilter(filter));
    },

    get(id) {
      return repo().findById(id);
    },

    async create(input) {
      assertPositiveAmount(input.amount);
      assertHasCategory(input.categoryId);
      assertNotFuture(input.date);
      return repo().create(input);
    },

    async update(id, patch) {
      if (patch.amount !== undefined) assertPositiveAmount(patch.amount);
      if (patch.categoryId !== undefined) assertHasCategory(patch.categoryId);
      if (patch.date !== undefined) assertNotFuture(patch.date);
      await repo().update(id, patch);
      const updated = await repo().findById(id);
      if (!updated) throw new Error(`Dépense ${id} introuvable après mise à jour.`);
      return updated;
    },

    remove(id) {
      return repo().remove(id);
    },

    totalForPeriod(userId, month, year) {
      return repo().sumTotal(userId, month, year);
    },

    totalsByCategory(userId, month, year) {
      return repo().sumByCategory(userId, month, year);
    },

    monthlyTotals(userId, lastMonths) {
      return repo().monthlyTotals(userId, lastMonths);
    },
  };
}
