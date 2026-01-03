import React, { useEffect } from 'react'
import { View, StyleSheet, ActivityIndicator } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { theme } from '../theme/theme'

type NavigationProp = StackNavigationProp<RootStackParamList>

export default function AddScreen() {
  const navigation = useNavigation<NavigationProp>()

  useEffect(() => {
    navigation.navigate('PropertyForm', {})
  }, [navigation])

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
})

