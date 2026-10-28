/**
 * Palette BudgetScan — sobre, moderne, orientée finance.
 * Vert = santé financière, rouge = dépassement, neutres ardoise pour le fond.
 */

export const palette = {
  // Marque
  primary: '#16A34A',
  primaryDark: '#0E7A38',
  primarySoft: '#DCFCE7',

  // Neutres
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F5F9',
  text: '#0B1220',
  textMuted: '#64748B',
  textFaint: '#94A3B8',
  border: '#E2E8F0',
  overlay: 'rgba(11, 18, 32, 0.45)',

  // Sémantique
  success: '#16A34A',
  successSoft: '#DCFCE7',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  info: '#2563EB',
  infoSoft: '#DBEAFE',

  // Blanc (texte sur fond coloré)
  white: '#FFFFFF',
} as const;

export type ColorToken = keyof typeof palette;

/** Couleurs par défaut des catégories (utilisées par le seed et le badge). */
export const categoryColors = [
  '#16A34A', // Alimentation
  '#2563EB', // Transport
  '#7C3AED', // Logement
  '#EA580C', // Loisirs
  '#DC2626', // Santé
  '#DB2777', // Shopping
  '#64748B', // Autres
] as const;
