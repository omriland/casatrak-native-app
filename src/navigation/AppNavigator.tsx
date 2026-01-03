import React from 'react'
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { createStackNavigator } from '@react-navigation/stack'
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { theme } from '../theme/theme'

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

// --- Minimalist Icons ---

const HomeIcon = ({ color }: { color: string }) => (
  <View style={styles.iconWrapper}>
    <View style={[styles.homeRoof, { borderBottomColor: color }]} />
    <View style={[styles.homeBase, { borderColor: color, borderTopWidth: 0 }]} />
  </View>
)

const SavedIcon = ({ color }: { color: string }) => (
  <View style={styles.iconWrapper}>
    <View style={[styles.flagPole, { backgroundColor: color }]} />
    <View style={[styles.flagBannerBody, { backgroundColor: color }]} />
  </View>
)

const AddIcon = () => (
  <View style={styles.addIconContent}>
    <View style={styles.addPlusHorizontal} />
    <View style={styles.addPlusVertical} />
  </View>
)

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
                <AddIcon />
              </TouchableOpacity>
            )
          }

          let IconComponent = route.name === 'Home' ? HomeIcon : SavedIcon
          const color = isFocused ? theme.colors.primary : theme.colors.textMuted

          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              <IconComponent color={color} />
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
  iconWrapper: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeRoof: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: theme.colors.textMuted,
    marginBottom: -1,
  },
  homeBase: {
    width: 16,
    height: 10,
    borderWidth: 2,
    borderTopWidth: 0,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  flagPole: {
    width: 2,
    height: 14,
    borderRadius: 1,
    position: 'absolute',
    left: 4,
  },
  flagBannerBody: {
    width: 12,
    height: 8,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    position: 'absolute',
    left: 6,
    top: 5,
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
  },
  addIconContent: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPlusHorizontal: {
    width: 18,
    height: 3,
    backgroundColor: theme.colors.white,
    borderRadius: 1.5,
    position: 'absolute',
  },
  addPlusVertical: {
    width: 3,
    height: 18,
    backgroundColor: theme.colors.white,
    borderRadius: 1.5,
    position: 'absolute',
  },
})
