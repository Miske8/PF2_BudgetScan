import { Redirect } from 'expo-router';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Loader } from '@/components/ui';
import { useAuthStatus } from '@/hooks/useAuthContext';

/**
 * Guard de navigation (Étape 4, branché sur l'auth réelle à l'étape 6).
 * - status 'loading'   → splash locale (Loader) le temps de lire la session.
 * - status 'signed-out'→ redirection vers /login.
 * - status 'signed-in' → rend les children.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const status = useAuthStatus();

  if (status === 'loading') {
    return (
      <View style={styles.fallback}>
        <Loader text="Chargement de votre session…" />
      </View>
    );
  }

  if (status === 'signed-out') {
    return <Redirect href="/(auth)/login" />;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default AuthGuard;
