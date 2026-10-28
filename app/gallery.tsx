import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme, formatCurrency } from '@/theme';
import { Button, Input, Card, Badge, EmptyState, Loader, SkeletonBlock } from '@/components/ui';

/**
 * Écran de galerie du Design System ( temporaire, supprimé à l'étape 6 ).
 * Permet de valider visuellement chaque composant isolément.
 */
export default function GalleryScreen() {
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.h1}>Design System</Text>

      {/* Buttons */}
      <Card title="Button">
        <View style={styles.row}>
          <Button label="Primary" onPress={() => {}} />
          <Button label="Secondary" variant="secondary" onPress={() => {}} />
        </View>
        <View style={styles.row}>
          <Button label="Ghost" variant="ghost" onPress={() => {}} />
          <Button label="Danger" variant="danger" onPress={() => {}} />
        </View>
        <View style={styles.row}>
          <Button label="Loading" loading onPress={() => {}} />
          <Button label="Disabled" disabled onPress={() => {}} />
        </View>
        <Button label="Full width · Large" size="lg" fullWidth onPress={() => {}} />
      </Card>

      {/* Inputs */}
      <Card title="Input" style={styles.cardGap}>
        <Input label="Titre" placeholder="Courses Carrefour" value="" onChangeText={() => {}} testID="demo-title" />
        <Input
          label="Montant"
          placeholder="0,00"
          keyboardType="decimal-pad"
          prefix="€"
          error="Le montant doit être supérieur à 0"
          value="-2"
          onChangeText={() => {}}
        />
        <Input label="Note" hint="Optionnel" value="" onChangeText={() => {}} multiline />
        <Input label="Mot de passe" secureTextEntry toggleSecure value="" onChangeText={() => {}} />
      </Card>

      {/* Badges */}
      <Card title="Badge" style={styles.cardGap}>
        <View style={styles.wrap}>
          <Badge label="Neutre" dot />
          <Badge label="Dans le budget" tone="success" dot />
          <Badge label="85 %" tone="warning" dot />
          <Badge label="Dépassé" tone="danger" dot />
          <Badge label="Alimentation" color="#16A34A" dot />
          <Badge label="Transport" color="#2563EB" dot />
        </View>
      </Card>

      {/* Loaders & skeletons */}
      <Card title="Loader / Skeleton" style={styles.cardGap}>
        <Loader mode="inline" text="Analyse du ticket…" />
        <View style={styles.stack}>
          <SkeletonBlock height={44} />
          <SkeletonBlock width="70%" height={16} />
          <SkeletonBlock width="45%" height={16} />
        </View>
      </Card>

      {/* Empty state */}
      <Card title="EmptyState" style={styles.cardGap}>
        <EmptyState
          title="Aucune dépense ce mois-ci"
          message="Ajoutez une dépense ou scannez un ticket pour commencer."
          icon="receipt-outline"
          actionLabel="Ajouter"
          onAction={() => {}}
        />
      </Card>

      {/* Exemple composition métier */}
      <Card
        title="Composition : ligne de dépense"
        subtitle="Card + Badge + formatCurrency"
        style={styles.cardGap}
        right={<Ionicons name="chevron-forward" size={18} color={theme.colors.textFaint} />}
      >
        <View style={styles.expenseRow}>
          <Badge label="Loisirs" color="#EA580C" />
          <Text style={styles.grow}>Cinéma</Text>
          <Text style={styles.amount}>{formatCurrency(12.9)}</Text>
        </View>
      </Card>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: theme.spacing.base, backgroundColor: theme.colors.background },
  h1: { ...theme.typography.display, color: theme.colors.text, marginBottom: theme.spacing.base },
  cardGap: { marginBottom: theme.spacing.base },
  row: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.sm, flexWrap: 'wrap' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  stack: { gap: theme.spacing.sm, marginTop: theme.spacing.md },
  expenseRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  grow: { flex: 1, color: theme.colors.text, fontSize: theme.fontSize.md },
  amount: { fontWeight: theme.fontFamily.bold, color: theme.colors.text },
});
