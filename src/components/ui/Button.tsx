import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { theme } from '@/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  iconLeft?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const HEIGHTS: Record<ButtonSize, number> = { sm: 36, md: 44, lg: 52 };
const FONT_SIZES: Record<ButtonSize, number> = { sm: theme.fontSize.sm, md: theme.fontSize.md, lg: theme.fontSize.lg };

/**
 * Bouton primaire de l'app.
 * - Taille tactile >= 44pt (accessibilité)
 * - Feedback visuel : opacité au press + spinner si `loading`
 * - `disabled` bloque le press ET change la palette.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  iconLeft,
  style,
  testID,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityLabel={label}
      testID={testID}
      onPress={onPress}
      disabled={isDisabled}
      hitSlop={8}
      style={({ pressed }) => [
        styles.base,
        { height: HEIGHTS[size], paddingHorizontal: size === 'sm' ? theme.spacing.md : theme.spacing.lg },
        variantStyles[variant],
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={contentColor(variant, true)} testID={testID ? `${testID}-spinner` : undefined} />
      ) : (
      <View style={styles.content}>
        {iconLeft ? <View style={styles.icon}>{iconLeft}</View> : null}
        <Text style={[styles.label, { fontSize: FONT_SIZES[size] }, { color: contentColor(variant, isDisabled) }]}>
          {label}
        </Text>
      </View>
      )}
    </Pressable>
  );
}

function contentColor(variant: ButtonVariant, disabled: boolean): string {
  if (disabled) return theme.colors.textFaint;
  switch (variant) {
    case 'primary':
    case 'danger':
      return theme.colors.white;
    case 'secondary':
      return theme.colors.primaryDark;
    case 'ghost':
      return theme.colors.text;
  }
}

const variantStyles: Record<ButtonVariant, ViewStyle> = {
  primary: { backgroundColor: theme.colors.primary },
  secondary: { backgroundColor: theme.colors.primarySoft },
  ghost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.border },
  danger: { backgroundColor: theme.colors.danger },
};

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: { alignSelf: 'stretch' },
  content: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  icon: { marginRight: theme.spacing.xs },
  label: { fontWeight: theme.fontFamily.semibold },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.55 },
});

export default Button;
