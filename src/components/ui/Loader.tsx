import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View, Animated, Easing } from 'react-native';
import { theme } from '@/theme';

export interface LoaderProps {
  /** 'spinner' : centré plein écran ; 'inline' : petit spinner avec texte. */
  mode?: 'fullscreen' | 'inline';
  text?: string;
  testID?: string;
}

/** Indicateur de chargement standard (couleur marque). */
export function Loader({ mode = 'fullscreen', text, testID }: LoaderProps) {
  if (mode === 'inline') {
    return (
      <View style={styles.inline} testID={testID}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        {text ? <Text style={styles.inlineText}>{text}</Text> : null}
      </View>
    );
  }
  return (
    <View style={styles.fullscreen} testID={testID} accessibilityRole="progressbar">
      <ActivityIndicator size="large" color={theme.colors.primary} />
      {text ? <Text style={styles.text}>{text}</Text> : null}
    </View>
  );
}

/** Skeleton shimmer simple (sans dépendance) pour les états de chargement de listes. */
export function SkeletonBlock({ width = '100%', height = 16, radius = theme.radius.sm, style }: {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: object;
}) {
  const [opacity] = React.useState(() => new Animated.Value(0.35));

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.85, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius, backgroundColor: theme.colors.border, opacity }, style]}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  fullscreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    gap: theme.spacing.md,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.base,
  },
  inlineText: { ...theme.typography.caption, color: theme.colors.textMuted },
  text: { ...theme.typography.body, color: theme.colors.textMuted },
});

export default Loader;
