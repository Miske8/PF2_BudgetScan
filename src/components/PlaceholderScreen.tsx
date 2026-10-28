import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';

/**
 * Composant partagé : écran placeholder des routes non encore implémentées.
 * Chaque écran sera remplacé au fil des étapes (auth = 6, dashboard = 7…).
 */
export function PlaceholderScreen({
  title,
  message,
  icon = 'construct-outline',
}: {
  title: string;
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={40} color={theme.colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <Link href="/(app)/(tabs)/dashboard" style={styles.link}>
        {'← Retour à l\u2019accueil'}
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background,
    gap: theme.spacing.sm,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...theme.typography.title, color: theme.colors.text },
  message: { ...theme.typography.body, color: theme.colors.textMuted, textAlign: 'center' },
  link: {
    marginTop: theme.spacing.lg,
    color: theme.colors.info,
    fontWeight: theme.fontFamily.medium,
  },
});
