import { Redirect } from 'expo-router';
import React from 'react';

/**
 * Route d'index (étape 4) : redirige vers l'onboarding.
 * À l'étape 6, logique affinée via le contexte auth :
 * - session valide → /(app)/(tabs)/dashboard
 * - onboarding déjà vu → /(auth)/login
 * - sinon → /onboarding
 */
export default function Index() {
  return <Redirect href="/onboarding" />;
}
