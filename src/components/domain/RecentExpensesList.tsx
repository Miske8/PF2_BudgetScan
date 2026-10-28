/**
 * RecentExpensesList — dernières dépenses du dashboard (Étape 7).
 * Léger : pas de filtres ici (l'écran Dépenses s'en charge à l'étape 8).
 * Chaque ligne est tactile et mène vers le détail (route prévue étape 8) ;
 * en attendant, un tap ouvre la modale de détail si elle existe.
 */

import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Category, Expense } from '@/core/types/models';
import { theme, formatCurrencyCompact, formatDate } from '@/theme';

export interface RecentExpensesListProps {
  expenses: Expense[];
  /** Map id -> category pour badge couleur/icône. */
  categoriesById: Map<string, Category>;
  onPressExpense?: (expense: Expense) => void;
  testID?: string;
}

function RecentExpenseRow({
  expense,
  category,
  onPress,
}: {
  expense: Expense;
  category: Category | undefined;
  onPress?: () => void;
}) {
  const color = category?.color ?? theme.colors.textFaint;
  const icon = category?.icon ?? 'ellipse';

  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {expense.title}
        </Text>
        <Text style={styles.meta}>
          {category?.name ?? 'Sans catégorie'} · {formatDate(expense.date)}
        </Text>
      </View>
      <Text style={styles.amount}>{formatCurrencyCompact(expense.amount)}</Text>
      {onPress ? (
        <Ionicons name="chevron-forward" size={16} color={theme.colors.textFaint} />
      ) : null}
    </View>
  );
}

export function RecentExpensesList({
  expenses,
  categoriesById,
  onPressExpense,
  testID,
}: RecentExpensesListProps) {
  return (
    <FlatList
      testID={testID}
      data={expenses}
      keyExtractor={(item) => item.id}
      scrollEnabled={false}
      renderItem={({ item }) => (
        <RecentExpenseRow
          expense={item}
          category={categoriesById.get(item.categoryId)}
          onPress={onPressExpense ? () => onPressExpense(item) : undefined}
        />
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: 44, // zone tactile
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  title: { ...theme.typography.subtitle, color: theme.colors.text },
  meta: { ...theme.typography.caption, marginTop: 2 },
  amount: { ...theme.typography.subtitle, color: theme.colors.text },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border },
});
