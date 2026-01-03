import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs'
import { useNavigation } from '@react-navigation/native'
import { theme } from '../theme/theme'
import CardsScreen from './CardsScreen'
import KanbanScreen from './KanbanScreen'
import MapScreen from './MapScreen'
import FeatherIcon from 'react-native-vector-icons/Feather'
import { logout } from '../lib/auth'

export type DashboardTabParamList = {
  Cards: undefined
  Kanban: undefined
  Map: undefined
}

const TopTab = createMaterialTopTabNavigator<DashboardTabParamList>()

// Custom Tab Bar (Pill style with Icons)
function CustomTabBar({ state, descriptors, navigation }: MaterialTopTabBarProps) {
  return (
    <View style={styles.tabBarWrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key]
          const label = options.tabBarLabel ?? route.name
          const isFocused = state.index === index

          let iconName: 'list' | 'columns' | 'map' = 'list'
          if (route.name === 'Kanban') iconName = 'columns'
          if (route.name === 'Map') iconName = 'map'

          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              style={[styles.tabButton, isFocused && styles.tabButtonActive]}
              activeOpacity={0.8}
            >
              <FeatherIcon
                name={iconName}
                size={14}
                color={isFocused ? theme.colors.white : theme.colors.textSecondary}
                style={{ marginRight: 6 }}
              />
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
  const navigation = useNavigation()

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout()
            // Small delay to ensure logout completes, then trigger navigation reset
            // This will cause App.tsx to re-check auth via handleNavigationStateChange
            setTimeout(() => {
              navigation.getParent()?.reset({
                index: 0,
                routes: [{ name: 'MainTabs' as never }],
              })
            }, 100)
          },
        },
      ]
    )
  }

  return (
    <View style={styles.container}>
      {/* Refined Header */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View>
          <Text style={styles.titleText}>CasaTrack</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <FeatherIcon name="log-out" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
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
  titleText: {
    fontSize: 34,
    fontWeight: '800',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  tabButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
  },
  tabLabelActive: {
    color: theme.colors.white,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
})
