import { Stack } from 'expo-router';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { theme } from '@/theme';

/**
 * Racine Expo Router (étape 4 — navigation complète).
 *
 * Arborescence :
 * - index            → redirect /onboarding
 * - onboarding       → public
 * - (auth)           → login, register (publics)
 * - (app)            → protégé par AuthGuard :
 *     - (tabs)       → dashboard, expenses, scan, budgets, stats
 *     - expenses/*   → new, [id] (modal)
 *     - tickets/*    → analyze (modal)
 *     - categories, settings
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.background },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
          {/* Galerie design system — retirée à la finalisation (étape 12) */}
          <Stack.Screen name="gallery" options={{ title: 'Design System' }} />
          {/* Écran de vérification SQLite — retiré à l'étape 12 */}
          <Stack.Screen name="storage-check" options={{ title: 'Storage Check' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
