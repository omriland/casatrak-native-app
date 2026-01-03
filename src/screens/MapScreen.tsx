import React, { useState, useEffect, useMemo } from 'react'
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import MapView, { Marker, PROVIDER_DEFAULT, Region, Callout } from 'react-native-maps'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { getProperties } from '../lib/properties'
import { Property, PropertyStatus } from '../types/property'
import { theme } from '../theme/theme'
import { getStatusLabel, getStatusColor } from '../constants/statuses'
import FeatherIcon from 'react-native-vector-icons/Feather'

interface TransitStation {
  id: string
  name: string
  latitude: number
  longitude: number
  type?: string
}

type NavigationProp = StackNavigationProp<RootStackParamList>

const DEFAULT_REGION: Region = {
  latitude: 32.0853, // Tel Aviv area
  longitude: 34.7818,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
}

// Get marker color based on status and flagged state (matching web version logic)
// Note: pinColor only supports 'red', 'green', 'purple' - we map to closest match
const getMarkerPinColor = (property: Property): 'red' | 'green' | 'purple' => {
  // Flagged properties always get amber/yellow color -> map to 'red' (closest)
  if (property.is_flagged) {
    return 'red' // Amber/yellow for flagged (closest to red)
  }

  // Status-based colors (matching web version)
  const isIrrelevant = property.status === 'Irrelevant'
  const isInterested = property.status === 'Interested'
  const isVisited = property.status === 'Visited'

  if (isIrrelevant) {
    return 'purple' // Gray -> purple (closest)
  } else if (isInterested) {
    return 'red' // Dark yellow -> red (closest)
  } else if (isVisited) {
    return 'purple' // Light blue -> purple (closest)
  } else {
    // Default: primary teal color -> green (closest)
    return 'green' // Primary teal -> green (closest)
  }
}

// Get actual color for callout/styling (matching web version exactly)
const getMarkerColor = (property: Property): string => {
  // Flagged properties always get amber/yellow color
  if (property.is_flagged) {
    return '#f59e0b' // Amber/yellow for flagged
  }

  // Status-based colors (matching web version)
  const isIrrelevant = property.status === 'Irrelevant'
  const isInterested = property.status === 'Interested'
  const isVisited = property.status === 'Visited'

  if (isIrrelevant) {
    return '#64748b' // Gray
  } else if (isInterested) {
    return '#ca8a04' // Dark yellow (yellow-600)
  } else if (isVisited) {
    return '#60a5fa' // Light blue (blue-400)
  } else {
    // Default: primary teal color
    return theme.colors.primary // Primary black/teal
  }
}

// Check if property should show "NEW" badge (Seen or Interested status)
const isNewProperty = (status: PropertyStatus): boolean => {
  return status === 'Seen' || status === 'Interested'
}

// Format price for display
const formatPrice = (price: number | null): string => {
  if (price === null || price === 1) return 'Unknown'
  return new Intl.NumberFormat('he-IL', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(price) + ' ₪'
}

export default function MapScreen() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<NavigationProp>()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [showIrrelevant, setShowIrrelevant] = useState(false)
  const [showTransit, setShowTransit] = useState(false)
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false)
  const [transitStations, setTransitStations] = useState<TransitStation[]>([])
  const [loadingTransit, setLoadingTransit] = useState(false)

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

  // Load transit stations when toggle is enabled
  useEffect(() => {
    if (showTransit && mapRegion) {
      loadTransitStations()
    } else {
      setTransitStations([])
    }
  }, [showTransit, mapRegion])

  const loadTransitStations = async () => {
    if (!mapRegion) return

    setLoadingTransit(true)
    try {
      // Use Overpass API to get transit stations in the visible area
      const { latitude, longitude, latitudeDelta, longitudeDelta } = mapRegion
      const minLat = latitude - latitudeDelta / 2
      const maxLat = latitude + latitudeDelta / 2
      const minLng = longitude - longitudeDelta / 2
      const maxLng = longitude + longitudeDelta / 2

      // Query for public transport stations (bus stops, train stations, etc.)
      const query = `
        [out:json][timeout:25];
        (
          node["public_transport"="station"](${minLat},${minLng},${maxLat},${maxLng});
          node["public_transport"="stop_position"](${minLat},${minLng},${maxLat},${maxLng});
          node["railway"="station"](${minLat},${minLng},${maxLat},${maxLng});
          node["railway"="halt"](${minLat},${minLng},${maxLat},${maxLng});
          node["highway"="bus_stop"](${minLat},${minLng},${maxLat},${maxLng});
        );
        out body;
        >;
        out skel qt;
      `

      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(query)}`,
      })

      if (!response.ok) {
        throw new Error('Failed to fetch transit data')
      }

      const data = await response.json()
      const stations: TransitStation[] = []

      // Process nodes
      if (data.elements) {
        data.elements.forEach((element: any, index: number) => {
          if (element.type === 'node' && element.lat && element.lon) {
            stations.push({
              id: `transit-${element.id || index}`,
              name: element.tags?.name || element.tags?.ref || 'Transit Station',
              latitude: element.lat,
              longitude: element.lon,
              type: element.tags?.public_transport || element.tags?.railway || element.tags?.highway || 'station',
            })
          }
        })
      }

      // Limit to reasonable number to avoid performance issues
      setTransitStations(stations.slice(0, 100))
    } catch (error) {
      console.error('Error loading transit stations:', error)
      // Fallback: Use some common Tel Aviv transit stations
      setTransitStations([
        { id: 'ta-central', name: 'Tel Aviv Central', latitude: 32.0853, longitude: 34.7818, type: 'station' },
        { id: 'ta-hashalom', name: 'Hashalom', latitude: 32.0733, longitude: 34.7911, type: 'station' },
        { id: 'ta-university', name: 'Tel Aviv University', latitude: 32.1133, longitude: 34.8044, type: 'station' },
      ])
    } finally {
      setLoadingTransit(false)
    }
  }

  const handleMarkerPress = (property: Property) => {
    navigation.navigate('PropertyDetail', { property })
  }

  // Filter properties based on layer settings
  const visibleProperties = useMemo(() => {
    return properties.filter(
      (p) =>
        (showIrrelevant || p.status !== 'Irrelevant') &&
        p.status !== 'Purchased' &&
        p.latitude !== null &&
        p.longitude !== null
    )
  }, [properties, showIrrelevant])

  // All properties with coordinates (for count display)
  const allPropertiesWithCoords = useMemo(() => {
    return properties.filter((p) => p.latitude !== null && p.longitude !== null)
  }, [properties])

  // Calculate map region to fit all visible properties
  const mapRegion = useMemo((): Region => {
    if (visibleProperties.length === 0) {
      return DEFAULT_REGION
    }

    const latitudes = visibleProperties.map((p) => p.latitude!)
    const longitudes = visibleProperties.map((p) => p.longitude!)

    const minLat = Math.min(...latitudes)
    const maxLat = Math.max(...latitudes)
    const minLng = Math.min(...longitudes)
    const maxLng = Math.max(...longitudes)

    const centerLat = (minLat + maxLat) / 2
    const centerLng = (minLng + maxLng) / 2

    // Calculate deltas with padding
    const latDelta = Math.max(maxLat - minLat, 0.01) * 1.5 // Add 50% padding
    const lngDelta = Math.max(maxLng - minLng, 0.01) * 1.5 // Add 50% padding

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: Math.max(latDelta, 0.01), // Minimum delta
      longitudeDelta: Math.max(lngDelta, 0.01), // Minimum delta
    }
  }, [visibleProperties])

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Overlay to close layer menu when tapping outside */}
      {isLayerMenuOpen && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setIsLayerMenuOpen(false)}
        />
      )}
      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        region={mapRegion}
        showsUserLocation
        showsMyLocationButton
        showsTraffic={false}
        showsBuildings={true}
      >
        {visibleProperties.map((property) => {
          const markerPinColor = getMarkerPinColor(property)
          const markerColor = getMarkerColor(property)
          const showNewBadge = isNewProperty(property.status)

          return (
            <Marker
              key={property.id}
              coordinate={{
                latitude: property.latitude!,
                longitude: property.longitude!,
              }}
              pinColor={markerPinColor}
              title={property.title || property.address || 'Property'}
            >
              <Callout onPress={() => handleMarkerPress(property)}>
                <View style={styles.calloutContainer}>
                  {/* NEW Badge */}
                  {showNewBadge && (
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>NEW</Text>
                    </View>
                  )}
                  
                  {/* Property Title */}
                  <Text style={styles.calloutTitle} numberOfLines={2}>
                    {property.title || property.address || 'Property'}
                  </Text>
                  
                  {/* Address */}
                  <Text style={styles.calloutAddress} numberOfLines={1}>
                    {property.address}
                  </Text>
                  
                  {/* Status Badge */}
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(property.status) + '20' }]}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(property.status) }]} />
                    <Text style={[styles.statusText, { color: getStatusColor(property.status) }]}>
                      {getStatusLabel(property.status)}
                    </Text>
                  </View>
                  
                  {/* Property Stats */}
                  <View style={styles.statsContainer}>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Rooms:</Text>
                      <Text style={styles.statValue}>{property.rooms}</Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Size:</Text>
                      <Text style={styles.statValue}>
                        {property.square_meters && property.square_meters !== 1
                          ? `${property.square_meters}m²`
                          : 'Unknown'}
                      </Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Price:</Text>
                      <Text style={styles.statValue}>{formatPrice(property.asked_price)}</Text>
                    </View>
                    {property.price_per_meter &&
                      property.asked_price !== null &&
                      property.asked_price !== 1 &&
                      property.square_meters !== null &&
                      property.square_meters !== 1 && (
                        <View style={styles.statRow}>
                          <Text style={styles.statLabel}>Per m²:</Text>
                          <Text style={styles.statValue}>
                            {formatPrice(Math.round(property.price_per_meter))}
                          </Text>
                        </View>
                      )}
                  </View>
                  
                  {/* Tap to view details */}
                  <Text style={styles.tapHint}>Tap to view details</Text>
                </View>
              </Callout>
            </Marker>
          )
        })}

        {/* Transit Station Markers */}
        {showTransit &&
          transitStations.map((station) => (
            <Marker
              key={station.id}
              coordinate={{
                latitude: station.latitude,
                longitude: station.longitude,
              }}
              pinColor="blue"
              title={station.name}
            >
              <Callout>
                <View style={styles.transitCallout}>
                  <Text style={styles.transitCalloutTitle}>{station.name}</Text>
                  <Text style={styles.transitCalloutType}>
                    {station.type === 'station' ? 'Train Station' : 
                     station.type === 'stop_position' ? 'Transit Stop' :
                     station.type === 'bus_stop' ? 'Bus Stop' : 'Transit Station'}
                  </Text>
                </View>
              </Callout>
            </Marker>
          ))}
      </MapView>

      {/* Property count overlay - Top Left */}
      <View style={[styles.countBadge, { top: Math.max(insets.top - 50, 0), left: 24 }]}>
        <View style={styles.badge}>
          <FeatherIcon name="map-pin" size={14} color={theme.colors.primary} style={{ marginRight: 8 }} />
          <Text style={styles.badgeText}>
            {visibleProperties.length} {visibleProperties.length === 1 ? 'Property' : 'Properties'}
          </Text>
        </View>
      </View>

      {/* Layer Controls - Top Right */}
      <View style={[styles.layerControls, { top: Math.max(insets.top - 50, 0), right: 24 }]}>
        <TouchableOpacity
          style={styles.layerButton}
          onPress={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
          activeOpacity={0.7}
        >
          <FeatherIcon name="layers" size={18} color={theme.colors.text} />
        </TouchableOpacity>

        {isLayerMenuOpen && (
          <View style={styles.layerMenu}>
            <Text style={styles.layerMenuTitle}>Layers</Text>
            
            {/* Show Irrelevant Properties Toggle */}
            <TouchableOpacity
              style={styles.layerMenuItem}
              onPress={() => setShowIrrelevant(!showIrrelevant)}
              activeOpacity={0.7}
            >
              <View style={styles.layerMenuItemContent}>
                <FeatherIcon
                  name={showIrrelevant ? 'eye' : 'eye-off'}
                  size={16}
                  color={theme.colors.textSecondary}
                />
                <Text style={styles.layerMenuItemText}>Show Irrelevant</Text>
              </View>
              <View style={[styles.toggle, showIrrelevant && styles.toggleActive]}>
                <View style={[styles.toggleThumb, showIrrelevant && styles.toggleThumbActive]} />
              </View>
            </TouchableOpacity>

            {/* Show Transit Stations Toggle */}
            <TouchableOpacity
              style={styles.layerMenuItem}
              onPress={() => setShowTransit(!showTransit)}
              activeOpacity={0.7}
            >
              <View style={styles.layerMenuItemContent}>
                <FeatherIcon
                  name={showTransit ? 'map' : 'map'}
                  size={16}
                  color={theme.colors.textSecondary}
                />
                <Text style={styles.layerMenuItemText}>Transit Stations</Text>
              </View>
              <View style={[styles.toggle, showTransit && styles.toggleActive]}>
                <View style={[styles.toggleThumb, showTransit && styles.toggleThumbActive]} />
              </View>
            </TouchableOpacity>
          </View>
        )}
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
  countBadge: {
    position: 'absolute',
    zIndex: 10,
  },
  layerControls: {
    position: 'absolute',
    zIndex: 10,
  },
  layerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  layerMenu: {
    position: 'absolute',
    top: 52,
    right: 0,
    width: 200,
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    padding: 12,
  },
  layerMenuTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  layerMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  layerMenuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  layerMenuItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    marginLeft: 10,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: theme.colors.primary,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    position: 'absolute',
    left: 2,
  },
  toggleThumbActive: {
    left: 22,
  },
  transitCallout: {
    padding: 8,
    minWidth: 150,
  },
  transitCalloutTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    marginBottom: 4,
  },
  transitCalloutType: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    paddingHorizontal: 16,
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
  calloutContainer: {
    width: 250,
    padding: 12,
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  newBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: theme.colors.white,
  },
  newBadgeText: {
    color: theme.colors.white,
    fontSize: 9,
    fontWeight: '700',
    fontFamily: theme.typography.fontFamily,
    letterSpacing: 0.3,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    marginBottom: 4,
    paddingRight: 50, // Space for NEW badge
  },
  calloutAddress: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: theme.typography.fontFamily,
  },
  statsContainer: {
    marginBottom: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
  },
  tapHint: {
    fontSize: 10,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily,
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
})
