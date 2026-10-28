/**
 * budgetService — Application Layer.
 * Règle clé : un budget global est UNIQUE par (user, mois, année) — garanti
 * côté SQL ; ici on expose un upsert simple + le calcul fiable du reste.
 */

import type { Budget, NewBudgetInput } from '@/core/types/models';
import { assertPositiveAmount } from '@/core/rules/businessRules';
import { getRepositories } from './container';

export interface BudgetOverview {
  month: number;
  year: number;
  /** Budget global du mois (null = non défini). */
  global: Budget | null;
  totalSpent: number;
  /** global.amount - totalSpent (négatif si dépassement). */
  remaining: number;
  /** 0..1+ (ratio dépensé / budget global). */
  progress: number;
  overBudget: boolean;
  byCategory: Array<{
    budget: Budget;
    spent: number;
    remaining: number;
    progress: number;
  }>;
}

export interface BudgetService {
  setGlobal(userId: string, month: number, year: number, amount: number): Promise<Budget>;
  setForCategory(
    userId: string,
    categoryId: string,
    month: number,
    year: number,
    amount: number,
  ): Promise<Budget>;
  overview(userId: string, month: number, year: number): Promise<BudgetOverview>;
  remove(id: string): Promise<void>;
}

export function createBudgetService(): BudgetService {
  const budgets = () => getRepositories().budgets;
  const expenses = () => getRepositories().expenses;

  async function upsert(input: NewBudgetInput): Promise<Budget> {
    assertPositiveAmount(input.amount);
    return budgets().upsert(input);
  }

  return {
    setGlobal(userId, month, year, amount) {
      return upsert({ userId, categoryId: null, month, year, amount });
    },

    setForCategory(userId, categoryId, month, year, amount) {
      return upsert({ userId, categoryId, month, year, amount });
    },

    async overview(userId, month, year) {
      const [global, allPeriod, totalSpent, spentByCategory] = await Promise.all([
        budgets().findGlobal(userId, month, year),
        budgets().findAllForPeriod(userId, month, year),
        expenses().sumTotal(userId, month, year),
        expenses().sumByCategory(userId, month, year),
      ]);

      const remaining = (global?.amount ?? 0) - totalSpent;
      const progress = global && global.amount > 0 ? totalSpent / global.amount : 0;

      const byCategory = allPeriod
        .filter((b): b is Budget & { categoryId: string } => b.categoryId !== null)
        .map((budget) => {
          const spent = spentByCategory[budget.categoryId] ?? 0;
          return {
            budget,
            spent,
            remaining: budget.amount - spent,
            progress: budget.amount > 0 ? spent / budget.amount : 0,
          };
        });

      return {
        month,
        year,
        global,
        totalSpent,
        remaining,
        progress,
        overBudget: global !== null && remaining < 0,
        byCategory,
      };
    },

    remove(id) {
      return budgets().remove(id);
    },
  };
}
