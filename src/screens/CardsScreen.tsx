import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Vibration,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { theme } from '../theme/theme'
import PropertyCard from '../components/PropertyCard'
import { Property } from '../types/property'
import { getProperties } from '../lib/properties'
import { getUpcomingVisitsByProperty } from '../lib/visits'
import { RootStackParamList } from '../navigation/AppNavigator'
import FeatherIcon from 'react-native-vector-icons/Feather'

type NavigationProp = StackNavigationProp<RootStackParamList>

export default function CardsScreen() {
  const navigation = useNavigation<NavigationProp>()
  const [properties, setProperties] = useState<Property[]>([])
  const [visitsByProperty, setVisitsByProperty] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [archivedExpanded, setArchivedExpanded] = useState(false)

  const loadProperties = async () => {
    try {
      setError(null)
      const [propertiesData, visitsData] = await Promise.all([
        getProperties(),
        getUpcomingVisitsByProperty(),
      ])
      setProperties(propertiesData)
      setVisitsByProperty(visitsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadProperties()
  }, [])

  const onRefresh = useCallback(() => {
    Vibration.vibrate(5) // Even shorter/lighter vibration
    setRefreshing(true)
    loadProperties()
  }, [])

  const handlePropertyPress = (property: Property) => {
    navigation.navigate('PropertyDetail', { property })
  }

  const relevantProperties = properties.filter((p) => p.status !== 'Irrelevant')
  const irrelevantProperties = properties.filter((p) => p.status === 'Irrelevant')

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Property Count - Minimalist Badge */}
      <View style={styles.countRow}>
        <Text style={styles.countLabel}>
          {String(relevantProperties.length)} {relevantProperties.length === 1 ? 'relevant property' : 'relevant properties'}
        </Text>
      </View>

      {error ? (
        <View style={styles.emptyContainer}>
          <View style={styles.errorCircle}>
            <FeatherIcon name="alert-circle" size={32} color="#DC2626" />
          </View>
          <Text style={styles.emptyTitle}>Connection Error</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadProperties}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : properties.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <FeatherIcon name="home" size={32} color={theme.colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No properties yet</Text>
          <Text style={styles.emptySubtitle}>
            Your home journey starts here. Add your first property to get started.
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('PropertyForm', {})}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <FeatherIcon name="plus" size={18} color={theme.colors.white} style={{ marginRight: 8 }} />
              <Text style={styles.addButtonText}>Add Property</Text>
            </View>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={relevantProperties}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PropertyCard
              property={item}
              onPress={() => handlePropertyPress(item)}
              upcomingVisits={visitsByProperty[item.id] || []}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            irrelevantProperties.length > 0 ? (
              <View style={styles.irrelevantSection}>
                <View style={styles.separator} />
                <TouchableOpacity
                  style={styles.archivedHeader}
                  onPress={() => setArchivedExpanded(!archivedExpanded)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.irrelevantTitle}>
                    Archived ({String(irrelevantProperties.length)})
                  </Text>
                  <FeatherIcon
                    name={archivedExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={theme.colors.textMuted}
                  />
                </TouchableOpacity>
                {archivedExpanded && (
                  <>
                    {irrelevantProperties.map((property) => (
                      <PropertyCard
                        key={property.id}
                        property={property}
                        onPress={() => handlePropertyPress(property)}
                        upcomingVisits={visitsByProperty[property.id] || []}
                      />
                    ))}
                  </>
                )}
              </View>
            ) : <View style={{ height: 100 }} />
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  countRow: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  countLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: theme.typography.fontFamily,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: -40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  errorCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
  },
  addButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: theme.typography.fontFamily,
  },
  retryButton: {
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryButtonText: {
    color: theme.colors.primary,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: theme.typography.fontFamily,
  },
  irrelevantSection: {
    marginTop: 32,
    paddingBottom: 100,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginBottom: 24,
  },
  archivedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  irrelevantTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
})
