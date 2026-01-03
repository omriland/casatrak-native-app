import React, { useState, useEffect, useRef } from 'react'
import { StatusBar, ActivityIndicator, View, StyleSheet, AppState } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

import AppNavigator from './src/navigation/AppNavigator'
import LoginScreen from './src/screens/LoginScreen'
import { isAuthenticated } from './src/lib/auth'
import { theme } from './src/theme/theme'
import { LogBox } from 'react-native'

// Ignore specific deprecation warnings from libraries
LogBox.ignoreLogs(['InteractionManager has been deprecated'])

export default function App() {
  const [loading, setLoading] = useState(true)
  const [loggedIn, setLoggedIn] = useState(false)
  const navigationRef = useRef<any>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  // Listen for app state changes to re-check auth (useful after logout)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkAuth()
      }
    })

    return () => {
      subscription.remove()
    }
  }, [])

  const checkAuth = async () => {
    try {
      const authenticated = await isAuthenticated()
      setLoggedIn(authenticated)
    } catch (error) {
      console.error('Auth check failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = () => {
    setLoggedIn(true)
  }

  const handleNavigationStateChange = () => {
    // Re-check auth on navigation state changes
    checkAuth()
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    )
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <NavigationContainer ref={navigationRef} onStateChange={handleNavigationStateChange}>
          {loggedIn ? <AppNavigator /> : <LoginScreen onLogin={handleLogin} />}
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
})

