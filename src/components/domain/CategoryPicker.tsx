/**
 * CategoryPicker — sélecteur de catégorie en grille de puces.
 * Plus tactile et visuel qu'un <Select> ; réutilisé par le formulaire dépense
 * et l'écran de correction du ticket scanné (étape 10).
 */

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Category } from '@/core/types/models';
import { theme } from '@/theme';

export interface CategoryPickerProps {
  categories: Category[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  error?: string;
  testID?: string;
}

export function CategoryPicker({ categories, selectedId, onSelect, error, testID }: CategoryPickerProps) {
  return (
    <View testID={testID}>
      <Text style={styles.label}>Catégorie</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {categories.map((category) => {
          const selected = category.id === selectedId;
          return (
            <Pressable
              key={category.id}
              onPress={() => onSelect(category.id)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Catégorie ${category.name}`}
              hitSlop={4}
              style={({ pressed }) => [
                styles.chip,
                selected && styles.chipSelected,
                pressed && styles.chipPressed,
              ]}
            >
              <Ionicons
                name={category.icon as never}
                size={15}
                color={selected ? theme.colors.white : category.color}
              />
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {category.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { ...theme.typography.label, color: theme.colors.textMuted, marginBottom: theme.spacing.xs },
  row: { gap: theme.spacing.sm, paddingVertical: theme.spacing.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: theme.touchTarget - 8,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  chipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipPressed: { opacity: 0.85 },
  chipText: { fontSize: theme.fontSize.sm, fontWeight: '600', color: theme.colors.text },
  chipTextSelected: { color: theme.colors.white },
  error: { ...theme.typography.caption, color: theme.colors.danger, marginTop: theme.spacing.xs },
});
