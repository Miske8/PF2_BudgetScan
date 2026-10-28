import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';

/**
 * Icônes des onglets : remplie quand actif, outline sinon.
 */
function TabIcon({
  name,
  color,
  focused,
}: {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  focused: boolean;
}) {
  return <Ionicons name={focused ? name : (`${name}-outline` as never)} size={24} color={color} />;
}

/**
 * Layout des 5 onglets principaux (Accueil, Dépenses, Scan, Budgets, Stats).
 * Le bouton Scan est mis en avant visuellement (pastille centrale).
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textFaint,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Dépenses',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="list" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.scanWrap}>
              <View style={[styles.scanBubble, focused && styles.scanBubbleActive]}>
                <Ionicons name="scan-outline" size={26} color={theme.colors.white} />
              </View>
              <Text style={[styles.tabLabel, { color }]}>Scan</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: 'Budgets',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="wallet" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="pie-chart" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const BUBBLE = 52;

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: theme.colors.surface,
    borderTopColor: theme.colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    height: Platform.OS === 'ios' ? 84 : 64,
    paddingTop: theme.spacing.xs,
  },
  tabItem: { justifyContent: 'center' },
  tabLabel: { fontSize: theme.fontSize.xs, fontWeight: theme.fontFamily.medium },
  scanWrap: { alignItems: 'center', justifyContent: 'flex-end', gap: 2 },
  scanBubble: {
    width: BUBBLE,
    height: BUBBLE,
    borderRadius: BUBBLE / 2,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -BUBBLE / 2 + 10,
    ...theme.shadow.raised,
  },
  scanBubbleActive: { backgroundColor: theme.colors.primaryDark },
});
