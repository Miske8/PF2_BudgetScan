/**
 * Écran Analyse du ticket (modal) — route : /tickets/analyze?id=…&amount=…&date=…&title=…
 *
 * Reçoit les paramètres produits par l'écran Scan après extraction OCR.
 * Affiche :
 *  - la prévisualisation de l'image capturée,
 *  - un bandeau "données extraites" avec le niveau de confiance,
 *  - le formulaire de dépense PRÉ-REMPI (useExpenseForm({ initial })).
 * L'utilisateur corrige librement avant d'enregistrer ; receiptImageUri et
 * ticketId sont transmis pour la traçabilité image -> dépense.
 */

import React, { useMemo } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Card, Header } from '@/components/ui';
import { ExpenseForm } from '@/components/domain/ExpenseForm';
import { useExpenseForm, type UseExpenseFormResult } from '@/hooks/useExpenseForm';
import { theme } from '@/theme';
import { ticketService } from '@/services';
import type { ExpenseFormInput } from '@/core/schemas/expense';

export default function TicketAnalyzeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    amount?: string;
    date?: string;
    title?: string;
  }>();

  // Reconstruit les valeurs pré-remplies à partir des paramètres d'URL.
  const initial = useMemo<Partial<ExpenseFormInput>>(() => {
    const values: Partial<ExpenseFormInput> = {};
    if (params.title) values.title = params.title;
    if (params.amount) values.amount = params.amount; // format FR géré par le schéma Zod
    if (params.date) values.date = params.date; // déjà JJ/MM/AAAA (toFrDate côté scan)
    if (params.id) values.ticketId = params.id;
    return values;
  }, [params.title, params.amount, params.date, params.id]);

  // Récupère l'URI de l'image depuis le ticket persisté (best-effort).
  const [imageUri, setImageUri] = React.useState<string | null>(null);
  React.useEffect(() => {
    let cancelled = false;
    if (params.id) {
      void ticketService.getById(params.id).then((ticket) => {
        if (!cancelled && ticket) setImageUri(ticket.imageUri);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const controller: UseExpenseFormResult = useExpenseForm({
    initial: imageUri ? { ...initial, receiptImageUri: imageUri } : initial,
  });

  return (
    <View style={styles.container}>
      <Header title="Analyse du ticket" onBack={() => router.back()} />

      {/* Prévisualisation + résumé d'extraction */}
      <ScrollView contentContainerStyle={styles.previewScroll} keyboardShouldPersistTaps="handled">
        {imageUri ? (
          <Card style={styles.previewCard} testID="analyze-preview">
            <Image
              source={{ uri: imageUri }}
              style={styles.previewImage}
              resizeMode="cover"
              accessibilityLabel="Photo du ticket scanné"
            />
            <View style={styles.previewMeta}>
              <Text style={styles.previewTitle}>Données extraites automatiquement</Text>
              <Text style={styles.previewHint}>
                Vérifiez et corrigez les champs ci-dessous avant d’enregistrer la dépense.
              </Text>
            </View>
          </Card>
        ) : (
          <Card style={styles.previewCard}>
            <Text style={styles.previewHint}>Chargement de l’aperçu…</Text>
          </Card>
        )}
      </ScrollView>

      {/* Formulaire pré-rempli partagé avec l'ajout manuel */}
      <View style={styles.formArea}>
        <ExpenseForm
          controller={controller}
          submitLabel="Enregistrer la dépense"
          onSuccess={() => router.replace('/(app)/(tabs)/dashboard')}
          onCancel={() => router.back()}
        />
      </View>
    </View>
  );
}

// Modale sans header natif : titre géré par <Header>.
TicketAnalyzeScreen.options = { title: 'Analyse du ticket' };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  previewScroll: { padding: theme.spacing.md, paddingBottom: 0 },
  previewCard: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  previewImage: {
    width: 88,
    height: 112,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surfaceAlt,
  },
  previewMeta: { flex: 1, gap: 4 },
  previewTitle: { ...theme.typography.title, color: theme.colors.text },
  previewHint: { ...theme.typography.caption, color: theme.colors.textMuted },
  formArea: { flex: 1 },
});
