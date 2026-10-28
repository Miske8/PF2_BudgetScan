import React from 'react';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';

/** Ajout manuel de dépense — étape 8. Route : /expenses/new */
export default function NewExpenseScreen() {
  return (
    <PlaceholderScreen
      title="Nouvelle dépense"
      message="Formulaire RHF + Zod : titre, montant, date, catégorie, note (étape 8)."
      icon="add-circle-outline"
    />
  );
}
