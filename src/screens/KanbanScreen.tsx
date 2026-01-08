import React, { useState, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Dimensions,
  LayoutChangeEvent,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated'
import { RootStackParamList } from '../navigation/AppNavigator'
import { getProperties, updatePropertyStatus, formatAddress } from '../lib/properties'
import { Property, PropertyStatus } from '../types/property'
import { PROPERTY_STATUSES, PROPERTY_STATUS_LABELS, getStatusColor } from '../constants/statuses'
import { theme } from '../theme/theme'
import FeatherIcon from 'react-native-vector-icons/Feather'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

type NavigationProp = StackNavigationProp<RootStackParamList>

const formatPrice = (price: number | null) => {
  if (price === null || price === 1) return '—'
  return new Intl.NumberFormat('he-IL', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(price) + ' ₪'
}

interface KanbanCardProps {
  property: Property
  onPress: () => void
  onDragStart: (property: Property, x: number, y: number) => void
  isDragging: boolean
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity)

function KanbanCard({ property, onPress, onDragStart, isDragging }: KanbanCardProps) {
  const opacity = useSharedValue(1)

  const cardStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    }
  })

  const cardRef = useRef<View>(null)

  const onLongPress = () => {
    opacity.value = withSpring(0.3)
    cardRef.current?.measure((x, y, width, height, pageX, pageY) => {
      onDragStart(property, pageX + width / 2, pageY + height / 2)
    })
  }

  const onPressOut = () => {
    if (!isDragging) {
      opacity.value = withSpring(1)
    }
  }

  return (
    <Animated.View ref={cardRef} style={[styles.card, cardStyle, isDragging && styles.cardDragging]}>
      <AnimatedTouchable
        onPress={onPress}
        onLongPress={onLongPress}
        onPressOut={onPressOut}
        activeOpacity={0.7}
        disabled={isDragging}
      >
        <Text style={styles.cardTitle} numberOfLines={2}>
          {property.title || property.address}
        </Text>
        <Text style={styles.cardAddress} numberOfLines={1}>
          {formatAddress(property.address)}
        </Text>

        <View style={styles.cardStats}>
          {property.rooms > 0 && (
            <Text style={styles.cardStat}>{String(property.rooms)}</Text>
          )}
          {property.square_meters && property.square_meters !== 1 && (
            <Text style={styles.cardStat}>{String(property.square_meters)}m²</Text>
          )}
        </View>

        {property.asked_price !== null && property.asked_price !== 1 && (
          <Text style={styles.cardPrice}>{formatPrice(property.asked_price)}</Text>
        )}

        {property.is_flagged && (
          <View style={styles.flaggedBadge}>
            <FeatherIcon name="bookmark" size={10} color={theme.colors.primary} />
          </View>
        )}
      </AnimatedTouchable>
    </Animated.View>
  )
}

export default function KanbanScreen() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<NavigationProp>()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [draggingProperty, setDraggingProperty] = useState<Property | null>(null)
  const [columnLayouts, setColumnLayouts] = useState<Record<string, { x: number; width: number }>>({})
  const [scrollX, setScrollX] = useState(0)
  const scrollViewRef = useRef<ScrollView>(null)

  const dragX = useSharedValue(0)
  const dragY = useSharedValue(0)
  const dragScale = useSharedValue(1)
  const startX = useSharedValue(0)
  const startY = useSharedValue(0)

  const loadProperties = useCallback(async () => {
    try {
      const data = await getProperties()
      const filtered = data.filter(p => p.status !== 'Irrelevant' && p.status !== 'Purchased')
      setProperties(filtered)
    } catch (error) {
      console.error('Error loading properties:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadProperties()
    }, [loadProperties])
  )

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadProperties()
  }, [loadProperties])

  const handleStatusChange = async (propertyId: string, newStatus: PropertyStatus) => {
    try {
      await updatePropertyStatus(propertyId, newStatus)
      setProperties(prev =>
        prev.map(p => (p.id === propertyId ? { ...p, status: newStatus } : p))
      )
    } catch (error) {
      console.error('Error updating property status:', error)
      Alert.alert('Error', 'Failed to update property status')
    }
  }

  const handlePropertyPress = (property: Property) => {
    navigation.navigate('PropertyDetail', { property })
  }

  const getPropertiesByStatus = (status: PropertyStatus) => {
    return properties.filter(p => p.status === status)
  }

  const handleDragStart = (property: Property, x: number, y: number) => {
    setDraggingProperty(property)
    dragX.value = x
    dragY.value = y
    startX.value = x
    startY.value = y
    dragScale.value = withSpring(1.1)
  }

  const handleDragEnd = () => {
    if (!draggingProperty) return

    // Find which column we're over (account for scroll position)
    const currentX = dragX.value
    const targetColumn = Object.entries(columnLayouts).find(([_, layout]) => {
      // Account for scroll offset
      const adjustedX = layout.x - scrollX
      return currentX >= adjustedX && currentX <= adjustedX + layout.width
    })

    if (targetColumn) {
      const newStatus = targetColumn[0] as PropertyStatus
      if (draggingProperty.status !== newStatus) {
        handleStatusChange(draggingProperty.id, newStatus)
      }
    }

    // Reset
    setDraggingProperty(null)
    dragX.value = withSpring(0)
    dragY.value = withSpring(0)
    dragScale.value = withSpring(1)
  }

  const panGesture = Gesture.Pan()
    .enabled(!!draggingProperty)
    .onStart(() => {
      startX.value = dragX.value
      startY.value = dragY.value
    })
    .onUpdate((event) => {
      dragX.value = startX.value + event.translationX
      dragY.value = startY.value + event.translationY
    })
    .onEnd(() => {
      runOnJS(handleDragEnd)()
    })

  const dragOverlayStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: dragX.value - 140 },
        { translateY: dragY.value - 100 },
        { scale: dragScale.value },
      ],
    }
  })

  const onColumnLayout = (status: PropertyStatus, event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout
    setColumnLayouts(prev => ({
      ...prev,
      [status]: { x, width },
    }))
  }

  const availableStatuses = PROPERTY_STATUSES.filter(status => status !== 'Irrelevant' && status !== 'Purchased')
  const columnHeight = SCREEN_HEIGHT - insets.top - insets.bottom - 100

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    )
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Text style={styles.headerTitle}>Board</Text>
        </View>

        <GestureDetector gesture={panGesture}>
          <Animated.View style={styles.boardContainer}>
            <ScrollView
              ref={scrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.columnsContainer}
              scrollEnabled={!draggingProperty}
              onScroll={(e) => setScrollX(e.nativeEvent.contentOffset.x)}
              scrollEventThrottle={16}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={theme.colors.primary}
                />
              }
            >
              {availableStatuses.map((status) => {
                const columnProperties = getPropertiesByStatus(status)
                const statusColor = getStatusColor(status)

                return (
                  <View
                    key={status}
                    style={[styles.column, { height: columnHeight }]}
                    onLayout={(e) => onColumnLayout(status, e)}
                  >
                    <View style={styles.columnHeader}>
                      <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
                      <Text style={styles.columnTitle}>{PROPERTY_STATUS_LABELS[status]}</Text>
                      <View style={styles.countBadge}>
                        <Text style={styles.countText}>{String(columnProperties.length)}</Text>
                      </View>
                    </View>

                    <ScrollView
                      style={styles.columnContent}
                      contentContainerStyle={styles.columnContentInner}
                      scrollEnabled={false}
                      showsVerticalScrollIndicator={false}
                    >
                      {columnProperties.length === 0 ? (
                        <View style={styles.emptyColumn}>
                          <Text style={styles.emptyText}>No properties</Text>
                        </View>
                      ) : (
                        columnProperties.map((property) => (
                          <KanbanCard
                            key={property.id}
                            property={property}
                            onPress={() => handlePropertyPress(property)}
                            onDragStart={handleDragStart}
                            isDragging={draggingProperty?.id === property.id}
                          />
                        ))
                      )}
                    </ScrollView>
                  </View>
                )
              })}
            </ScrollView>

            {/* Drag Overlay */}
            {draggingProperty && (
              <Animated.View style={[styles.dragOverlay, dragOverlayStyle]} pointerEvents="none">
                <View style={styles.dragCard}>
                  <Text style={styles.dragCardTitle} numberOfLines={2}>
                    {draggingProperty.title || draggingProperty.address}
                  </Text>
                  <Text style={styles.dragCardAddress} numberOfLines={1}>
                    {formatAddress(draggingProperty.address)}
                  </Text>
                </View>
              </Animated.View>
            )}
          </Animated.View>
        </GestureDetector>
      </View>
    </GestureHandlerRootView>
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
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
  },
  boardContainer: {
    flex: 1,
  },
  columnsContainer: {
    paddingHorizontal: 16,
  },
  column: {
    width: 280,
    marginRight: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  statusIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: 10,
  },
  columnTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
  },
  countBadge: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
  },
  columnContent: {
    flex: 1,
  },
  columnContentInner: {
    padding: 12,
  },
  emptyColumn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    marginBottom: 4,
  },
  cardAddress: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
    marginBottom: 10,
  },
  cardStats: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  cardStat: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
  },
  flaggedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardDragging: {
    opacity: 0.3,
  },
  dragOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 280,
    zIndex: 1000,
    pointerEvents: 'none',
  },
  dragCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  dragCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    marginBottom: 4,
  },
  dragCardAddress: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
  },
})
