/**
 * Échelle typographique.
 * System font uniquement : zéro dépendance de police, rendu natif impeccable.
 */

export const fontFamily = {
  regular: undefined, // police système
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  amount: 34, // montants clés du dashboard
} as const;

export const lineHeight = {
  tight: 1.2,
  normal: 1.45,
} as const;

export const typography = {
  display: {
    fontSize: fontSize.xxl,
    fontWeight: fontFamily.bold,
    lineHeight: Math.round(fontSize.xxl * lineHeight.tight),
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontFamily.semibold,
    lineHeight: Math.round(fontSize.lg * lineHeight.tight),
  },
  subtitle: {
    fontSize: fontSize.md,
    fontWeight: fontFamily.medium,
  },
  body: {
    fontSize: fontSize.md,
    fontWeight: fontFamily.regular,
    lineHeight: Math.round(fontSize.md * lineHeight.normal),
  },
  caption: {
    fontSize: fontSize.sm,
    fontWeight: fontFamily.regular,
    color: 'textMuted',
  } as const,
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontFamily.medium,
  },
  overline: {
    fontSize: fontSize.xs,
    fontWeight: fontFamily.semibold,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
  },
  amount: {
    fontSize: fontSize.amount,
    fontWeight: fontFamily.bold,
    letterSpacing: -0.5,
  },
} as const;
