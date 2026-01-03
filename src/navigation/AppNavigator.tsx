import React from 'react'
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { createStackNavigator } from '@react-navigation/stack'
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { theme } from '../theme/theme'
import FeatherIcon from 'react-native-vector-icons/Feather'

import DashboardScreen from '../screens/DashboardScreen'
import AddScreen from '../screens/AddScreen'
import FlaggedScreen from '../screens/FlaggedScreen'
import PropertyDetailScreen from '../screens/PropertyDetailScreen'
import PropertyFormScreen from '../screens/PropertyFormScreen'
import { Property } from '../types/property'

// Define navigation types
export type RootStackParamList = {
  MainTabs: undefined
  PropertyDetail: { property: Property }
  PropertyForm: { property?: Property }
}

export type MainTabParamList = {
  Home: undefined
  Add: undefined
  Saved: undefined
}

const Stack = createStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator<MainTabParamList>()

// --- Custom Tab Bar Component ---

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.barInside}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key]
          const isFocused = state.index === index

          if (route.name === 'Add') {
            return (
              <TouchableOpacity
                key={route.key}
                onPress={() => navigation.navigate('Add')}
                activeOpacity={0.9}
                style={styles.prominentButton}
              >
                <FeatherIcon name="plus" size={28} color={theme.colors.white} />
              </TouchableOpacity>
            )
          }

          let iconName: 'home' | 'bookmark' = route.name === 'Home' ? 'home' : 'bookmark'
          const color = isFocused ? theme.colors.primary : theme.colors.textMuted

          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              <FeatherIcon name={iconName} size={24} color={color} />
              {isFocused && <View style={styles.activeDot} />}
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Add" component={AddScreen} />
      <Tab.Screen name="Saved" component={FlaggedScreen} />
    </Tab.Navigator>
  )
}

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="PropertyDetail"
        component={PropertyDetailScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="PropertyForm"
        component={PropertyFormScreen}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  )
}

const styles = StyleSheet.create({
  tabBarContainer: {
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  barInside: {
    flexDirection: 'row',
    width: '100%',
    height: 70,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
    marginTop: 4,
  },
  prominentButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
})
