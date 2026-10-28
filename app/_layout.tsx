import { Stack } from 'expo-router';

/**
 * Racine Expo Router — squelette minimaliste (Étape 2).
 * L'authentification, le thème et les onglets arriveront aux étapes 3 à 6.
 */
export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'BudgetScan' }} />
    </Stack>
  );
}
