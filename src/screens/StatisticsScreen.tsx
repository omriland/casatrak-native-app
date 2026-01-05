import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { getProperties } from '../lib/properties'
import { supabase } from '../lib/supabase'
import { Property, PropertyStatus } from '../types/property'
import { PROPERTY_STATUSES, PROPERTY_STATUS_LABELS, getStatusColor } from '../constants/statuses'
import { theme } from '../theme/theme'
import FeatherIcon from 'react-native-vector-icons/Feather'

interface Statistics {
  totalProperties: number
  propertiesByStatus: Record<PropertyStatus, number>
  totalAttachments: number
  totalNotes: number
  flaggedCount: number
}

export default function StatisticsScreen() {
  const insets = useSafeAreaInsets()
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadStatistics = useCallback(async () => {
    try {
      // Load properties
      const properties = await getProperties()

      // Count attachments
      const { count: attachmentsCount } = await supabase
        .from('attachments')
        .select('*', { count: 'exact', head: true })

      // Count notes
      const { count: notesCount } = await supabase
        .from('notes')
        .select('*', { count: 'exact', head: true })

      // Calculate statistics
      const propertiesByStatus: Record<PropertyStatus, number> = {
        'Seen': 0,
        'Interested': 0,
        'Contacted Realtor': 0,
        'Visited': 0,
        'On Hold': 0,
        'Irrelevant': 0,
        'Purchased': 0,
      }

      properties.forEach((property) => {
        propertiesByStatus[property.status] = (propertiesByStatus[property.status] || 0) + 1
      })

      const flaggedCount = properties.filter((p) => p.is_flagged).length

      setStatistics({
        totalProperties: properties.length,
        propertiesByStatus,
        totalAttachments: attachmentsCount || 0,
        totalNotes: notesCount || 0,
        flaggedCount,
      })
    } catch (error) {
      console.error('Error loading statistics:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadStatistics()
    }, [loadStatistics])
  )

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadStatistics()
  }, [loadStatistics])

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    )
  }

  if (!statistics) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Failed to load statistics</Text>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Overview Cards */}
      <View style={styles.overviewSection}>
        <View style={styles.overviewCard}>
          <View style={styles.overviewIconContainer}>
            <FeatherIcon name="home" size={24} color={theme.colors.primary} />
          </View>
          <Text style={styles.overviewValue}>{String(statistics.totalProperties)}</Text>
          <Text style={styles.overviewLabel}>Total Properties</Text>
        </View>

        <View style={styles.overviewCard}>
          <View style={styles.overviewIconContainer}>
            <FeatherIcon name="image" size={24} color={theme.colors.primary} />
          </View>
          <Text style={styles.overviewValue}>{String(statistics.totalAttachments)}</Text>
          <Text style={styles.overviewLabel}>Photos & Files</Text>
        </View>

        <View style={styles.overviewCard}>
          <View style={styles.overviewIconContainer}>
            <FeatherIcon name="message-square" size={24} color={theme.colors.primary} />
          </View>
          <Text style={styles.overviewValue}>{String(statistics.totalNotes)}</Text>
          <Text style={styles.overviewLabel}>Comments</Text>
        </View>

        <View style={styles.overviewCard}>
          <View style={styles.overviewIconContainer}>
            <FeatherIcon name="bookmark" size={24} color={theme.colors.primary} />
          </View>
          <Text style={styles.overviewValue}>{String(statistics.flaggedCount)}</Text>
          <Text style={styles.overviewLabel}>Flagged</Text>
        </View>
      </View>

      {/* Status Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Properties by Status</Text>
        <View style={styles.statusList}>
          {PROPERTY_STATUSES.map((status) => {
            const count = statistics.propertiesByStatus[status]
            const statusColor = getStatusColor(status)
            const percentage = statistics.totalProperties > 0
              ? Math.round((count / statistics.totalProperties) * 100)
              : 0

            return (
              <View key={status} style={styles.statusItem}>
                <View style={styles.statusHeader}>
                  <View style={styles.statusLeft}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    <Text style={styles.statusLabel}>{PROPERTY_STATUS_LABELS[status]}</Text>
                  </View>
                  <View style={styles.statusRight}>
                    <Text style={styles.statusCount}>{String(count)}</Text>
                    <Text style={styles.statusPercentage}>{String(percentage)}%</Text>
                  </View>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${percentage}%`, backgroundColor: statusColor },
                    ]}
                  />
                </View>
              </View>
            )
          })}
        </View>
      </View>
    </ScrollView>
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
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
  },
  overviewSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 32,
    gap: 12,
  },
  overviewCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
  },
  overviewIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  overviewValue: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    marginBottom: 20,
  },
  statusList: {
    gap: 16,
  },
  statusItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  statusLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    flex: 1,
  },
  statusRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusCount: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
  },
  statusPercentage: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily,
    minWidth: 35,
    textAlign: 'right',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
})
