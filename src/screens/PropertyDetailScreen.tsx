import React from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native'
import { RootStackParamList } from '../navigation/AppNavigator'
import { theme } from '../theme/theme'

type PropertyDetailRouteProp = RouteProp<RootStackParamList, 'PropertyDetail'>

export default function PropertyDetailScreen() {
  const insets = useSafeAreaInsets()
  const route = useRoute<PropertyDetailRouteProp>()
  const navigation = useNavigation()
  const { property } = route.params

  const formatPrice = (price: number | null): string => {
    if (price === null || price === 1) return 'Price Unknown'
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(price)
  }

  const handleCall = () => {
    if (property.contact_phone) {
      Linking.openURL(`tel:${property.contact_phone}`)
    }
  }

  const handleWhatsApp = () => {
    if (property.contact_phone) {
      const cleanPhone = property.contact_phone.replace(/\D/g, '')
      const whatsappNumber = cleanPhone.startsWith('0')
        ? '972' + cleanPhone.slice(1)
        : cleanPhone
      Linking.openURL(`https://wa.me/${whatsappNumber}`)
    }
  }

  const handleOpenURL = () => {
    if (property.url) {
      Linking.openURL(property.url)
    }
  }

  return (
    <View style={styles.container}>
      {/* Status & Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Text style={styles.backIcon}>✕</Text>
        </TouchableOpacity>
        <View style={[styles.statusTag, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.statusText}>{property.status.toUpperCase()}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topInfo}>
          <Text style={[styles.price, (property.asked_price === 1 || !property.asked_price) && styles.unknownPrice]}>
            {formatPrice(property.asked_price)}
          </Text>
          <Text style={styles.title}>{property.title || property.address || 'Untitled Property'}</Text>
          <Text style={styles.address}>{property.address}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{property.rooms || '—'}</Text>
            <Text style={styles.statLabel}>Rooms</Text>
          </View>
          {property.square_meters != null && property.square_meters !== 1 && (
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{property.square_meters}m²</Text>
              <Text style={styles.statLabel}>Size</Text>
            </View>
          )}
          {property.balcony_square_meters != null && property.balcony_square_meters !== 1 && property.balcony_square_meters !== 0 && (
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{property.balcony_square_meters}m²</Text>
              <Text style={styles.statLabel}>Balcony</Text>
            </View>
          )}
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: property.apartment_broker ? theme.colors.secondary : theme.colors.textMuted }]}>
              {property.apartment_broker ? 'Yes' : 'No'}
            </Text>
            <Text style={styles.statLabel}>Broker</Text>
          </View>
        </View>

        {/* Description Section */}
        {property.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About this property</Text>
            <Text style={styles.description}>{property.description}</Text>
          </View>
        )}

        {/* Contact Strip */}
        {(property.contact_name || property.contact_phone) && (
          <View style={styles.contactCard}>
            <View style={styles.contactHeader}>
              <View style={styles.contactAvatar}>
                <Text style={styles.avatarText}>{property.contact_name ? property.contact_name.charAt(0) : '?'}</Text>
              </View>
              <View>
                <Text style={styles.contactName}>{property.contact_name || 'Owner / Agent'}</Text>
                <Text style={styles.contactSub}>{property.contact_phone || 'No phone provided'}</Text>
              </View>
            </View>

            {property.contact_phone && (
              <View style={styles.contactActions}>
                <TouchableOpacity style={styles.callButton} onPress={handleCall}>
                  <Text style={styles.callButtonText}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.waButton} onPress={handleWhatsApp}>
                  <Text style={styles.waButtonText}>WhatsApp</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* External Link */}
        {property.url && (
          <TouchableOpacity style={styles.linkButton} onPress={handleOpenURL}>
            <Text style={styles.linkButtonText}>View original listing</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  backIcon: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  statusTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    color: theme.colors.white,
    fontSize: 11,
    fontWeight: '800',
    fontFamily: theme.typography.fontFamily,
    letterSpacing: 1,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  topInfo: {
    marginTop: 20,
    marginBottom: 30,
  },
  price: {
    fontSize: 36,
    fontWeight: '800',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    marginBottom: 8,
  },
  unknownPrice: {
    fontSize: 24,
    color: theme.colors.textMuted,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    marginBottom: 6,
  },
  address: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
  },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '600',
    fontFamily: theme.typography.fontFamily,
    textTransform: 'uppercase',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
    fontFamily: theme.typography.fontFamily,
  },
  description: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    lineHeight: 26,
    fontFamily: theme.typography.fontFamily,
  },
  contactCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  contactAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  contactName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
  },
  contactSub: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 12,
  },
  callButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  callButtonText: {
    color: theme.colors.white,
    fontWeight: '700',
    fontFamily: theme.typography.fontFamily,
  },
  waButton: {
    flex: 1,
    backgroundColor: theme.colors.white,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  waButtonText: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontFamily: theme.typography.fontFamily,
  },
  linkButton: {
    alignItems: 'center',
    padding: 20,
  },
  linkButtonText: {
    color: theme.colors.secondary,
    fontWeight: '700',
    fontFamily: theme.typography.fontFamily,
  },
})
