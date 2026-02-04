import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs'
import { useNavigation } from '@react-navigation/native'
import { theme } from '../theme/theme'
import CardsScreen from './CardsScreen'
import MapScreen from './MapScreen'
import StatisticsScreen from './StatisticsScreen'
import FeatherIcon from 'react-native-vector-icons/Feather'
import { logout } from '../lib/auth'

export type DashboardTabParamList = {
  Cards: undefined
  Map: undefined
  Statistics: undefined
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

          let iconName: 'list' | 'map' | 'bar-chart-2' = 'list'
          if (route.name === 'Map') iconName = 'map'
          if (route.name === 'Statistics') iconName = 'bar-chart-2'

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
      <View style={[styles.headerContainer, { paddingTop: insets.top + 16 }]}>
        <View style={styles.header}>
          <View>
            <Text style={styles.titleText}>CasaTrack</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => (navigation as any).navigate('Search')}
              style={styles.actionButton}
              activeOpacity={0.7}
            >
              <FeatherIcon name="search" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => (navigation as any).navigate('PropertyForm', {})}
              style={styles.actionButton}
              activeOpacity={0.7}
            >
              <FeatherIcon name="plus" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={styles.actionButton} activeOpacity={0.7}>
              <FeatherIcon name="log-out" size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>
        <TopTab.Navigator
          tabBar={(props) => <CustomTabBar {...props} />}
          screenOptions={{ swipeEnabled: true }}
        >
          <TopTab.Screen name="Cards" component={CardsScreen} options={{ tabBarLabel: 'Listings' }} />
          <TopTab.Screen name="Map" component={MapScreen} options={{ tabBarLabel: 'Map View' }} />
          <TopTab.Screen name="Statistics" component={StatisticsScreen} options={{ tabBarLabel: 'Stats' }} />
        </TopTab.Navigator>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  headerContainer: {
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  titleText: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
  },
  tabBarWrapper: {
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
})
