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
 * Création de compte 100 % local (Étape 6).
 * Email unique + mot de passe hashé (sha256 itéré + sel) en SQLite ;
 * session ouverte immédiatement après inscription via le contexte auth.
 */
export default function RegisterScreen() {
  const { form, submitting, globalError, onSubmit } = useAuthForm('register');
  const { control } = form;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.logoWrap}>
            <Ionicons name="person-add-outline" size={32} color={theme.colors.white} />
          </View>
          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>
            Vos données restent sur votre appareil. Aucun serveur, aucun email requis.
          </Text>

          {globalError ? (
            <View style={styles.alert} accessibilityRole="alert" testID="register-error">
              <Ionicons name="alert-circle" size={18} color={theme.colors.danger} />
              <Text style={styles.alertText}>{globalError}</Text>
            </View>
          ) : null}

          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value }, fieldState }) => (
              <Input
                label="Prénom"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={fieldState.error?.message}
                placeholder="Camille"
                autoComplete="given-name"
                testID="register-name"
              />
            )}
          />

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
                testID="register-email"
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
                hint="8 caractères minimum."
                placeholder="••••••••"
                secureTextEntry
                toggleSecure
                autoCapitalize="none"
                testID="register-password"
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value }, fieldState }) => (
              <Input
                label="Confirmer le mot de passe"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={fieldState.error?.message}
                placeholder="••••••••"
                secureTextEntry
                toggleSecure
                autoCapitalize="none"
                testID="register-confirm"
              />
            )}
          />

          <Button
            label="Créer mon compte"
            size="lg"
            fullWidth
            loading={submitting}
            disabled={submitting}
            onPress={onSubmit}
            style={styles.submit}
            testID="register-submit"
          />

          <View style={styles.switch}>
            <Text style={styles.switchText}>Déjà un compte ?</Text>
            <Link href="/(auth)/login" asChild>
              <Button label="Se connecter" variant="ghost" onPress={() => undefined} />
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
