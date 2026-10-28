/**
 * Préférences non sensibles — AsyncStorage.
 * (La session, elle, vit dans SecureStore ; le hash jamais ici.)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'budgetscan.onboarding.seen';

export const prefs = {
  async getOnboardingSeen(): Promise<boolean> {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    return value === '1';
  },
  async setOnboardingSeen(seen: boolean): Promise<void> {
    await AsyncStorage.setItem(ONBOARDING_KEY, seen ? '1' : '0');
  },
};
