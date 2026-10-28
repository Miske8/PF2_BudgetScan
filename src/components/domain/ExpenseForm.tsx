/**
 * ExpenseForm — formulaire partagé création / édition / pré-remplissage OCR.
 * Présente uniquement les champs ; la logique vit dans useExpenseForm.
 * Utilisé par : /expenses/new, /expenses/[id] (mode edit), /tickets/analyze (étape 10).
 */

import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Controller, type Control } from 'react-hook-form';
import { Button, Card, Input } from '@/components/ui';
import { CategoryPicker } from '@/components/domain/CategoryPicker';
import type { ExpenseFormInput, ExpenseFormOutput } from '@/core/schemas/expense';
import type { UseExpenseFormResult } from '@/hooks/useExpenseForm';
import { theme } from '@/theme';

export interface ExpenseFormProps {
  controller: UseExpenseFormResult;
  submitLabel?: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function ExpenseForm({ controller, submitLabel, onSuccess, onCancel }: ExpenseFormProps) {
  const { form, categories, categoriesLoading, submitting, submitError, onSubmit } = controller;
  const { control } = form;

  const handlePress = async () => {
    const ok = await onSubmit();
    if (ok) onSuccess();
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.card}>
          <Input
            label="Titre"
            placeholder="Ex. : Courses Carrefour"
            maxLength={60}
            testID="expense-title"
            error={form.formState.errors.title?.message}
            accessibilityLabel="Titre de la dépense"
            {...form.register('title')}
          />

          <View style={styles.rowFields}>
            <Input
              label="Montant"
              placeholder="0,00"
              prefix="€"
              keyboardType="decimal-pad"
              maxLength={10}
              testID="expense-amount"
              containerStyle={styles.amountField}
              error={form.formState.errors.amount?.message}
              accessibilityLabel="Montant en euros"
              {...form.register('amount')}
            />
            <Input
              label="Date"
              placeholder="JJ/MM/AAAA"
              keyboardType="number-pad"
              maxLength={10}
              testID="expense-date"
              containerStyle={styles.dateField}
              hint="Format JJ/MM/AAAA"
              error={form.formState.errors.date?.message}
              accessibilityLabel="Date de la dépense"
              {...form.register('date')}
            />
          </View>

          {/* Catégorie : composant piloté (pas de register natif) */}
          <ControllerWrapper control={control}>
            {(value, setValue) => (
              <CategoryPicker
                categories={categories}
                selectedId={value}
                onSelect={(id) => {
                  setValue(id);
                  form.clearErrors('categoryId');
                }}
                error={form.formState.errors.categoryId?.message}
                testID="expense-category-picker"
              />
            )}
          </ControllerWrapper>
          {categoriesLoading ? (
            <Text style={styles.hintSmall}>Chargement des catégories…</Text>
          ) : null}

          <Input
            label="Note (optionnel)"
            placeholder="Précisions, article scanné…"
            multiline
            numberOfLines={3}
            maxLength={280}
            testID="expense-note"
            error={form.formState.errors.note?.message}
            accessibilityLabel="Note libre"
            {...form.register('note')}
          />
        </Card>

        {submitError ? (
          <View style={styles.errorBanner} accessibilityRole="alert" testID="expense-form-error">
            <Text style={styles.errorText}>{submitError}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Button
            label={submitLabel ?? (controller.isEdit ? 'Enregistrer' : 'Ajouter la dépense')}
            onPress={handlePress}
            loading={submitting}
            disabled={categories.length === 0}
            size="lg"
            testID="expense-submit"
          />
          {onCancel ? (
            <Button label="Annuler" variant="ghost" onPress={onCancel} testID="expense-cancel" />
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Petit wrapper Controller pour garder le fichier lisible.
// ---------------------------------------------------------------------------
function ControllerWrapper({
  control,
  children,
}: {
  control: Control<ExpenseFormInput, unknown, ExpenseFormOutput>;
  children: (value: string | undefined, setValue: (v: string) => void) => React.ReactElement;
}) {
  return (
    <Controller
      control={control}
      name="categoryId"
      render={({ field: { value, onChange } }) =>
        children(value as string | undefined, onChange as (v: string) => void)
      }
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  card: { gap: theme.spacing.md },
  rowFields: { flexDirection: 'row', gap: theme.spacing.sm },
  amountField: { flex: 1 },
  dateField: { flex: 1.4 },
  hintSmall: { ...theme.typography.caption, color: theme.colors.textFaint, marginTop: -theme.spacing.sm },
  errorBanner: {
    backgroundColor: theme.colors.dangerSoft,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  errorText: { fontSize: theme.fontSize.sm, fontWeight: '600', color: theme.colors.danger },
  actions: { gap: theme.spacing.sm, marginTop: theme.spacing.lg },
});
