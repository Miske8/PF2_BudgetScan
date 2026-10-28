/**
 * Écran Dépenses (onglet) — historique filtrable.
 * - filtre période (mois glissant -> "Toutes les périodes")
 * - filtre catégorie (puces horizontales)
 * - recherche titre + note
 * - états : loading / error / vide / résultats
 */

import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, EmptyState, Header, Input, Loader } from '@/components/ui';
import { ExpenseListItem } from '@/components/domain/ExpenseListItem';
import { buildPeriodOptions, groupByDay, useExpenses } from '@/hooks/useExpenses';
import { formatCurrencyCompact, theme } from '@/theme';

const PERIOD_OPTIONS = buildPeriodOptions();

export default function ExpensesScreen() {
  const router = useRouter();
  const {
    expenses,
    categories,
    categoryById,
    total,
    loading,
    error,
    refetch,
    filters,
    setMonthYear,
    setCategoryId,
    setSearch,
    resetFilters,
    hasActiveFilter,
  } = useExpenses();

  const [refreshing, setRefreshing] = useState(false);
  const groups = useMemo(() => groupByDay(expenses), [expenses]);

  const periodValue = useMemo(() => {
    if (filters.month === undefined || filters.year === undefined) return '';
    const idx = PERIOD_OPTIONS.findIndex((o) => o.month === filters.month && o.year === filters.year);
    return idx >= 0 ? String(idx) : '';
  }, [filters.month, filters.year]);

  const onPeriodChange = useCallback(
    (raw: string) => {
      if (raw === '') {
        setMonthYear(undefined, undefined);
        return;
      }
      const option = PERIOD_OPTIONS[Number(raw)];
      if (option) setMonthYear(option.month, option.year);
    },
    [setMonthYear],
  );

  const currentPeriodLabel = PERIOD_OPTIONS.find(
    (o) => o.month === filters.month && o.year === filters.year,
  )?.label;

  return (
    <View style={styles.container}>
      <Header
        title="Dépenses"
        subtitle={currentPeriodLabel ?? 'Toutes les périodes'}
        actions={[{ icon: 'add', label: 'Ajouter une dépense', onPress: () => router.push('/expenses/new') }]}
      />

      {/* Recherche + période */}
      <View style={styles.filtersRow}>
        <Input
          placeholder="Rechercher…"
          testID="expenses-search"
          accessibilityLabel="Rechercher une dépense"
          containerStyle={styles.search}
          value={filters.search ?? ''}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        <PickerField
          value={periodValue}
          onChange={onPeriodChange}
          options={[
            ...PERIOD_OPTIONS.map((o, i) => ({ key: String(i), label: o.label })),
            { key: '', label: 'Tout' },
          ]}
          testID="expenses-period-filter"
        />
      </View>

      {/* Filtre catégorie */}
      {categories.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
          <FilterChip label="Toutes" selected={!filters.categoryId} onPress={() => setCategoryId(undefined)} />
          {categories.map((c) => (
            <FilterChip
              key={c.id}
              label={c.name}
              color={c.color}
              selected={filters.categoryId === c.id}
              onPress={() => setCategoryId(filters.categoryId === c.id ? undefined : c.id)}
            />
          ))}
        </ScrollView>
      ) : null}

      {/* Liste */}
      <View style={styles.listArea}>
        {loading && expenses.length === 0 ? (
          <Loader text="Chargement des dépenses…" />
        ) : error ? (
          <EmptyState
            title="Impossible de charger les dépenses"
            message={error.message}
            icon="cloud-offline-outline"
            actionLabel="Réessayer"
            onAction={refetch}
          />
        ) : expenses.length === 0 ? (
          <EmptyState
            title={hasActiveFilter ? 'Aucun résultat' : "Aucune dépense pour l'instant"}
            message={
              hasActiveFilter
                ? "Essayez d'élargir la période ou de retirer des filtres."
                : 'Ajoutez votre première dépense, ou scannez un ticket de caisse.'
            }
            icon="receipt-outline"
            actionLabel={hasActiveFilter ? 'Réinitialiser les filtres' : 'Ajouter une dépense'}
            onAction={hasActiveFilter ? resetFilters : () => router.push('/expenses/new')}
          />
        ) : (
          <>
            <View style={styles.totalBar}>
              <Text style={styles.totalCount}>
                {expenses.length} dépense{expenses.length > 1 ? 's' : ''}
              </Text>
              <Text style={styles.totalAmount}>{formatCurrencyCompact(total)}</Text>
            </View>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => {
                    setRefreshing(true);
                    refetch();
                    setTimeout(() => setRefreshing(false), 600);
                  }}
                />
              }
            >
              {groups.map((group) => (
                <View key={group.key} style={styles.group}>
                  <View style={styles.groupHeader}>
                    <Text style={styles.groupLabel}>{group.label}</Text>
                    <Text style={styles.groupTotal}>{formatCurrencyCompact(group.total)}</Text>
                  </View>
                  <Card style={styles.cardFlush} padded={false}>
                    {group.items.map((expense) => (
                      <ExpenseListItem
                        key={expense.id}
                        expense={expense}
                        category={categoryById.get(expense.categoryId)}
                        hideDate
                        testID={`expense-item-${expense.id}`}
                        onPress={() => router.push(`/expenses/${expense.id}`)}
                      />
                    ))}
                  </Card>
                </View>
              ))}
            </ScrollView>
          </>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Sous-composants locaux
// ---------------------------------------------------------------------------

interface PickerFieldProps {
  value: string;
  onChange: (v: string) => void;
  options: { key: string; label: string }[];
  testID?: string;
}

function PickerField({ value, onChange, options, testID }: PickerFieldProps) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.key === value);

  return (
    <View testID={testID}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityLabel="Filtrer par période"
        style={styles.pickerButton}
      >
        <Ionicons name="calendar-outline" size={16} color={theme.colors.textMuted} />
        <Text style={styles.pickerText} numberOfLines={1}>
          {current?.label ?? 'Période'}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={14} color={theme.colors.textMuted} />
      </Pressable>
      {open ? (
        <View style={styles.pickerSheet}>
          <ScrollView style={{ maxHeight: 260 }}>
            {options.map((option) => (
              <Pressable
                key={option.key || 'all'}
                onPress={() => {
                  onChange(option.key);
                  setOpen(false);
                }}
                accessibilityRole="button"
                style={styles.pickerItem}
              >
                <Text style={[styles.pickerItemText, option.key === value && styles.pickerItemActive]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

interface FilterChipProps {
  label: string;
  selected: boolean;
  color?: string;
  onPress: () => void;
}

function FilterChip({ label, selected, color, onPress }: FilterChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && { opacity: 0.85 }]}
    >
      {color ? <View style={[styles.chipDot, { backgroundColor: selected ? theme.colors.white : color }]} /> : null}
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  filtersRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'flex-start',
  },
  search: { flex: 1 },
  catRow: { gap: theme.spacing.sm, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  chipSelected: { backgroundColor: theme.colors.text, borderColor: theme.colors.text },
  chipDot: { width: 8, height: 8, borderRadius: theme.radius.pill },
  chipText: { fontSize: theme.fontSize.sm, fontWeight: '600', color: theme.colors.textMuted },
  chipTextSelected: { color: theme.colors.white },
  listArea: { flex: 1 },
  totalBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  totalCount: { ...theme.typography.caption, color: theme.colors.textMuted },
  totalAmount: { ...theme.typography.title, color: theme.colors.primary },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: theme.spacing.xxl },
  group: { marginBottom: theme.spacing.base },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xs,
  },
  groupLabel: { ...theme.typography.overline, color: theme.colors.textFaint, textTransform: 'capitalize' },
  groupTotal: { ...theme.typography.overline, color: theme.colors.textMuted },
  cardFlush: { marginHorizontal: theme.spacing.md, padding: 0, overflow: 'hidden' },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    maxWidth: 170,
  },
  pickerText: { fontSize: theme.fontSize.sm, color: theme.colors.text, flexShrink: 1 },
  pickerSheet: {
    position: 'absolute',
    zIndex: 10,
    top: 48,
    right: 0,
    width: 200,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.xs,
    ...theme.shadow.raised,
  },
  pickerItem: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, minHeight: 44 },
  pickerItemText: { fontSize: theme.fontSize.sm, color: theme.colors.textMuted },
  pickerItemActive: { color: theme.colors.primary, fontWeight: '700' },
});
