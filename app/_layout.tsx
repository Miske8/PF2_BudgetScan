import { Stack } from 'expo-router';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { theme } from '@/theme';

/**
 * Racine Expo Router (Étape 3).
 * - Providers globaux : gestures + safe area.
 * - Thème appliqué aux écrans (fond surface).
 * L'auth guard et les onglets arriveront aux étapes 4 et 6.
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.background },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="gallery" options={{ title: 'Design System' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
