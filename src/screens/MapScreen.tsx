import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { getProperties } from '../lib/properties'
import { Property } from '../types/property'
import { theme } from '../theme/theme'

type NavigationProp = StackNavigationProp<RootStackParamList>

const INITIAL_REGION = {
  latitude: 32.0853,
  longitude: 34.7818,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
}

export default function MapScreen() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<NavigationProp>()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProperties = async () => {
      try {
        const data = await getProperties()
        setProperties(data)
      } catch (error) {
        console.error('Error loading properties:', error)
      } finally {
        setLoading(false)
      }
    }
    loadProperties()
  }, [])

  const handleMarkerPress = (property: Property) => {
    navigation.navigate('PropertyDetail', { property })
  }

  const propertiesWithCoordinates = properties.filter(
    (p) => p.latitude !== null && p.longitude !== null
  )

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={INITIAL_REGION}
        showsUserLocation
        showsMyLocationButton
      >
        {propertiesWithCoordinates.map((property) => (
          <Marker
            key={property.id}
            coordinate={{
              latitude: property.latitude!,
              longitude: property.longitude!,
            }}
            pinColor={theme.colors.primary}
            title={String(property.title || property.address || '')}
            onCalloutPress={() => handleMarkerPress(property)}
          />
        ))}
      </MapView>

      {/* Property count overlay */}
      <View style={[styles.overlay, { top: insets.top + 20 }]}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {propertiesWithCoordinates.length} Properties
          </Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  badge: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
  },
})

