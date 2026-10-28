/**
 * Seed — jeu de données de démonstration.
 *
 * Usage (depuis un écran de dev ou settings, étape 12) :
 *   await seedDemoData(demoUserId);
 *
 * Génère un utilisateur "demo@budgetscan.app" (mot de passe : demo1234),
 * un budget global + 3 budgets par catégorie sur le mois courant, et
 * ~18 dépenses réparties sur les 3 derniers mois pour alimenter le
 * dashboard et les statistiques immédiatement.
 *
 * Idempotent : ne réinsère pas si l'utilisateur démo existe déjà.
 */

import { getDatabase } from '../database';
import { newId, now } from '../mappers';
import { seedDefaultCategories } from './defaultCategories';

export const DEMO_EMAIL = 'demo@budgetscan.app';
export const DEMO_PASSWORD = 'demo1234';

/**
 * Hash déterministe sans dépendance native : FNV-1a 64 bits (en 2×32 bits)
 * + sel. Suffisant pour une auth STRICTEMENT locale du MVP ; remplacé par
 * sha256 (expo-crypto) à l'étape 6 — la colonne password_hash reste opaque.
 */
export function hashPasswordLocal(password: string): string {
  const input = `budgetscan:v1:${password}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < input.length; i += 1) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul((h2 + c) ^ (h2 >>> 7), 0x85ebca6b) >>> 0;
  }
  return `${h1.toString(16).padStart(8, '0')}${h2.toString(16).padStart(8, '0')}`;
}

interface DemoExpenseTemplate {
  title: string;
  category: string; // nom catégorie système
  amounts: number[]; // un montant par "mois offset" (0 = ce mois, 1 = M-1, 2 = M-2)
}

const TEMPLATES: DemoExpenseTemplate[] = [
  { title: 'Courses Carrefour', category: 'Alimentation', amounts: [62.4, 81.2, 55.9] },
  { title: 'Boulangerie', category: 'Alimentation', amounts: [8.5, 12.3, 6.8] },
  { title: 'Restaurant universitaire', category: 'Alimentation', amounts: [44, 33, 51.5] },
  { title: 'Abonnement métro', category: 'Transport', amounts: [79.5, 79.5, 79.5] },
  { title: 'Essence', category: 'Transport', amounts: [65, 48.2, 70] },
  { title: 'Loyer', category: 'Logement', amounts: [620, 620, 620] },
  { title: 'Électricité', category: 'Logement', amounts: [58.3, 61.7, 49.9] },
  { title: 'Cinéma', category: 'Loisirs', amounts: [26, 13, 39] },
  { title: 'Abonnement musique', category: 'Loisirs', amounts: [10.99, 10.99, 10.99] },
  { title: 'Pharmacie', category: 'Santé', amounts: [23.5, 8.9, 31.2] },
  { title: 'Vêtements', category: 'Shopping', amounts: [89.9, 45, 120.5] },
  { title: 'Cadeau anniversaire', category: 'Autres', amounts: [35, 0, 22] },
];

function pickDate(monthOffset: number, dayOfMonth: number): number {
  const base = new Date();
  const d = new Date(base.getFullYear(), base.getMonth() - monthOffset, dayOfMonth, 12, 0, 0);
  return d.getTime();
}

export async function seedDemoData(): Promise<{ userId: string }> {
  const db = await getDatabase();
  await seedDefaultCategories();

  const existing = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM users WHERE email = ?',
    DEMO_EMAIL,
  );
  if (existing) return { userId: existing.id };

  const userId = newId();
  const timestamp = now();
  const passwordHash = hashPasswordLocal(DEMO_PASSWORD);

  await db.runAsync(
    `INSERT INTO users (id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)`,
    [userId, 'Utilisateur démo', DEMO_EMAIL, passwordHash, timestamp],
  );

  const categories = await db.getAllAsync<{ id: string; name: string }>(
    'SELECT id, name FROM categories WHERE user_id IS NULL',
  );
  const byName = new Map(categories.map((c) => [c.name, c.id]));

  // Budgets : global + Alimentation / Transport / Logement (mois courant).
  const base = new Date();
  const month = base.getMonth() + 1;
  const year = base.getFullYear();
  const globalBudgetId = newId();
  await db.runAsync(
    `INSERT INTO budgets (id, user_id, category_id, month, year, amount, created_at, updated_at)
     VALUES (?, ?, NULL, ?, ?, ?, ?, ?)`,
    [globalBudgetId, userId, month, year, 1500, timestamp, timestamp],
  );
  for (const [name, amount] of [
    ['Alimentation', 300],
    ['Transport', 180],
    ['Logement', 700],
  ] as const) {
    const categoryId = byName.get(name);
    if (!categoryId) continue;
    await db.runAsync(
      `INSERT INTO budgets (id, user_id, category_id, month, year, amount, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [newId(), userId, categoryId, month, year, amount, timestamp, timestamp],
    );
  }

  // Dépenses : modèles × offsets de mois, dates déterministes.
  // Insérées dans une transaction pour garantir l'atomicité du seed.
  let inserted = 0;
  await db.withTransactionAsync(async () => {
    for (const template of TEMPLATES) {
      const categoryId = byName.get(template.category);
      if (!categoryId) continue;
      for (let monthOffset = 0; monthOffset < template.amounts.length; monthOffset += 1) {
        const amount = template.amounts[monthOffset];
        if (amount === undefined || amount <= 0) continue;
        const date = pickDate(monthOffset, 3 + ((inserted * 2) % 24));
        await db.runAsync(
          `INSERT INTO expenses
             (id, user_id, title, amount, date, category_id, note, receipt_image_uri, ticket_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, NULL, ?, ?)`,
          [newId(), userId, template.title, amount, date, categoryId, timestamp, timestamp],
        );
        inserted += 1;
      }
    }
  });

  return { userId };
}
