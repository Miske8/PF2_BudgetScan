import type { ExpoConfig } from 'expo/config';

/**
 * Configuration Expo Router.
 * - `root` : le dossier `app/` à la racine contient les routes (file-based routing).
 *   C'est le comportement par défaut d'expo-router ; on l'explicite ici.
 */
const config: Pick<ExpoConfig, 'scheme'> = {
  // Le deep-link scheme est défini dans app.json ("budgetscan").
};

export default {
  ...config,
  router: {
    root: './app',
  },
};
