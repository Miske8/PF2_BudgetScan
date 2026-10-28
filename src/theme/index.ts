/**
 * Thème BudgetScan — point d'entrée unique.
 * Importer depuis '@/theme' partout dans l'app.
 */
import { palette, categoryColors } from './colors';
import { typography, fontSize, fontFamily, lineHeight } from './typography';
import { spacing, radius, shadow, touchTarget } from './spacing';

export const theme = {
  colors: palette,
  typography,
  fontSize,
  fontFamily,
  lineHeight,
  spacing,
  radius,
  shadow,
  touchTarget,
} as const;

export type AppTheme = typeof theme;

export { palette, categoryColors };
export * from './format';
export default theme;
