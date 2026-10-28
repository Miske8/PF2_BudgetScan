import React, { forwardRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  TextInputProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { theme } from '@/theme';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  /** Affiche un œil pour basculer secureTextEntry (mot de passe). */
  toggleSecure?: boolean;
  prefix?: string; // ex : "€"
  containerStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Champ de saisie avec label, message d'erreur et bordure focus.
 * Compatible react-hook-form via `ref` (forwardRef sur TextInput natif).
 */
export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, hint, toggleSecure, prefix, containerStyle, testID, secureTextEntry, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(Boolean(secureTextEntry));

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.field,
          focused && styles.fieldFocused,
          error ? styles.fieldError : null,
        ]}
      >
        {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
        <TextInput
          ref={ref}
          testID={testID}
          style={styles.input}
          placeholderTextColor={theme.colors.textFaint}
          secureTextEntry={hidden}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          accessibilityLabel={label ?? rest.placeholder}
          {...rest}
        />
        {toggleSecure ? (
          <TouchableOpacity
            onPress={() => setHidden((h) => !h)}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Afficher le mot de passe' : 'Masquer le mot de passe'}
            hitSlop={10}
            style={styles.trailing}
          >
            <Text style={styles.eye}>{hidden ? '👁' : '🙈'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { marginBottom: theme.spacing.base },
  label: {
    ...theme.typography.label,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: theme.touchTarget,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
  },
  fieldFocused: { borderColor: theme.colors.primary },
  fieldError: { borderColor: theme.colors.danger },
  input: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    paddingVertical: theme.spacing.md,
  },
  prefix: { color: theme.colors.textMuted, marginRight: theme.spacing.xs, fontSize: theme.fontSize.md },
  trailing: { paddingLeft: theme.spacing.xs },
  eye: { fontSize: theme.fontSize.md },
  error: { color: theme.colors.danger, fontSize: theme.fontSize.xs, marginTop: theme.spacing.xs },
  hint: { color: theme.colors.textMuted, fontSize: theme.fontSize.xs, marginTop: theme.spacing.xs },
});

export default Input;
