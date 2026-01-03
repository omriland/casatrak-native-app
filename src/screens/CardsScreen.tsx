import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { theme } from '../theme/theme'
import PropertyCard from '../components/PropertyCard'
import { Property } from '../types/property'
import { getProperties } from '../lib/properties'
import { RootStackParamList } from '../navigation/AppNavigator'

type NavigationProp = StackNavigationProp<RootStackParamList>

export default function CardsScreen() {
  const navigation = useNavigation<NavigationProp>()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadProperties = async () => {
    try {
      setError(null)
      const data = await getProperties()
      setProperties(data)
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
          {relevantProperties.length} {relevantProperties.length === 1 ? 'Property' : 'Properties'} found
        </Text>
      </View>

      {error ? (
        <View style={styles.emptyContainer}>
          <View style={styles.errorCircle}>
            <Text style={styles.errorIcon}>!</Text>
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
            <Text style={styles.emptyIcon}>🏠</Text>
          </View>
          <Text style={styles.emptyTitle}>No properties yet</Text>
          <Text style={styles.emptySubtitle}>
            Your home journey starts here. Add your first property to get started.
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('PropertyForm', {})}
          >
            <Text style={styles.addButtonText}>+ Add Property</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={relevantProperties}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PropertyCard property={item} onPress={() => handlePropertyPress(item)} />
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
                <Text style={styles.irrelevantTitle}>
                  Archived ({irrelevantProperties.length})
                </Text>
                {irrelevantProperties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    onPress={() => handlePropertyPress(property)}
                  />
                ))}
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
    backgroundColor: theme.colors.background,
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
    color: theme.colors.textMuted,
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
  emptyIcon: {
    fontSize: 32,
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
  errorIcon: {
    fontSize: 24,
    color: '#DC2626',
    fontWeight: 'bold',
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
  irrelevantTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
})
