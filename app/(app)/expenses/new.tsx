/**
 * Ajout manuel d'une dépense — modal. Route : /expenses/new
 * (étape 10 réutilisera le même ExpenseForm avec `initial` pré-rempli par l'OCR).
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '@/components/ui';
import { ExpenseForm } from '@/components/domain/ExpenseForm';
import { useExpenseForm } from '@/hooks/useExpenseForm';
import { theme } from '@/theme';

export default function NewExpenseScreen() {
  const router = useRouter();
  const controller = useExpenseForm();

  return (
    <View style={styles.container}>
      <Header title="Nouvelle dépense" />
      <ExpenseForm
        controller={controller}
        submitLabel="Ajouter la dépense"
        onSuccess={() => router.back()}
        onCancel={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
});
