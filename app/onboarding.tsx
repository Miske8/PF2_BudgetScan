import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { useAuthContext } from '@/hooks/useAuthContext';
import { theme } from '@/theme';

/**
 * Onboarding — écran d'accueil public (étape 6 : mémorise "vu" via prefs).
 * Slide unique MVP : valeur de l'app + CTA.
 */
const FEATURES = [
  { icon: 'scan-outline', title: 'Scannez vos tickets', text: 'Le montant est extrait automatiquement.' },
  { icon: 'wallet-outline', title: 'Budgets mensuels', text: 'Global et par catégorie, avec alertes.' },
  { icon: 'pie-chart-outline', title: 'Statistiques claires', text: 'Visualisez où part votre argent.' },
] as const;

export default function OnboardingScreen() {
  const { setOnboardingSeen } = useAuthContext();

  /** Mémorise "onboarding vu" puis navigue (l'index redirigera directement ici la prochaine fois). */
  const goNext = (href: '/(auth)/register' | '/(auth)/login') => {
    void setOnboardingSeen(true);
    router.push(href);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.logoWrap}>
          <Ionicons name="cash-outline" size={44} color={theme.colors.white} />
        </View>
        <Text style={styles.title}>Bienvenue sur BudgetScan</Text>

        <Text style={styles.subtitle}>
          Gérez votre budget sans saisie manuelle complexe.
        </Text>

        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon} size={22} color={theme.colors.primaryDark} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureBody}>{f.text}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Commencer"
          size="lg"
          fullWidth
          onPress={() => goNext('/(auth)/register')}
          testID="onboarding-start"
        />
        <Button
          label="J'ai déjà un compte"
          variant="ghost"
          fullWidth
          onPress={() => goNext('/(auth)/login')}
          testID="onboarding-login"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  container: { flexGrow: 1, justifyContent: 'center', padding: theme.spacing.xl, gap: theme.spacing.base },
  logoWrap: {
    width: 88,
    height: 88,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: theme.spacing.sm,
    ...theme.shadow.raised,
  },
  title: { ...theme.typography.display, color: theme.colors.text, textAlign: 'center' },
  subtitle: { ...theme.typography.body, color: theme.colors.textMuted, textAlign: 'center' },
  features: { marginTop: theme.spacing.xl, gap: theme.spacing.base },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.base },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { flex: 1 },
  featureTitle: { ...theme.typography.subtitle, color: theme.colors.text },
  featureBody: { ...theme.typography.caption, marginTop: 2 },
  footer: {
    padding: theme.spacing.base,
    gap: theme.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
});
