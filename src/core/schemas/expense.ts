/**
 * Schémas Zod — Dépenses (Domain Layer).
 * Partagés entre :
 *  - le formulaire d'ajout/édition (zodResolver + react-hook-form),
 *  - la validation des données extraites d'un ticket scanné (étape 10),
 *  - les tests unitaires des règles métier.
 */

import { z } from 'zod';

/** Dates FR acceptées au clavier : "31/12/2025" ou "31/12/25". */
const RE_DATE_FR = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/;

export function parseDateFr(input: string): Date | null {
  const match = RE_DATE_FR.exec(input.trim());
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  let year = Number(match[3]);
  if (year < 100) year += 2000;

  const date = new Date(year, month - 1, day);
  // Rejet des dates invalides ("31/02", jours hors mois…) et du futur.
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  if (date.getTime() > endOfToday.getTime()) return null;
  return date;
}

/** Epoch ms -> "JJ/MM/AAAA" pour pré-remplir le champ date. */
export function toDateFr(ts: number): string {
  const d = new Date(ts);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/** Champ montant : accepte "12,50" (FR) et "12.50" (US). */
const amountField = z
  .string()
  .trim()
  .min(1, 'Le montant est obligatoire.')
  .transform((s) => s.replace(',', '.'))
  .refine((s) => /^\d+(\.\d{1,2})?$/.test(s), 'Montant invalide (ex. : 12,50).')
  .transform(Number)
  .refine((n) => n > 0, 'Le montant doit être strictement positif.')
  .refine((n) => n <= 1_000_000, 'Montant démesuré — vérifiez la saisie.');

export const expenseFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Le titre est obligatoire.')
      .max(60, 'Titre trop long (60 caractères max).'),
    amount: amountField,
    /** Format JJ/MM/AAAA ; dans le passé ou aujourd'hui uniquement. */
    date: z
      .string()
      .trim()
      .min(1, 'La date est obligatoire.')
      .refine((s) => parseDateFr(s) !== null, 'Date invalide (format JJ/MM/AAAA, pas de futur).'),
    categoryId: z
      .string()
      .trim()
      .min(1, 'Une dépense doit avoir une catégorie.'),
    note: z.string().trim().max(280, 'Note trop longue (280 caractères max).').optional(),
  })
  /** Champs optionnels injectés par l'écran de scan (traçabilité étape 10). */
  .extend({
    receiptImageUri: z.string().nullish(),
    ticketId: z.string().nullish(),
  });

/** FormShape : ce que RHF manipule au clavier (amount = string). */
export type ExpenseFormInput = z.input<typeof expenseFormSchema>;
/** Output Zod après transformations (amount = number). */
export type ExpenseFormOutput = z.output<typeof expenseFormSchema>;

/** Réutilisé par l'écran d'analyse de ticket pour valider les données OCR avant enregistrement. */
export const extractedAmountSchema = amountField;
