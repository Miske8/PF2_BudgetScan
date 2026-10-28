import React from 'react';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';

/** Création de compte local — implémenté à l'étape 6. */
export default function RegisterScreen() {
  return (
    <PlaceholderScreen
      title="Créer un compte"
      message="Compte 100 % local : email, mot de passe hashé en SQLite (étape 6)."
      icon="person-add-outline"
    />
  );
}
