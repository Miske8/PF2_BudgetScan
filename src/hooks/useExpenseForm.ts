/**
 * useExpenseForm — logique du formulaire Dépense (React Hook Form + Zod).
 * Utilisé par :
 *  - /expenses/new   (création manuelle),
 *  - /expenses/[id]  (édition, via `initial`),
 *  - /tickets/analyze (étape 10 : pré-remplissage OCR -> passage en `initial`).
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import type { Category, Expense, NewExpenseInput } from '@/core/types/models';
import {
  parseDateFr,
  toDateFr,
  expenseFormSchema,
  type ExpenseFormInput,
  type ExpenseFormOutput,
} from '@/core/schemas/expense';
import { categoryService, expenseService } from '@/services';
import { useAsync } from './useAsync';
import { useAuthContext } from './useAuthContext';

export interface UseExpenseFormOptions {
  /** Présence = mode édition. */
  expense?: Expense;
  /** Valeurs pré-remplies (scan ticket, duplication…). Prioritaires sur `expense`. */
  initial?: Partial<ExpenseFormInput>;
}

export interface UseExpenseFormResult {
  form: UseFormReturn<ExpenseFormInput, unknown, ExpenseFormOutput>;
  categories: Category[];
  categoriesLoading: boolean;
  submitting: boolean;
  submitError: string | null;
  isEdit: boolean;
  onSubmit: () => Promise<boolean>;
}

export function useExpenseForm({ expense, initial }: UseExpenseFormOptions = {}): UseExpenseFormResult {
  const { user } = useAuthContext();
  const userId = user?.id ?? '';
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const catsQuery = useAsync(() => {
    if (!userId) return Promise.resolve([] as Category[]);
    return categoryService.list(userId);
  }, [userId]);
  const categories = catsQuery.data ?? [];

  /** Conversion stricte (sans Date.now()) : undefined si absent ou invalide. */
  const initialDateMs = typeof initial?.date === 'number' && Number.isFinite(initial.date) ? initial.date : undefined;
  // Valeur dérivée stable au rendu (la règle react-hooks/purity interdit
  // Date.now() directement dans le composant).
  const todayStart = new Date().setHours(0, 0, 0, 0);

  const defaultValues = useMemo<ExpenseFormInput>(
    () => ({
      title: expense?.title ?? initial?.title ?? '',
      amount: (() => {
        const raw = expense?.amount ?? (typeof initial?.amount === 'number' ? initial.amount : undefined);
        return raw === undefined ? '' : String(raw).replace('.', ',');
      })(),
      date: toDateFr(expense?.date ?? initialDateMs ?? todayStart),
      categoryId: expense?.categoryId ?? initial?.categoryId ?? '',
      note: expense?.note ?? initial?.note ?? '',
      receiptImageUri: expense?.receiptImageUri ?? initial?.receiptImageUri ?? null,
      ticketId: expense?.ticketId ?? initial?.ticketId ?? null,
    }),
    [expense, initial],
  );

  const form = useForm<ExpenseFormInput, unknown, ExpenseFormOutput>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues,
    mode: 'onBlur',
  });

  // Synchronise le formulaire si les valeurs initiales changent après montage
  // (ex. : écran d'édition où la dépense arrive en asynchrone).
  useEffect(() => {
    if (expense || initial) form.reset(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset volontaire quand les données arrivent
  }, [defaultValues]);

  // Si les catégories arrivent après le montage et qu'aucune n'est choisie,
  // on ne force rien : le schéma Zod exigera une sélection explicite.
  // Message dérivé au rendu (pas de setState dans un effect — règle purity).
  const noCategoriesError =
    !defaultValues.categoryId && catsQuery.data !== undefined && catsQuery.data.length === 0
      ? 'Aucune catégorie disponible. Créez-en une depuis Réglages.'
      : null;

  const onSubmit = async (): Promise<boolean> => {
    if (!userId) {
      setSubmitError('Session expirée, reconnectez-vous.');
      return false;
    }
    setSubmitting(true);
    setSubmitError(null);
    if (noCategoriesError) {
      setSubmitError(noCategoriesError);
      setSubmitting(false);
      return false;
    }
    try {
      const valid = await form.trigger();
      if (!valid) return false;
      // trigger() a peuplé formState ; on relit les valeurs TRANSFORMÉES par Zod.
      const parsed = expenseFormSchema.safeParse(form.getValues());
      if (!parsed.success) return false;
      const data = parsed.data;

      const payload: NewExpenseInput = {
        userId,
        title: data.title.trim(),
        amount: data.amount,
        date: parseDateFr(data.date)?.getTime() ?? Date.now(),
        categoryId: data.categoryId,
        note: data.note?.trim() || null,
        receiptImageUri: data.receiptImageUri ?? null,
        ticketId: data.ticketId ?? null,
      };

      if (expense) {
        await expenseService.update(expense.id, payload);
      } else {
        await expenseService.create(payload);
      }
      return true;
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Enregistrement impossible.');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    form,
    categories,
    categoriesLoading: catsQuery.loading,
    submitting,
    submitError,
    isEdit: Boolean(expense),
    onSubmit,
  };
}
