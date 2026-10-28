/**
 * SessionStore — persistance sécurisée de la session (Infrastructure Layer).
 *
 * Le token de session (= user id) est stocké dans expo-secure-store :
 * Keychain (iOS) / Keystore (Android), jamais en clair dans SQLite ou AsyncStorage.
 *
 * Abstrait derrière une interface pour pouvoir basculer plus tard vers un
 * backend (JWT httpOnly cookie, OAuth…) sans toucher aux services ni aux écrans.
 */

import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'budgetscan.session.userId';

export interface SessionStore {
  read(): Promise<string | null>;
  write(userId: string): Promise<void>;
  clear(): Promise<void>;
}

export const secureSessionStore: SessionStore = {
  async read() {
    try {
      return await SecureStore.getItemAsync(SESSION_KEY);
    } catch {
      // SecureStore peut échouer sur certaines plateformes (web) :
      // on traite comme "session absente" plutôt que de bloquer l'app.
      return null;
    }
  },
  async write(userId) {
    await SecureStore.setItemAsync(SESSION_KEY, userId);
  },
  async clear() {
    await SecureStore.deleteItemAsync(SESSION_KEY);
  },
};
