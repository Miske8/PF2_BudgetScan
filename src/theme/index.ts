/**
 * Thème BudgetScan — fondations (Étape 2).
 * La version complète (typographie, spacing, composants) arrive à l'étape 3.
 */
export const colors = {
  primary: '#16A34A',
  primaryDark: '#0E7A38',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#0B1220',
  textMuted: '#64748B',
  border: '#E2E8F0',
  danger: '#DC2626',
  warning: '#D97706',
  success: '#16A34A',
} as const;

export type AppTheme = {
  colors: typeof colors;
};

export const theme: AppTheme = { colors };
