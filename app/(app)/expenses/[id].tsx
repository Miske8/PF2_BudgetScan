/**
 * Détail d'une dépense — bascule vue / édition, suppression confirmée.
 * Route : /expenses/[id]
 */

import React, { useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Button, Card, EmptyState, Header, Loader } from '@/components/ui';
import { ExpenseForm } from '@/components/domain/ExpenseForm';
import { useAsync } from '@/hooks/useAsync';
import { useExpenseForm } from '@/hooks/useExpenseForm';
import { categoryService, expenseService } from '@/services';
import { formatCurrency, formatDate } from '@/theme';
import { theme } from '@/theme';

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  const query = useAsync(async () => {
    if (!id) return null;
    const found = await expenseService.get(id);
    if (!found) return null;
    const cats = await categoryService.list(found.userId);
    return { expense: found, category: cats.find((c) => c.id === found.categoryId) ?? null };
  }, [id]);

  const data = query.data;
  const controller = useExpenseForm(data ? { expense: data.expense } : {});

  if (query.loading) return <Loader text="Chargement de la dépense…" />;

  if (query.error) {
    return (
      <EmptyState
        title="Erreur de chargement"
        message={query.error.message}
        icon="alert-circle-outline"
        actionLabel="Réessayer"
        onAction={query.refetch}
      />
    );
  }

  if (!data?.expense) {
    return (
      <EmptyState
        title="Dépense introuvable"
        message="Elle a peut-être été supprimée."
        icon="help-circle-outline"
        actionLabel="Retour"
        onAction={() => router.back()}
      />
    );
  }

  const { expense, category } = data;

  const confirmDelete = () => {
    Alert.alert(
      'Supprimer cette dépense ?',
      `« ${expense.title} » (${formatCurrency(expense.amount)}) sera définitivement retirée de votre historique.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await expenseService.remove(expense.id);
              router.replace('/(app)/(tabs)/expenses');
            } catch (err) {
              Alert.alert('Suppression impossible', err instanceof Error ? err.message : 'Erreur inconnue.');
            }
          },
        },
      ],
    );
  };

  const shareReceipt = async () => {
    if (!expense.receiptImageUri) return;
    try {
      await Share.share({ message: `Ticket de « ${expense.title} » : ${expense.receiptImageUri}` });
    } catch {
      /* partage annulé */
    }
  };

  if (editing) {
    return (
      <View style={styles.container}>
        <Header title="Modifier la dépense" />
        <ExpenseForm
          controller={controller}
          submitLabel="Enregistrer les modifications"
          onSuccess={() => {
            setEditing(false);
            query.refetch();
          }}
          onCancel={() => setEditing(false)}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Détail de la dépense" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.hero}>
          <View style={[styles.iconWrap, { backgroundColor: `${category?.color ?? theme.colors.textFaint}22` }]}>
            <Ionicons name={(category?.icon ?? 'ellipse') as never} size={26} color={category?.color ?? theme.colors.textFaint} />
          </View>
          <Text style={styles.amount}>{formatCurrency(expense.amount)}</Text>
          <Text style={styles.title}>{expense.title}</Text>
          <View style={styles.badges}>
            {category ? <Badge label={category.name} color={category.color} dot /> : <Badge label="Sans catégorie" tone="warning" />}
            <Badge label={formatDate(expense.date)} tone="neutral" />
          </View>
        </Card>

        {expense.note ? (
          <Card title="Note">
            <Text style={styles.note}>{expense.note}</Text>
          </Card>
        ) : null}

        {expense.receiptImageUri ? (
          <Card title="Ticket de caisse">
            <Text style={styles.receiptPath} numberOfLines={2}>
              {expense.receiptImageUri}
            </Text>
            <Button label="Partager le ticket" variant="secondary" size="sm" onPress={shareReceipt} />
          </Card>
        ) : null}

        <View style={styles.actions}>
          <Button
            label="Modifier"
            variant="secondary"
            iconLeft={<Ionicons name="create-outline" size={18} color={theme.colors.text} />}
            onPress={() => setEditing(true)}
            testID="expense-edit"
          />
          <Button
            label="Supprimer"
            variant="danger"
            iconLeft={<Ionicons name="trash-outline" size={18} color={theme.colors.white} />}
            onPress={confirmDelete}
            testID="expense-delete"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { padding: theme.spacing.md, gap: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  hero: { alignItems: 'center', paddingVertical: theme.spacing.xl, gap: theme.spacing.sm },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amount: { ...theme.typography.amount, color: theme.colors.text },
  title: { ...theme.typography.subtitle, color: theme.colors.textMuted, textAlign: 'center' },
  badges: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.xs },
  note: { ...theme.typography.body, color: theme.colors.textMuted },
  receiptPath: { ...theme.typography.caption, color: theme.colors.textFaint, marginBottom: theme.spacing.sm },
  actions: { gap: theme.spacing.sm, marginTop: theme.spacing.sm },
});
