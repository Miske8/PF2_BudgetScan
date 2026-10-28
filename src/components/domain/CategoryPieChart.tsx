/**
 * CategoryPieChart — répartition des dépenses par catégorie (Étape 7).
 * Wrapper fin autour de Victory Native (VictoryPie déjà dans les deps via
 * react-native-svg). Gère lui-même l'état vide (< 1 € dépensé).
 *
 * NB : on passe par victory-native (déjà requis par chart-kit) pour éviter
 * la dépendance lourde victory-native seule ; voir package.json étape 2.
 */

import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { theme, formatCurrencyCompact, formatPercent } from '@/theme';
import { EmptyState } from '@/components/ui';
import type { CategoryBreakdownItem } from '@/services/statsService';

export interface CategoryPieChartProps {
  data: CategoryBreakdownItem[];
  testID?: string;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_SIZE = Math.min(SCREEN_WIDTH - theme.spacing.xl * 2 - theme.spacing.lg * 2, 200);

export function CategoryPieChart({ data, testID }: CategoryPieChartProps) {
  const chartData = useMemo(
    () =>
      data.map((item) => ({
        name: item.category.name,
        amount: item.total,
        color: item.category.color,
        legendFontColor: theme.colors.textMuted,
        legendFontSize: theme.fontSize.xs,
      })),
    [data],
  );

  if (data.length === 0) {
    return (
      <EmptyState
        icon="pie-chart-outline"
        title="Aucune dépense ce mois"
        message="Ajoutez une dépense ou scannez un ticket pour voir votre répartition."
      />
    );
  }

  return (
    <View testID={testID}>
      <PieChart
        data={chartData}
        width={CHART_SIZE + 60}
        height={CHART_SIZE}
        chartConfig={{ color: () => theme.colors.textMuted }}
        accessor="amount"
        backgroundColor="transparent"
        paddingLeft="0"
        absolute={false}
        hasLegend={false}
      />
      {/* Légende custom : % + montant, plus lisible que celle de chart-kit */}
      <View style={styles.legend}>
        {data.slice(0, 5).map((item) => (
          <View key={item.category.id} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: item.category.color }]} />
            <Text style={styles.legendName} numberOfLines={1}>
              {item.category.name}
            </Text>
            <Text style={styles.legendShare}>{formatPercent(item.share)}</Text>
            <Text style={styles.legendAmount}>{formatCurrencyCompact(item.total)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { gap: theme.spacing.xs, marginTop: theme.spacing.sm },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  dot: { width: 10, height: 10, borderRadius: theme.radius.pill },
  legendName: { fontSize: theme.fontSize.sm, color: theme.colors.text, flex: 1 },
  legendShare: { ...theme.typography.caption, width: 46, textAlign: 'right' },
  legendAmount: {
    ...theme.typography.caption,
    width: 80,
    textAlign: 'right',
    color: theme.colors.text,
    fontWeight: '600',
  },
});
