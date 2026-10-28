/**
 * useDashboard — hook de vue dédié au tableau de bord (Étape 7).
 *
 * Orchestration :
 *  - lit la période courante (mois/année) via `currentPeriod()`
 *  - agrège budgetService.overview() + statsService.breakdownByCategory()
 *    en parallèle (Promise.all) → un seul état loading/error pour l'écran
 *  - expose refetch() après une mutation (ajout/suppression de dépense).
 *
 * L'écran ne connaît QUE ce hook : ni les services, ni SQLite.
 */

import { useCallback, useMemo } from 'react';
import { useAuthContext } from '@/hooks/useAuthContext';
import { useAsync } from '@/hooks/useAsync';
import { budgetService, statsService } from '@/services';
import type { BudgetOverview } from '@/services';
import type { CategoryBreakdownItem } from '@/services/statsService';

export interface DashboardData {
  overview: BudgetOverview;
  breakdown: CategoryBreakdownItem[];
}

export interface CurrentPeriod {
  month: number; // 1-12
  year: number;
}

/** Période du jour — extraite pour rester testable et mockable. */
export function currentPeriod(now: Date = new Date()): CurrentPeriod {
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export interface UseDashboardResult extends DashboardData {
  period: CurrentPeriod;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useDashboard(): UseDashboardResult {
  const { user } = useAuthContext();
  const period = useMemo(() => currentPeriod(), []);

  const fetcher = useCallback(async (): Promise<DashboardData> => {
    if (!user) throw new Error('Session expirée, reconnectez-vous.');
    const [overview, breakdown] = await Promise.all([
      budgetService.overview(user.id, period.month, period.year),
      statsService.breakdownByCategory(user.id, period.month, period.year),
    ]);
    return { overview, breakdown };
  }, [user, period]);

  const { data, loading, error, refetch } = useAsync<DashboardData>(fetcher, [fetcher]);


  return {
    period,
    overview: data?.overview ?? EMPTY_OVERVIEW(period),
    breakdown: data?.breakdown ?? [],
    loading,
    error,
    refetch,
  };
}

/** Valeur neutre pendant le chargement (évite les `?.` dans le JSX). */
function EMPTY_OVERVIEW(period: CurrentPeriod): BudgetOverview {
  return {
    month: period.month,
    year: period.year,
    global: null,
    totalSpent: 0,
    remaining: 0,
    progress: 0,
    overBudget: false,
    byCategory: [],
  };
}
