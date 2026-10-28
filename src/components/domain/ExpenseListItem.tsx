/**
 * ExpenseListItem — ligne de dépense réutilisable.
 * Utilisé par : liste Dépenses (onglet), Dashboard (récentes), Recherche.
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Category, Expense } from '@/core/types/models';
import { formatCurrencyCompact, formatDate , theme } from '@/theme';

export interface ExpenseListItemProps {
  expense: Expense;
  category?: Category;
  onPress?: () => void;
  /** Masque la date (si le groupe parent l'affiche déjà). */
  hideDate?: boolean;
  testID?: string;
}

export function ExpenseListItem({ expense, category, onPress, hideDate, testID }: ExpenseListItemProps) {
  const color = category?.color ?? theme.colors.textFaint;
  const icon = category?.icon ?? 'ellipse';

  return (
    <TouchableOpacity
      testID={testID}
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.6}
      accessibilityRole="button"
      accessibilityLabel={`${expense.title}, ${formatCurrencyCompact(expense.amount)}, ${
        category?.name ?? 'sans catégorie'
      }`}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${color}22` }]}>
        <Ionicons name={icon as never} size={18} color={color} />
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {expense.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {category?.name ?? 'Catégorie supprimée'}
          {hideDate ? '' : ` · ${formatDate(expense.date)}`}
        </Text>
      </View>

      <Text style={styles.amount}>{formatCurrencyCompact(expense.amount)}</Text>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.textFaint} style={styles.chevron} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: theme.touchTarget,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  info: { flex: 1, marginRight: theme.spacing.sm },
  title: { ...theme.typography.body, fontWeight: '600', color: theme.colors.text },
  meta: { ...theme.typography.caption, color: theme.colors.textMuted, marginTop: 2 },
  amount: { ...theme.typography.body, fontWeight: '700', color: theme.colors.text },
  chevron: { marginLeft: theme.spacing.xs },
});
