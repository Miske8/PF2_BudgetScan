import React from 'react';
import { StyleSheet, Text, View, Pressable, ViewStyle, StyleProp } from 'react-native';
import { theme } from '@/theme';

export interface CardProps {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode; // action ou badge en tête de carte
  footer?: React.ReactNode;
  onPress?: () => void;
  padded?: boolean;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Conteneur surface blanche + ombre légère.
 * Si `onPress` est fourni, toute la carte devient tactile (>=44pt garanti par le contenu).
 */
export function Card({ title, subtitle, right, footer, onPress, padded = true, children, style, testID }: CardProps) {
  const inner = (
    <>
      {title || right ? (
        <View style={styles.header}>
          <View style={styles.headerText}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {right ? <View style={styles.right}>{right}</View> : null}
        </View>
      ) : null}
      {children}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        testID={testID}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.card, padded && styles.padded, pressed && styles.pressed, style]}
      >
        {inner}
      </Pressable>
    );
  }

  return (
    <View testID={testID} style={[styles.card, padded && styles.padded, style]}>
      {inner}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
  },
  padded: { padding: theme.spacing.base },
  pressed: { opacity: 0.9 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  headerText: { flex: 1 },
  title: { ...theme.typography.title, color: theme.colors.text },
  subtitle: { ...theme.typography.caption, color: theme.colors.textMuted, marginTop: 2 },
  right: { marginLeft: theme.spacing.sm },
  footer: { marginTop: theme.spacing.md },
});

export default Card;
