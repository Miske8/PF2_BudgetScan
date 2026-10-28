/**
 * BudgetSummaryCard — carte principale du dashboard (Étape 7).
 * Affiche : budget mensuel, total dépensé, reste, barre de progression,
 * alerte de dépassement. Reçue en props : purement présentationnelle.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Badge } from '@/components/ui';
import { theme, formatCurrencyCompact, formatPercent } from '@/theme';
import type { BudgetOverview } from '@/services';

export interface BudgetSummaryCardProps {
  overview: BudgetOverview;
  /** "octobre 2026" — libellé de période calculé par l'appelant. */
  periodLabel: string;
  testID?: string;
}

const clampRatio = (ratio: number): number => Math.max(0, Math.min(1, ratio));

export function BudgetSummaryCard({ overview, periodLabel, testID }: BudgetSummaryCardProps) {
  const { global, totalSpent, remaining, progress, overBudget } = overview;
  const hasBudget = global !== null;

  const barColor = !hasBudget
    ? theme.colors.border
    : overBudget
      ? theme.colors.danger
      : progress >= 0.8
        ? theme.colors.warning
        : theme.colors.primary;

  return (
    <Card testID={testID} style={styles.card}>
      {/* Solde restant — chiffre principal */}
      <View style={styles.heroRow}>
        <View style={styles.heroLeft}>
          <Text style={styles.heroLabel}>
            {hasBudget ? 'Budget restant' : 'Aucun budget défini'} · {periodLabel}
          </Text>
          <Text
            style={[
              styles.heroAmount,
              hasBudget && (overBudget ? styles.heroNegative : styles.heroPositive),
            ]}
          >
            {hasBudget ? formatCurrencyCompact(remaining) : '—'}
          </Text>
        </View>
        <Ionicons
          name={overBudget ? 'alert-circle' : 'wallet-outline'}
          size={34}
          color={overBudget ? theme.colors.danger : theme.colors.primary}
        />
      </View>

      {/* Barre de progression */}
      <View
        style={styles.track}
        accessibilityRole="progressbar"
        accessibilityLabel={
          hasBudget ? `${formatPercent(progress)} du budget mensuel dépensé` : undefined
        }
      >
        <View
          style={[
            styles.fill,
            { width: `${clampRatio(progress) * 100}%`, backgroundColor: barColor },
          ]}
        />
      </View>

      {/* Stats secondaires */}
      <View style={styles.statsRow}>
        <Stat label="Dépensé ce mois" value={formatCurrencyCompact(totalSpent)} />
        <View style={styles.statDivider} />
        <Stat label="Budget prévu" value={hasBudget ? formatCurrencyCompact(global.amount) : '—'} />
        {hasBudget ? (
          <Badge
            tone={overBudget ? 'danger' : progress >= 0.8 ? 'warning' : 'success'}
            label={overBudget ? 'Dépassé' : `${formatPercent(progress)} utilisé`}
            style={styles.badge}
          />
        ) : null}
      </View>

      {/* Alerte dépassement */}
      {overBudget ? (
        <View style={styles.alertBanner}>
          <Ionicons name="warning" size={16} color={theme.colors.danger} />
          <Text style={styles.alertText}>
            Vous avez dépassé votre budget de {formatCurrencyCompact(Math.abs(remaining))} ce mois.
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { ...theme.shadow.card },
  heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroLeft: { flex: 1 },
  heroLabel: { ...theme.typography.caption, marginBottom: theme.spacing.xs },
  heroAmount: { ...theme.typography.amount },
  heroPositive: { color: theme.colors.text },
  heroNegative: { color: theme.colors.danger },
  track: {
    height: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceAlt,
    marginVertical: theme.spacing.md,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: theme.radius.pill },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg },
  stat: {},
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: theme.colors.border,
  },
  statValue: { ...theme.typography.subtitle, color: theme.colors.text },
  statLabel: { ...theme.typography.caption, marginTop: 2 },
  badge: { marginLeft: 'auto' },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.dangerSoft,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  alertText: { ...theme.typography.caption, color: theme.colors.danger, flex: 1 },
});
