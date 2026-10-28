/**
 * statsService — Application Layer.
 * Agrège les données des repositories pour les écrans Dashboard et Stats.
 * (Séparé du budgetService pour garder un périmètre unique par service.)
 */

import type { Category, Expense } from '@/core/types/models';
import { getRepositories } from './container';

export interface CategoryBreakdownItem {
  category: Category;
  total: number;
  /** Part du total mensuel, 0..1. */
  share: number;
}

export interface MonthlyTrendPoint {
  month: number;
  year: number;
  total: number;
}

export interface StatsService {
  /** Répartition des dépenses du mois par catégorie (tri décroissant). */
  breakdownByCategory(
    userId: string,
    month: number,
    year: number,
  ): Promise<CategoryBreakdownItem[]>;
  /** Dernières dépenses du mois (dashboard). */
  recentExpenses(userId: string, limit?: number): Promise<Expense[]>;
  /** Totaux des N derniers mois d'activité (stats). */
  monthlyTrend(userId: string, lastMonths?: number): Promise<MonthlyTrendPoint[]>;
}

export function createStatsService(): StatsService {
  return {
    async breakdownByCategory(userId, month, year) {
      const [categories, totals] = await Promise.all([
        getRepositories().categories.findAllForUser(userId),
        getRepositories().expenses.sumByCategory(userId, month, year),
      ]);
      const grandTotal = Object.values(totals).reduce((sum, v) => sum + v, 0);
      const byId = new Map(categories.map((c) => [c.id, c]));

      return Object.entries(totals)
        .filter(([categoryId]) => byId.has(categoryId))
        .map(([categoryId, total]) => ({
          category: byId.get(categoryId)!,
          total,
          share: grandTotal > 0 ? total / grandTotal : 0,
        }))
        .sort((a, b) => b.total - a.total);
    },

    async recentExpenses(userId, limit = 5) {
      // Sans filtre de période : les toutes dernières dépenses, tous mois confondus.
      return getRepositories().expenses.findMany(userId, { limit });
    },

    async monthlyTrend(userId, lastMonths = 6) {
      return getRepositories().expenses.monthlyTotals(userId, lastMonths);
    },
  };
}
