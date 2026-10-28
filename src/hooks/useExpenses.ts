/**
 * useExpenses — état + données de l'écran Dépenses (liste, filtres, recherche).
 * L'UI ne parle jamais au repository : elle passe par expenseService.
 */

import { useCallback, useMemo, useState } from 'react';
import type { Category, Expense, ExpenseFilter } from '@/core/types/models';
import { currentPeriod } from '@/core/types/models';
import { categoryService, expenseService } from '@/services';
import { useAsync } from './useAsync';
import { useAuthContext } from './useAuthContext';

export interface PeriodOption {
  /** undefined = toutes les périodes. */
  month?: number;
  year: number;
  label: string;
}

const MONTH_LABELS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

/** Liste déroulante : mois courant -> décembre de l'année précédente. */
export function buildPeriodOptions(): PeriodOption[] {
  const now = new Date();
  const options: PeriodOption[] = [];
  for (let i = 0; i < 13; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push({
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      label: `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`,
    });
  }
  return options;
}

export function periodLabel(month: number, year: number): string {
  return `${MONTH_LABELS[month - 1] ?? String(month)} ${year}`;
}

export interface UseExpensesResult {
  expenses: Expense[];
  categories: Category[];
  categoryById: Map<string, Category>;
  total: number;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  filters: ExpenseFilter;
  setMonthYear: (month?: number, year?: number) => void;
  setCategoryId: (categoryId?: string) => void;
  setSearch: (search: string) => void;
  resetFilters: () => void;
  hasActiveFilter: boolean;
}

export function useExpenses(): UseExpensesResult {
  const { user } = useAuthContext();
  const userId = user?.id ?? '';

  const [filters, setFilters] = useState<ExpenseFilter>(() => ({ ...currentPeriod() }));
  const [search, setSearchState] = useState('');

  const merged: ExpenseFilter = useMemo(
    () => ({ ...filters, search: search.trim() || undefined }),
    [filters, search],
  );

  const listQuery = useAsync(() => {
    if (!userId) return Promise.resolve([] as Expense[]);
    return expenseService.list(userId, merged);
  }, [userId, merged.month, merged.year, merged.categoryId, merged.search]);

  const catsQuery = useAsync(() => {
    if (!userId) return Promise.resolve([] as Category[]);
    return categoryService.list(userId);
  }, [userId]);

  const expenses = listQuery.data ?? [];
  const categories = catsQuery.data ?? [];
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const total = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);

  const setMonthYear = useCallback((month?: number, year?: number) => {
    setFilters((f) => ({ ...f, month, year }));
  }, []);

  const setCategoryId = useCallback((categoryId?: string) => {
    setFilters((f) => {
      const next = { ...f };
      if (categoryId) next.categoryId = categoryId;
      else delete next.categoryId;
      return next;
    });
  }, []);

  const setSearch = useCallback((value: string) => setSearchState(value), []);

  const resetFilters = useCallback(() => {
    setFilters({ ...currentPeriod() });
    setSearchState('');
  }, []);

  const hasActiveFilter =
    merged.search !== undefined ||
    merged.categoryId !== undefined ||
    merged.month !== currentPeriod().month ||
    merged.year !== currentPeriod().year;

  return {
    expenses,
    categories,
    categoryById,
    total,
    loading: listQuery.loading || catsQuery.loading,
    error: listQuery.error ?? catsQuery.error,
    refetch: listQuery.refetch,
    filters: merged,
    setMonthYear,
    setCategoryId,
    setSearch,
    resetFilters,
    hasActiveFilter,
  };
}

// ---------------------------------------------------------------------------
// Regroupement par jour (historique) — fonction pure, testable unitairement.
// ---------------------------------------------------------------------------

export interface ExpenseDayGroup {
  key: string; // "2026-10-28"
  label: string; // "Aujourd'hui", "Hier", "lun. 27 oct."
  total: number;
  items: Expense[];
}

function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

export function groupByDay(expenses: Expense[]): ExpenseDayGroup[] {
  const groups = new Map<string, ExpenseDayGroup>();
  for (const expense of expenses) {
    const key = dayKey(expense.date);
    let group = groups.get(key);
    if (!group) {
      group = { key, label: dayLabel(expense.date), total: 0, items: [] };
      groups.set(key, group);
    }
    group.items.push(expense);
    group.total += expense.amount;
  }
  // Tri : jours du plus récent au plus ancien ; dépenses internes idem.
  return [...groups.values()].sort((a, b) => {
    if (a.key !== b.key) return a.key < b.key ? 1 : -1;
    return (b.items[0]?.date ?? 0) - (a.items[0]?.date ?? 0);
  });
}

function dayLabel(ts: number): string {
  const date = new Date(ts);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (dayKey(ts) === dayKey(today.getTime())) return "Aujourd'hui";
  if (dayKey(ts) === dayKey(yesterday.getTime())) return 'Hier';
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
}
