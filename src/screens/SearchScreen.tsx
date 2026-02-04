import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import Fuse from 'fuse.js'
import { RootStackParamList } from '../navigation/AppNavigator'
import { getProperties } from '../lib/properties'
import { getUpcomingVisitsByProperty } from '../lib/visits'
import { Property } from '../types/property'
import PropertyCard from '../components/PropertyCard'
import { theme } from '../theme/theme'
import FeatherIcon from 'react-native-vector-icons/Feather'

type NavigationProp = StackNavigationProp<RootStackParamList>

export default function SearchScreen() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<NavigationProp>()
  const [searchQuery, setSearchQuery] = useState('')
  const [properties, setProperties] = useState<Property[]>([])
  const [visitsByProperty, setVisitsByProperty] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(false)

  React.useEffect(() => {
    loadProperties()
  }, [])

  const loadProperties = async () => {
    try {
      setLoading(true)
      const [propertiesData, visitsData] = await Promise.all([
        getProperties(),
        getUpcomingVisitsByProperty(),
      ])
      setProperties(propertiesData)
      setVisitsByProperty(visitsData)
    } catch (error) {
      console.error('Error loading properties:', error)
    } finally {
      setLoading(false)
    }
  }


  const filteredProperties = useMemo(() => {
    if (!searchQuery.trim()) return []

    // Configure Fuse.js for fuzzy search
    // threshold: 0.0 = exact match, 1.0 = match anything
    // Lower threshold = more strict matching, higher = more fuzzy
    const fuse = new Fuse(properties, {
      keys: [
        { name: 'title', weight: 0.5 }, // Title has highest weight
        { name: 'address', weight: 0.3 }, // Address has medium weight
        { name: 'description', weight: 0.2 }, // Description has lower weight
      ],
      threshold: 0.4, // 0.4 = allows for typos and partial matches (60% similarity)
      includeScore: true, // Include relevance scores
      minMatchCharLength: 2, // Minimum characters to match (supports partial search)
      ignoreLocation: true, // Search anywhere in the string
      findAllMatches: true, // Find all matches, not just the first
      shouldSort: true, // Sort results by relevance
    })

    // Perform fuzzy search
    const results = fuse.search(searchQuery)

    // Return properties sorted by relevance (lower score = better match)
    return results.map(result => result.item)
  }, [properties, searchQuery])

  const handlePropertyPress = (property: Property) => {
    navigation.navigate('PropertyDetail', { property })
  }

  const handleClose = () => {
    navigation.goBack()
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + 20 }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Search</Text>
          {filteredProperties.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{String(filteredProperties.length)}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton} activeOpacity={0.7}>
          <FeatherIcon name="x" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <FeatherIcon name="search" size={18} color={theme.colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title, address, or description..."
            placeholderTextColor={theme.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus={true}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
              activeOpacity={0.7}
            >
              <FeatherIcon name="x" size={16} color={theme.colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : searchQuery.trim() ? (
        <FlatList
          data={filteredProperties}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PropertyCard
              property={item}
              onPress={() => handlePropertyPress(item)}
              upcomingVisits={visitsByProperty[item.id] || []}
              showDateAdded={true}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <FeatherIcon name="search" size={40} color={theme.colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No properties found</Text>
              <Text style={styles.emptySubtitle}>
                Try different keywords or check your spelling
              </Text>
            </View>
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <FeatherIcon name="search" size={40} color={theme.colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Search Properties</Text>
          <Text style={styles.emptySubtitle}>
            Start typing to search by title, address, or description
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    marginRight: 10,
  },
  badge: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
  },
  closeButton: {
    position: 'absolute',
    right: 24,
    top: '50%',
    marginTop: -10,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FAFAFA',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    paddingVertical: 14,
  },
  clearButton: {
    padding: 4,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: -60,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
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
  },
})
