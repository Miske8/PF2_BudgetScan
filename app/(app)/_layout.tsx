import { Stack } from 'expo-router';
import React from 'react';
import { AuthGuard } from '@/components/AuthGuard';

/**
 * Layout du groupe privé `(app)` : toutes les routes enfants
 * (tabs + stacks de détail) sont protégées par le guard d'authentification.
 */
export default function AppLayout() {
  return (
    <AuthGuard>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      >
        {/* Onglets principaux */}
        <Stack.Screen name="(tabs)" />
        {/* Stacks de détail / formulaires */}
        <Stack.Screen name="expenses" options={{ presentation: 'modal' }} />
        <Stack.Screen name="tickets" options={{ presentation: 'modal' }} />
        <Stack.Screen name="categories" />
        <Stack.Screen name="settings" />
      </Stack>
    </AuthGuard>
  );
}
