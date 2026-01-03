import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native'
import { RootStackParamList } from '../navigation/AppNavigator'
import { theme } from '../theme/theme'
import { createProperty, updateProperty } from '../lib/properties'
import { PropertySource, PropertyType } from '../types/property'

type PropertyFormRouteProp = RouteProp<RootStackParamList, 'PropertyForm'>

const SOURCES: PropertySource[] = ['Yad2', 'Friends & Family', 'Facebook', 'Madlan', 'Other']
const PROPERTY_TYPES: PropertyType[] = ['New', 'Existing apartment']

export default function PropertyFormScreen() {
  const insets = useSafeAreaInsets()
  const route = useRoute<PropertyFormRouteProp>()
  const navigation = useNavigation()
  const existingProperty = route.params?.property

  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState(existingProperty?.title || '')
  const [address, setAddress] = useState(existingProperty?.address || '')
  const [rooms, setRooms] = useState(existingProperty?.rooms?.toString() || '3')
  const [squareMeters, setSquareMeters] = useState(existingProperty?.square_meters?.toString() || '')
  const [askedPrice, setAskedPrice] = useState(existingProperty?.asked_price?.toString() || '')
  const [source, setSource] = useState<PropertySource>(existingProperty?.source || 'Yad2')
  const [propertyType, setPropertyType] = useState<PropertyType>(existingProperty?.property_type || 'Existing apartment')
  const [contactName, setContactName] = useState(existingProperty?.contact_name || '')
  const [contactPhone, setContactPhone] = useState(existingProperty?.contact_phone || '')
  const [description, setDescription] = useState(existingProperty?.description || '')
  const [url, setUrl] = useState(existingProperty?.url || '')

  const handleSubmit = async () => {
    if (!address.trim()) return

    setLoading(true)
    try {
      const propertyData = {
        title: title.trim() || address.trim(),
        address: address.trim(),
        rooms: parseFloat(rooms) || 3,
        square_meters: squareMeters ? parseInt(squareMeters) : null,
        asked_price: askedPrice ? parseInt(askedPrice.replace(/,/g, '')) : null,
        source,
        property_type: propertyType,
        contact_name: contactName.trim() || null,
        contact_phone: contactPhone.trim() || null,
        description: description.trim() || null,
        url: url.trim() || null,
      }

      if (existingProperty) {
        await updateProperty(existingProperty.id, propertyData)
      } else {
        await createProperty(propertyData)
      }
      navigation.goBack()
    } catch (error) {
      console.error('Error saving property:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      {/* Refined Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{existingProperty ? 'Edit' : 'Add Property'}</Text>
        <TouchableOpacity
          onPress={handleSubmit}
          style={[styles.headerButton, loading && styles.disabled]}
          disabled={loading || !address.trim()}
        >
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Text style={[styles.headerButtonText, styles.saveButtonText]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Essential Info</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Nickname (Optional)</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Dream Loft"
                placeholderTextColor={theme.colors.textMuted}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Address *</Text>
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholder="Where is it?"
                placeholderTextColor={theme.colors.textMuted}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>The Details</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Rooms</Text>
              <View style={styles.selectorRow}>
                {['2', '2.5', '3', '3.5', '4', '4.5', '5', '5+'].map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.selectorItem, rooms === r && styles.selectorItemActive]}
                    onPress={() => setRooms(r)}
                  >
                    <Text style={[styles.selectorText, rooms === r && styles.selectorTextActive]}>
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.rowFields}>
              <View style={[styles.field, { flex: 1, marginRight: 12 }]}>
                <Text style={styles.label}>Size (m²)</Text>
                <TextInput
                  style={styles.input}
                  value={squareMeters}
                  onChangeText={setSquareMeters}
                  placeholder="e.g. 85"
                  keyboardType="number-pad"
                  placeholderTextColor={theme.colors.textMuted}
                />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Price (₪)</Text>
                <TextInput
                  style={styles.input}
                  value={askedPrice}
                  onChangeText={setAskedPrice}
                  placeholder="e.g. 2,490,000"
                  keyboardType="number-pad"
                  placeholderTextColor={theme.colors.textMuted}
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact & Origin</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Source</Text>
              <View style={styles.selectorRow}>
                {SOURCES.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.selectorItem, source === s && styles.selectorItemActive]}
                    onPress={() => setSource(s)}
                  >
                    <Text style={[styles.selectorText, source === s && styles.selectorTextActive]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.rowFields}>
              <View style={[styles.field, { flex: 1, marginRight: 12 }]}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={contactName}
                  onChangeText={setContactName}
                  placeholder="Agent / Owner"
                  placeholderTextColor={theme.colors.textMuted}
                />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Phone</Text>
                <TextInput
                  style={styles.input}
                  value={contactPhone}
                  onChangeText={setContactPhone}
                  placeholder="05..."
                  keyboardType="phone-pad"
                  placeholderTextColor={theme.colors.textMuted}
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Extra Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Any details to remember?"
              placeholderTextColor={theme.colors.textMuted}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  headerButton: {
    paddingVertical: 8,
    minWidth: 60,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
  },
  saveButtonText: {
    color: theme.colors.primary,
    fontWeight: '800',
    textAlign: 'right',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
  },
  disabled: {
    opacity: 0.3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
    fontFamily: theme.typography.fontFamily,
  },
  field: {
    marginBottom: 16,
  },
  rowFields: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  textArea: {
    minHeight: 120,
    paddingTop: 16,
    textAlignVertical: 'top',
  },
  selectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectorItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  selectorItemActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  selectorText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
  },
  selectorTextActive: {
    color: theme.colors.white,
  },
})

