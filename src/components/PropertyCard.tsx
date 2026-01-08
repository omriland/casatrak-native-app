import { View, Text, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native'
import FeatherIcon from 'react-native-vector-icons/Feather'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { theme } from '../theme/theme'
import { Property, Note } from '../types/property'
import { getPublicUrl, formatAddress } from '../lib/properties'
import { getStatusLabel, getStatusColor } from '../constants/statuses'
import { Visit } from '../types/visit'
import { getVisitStatusLabel, getVisitStatusColor } from '../constants/visits'

interface PropertyCardProps {
  property: Property
  onPress: () => void
  customStyle?: any
  upcomingVisits?: Visit[]
}

const formatPrice = (price: number | null) => {
  if (price === null || price === 1) return 'Unknown'
  return new Intl.NumberFormat('he-IL', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(price) + ' ₪'
}

const Stars = ({ rating }: { rating?: number }) => {
  if (!rating || rating === 0) return null
  return (
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map((s) => (
        <IonIcon
          key={s}
          name={s <= rating ? 'star' : 'star-outline'}
          size={14}
          color={s <= rating ? '#FBBF24' : '#E2E8F0'}
          style={{ marginRight: 1 }}
        />
      ))}
    </View>
  )
}

const formatVisitDate = (isoString: string) => {
  const date = new Date(isoString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const visitDate = new Date(date)
  visitDate.setHours(0, 0, 0, 0)

  const diffDays = Math.floor((visitDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays === 2) return 'Day after tomorrow'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const formatVisitTime = (isoString: string) => {
  const date = new Date(isoString)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export default function PropertyCard({ property, onPress, customStyle, upcomingVisits = [] }: PropertyCardProps) {
  const isFlagged = property.is_flagged

  return (
    <TouchableOpacity
      style={[styles.card, isFlagged && styles.cardFlagged, customStyle]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Top Section: Title & Status Column */}
      <View style={styles.headerRow}>
        <View style={styles.titleArea}>
          {isFlagged && (
            <FeatherIcon name="flag" size={16} color="#FBBF24" style={styles.flagIcon} />
          )}
          <Text style={styles.title} numberOfLines={2}>
            {property.title || property.address || 'Untitled'}
          </Text>
        </View>

        <View style={styles.rightColumn}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(property.status) + '15' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(property.status) }]}>{getStatusLabel(property.status)}</Text>
          </View>
          <Stars rating={property.rating} />
        </View>
      </View>

      {/* Middle Section: Address */}
      <View style={styles.addressRow}>
        <FeatherIcon name="map-pin" size={14} color="#64748B" style={styles.pinIcon} />
        <Text style={styles.addressText} numberOfLines={1}>{formatAddress(property.address)}</Text>
      </View>

      {/* Bottom Section: Stats Strip */}
      <View style={styles.statsStrip}>
        <Text style={styles.statItem}>{property.rooms || '—'} rooms</Text>
        <Text style={styles.dot}>•</Text>
        <Text style={styles.statItem}>
          {property.square_meters && property.square_meters !== 1 ? `${property.square_meters} m²` : 'Unknown'}
        </Text>
        <Text style={styles.dot}>•</Text>
        <Text style={[styles.statItem, styles.priceText]}>{formatPrice(property.asked_price)}</Text>
      </View>

      {/* Latest Notes (only if present) */}
      {property.latest_notes && property.latest_notes.length > 0 && (
        <View style={styles.notesSection}>
          {property.latest_notes.map((note) => (
            <View key={note.id} style={styles.noteLine}>
              <View style={styles.noteIndicator} />
              <Text style={styles.noteText} numberOfLines={1}>
                {note.content}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Upcoming Visits (only if present) */}
      {upcomingVisits && upcomingVisits.length > 0 && (
        <View style={styles.visitsSection}>
          {upcomingVisits.map((visit) => (
            <View key={visit.id} style={styles.visitLine}>
              <View style={[styles.visitIndicator, { backgroundColor: theme.colors.primary + '60' }]} />
              <View style={styles.visitContent}>
                <View style={styles.visitHeader}>
                  <FeatherIcon name="calendar" size={13} color={theme.colors.primary} />
                  <Text style={styles.visitDateText}>
                    {formatVisitDate(visit.scheduled_at)} • {formatVisitTime(visit.scheduled_at)}
                  </Text>
                </View>
                {visit.notes && (
                  <Text style={styles.visitNotesText} numberOfLines={1}>
                    {visit.notes}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  cardFlagged: {
    backgroundColor: '#FFFCF2',
    borderColor: '#FEF3C7',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingRight: 10,
  },
  flagIcon: {
    marginRight: 8,
    marginTop: 4,
  },
  rightColumn: {
    alignItems: 'flex-end',
    gap: 6,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    lineHeight: 24,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  statusBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    fontFamily: theme.typography.fontFamily,
    letterSpacing: 0.5,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  pinIcon: {
    marginRight: 6,
  },
  addressText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
    flex: 1,
    opacity: 0.8,
  },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.03)',
    paddingTop: 14,
  },
  statItem: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
    fontWeight: '600',
  },
  priceText: {
    color: theme.colors.text,
    fontWeight: '800',
  },
  dot: {
    marginHorizontal: 10,
    color: '#CBD5E1',
    fontSize: 12,
  },
  notesSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.03)',
    gap: 8,
  },
  noteLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  noteIndicator: {
    width: 3,
    height: 12,
    borderRadius: 1.5,
    backgroundColor: theme.colors.primary + '40',
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
    opacity: 0.8,
    fontStyle: 'italic',
  },
  visitsSection: {
    marginTop: 16,
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.03)',
    backgroundColor: theme.colors.primary + '08',
    borderRadius: 8,
    gap: 8,
  },
  visitLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  visitIndicator: {
    width: 4,
    height: 14,
    borderRadius: 2,
    marginTop: 2,
  },
  visitContent: {
    flex: 1,
  },
  visitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  visitDateText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    fontWeight: '700',
  },
  visitNotesText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
    opacity: 0.7,
    fontStyle: 'italic',
    marginLeft: 18,
  },
})
