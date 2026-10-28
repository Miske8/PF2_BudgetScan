import React from 'react';
import { StyleSheet, Text, View, StyleProp, ViewStyle } from 'react-native';
import { theme } from '@/theme';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'custom';

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  /** Fond personnalisé (ex : couleur de catégorie). Le texte reste blanc. */
  color?: string;
  dot?: boolean; // pastille de couleur devant le libellé
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Étiquette compacte : statut de budget, catégorie, filtre actif… */
export function Badge({ label, tone = 'neutral', color, dot = false, style, testID }: BadgeProps) {
  const customBg = color ? { backgroundColor: color } : undefined;
  const isCustom = Boolean(color);

  return (
    <View
      testID={testID}
      style={[styles.badge, toneStyles[tone], customBg, style]}
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      {dot && !isCustom ? <View style={[styles.dot, dotStyles[tone]]} /> : null}
      {dot && isCustom ? <View style={[styles.dot, { backgroundColor: theme.colors.white }]} /> : null}
      <Text style={[styles.label, isCustom ? styles.labelOnColor : toneTextStyles[tone]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs + 2,
    borderRadius: theme.radius.pill,
    gap: theme.spacing.xs,
  },
  label: { fontSize: theme.fontSize.xs, fontWeight: theme.fontFamily.semibold },
  labelOnColor: { color: theme.colors.white },
  dot: { width: 6, height: 6, borderRadius: 3 },
});

const toneStyles: Record<BadgeTone, ViewStyle> = {
  neutral: { backgroundColor: theme.colors.surfaceAlt },
  success: { backgroundColor: theme.colors.successSoft },
  warning: { backgroundColor: theme.colors.warningSoft },
  danger: { backgroundColor: theme.colors.dangerSoft },
  info: { backgroundColor: theme.colors.infoSoft },
  custom: { backgroundColor: theme.colors.surfaceAlt },
};

const toneTextStyles: Record<BadgeTone, { color: string }> = {
  neutral: { color: theme.colors.textMuted },
  success: { color: theme.colors.success },
  warning: { color: theme.colors.warning },
  danger: { color: theme.colors.danger },
  info: { color: theme.colors.info },
  custom: { color: theme.colors.textMuted },
};

const dotStyles: Record<BadgeTone, { backgroundColor: string }> = {
  neutral: { backgroundColor: theme.colors.textFaint },
  success: { backgroundColor: theme.colors.success },
  warning: { backgroundColor: theme.colors.warning },
  danger: { backgroundColor: theme.colors.danger },
  info: { backgroundColor: theme.colors.info },
  custom: { backgroundColor: theme.colors.textFaint },
};

export default Badge;
