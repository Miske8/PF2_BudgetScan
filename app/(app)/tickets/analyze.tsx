import React from 'react';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';

/** Analyse du ticket scanné (pré-remplissage + correction) — étape 10. */
export default function TicketAnalyzeScreen() {
  return (
    <PlaceholderScreen
      title="Analyse du ticket"
      message="Résultat OCR simulé : montant/date extraits, corrigeables avant enregistrement (étape 10)."
      icon="document-text-outline"
    />
  );
}
