import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native'
import { theme } from '../theme/theme'
import { Property, PropertyStatus } from '../types/property'

interface PropertyCardProps {
  property: Property
  onPress: () => void
}

const formatPrice = (price: number | null) => {
  if (price === null || price === 1) return 'Unknown'
  return new Intl.NumberFormat('he-IL', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(price) + ' ₪'
}

const PinIcon = ({ color = '#64748B' }: { color?: string }) => (
  <View style={styles.pinContainer}>
    <View style={[styles.pinCircleIcon, { borderColor: color }]} />
    <View style={[styles.pinPoint, { backgroundColor: color }]} />
  </View>
)

const MinimalFlagIcon = ({ color = theme.colors.primary }: { color?: string }) => (
  <View style={styles.flagContainer}>
    <View style={[styles.flagPole, { backgroundColor: color }]} />
    <View style={[styles.flagBanner, { backgroundColor: color }]} />
  </View>
)

const Stars = ({ rating }: { rating?: number }) => {
  if (!rating || rating === 0) return null
  return (
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Text key={s} style={[styles.star, s <= rating ? styles.starFilled : styles.starEmpty]}>
          ★
        </Text>
      ))}
    </View>
  )
}

export default function PropertyCard({ property, onPress }: PropertyCardProps) {
  const isFlagged = property.is_flagged

  return (
    <TouchableOpacity
      style={[styles.card, isFlagged && styles.cardFlagged]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Top Section: Title & Status Column */}
      <View style={styles.headerRow}>
        <View style={styles.titleArea}>
          {isFlagged && <MinimalFlagIcon color="#FBBF24" />}
          <Text style={styles.title} numberOfLines={2}>
            {property.title || property.address || 'Untitled'}
          </Text>
        </View>

        <View style={styles.rightColumn}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{String(property.status).toUpperCase()}</Text>
          </View>
          <Stars rating={property.rating} />
        </View>
      </View>

      {/* Middle Section: Address */}
      <View style={styles.addressRow}>
        <PinIcon />
        <Text style={styles.addressText} numberOfLines={1}>{property.address}</Text>
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
  rightColumn: {
    alignItems: 'flex-end',
    gap: 6,
  },
  flagContainer: {
    width: 14,
    height: 18,
    marginRight: 8,
    marginTop: 4,
  },
  flagPole: {
    width: 2,
    height: 16,
    borderRadius: 1,
  },
  flagBanner: {
    width: 10,
    height: 7,
    position: 'absolute',
    left: 2,
    top: 1,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
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
  star: {
    fontSize: 14,
    marginHorizontal: -1,
  },
  starFilled: {
    color: '#FBBF24',
  },
  starEmpty: {
    color: '#E2E8F0',
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
  pinContainer: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  pinCircleIcon: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
  },
  pinPoint: {
    width: 2,
    height: 4,
    borderRadius: 1,
    marginTop: -2,
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
})
