import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Controller } from 'react-hook-form';
import { Button, Input } from '@/components/ui';
import { useAuthForm } from '@/hooks/useAuthForm';
import { theme } from '@/theme';

/**
 * Connexion locale (Étape 6).
 * Validation Zod via react-hook-form ; erreurs métier remontées en bandeau.
 */
export default function LoginScreen() {
  const { form, submitting, globalError, onSubmit } = useAuthForm('login');
  const { control } = form;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.logoWrap}>
            <Ionicons name="log-in-outline" size={32} color={theme.colors.white} />
          </View>
          <Text style={styles.title}>Bon retour</Text>
          <Text style={styles.subtitle}>Connectez-vous à votre compte local.</Text>

          {globalError ? (
            <View style={styles.alert} accessibilityRole="alert" testID="login-error">
              <Ionicons name="alert-circle" size={18} color={theme.colors.danger} />
              <Text style={styles.alertText}>{globalError}</Text>
            </View>
          ) : null}

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value }, fieldState }) => (
              <Input
                label="Email"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={fieldState.error?.message}
                placeholder="vous@exemple.fr"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                inputMode="email"
                testID="login-email"
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value }, fieldState }) => (
              <Input
                label="Mot de passe"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={fieldState.error?.message}
                placeholder="••••••••"
                secureTextEntry
                toggleSecure
                autoCapitalize="none"
                testID="login-password"
              />
            )}
          />

          <Button
            label="Se connecter"
            size="lg"
            fullWidth
            loading={submitting}
            disabled={submitting}
            onPress={onSubmit}
            style={styles.submit}
            testID="login-submit"
          />

          <View style={styles.switch}>
            <Text style={styles.switchText}>Pas encore de compte ?</Text>
            <Link href="/(auth)/register" asChild>
              <Button label="Créer un compte" variant="ghost" onPress={() => undefined} />
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.base,
  },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    ...theme.shadow.raised,
  },
  title: { ...theme.typography.display, color: theme.colors.text, textAlign: 'center' },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.dangerSoft,
    borderRadius: theme.radius.md,
    padding: theme.spacing.base,
    minHeight: 44,
  },
  alertText: { ...theme.typography.caption, color: theme.colors.danger, flex: 1 },
  submit: { marginTop: theme.spacing.sm },
  switch: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  switchText: { ...theme.typography.caption, color: theme.colors.textMuted },
});
