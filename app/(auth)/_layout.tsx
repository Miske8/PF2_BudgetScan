import { Stack } from 'expo-router';
import React from 'react';
import { theme } from '@/theme';

/**
 * Groupe public `(auth)` : login + register.
 * Ces écrans ne sont PAS protégés par l'AuthGuard.
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
