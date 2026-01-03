import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs'
import { theme } from '../theme/theme'
import CardsScreen from './CardsScreen'
import KanbanScreen from './KanbanScreen'
import MapScreen from './MapScreen'

export type DashboardTabParamList = {
  Cards: undefined
  Kanban: undefined
  Map: undefined
}

const TopTab = createMaterialTopTabNavigator<DashboardTabParamList>()

// Custom Tab Bar (Pill style)
function CustomTabBar({ state, descriptors, navigation }: MaterialTopTabBarProps) {
  return (
    <View style={styles.tabBarWrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key]
          const label = options.tabBarLabel ?? route.name
          const isFocused = state.index === index

          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              style={[styles.tabButton, isFocused && styles.tabButtonActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                {String(label)}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets()
  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })

  return (
    <View style={styles.container}>
      {/* Refined Header */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View>
          <Text style={styles.titleText}>CasaTrack</Text>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>
        <TopTab.Navigator
          tabBar={(props) => <CustomTabBar {...props} />}
          screenOptions={{ swipeEnabled: true }}
        >
          <TopTab.Screen name="Cards" component={CardsScreen} options={{ tabBarLabel: 'Listings' }} />
          <TopTab.Screen name="Kanban" component={KanbanScreen} options={{ tabBarLabel: 'Board' }} />
          <TopTab.Screen name="Map" component={MapScreen} options={{ tabBarLabel: 'Map View' }} />
        </TopTab.Navigator>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  dateText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily,
    fontWeight: '600',
    marginBottom: 4,
  },
  titleText: {
    fontSize: 34,
    fontWeight: '800',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
  },
  profileContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surface,
    padding: 2,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  profilePlaceholder: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  tabBarWrapper: {
    paddingVertical: 12,
    backgroundColor: theme.colors.background,
  },
  tabBarContainer: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  tabButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tabButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
  },
  tabLabelActive: {
    color: theme.colors.white,
  },
})


