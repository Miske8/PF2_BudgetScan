/**
 * Barrel Application Layer — instances de services prêtes à l'emploi.
 * Les écrans importent d'ici ; la composition (SQLite vs futur HTTP) reste
 * confinée dans container.ts.
 */

import { createBudgetService } from './budgetService';
import { createCategoryService } from './categoryService';
import { createExpenseService } from './expenseService';
import { createStatsService } from './statsService';

export const expenseService = createExpenseService();
export const categoryService = createCategoryService();
export const budgetService = createBudgetService();
export const statsService = createStatsService();

export { getRepositories, resetContainer, authService } from './container';
export type { AuthService } from './authService';
export type { BudgetOverview } from './budgetService';
export type { CategoryBreakdownItem, MonthlyTrendPoint } from './statsService';
export { SELECTABLE_ICONS } from './categoryService';
