import { Redirect } from 'expo-router';
import React from 'react';
import { useAuthContext } from '@/hooks/useAuthContext';
import { Loader } from '@/components/ui';

/**
 * Route d'index (étape 6 — routing conditionnel branché sur l'auth réelle) :
 * - session valide          → dashboard
 * - onboarding déjà vu      → login
 * - sinon                   → onboarding
 */
export default function Index() {
  const { status, onboardingSeen } = useAuthContext();

  if (status === 'loading') {
    return <Loader text="Chargement…" />;
  }
  if (status === 'signed-in') {
    return <Redirect href="/(app)/(tabs)/dashboard" />;
  }
  return <Redirect href={onboardingSeen ? '/(auth)/login' : '/onboarding'} />;
}
