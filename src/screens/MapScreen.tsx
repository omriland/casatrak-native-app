import React, { useState, useEffect, useMemo, useRef } from 'react'
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Linking } from 'react-native'
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
import IonIcon from 'react-native-vector-icons/Ionicons'

interface TransitStation {
  id: string
  name: string
  latitude: number
  longitude: number
  type?: string
  routes?: string[] // Bus/train line numbers or route names
}

type NavigationProp = StackNavigationProp<RootStackParamList>

const DEFAULT_REGION: Region = {
  latitude: 32.0853, // Tel Aviv area
  longitude: 34.7818,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
}

// Get marker color based on status and flagged state (matching web version logic)
// Note: pinColor only supports 'red', 'green', 'purple' - we use custom marker for grey (irrelevant)
const getMarkerPinColor = (property: Property): 'red' | 'green' | 'purple' | null => {
  // Irrelevant properties use custom grey marker (return null to use custom view)
  if (property.status === 'Irrelevant') {
    return null // Use custom grey marker instead
  }

  // Flagged properties always get amber/yellow color -> map to 'red' (closest)
  if (property.is_flagged) {
    return 'red' // Amber/yellow for flagged (closest to red)
  }

  // Status-based colors (matching web version)
  const isInterested = property.status === 'Interested'
  const isVisited = property.status === 'Visited'

  if (isInterested) {
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
  const [selectedTransitStation, setSelectedTransitStation] = useState<TransitStation | null>(null)
  const mapRef = useRef<MapView>(null)

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

      // Query to get bus stops and train stations with route information
      const query = `
        [out:json][timeout:20];
        (
          node["highway"="bus_stop"](${minLat},${minLng},${maxLat},${maxLng});
          node["railway"="station"](${minLat},${minLng},${maxLat},${maxLng});
        );
        out body;
        (
          way(around:50)["route"="bus"]["ref"];
          relation(around:50)["route"="bus"]["ref"];
        );
        out body;
      `

      // Try multiple Overpass API endpoints for better reliability
      const endpoints = [
        'https://overpass-api.de/api/interpreter',
        'https://overpass.kumi.systems/api/interpreter',
      ]

      let stations: TransitStation[] = []
      let lastError: Error | null = null

      for (const endpoint of endpoints) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `data=${encodeURIComponent(query)}`,
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
          }

          const data = await response.json()

          // Process nodes (stations/stops) and extract route information
          if (data.elements) {
            data.elements.forEach((element: any, index: number) => {
              if (element.type === 'node' && element.lat && element.lon) {
                const routeRefs: string[] = []
                
                // Extract routes from various tag formats
                if (element.tags?.route_ref) {
                  // Multiple routes separated by semicolon or comma
                  const refs = element.tags.route_ref.split(/[;,]/).map((r: string) => r.trim()).filter(Boolean)
                  routeRefs.push(...refs)
                }
                if (element.tags?.routes) {
                  const refs = element.tags.routes.split(/[;,]/).map((r: string) => r.trim()).filter(Boolean)
                  routeRefs.push(...refs)
                }
                if (element.tags?.bus_routes) {
                  const refs = element.tags.bus_routes.split(/[;,]/).map((r: string) => r.trim()).filter(Boolean)
                  routeRefs.push(...refs)
                }
                // Check if ref itself is a route number (common for bus stops)
                if (element.tags?.ref && element.tags?.highway === 'bus_stop') {
                  const ref = element.tags.ref.trim()
                  // If ref looks like a route number (digits or alphanumeric)
                  if (/^[\dA-Z]+$/.test(ref) && ref.length <= 4) {
                    routeRefs.push(ref)
                  }
                }

                // Remove duplicates and sort
                const uniqueRoutes = [...new Set(routeRefs)].sort((a, b) => {
                  const numA = parseInt(a) || 9999
                  const numB = parseInt(b) || 9999
                  return numA - numB
                })

                stations.push({
                  id: `transit-${element.id || index}`,
                  name: element.tags?.name || element.tags?.ref || 'Transit Station',
                  latitude: element.lat,
                  longitude: element.lon,
                  type: element.tags?.railway || element.tags?.highway || 'station',
                  routes: uniqueRoutes.length > 0 ? uniqueRoutes : undefined,
                })
              }
            })
          }

          // If we got results, break out of the loop
          if (stations.length > 0) {
            break
          }
        } catch (err: any) {
          lastError = err
          // Continue to next endpoint
          continue
        }
      }

      // If we got stations, use them (limit to reasonable number)
      if (stations.length > 0) {
        setTransitStations(stations.slice(0, 100))
      } else {
        // Fallback: Use common Tel Aviv transit stations
        throw lastError || new Error('No transit stations found')
      }
    } catch (error) {
      console.warn('Error loading transit stations, using fallback:', error)
      // Fallback: Use some common Tel Aviv transit stations with sample routes
      const { latitude, longitude } = mapRegion
      setTransitStations([
        { id: 'ta-central', name: 'Tel Aviv Central', latitude: 32.0853, longitude: 34.7818, type: 'station', routes: ['1', '4', '5', '18', '25'] },
        { id: 'ta-hashalom', name: 'Hashalom', latitude: 32.0733, longitude: 34.7911, type: 'station', routes: ['10', '13', '16', '25'] },
        { id: 'ta-university', name: 'Tel Aviv University', latitude: 32.1133, longitude: 34.8044, type: 'station', routes: ['7', '13', '18', '25', '45'] },
        { id: 'ta-savidor', name: 'Savidor Central', latitude: 32.0833, longitude: 34.7878, type: 'station', routes: ['1', '4', '5', '10', '16'] },
        { id: 'ta-hagana', name: 'HaHagana', latitude: 32.0606, longitude: 34.7856, type: 'station', routes: ['4', '5', '7', '18'] },
      ])
    } finally {
      setLoadingTransit(false)
    }
  }

  const handleMarkerPress = (property: Property) => {
    navigation.navigate('PropertyDetail', { property })
  }

  const handleFitToProperties = () => {
    if (!mapRef.current || visibleProperties.length === 0) return

    const coordinates = visibleProperties
      .filter((p) => p.latitude !== null && p.longitude !== null)
      .map((p) => ({
        latitude: p.latitude!,
        longitude: p.longitude!,
      }))

    if (coordinates.length > 0) {
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: {
          top: 100,
          right: 50,
          bottom: 100,
          left: 50,
        },
        animated: true,
      })
    }
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
        ref={mapRef}
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
          const isIrrelevant = property.status === 'Irrelevant'
          
          return (
            <Marker
              key={property.id}
              coordinate={{
                latitude: property.latitude!,
                longitude: property.longitude!,
              }}
              pinColor={isIrrelevant ? undefined : markerPinColor}
              anchor={isIrrelevant ? { x: 0.5, y: 0.5 } : undefined}
              title={property.title || property.address || 'Property'}
            >
              {isIrrelevant && (
                <View style={styles.greyMarker}>
                  <View style={styles.greyMarkerPin} />
                </View>
              )}
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
                      <Text style={styles.statValue}>{String(property.rooms || '—')}</Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Size:</Text>
                      <Text style={styles.statValue}>
                        {property.square_meters && property.square_meters !== 1
                          ? `${String(property.square_meters)}m²`
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
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.transitMarker}>
                <View style={styles.transitIconContainer}>
                  <IonIcon name="bus" size={10} color="#9CA3AF" />
                </View>
              </View>
              <Callout tooltip={false}>
                <View style={styles.transitCallout}>
                  {/* Close Button */}
                  <TouchableOpacity
                    style={styles.calloutCloseButton}
                    onPress={() => {
                      // Close callout by deselecting
                      setSelectedTransitStation(null)
                    }}
                  >
                    <FeatherIcon name="x" size={16} color={theme.colors.textSecondary} />
                  </TouchableOpacity>

                  {/* Station Name */}
                  <Text style={styles.transitCalloutTitle} numberOfLines={2}>
                    {String(station.name || 'Transit Station')}
                  </Text>
                  
                  {/* Bus Lines with Icon */}
                  {station.routes && Array.isArray(station.routes) && station.routes.length > 0 && (
                    <View style={styles.routesContainer}>
                      <View style={styles.routesList}>
                        {station.routes
                          .filter((route) => route != null && route !== '')
                          .slice(0, 8)
                          .map((route, idx) => {
                            // Assign colors to routes (cycling through purple and orange-brown)
                            const colors = ['#8B5CF6', '#D97706', '#8B5CF6', '#D97706'] // Purple and orange-brown
                            const isFirst = idx === 0
                            const routeColor = isFirst ? undefined : colors[(idx - 1) % colors.length]
                            
                            return (
                              <View
                                key={`route-${idx}-${route}`}
                                style={[
                                  styles.routeBadge,
                                  isFirst && styles.routeBadgeWhite,
                                  !isFirst && { backgroundColor: routeColor },
                                  idx > 0 && { marginLeft: 6 },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.routeText,
                                    isFirst && styles.routeTextDark,
                                  ]}
                                >
                                  {String(route)}
                                </Text>
                              </View>
                            )
                          })}
                        {station.routes.filter((route) => route != null && route !== '').length > 8 && (
                          <Text style={[styles.moreRoutesText, { marginLeft: 6 }]}>
                            +{String(station.routes.filter((route) => route != null && route !== '').length - 8)}
                          </Text>
                        )}
                        {/* Bus Icon */}
                        <View style={styles.busIconContainer}>
                          <IonIcon name="bus" size={18} color={theme.colors.textSecondary} />
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              </Callout>
            </Marker>
          ))}
      </MapView>

      {/* Property count overlay - Top Left */}
      <View style={[styles.countBadge, { top: Math.max(insets.top - 50, 0), left: 24 }]}>
        <TouchableOpacity
          style={styles.badge}
          onPress={handleFitToProperties}
          activeOpacity={0.7}
          disabled={visibleProperties.length === 0}
        >
          <FeatherIcon name="map-pin" size={14} color={theme.colors.primary} style={{ marginRight: 8 }} />
          <Text style={styles.badgeText}>
            {String(visibleProperties.length)} {visibleProperties.length === 1 ? 'Property' : 'Properties'}
          </Text>
        </TouchableOpacity>
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
            
            {/* Show Irrelevant Properties */}
            <TouchableOpacity
              style={[styles.layerMenuItem, showIrrelevant && styles.layerMenuItemActive]}
              onPress={() => setShowIrrelevant(!showIrrelevant)}
              activeOpacity={0.7}
            >
              <View style={styles.layerMenuItemContent}>
                <FeatherIcon
                  name={showIrrelevant ? 'eye' : 'eye-off'}
                  size={16}
                  color={showIrrelevant ? theme.colors.primary : theme.colors.textSecondary}
                />
                <Text style={[styles.layerMenuItemText, showIrrelevant && styles.layerMenuItemTextActive]}>
                  Show Irrelevant
                </Text>
              </View>
              {showIrrelevant && (
                <FeatherIcon name="check" size={18} color={theme.colors.primary} />
              )}
            </TouchableOpacity>

            {/* Show Transit Stations */}
            <TouchableOpacity
              style={[styles.layerMenuItem, showTransit && styles.layerMenuItemActive]}
              onPress={() => setShowTransit(!showTransit)}
              activeOpacity={0.7}
            >
              <View style={styles.layerMenuItemContent}>
                <FeatherIcon
                  name="map"
                  size={16}
                  color={showTransit ? theme.colors.primary : theme.colors.textSecondary}
                />
                <Text style={[styles.layerMenuItemText, showTransit && styles.layerMenuItemTextActive]}>
                  Transit Stations
                </Text>
              </View>
              {showTransit && (
                <FeatherIcon name="check" size={18} color={theme.colors.primary} />
              )}
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
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  layerMenuItemActive: {
    backgroundColor: theme.colors.primary + '08', // 8% opacity
    borderBottomColor: 'transparent',
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
  layerMenuItemTextActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  transitCallout: {
    width: 240,
    padding: 16,
    paddingTop: 20,
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
  },
  calloutCloseButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  transitCalloutTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    marginBottom: 12,
    textAlign: 'center',
    paddingRight: 24, // Space for close button
  },
  transitCalloutType: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
    marginBottom: 8,
  },
  routesContainer: {
    marginBottom: 12,
  },
  routesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  routeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeBadgeWhite: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  routeText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily,
  },
  routeTextDark: {
    color: theme.colors.text,
  },
  moreRoutesText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily,
    fontWeight: '600',
    marginLeft: 4,
  },
  busIconContainer: {
    marginLeft: 8,
    padding: 4,
  },
  googleMapsLink: {
    marginTop: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  googleMapsLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
    fontFamily: theme.typography.fontFamily,
    textDecorationLine: 'underline',
  },
  transitMarker: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transitIconContainer: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
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
  greyMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  greyMarkerPin: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#9CA3AF', // Grey color matching irrelevant status
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
})
