import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';

export interface HeaderAction {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  label: string; // accessibilité
}

export interface HeaderProps {
  title: string;
  subtitle?: string;
  /** Affiche une flèche retour si fourni (sinon auto via router.canGoBack()). */
  onBack?: () => void;
  actions?: HeaderAction[];
  transparent?: boolean;
}

/**
 * En-tête de page : titre + option retour + actions à droite.
 * Respecte la safe area (encoche iOS / status bar Android).
 */
export function Header({ title, subtitle, onBack, actions = [], transparent }: HeaderProps) {
  const insets = useSafeAreaInsets();
  const showBack = onBack ?? router.canGoBack();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + theme.spacing.sm },
        transparent ? styles.transparent : styles.solid,
      ]}
    >
      <View style={styles.row}>
        <View style={styles.left}>
          {showBack ? (
            <TouchableOpacity
              onPress={onBack ?? (() => router.back())}
              accessibilityRole="button"
              accessibilityLabel="Retour"
              hitSlop={12}
              style={styles.iconButton}
            >
              <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={styles.titleWrap}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={styles.right}>
          {actions.map((a) => (
            <TouchableOpacity
              key={a.label}
              onPress={a.onPress}
              accessibilityRole="button"
              accessibilityLabel={a.label}
              hitSlop={12}
              style={styles.iconButton}
            >
              <Ionicons name={a.icon} size={22} color={theme.colors.text} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  solid: { backgroundColor: theme.colors.background },
  transparent: { backgroundColor: 'transparent' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: theme.touchTarget,
    paddingHorizontal: theme.spacing.base,
  },
  left: { width: 40, alignItems: 'flex-start' },
  right: { minWidth: 40, flexDirection: 'row', justifyContent: 'flex-end', gap: theme.spacing.xs },
  titleWrap: { flex: 1, alignItems: 'center' },
  title: { ...theme.typography.title, color: theme.colors.text },
  subtitle: { ...theme.typography.caption, marginTop: 2 },
  iconButton: {
    width: theme.touchTarget - 8,
    height: theme.touchTarget - 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.pill,
  },
});

export default Header;
