import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Header, EmptyState } from '@/components/ui';
import { theme } from '@/theme';

/** Placeholder navigation (étape 4) — rempli aux étapes 7 à 11. */
export default function BudgetsScreen() {
  return (
    <View style={styles.container}>
      <Header title="budgets" />
      <EmptyState title="Écran en construction" message="Cette page sera implémentée dans les prochaines étapes." icon="construct-outline" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
});
