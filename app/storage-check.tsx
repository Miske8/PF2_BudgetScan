/**
 * Écran de vérification — Stockage local (étape 5).
 *
 * BUT TEMPORAIRE : prouver que migrations + seed + CRUD fonctionnent sur
 * l'appareil, AVANT de brancher l'UI réelle (étapes 7-9).
 * Supprimé à la finalisation (étape 12).
 *
 * Accès : route /storage-check depuis onboarding ou drawer debug.
 */

import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Header, Loader } from '@/components/ui';
import { theme } from '@/theme';
import { getDatabase, closeDatabase } from '@/infrastructure/db';
import { seedDefaultCategories, seedDemoData } from '@/infrastructure/db/seed';
import { expenseService, budgetService } from '@/services';
import { currentPeriod } from '@/core/types/models';

type LogEntry = { ok: boolean; label: string; detail?: string };

export default function StorageCheckScreen() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState(false);

  const log = (entry: LogEntry) => setLogs((prev) => [...prev, entry]);

  async function runChecks() {
    setRunning(true);
    setLogs([]);
    try {
      // 1. Ouverture + migrations.
      await getDatabase();
      log({ ok: true, label: 'SQLite ouvert', detail: 'migrations 001 appliquées' });

      // 2. Seed catégories système.
      await seedDefaultCategories();
      const db = await getDatabase();
      const cats = await db.getAllAsync<{ name: string }>(
        'SELECT name FROM categories WHERE user_id IS NULL ORDER BY name',
      );
      log({
        ok: cats.length >= 7,
        label: `Catégories par défaut (${cats.length})`,
        detail: cats.map((c) => c.name).join(', '),
      });

      // 3. Seed démo (user + budgets + dépenses).
      const { userId } = await seedDemoData();
      log({ ok: true, label: 'Seed démo inséré', detail: `user ${userId.slice(0, 8)}…` });

      // 4. Lecture via services (pas d'accès SQL direct côté écran).
      const period = currentPeriod();
      const expenses = await expenseService.list(userId, { ...period });
      const total = await expenseService.totalForPeriod(userId, period.month, period.year);
      log({
        ok: expenses.length > 0 && total > 0,
        label: `Dépenses du mois : ${expenses.length}`,
        detail: `total = ${total.toFixed(2)} € (agrégat SQL)`,
      });

      // 5. Règle métier : montant <= 0 refusé.
      let rejected = false;
      try {
        await expenseService.create({
          userId,
          title: 'test invalide',
          amount: -5,
          date: Date.now(),
          categoryId: expenses[0]?.categoryId ?? '',
        });
      } catch {
        rejected = true;
      }
      log({ ok: rejected, label: 'Règle métier : montant négatif rejeté' });

      // 6. Unicité budget global (upsert remplace, ne duplique pas).
      await budgetService.setGlobal(userId, period.month, period.year, 1500);
      await budgetService.setGlobal(userId, period.month, period.year, 1600);
      const overview = await budgetService.overview(userId, period.month, period.year);
      log({
        ok: overview.global?.amount === 1600,
        label: 'Upsert budget global unique',
        detail: `montant après 2 upserts = ${overview.global?.amount} € · restant = ${overview.remaining.toFixed(2)} €`,
      });

      // 7. CRUD dépense complet.
      if (expenses[0]) {
        const created = await expenseService.create({
          userId,
          title: 'Dépense test CRUD',
          amount: 12.34,
          date: Date.now(),
          categoryId: expenses[0].categoryId,
        });
        await expenseService.update(created.id, { amount: 20 });
        const read = await expenseService.get(created.id);
        await expenseService.remove(created.id);
        const gone = (await expenseService.get(created.id)) === null;
        log({
          ok: read?.amount === 20 && gone,
          label: 'CRUD dépense (create → update → delete)',
        });
      }

      // 8. Persistance après reconnexion.
      await closeDatabase();
      const db2 = await getDatabase();
      const n = await db2.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM expenses');
      log({
        ok: (n?.n ?? 0) > 0,
        label: 'Persistance après fermeture/réouverture',
        detail: `${n?.n ?? 0} lignes en base`,
      });
    } catch (err) {
      log({ ok: false, label: 'ÉCHEC', detail: err instanceof Error ? err.message : String(err) });
    } finally {
      setRunning(false);
    }
  }

  return (
    <View style={styles.container}>
      <Header title="Vérification stockage" />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Text style={styles.title}>Tests d'intégration SQLite</Text>
          <Text style={styles.subtitle}>
            Migrations, seed, services, règles métier et persistance sont vérifiés sur
            l&apos;appareil. Cet écran est temporaire (retiré à l&apos;étape 12).
          </Text>
          <Button
            title={running ? 'Analyse en cours…' : 'Lancer les vérifications'}
            onPress={runChecks}
            disabled={running}
            testID="storage-check-run"
          />
        </Card>

        {running && <Loader text="Interrogations de la base locale…" />}

        {logs.map((entry, index) => (
          <View key={`${entry.label}-${index}`} style={styles.logRow}>
            <Text style={{ color: entry.ok ? theme.colors.success : theme.colors.danger }}>
              {entry.ok ? '✓' : '✗'}
            </Text>
            <View style={styles.logBody}>
              <Text style={styles.logLabel}>{entry.label}</Text>
              {entry.detail ? <Text style={styles.logDetail}>{entry.detail}</Text> : null}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, gap: theme.spacing.md, paddingBottom: 48 },
  card: { gap: theme.spacing.sm },
  title: { ...theme.typography.title, color: theme.colors.text },
  subtitle: { ...theme.typography.caption, color: theme.colors.textMuted },
  logRow: { flexDirection: 'row', gap: theme.spacing.sm, alignItems: 'flex-start' },
  logBody: { flex: 1 },
  logLabel: { ...theme.typography.footnote, color: theme.colors.text },
  logDetail: { ...theme.typography.caption, color: theme.colors.textFaint },
});
