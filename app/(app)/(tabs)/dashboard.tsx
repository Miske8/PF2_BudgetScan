/**
 * DashboardScreen — tableau de bord BudgetScan (Étape 7).
 *
 * Composition :
 *  - Header avec action rapide (+ dépense)
 *  - BudgetSummaryCard : budget / dépensé / restant / progression / alerte
 *  - Card "Répartition" : CategoryPieChart (données locales SQLite)
 *  - Card "Dernières dépenses" : RecentExpensesList
 *
 * États gérés : loading (skeleton), error (message + réessai), empty.
 */

import React, { useCallback, useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, EmptyState, Header, SkeletonBlock } from '@/components/ui';
import { BudgetSummaryCard } from '@/components/domain/BudgetSummaryCard';
import { CategoryPieChart } from '@/components/domain/CategoryPieChart';
import { RecentExpensesList } from '@/components/domain/RecentExpensesList';
import { useDashboard } from '@/hooks/useDashboard';
import { useAuthContext } from '@/hooks/useAuthContext';
import { useAsync } from '@/hooks/useAsync';
import { categoryService, expenseService } from '@/services';
import type { Expense } from '@/core/types/models';
import { theme } from '@/theme';

const MONTH_NAMES = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
] as const;

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthContext();
  const { overview, breakdown, period, loading, error, refetch } = useDashboard();

  // Requêtes secondaires : catégories (mapping badges) + 5 dernières dépenses.
  const userId = user?.id ?? '';
  const categoriesQuery = useAsync(
    () => (userId ? categoryService.list(userId) : Promise.resolve([])),
    [userId],
  );
  const recentQuery = useAsync(
    () => (userId ? expenseService.list(userId, { limit: 5 }) : Promise.resolve([])),
    [userId],
  );

  const categoriesById = useMemo(
    () => new Map((categoriesQuery.data ?? []).map((c) => [c.id, c])),
    [categoriesQuery.data],
  );

  const periodLabel = `${MONTH_NAMES[period.month - 1]} ${period.year}`;

  const onPressExpense = useCallback((expense: Expense) => {
    router.push({ pathname: '/expenses/[id]', params: { id: expense.id } });
  }, []);

  const goToNewExpense = useCallback(() => router.push('/expenses/new'), []);
  const goToBudgets = useCallback(() => router.navigate('/(app)/(tabs)/budgets'), []);

  // --- État erreur -----------------------------------------------------------
  if (error) {
    return (
      <View style={styles.container}>
        <Header title="Tableau de bord" />
        <EmptyState
          icon="cloud-offline-outline"
          title="Impossible de charger vos données"
          message={error.message}
          actionLabel="Réessayer"
          onAction={refetch}
        />
      </View>
    );
  }

  const isInitialLoading = loading && !overview.global && overview.totalSpent === 0;

  return (
    <View style={styles.container}>
      <Header
        title={`Bonjour, ${(user?.name ?? '').split(' ')[0] || '!'}`}
        subtitle={periodLabel}
        actions={[{ icon: 'add-circle-outline', onPress: goToNewExpense, label: 'Ajouter une dépense' }]}
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + theme.spacing.xl }]}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refetch}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {isInitialLoading ? (
          <>
            <SkeletonBlock height={190} radius={theme.radius.lg} />
            <SkeletonBlock height={240} radius={theme.radius.lg} />
            <SkeletonBlock height={160} radius={theme.radius.lg} />
          </>
        ) : (
          <>
            {/* 1. Synthèse budgétaire */}
            <BudgetSummaryCard
              testID="dashboard-budget-card"
              overview={overview}
              periodLabel={periodLabel}
            />

            {/* CTA si aucun budget global défini ce mois */}
            {!overview.global ? (
              <Card onPress={goToBudgets} padded={false} testID="dashboard-set-budget">
                <View style={styles.inlineCtaInner}>
                  <Ionicons name="wallet-outline" size={22} color={theme.colors.primary} />
                  <Text style={styles.inlineCtaText}>Définir votre budget mensuel</Text>
                  <Ionicons name="chevron-forward" size={16} color={theme.colors.textFaint} />
                </View>
              </Card>
            ) : null}

            {/* 2. Répartition par catégorie */}
            <Card title="Répartition par catégorie" subtitle={periodLabel} testID="dashboard-pie">
              {breakdown.length === 0 ? (
                <EmptyState
                  icon="pie-chart-outline"
                  title="Aucune dépense ce mois"
                  message="Vos catégories apparaîtront ici dès la première dépense."
                  actionLabel="Ajouter une dépense"
                  onAction={goToNewExpense}
                  testID="dashboard-empty-month"
                />
              ) : (
                <CategoryPieChart data={breakdown} />
              )}
            </Card>

            {/* 3. Dernières dépenses */}
            <Card
              title="Dernières dépenses"
              right={<Text style={styles.seeAll}>Tout voir</Text>}
              onPress={() => router.navigate('/(app)/(tabs)/expenses')}
              testID="dashboard-recent"
            >
              {(recentQuery.data?.length ?? 0) > 0 ? (
                <RecentExpensesList
                  expenses={recentQuery.data ?? []}
                  categoriesById={categoriesById}
                  onPressExpense={onPressExpense}
                />
              ) : (
                <EmptyState
                  icon="receipt-outline"
                  title="Aucune dépense enregistrée"
                  message="Ajoutez votre première dépense manuellement ou scannez un ticket."
                  actionLabel="Scanner un ticket"
                  onAction={() => router.navigate('/(app)/(tabs)/scan')}
                  testID="dashboard-empty-all"
                />
              )}
            </Card>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.base, gap: theme.spacing.md },
  inlineCtaInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.md,
    minHeight: 48,
  },
  inlineCtaText: { ...theme.typography.subtitle, color: theme.colors.primary, flex: 1 },
  seeAll: { ...theme.typography.caption, color: theme.colors.primary },
});
