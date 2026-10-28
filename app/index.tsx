import { StyleSheet, Text, View } from 'react-native';

/**
 * Écran temporaire de vérification du wiring Expo Router (Étape 2).
 * Sera remplacé par l'onboarding à l'étape 6.
 */
export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>BudgetScan ✅</Text>
      <Text style={styles.subtitle}>
        Projet initialisé : Expo SDK 54 + TypeScript strict + Expo Router
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { marginTop: 8, textAlign: 'center', opacity: 0.7 },
});
