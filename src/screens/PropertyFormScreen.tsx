import React, { useState, useMemo, useEffect, useRef } from 'react'
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
  Switch,
  Alert,
  FlatList,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native'
import { RootStackParamList } from '../navigation/AppNavigator'
import { theme } from '../theme/theme'
import { createProperty, updateProperty } from '../lib/properties'
import { PropertySource, PropertyType, PropertyStatus, PropertyInsert } from '../types/property'
import { PROPERTY_STATUS_OPTIONS } from '../constants/statuses'
import { CONFIG } from '../lib/config'
import FeatherIcon from 'react-native-vector-icons/Feather'

type PropertyFormRouteProp = RouteProp<RootStackParamList, 'PropertyForm'>

const SOURCES: PropertySource[] = ['Yad2', 'Friends & Family', 'Facebook', 'Madlan', 'Other']
const PROPERTY_TYPES: PropertyType[] = ['New', 'Existing apartment']

interface GooglePlacePrediction {
  description: string
  place_id: string
}

export default function PropertyFormScreen() {
  const insets = useSafeAreaInsets()
  const route = useRoute<PropertyFormRouteProp>()
  const navigation = useNavigation()
  const existingProperty = route.params?.property

  const [loading, setLoading] = useState(false)
  
  // Form State
  const [title, setTitle] = useState(existingProperty?.title || '')
  const [address, setAddress] = useState(existingProperty?.address || '')
  const [url, setUrl] = useState(existingProperty?.url || '')
  const [rooms, setRooms] = useState<number>(existingProperty?.rooms || 3)
  const [squareMeters, setSquareMeters] = useState(existingProperty?.square_meters?.toString() || '')
  const [balconySquareMeters, setBalconySquareMeters] = useState(existingProperty?.balcony_square_meters?.toString() || '')
  const [askedPrice, setAskedPrice] = useState(existingProperty?.asked_price?.toString() || '')
  const [contactName, setContactName] = useState(existingProperty?.contact_name || '')
  const [contactPhone, setContactPhone] = useState(existingProperty?.contact_phone || '')
  const [source, setSource] = useState<PropertySource>(existingProperty?.source || 'Yad2')
  const [propertyType, setPropertyType] = useState<PropertyType>(existingProperty?.property_type || 'Existing apartment')
  const [status, setStatus] = useState<PropertyStatus>(existingProperty?.status || 'Seen')
  const [description, setDescription] = useState(existingProperty?.description || '')
  const [apartmentBroker, setApartmentBroker] = useState(existingProperty?.apartment_broker || false)
  const [latitude, setLatitude] = useState<number | null>(existingProperty?.latitude || null)
  const [longitude, setLongitude] = useState<number | null>(existingProperty?.longitude || null)

  // Autocomplete state
  const [predictions, setPredictions] = useState<GooglePlacePrediction[]>([])
  const [showPredictions, setShowPredictions] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const autocompleteTimeout = useRef<NodeJS.Timeout | null>(null)

  // Formatting Price
  const formattedPrice = useMemo(() => {
    if (!askedPrice) return ''
    const num = parseInt(askedPrice.replace(/,/g, ''))
    if (isNaN(num)) return ''
    return num.toLocaleString('en-US')
  }, [askedPrice])

  // Price per m² Calculation
  const pricePerMeter = useMemo(() => {
    const price = askedPrice ? parseInt(askedPrice.replace(/,/g, '')) : 0
    const sqMeters = squareMeters ? parseFloat(squareMeters) : 0
    const balcony = balconySquareMeters ? parseFloat(balconySquareMeters) : 0
    const effectiveArea = sqMeters + (0.5 * balcony)
    
    if (price > 0 && effectiveArea > 0) {
      return `₪${Math.round(price / effectiveArea).toLocaleString('en-US')}`
    }
    return 'N/A'
  }, [askedPrice, squareMeters, balconySquareMeters])

  const handlePriceChange = (text: string) => {
    const numericValue = text.replace(/[^\d]/g, '')
    setAskedPrice(numericValue)
  }

  const fetchPredictions = async (input: string) => {
    if (input.length < 3) {
      setPredictions([])
      setShowPredictions(false)
      return
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${CONFIG.GOOGLE_MAPS_API_KEY}&components=country:il&language=he`
      const response = await fetch(url)
      const data = await response.json()
      if (data.status === 'OK') {
        setPredictions(data.predictions)
        setShowPredictions(true)
      } else {
        setPredictions([])
        setShowPredictions(false)
      }
    } catch (error) {
      console.error('Error fetching predictions:', error)
    }
  }

  const handleAddressChange = (text: string) => {
    setAddress(text)
    if (autocompleteTimeout.current) {
      clearTimeout(autocompleteTimeout.current)
    }
    autocompleteTimeout.current = setTimeout(() => {
      fetchPredictions(text)
    }, 500)
  }

  const handlePredictionSelect = async (prediction: GooglePlacePrediction) => {
    setAddress(prediction.description)
    setShowPredictions(false)
    setPredictions([])
    
    if (!title.trim()) {
      setTitle(prediction.description)
    }

    setIsGeocoding(true)
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&key=${CONFIG.GOOGLE_MAPS_API_KEY}&fields=geometry`
      const response = await fetch(url)
      const data = await response.json()
      if (data.status === 'OK' && data.result.geometry) {
        setLatitude(data.result.geometry.location.lat)
        setLongitude(data.result.geometry.location.lng)
      }
    } catch (error) {
      console.error('Error fetching place details:', error)
    } finally {
      setIsGeocoding(false)
    }
  }

  const handleGoBack = () => {
    navigation.navigate('MainTabs', { screen: 'Home' })
  }

  const handleSubmit = async () => {
    if (!address.trim()) {
      Alert.alert('Missing Info', 'Please provide an address.')
      return
    }

    setLoading(true)
    try {
      const propertyData: PropertyInsert = {
        title: title.trim() || address.trim(),
        address: address.trim(),
        rooms: rooms,
        square_meters: squareMeters ? parseInt(squareMeters) : null,
        balcony_square_meters: balconySquareMeters ? parseInt(balconySquareMeters) : null,
        asked_price: askedPrice ? parseInt(askedPrice) : null,
        source,
        property_type: propertyType,
        status,
        contact_name: contactName.trim() || null,
        contact_phone: contactPhone.trim() || null,
        description: description.trim() || null,
        url: url.trim() || null,
        apartment_broker: apartmentBroker,
        latitude,
        longitude,
      }

      if (existingProperty) {
        await updateProperty(existingProperty.id, propertyData)
      } else {
        await createProperty(propertyData)
      }
      
      handleGoBack()
    } catch (error) {
      console.error('Error saving property:', error)
      Alert.alert('Error', 'Could not save property. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const showOptionPicker = (title: string, options: { label: string, value: any }[], current: any, onSelect: (val: any) => void) => {
    Alert.alert(
      title,
      '',
      [
        ...options.map(opt => ({
          text: opt.label,
          onPress: () => onSelect(opt.value),
          style: current === opt.value ? 'default' : 'default' as any
        })),
        { text: 'Cancel', style: 'cancel' }
      ]
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <TouchableOpacity onPress={handleGoBack} style={styles.headerIconButton}>
          <FeatherIcon name="x" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{existingProperty ? 'Edit Property' : 'Add Property'}</Text>
        <TouchableOpacity 
          onPress={handleSubmit} 
          disabled={loading || !address.trim()} 
          style={[styles.headerIconButton, (loading || !address.trim()) && styles.disabled]}
        >
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <FeatherIcon name="check" size={24} color={theme.colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          
          {/* Main Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Essential Details</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nickname (Optional)</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Dream Loft"
                placeholderTextColor={theme.colors.textMuted}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Address *</Text>
              <View style={styles.inputWrapper}>
                <FeatherIcon name="map-pin" size={18} color={theme.colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { paddingLeft: 44 }]}
                  value={address}
                  onChangeText={handleAddressChange}
                  placeholder="Enter property address"
                  placeholderTextColor={theme.colors.textMuted}
                  onFocus={() => address.length >= 3 && setShowPredictions(true)}
                />
                {isGeocoding && (
                  <ActivityIndicator size="small" color={theme.colors.primary} style={styles.geocodingIndicator} />
                )}
              </View>
              {showPredictions && predictions.length > 0 && (
                <View style={styles.predictionsContainer}>
                  {predictions.map((item) => (
                    <TouchableOpacity
                      key={item.place_id}
                      style={styles.predictionItem}
                      onPress={() => handlePredictionSelect(item)}
                    >
                      <FeatherIcon name="map-pin" size={14} color={theme.colors.textMuted} style={{ marginRight: 10 }} />
                      <Text style={styles.predictionText} numberOfLines={1}>{item.description}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Property URL</Text>
              <TextInput
                style={styles.input}
                value={url}
                onChangeText={setUrl}
                placeholder="https://www.yad2.co.il/..."
                placeholderTextColor={theme.colors.textMuted}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>The Space</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Rooms</Text>
              <View style={styles.roomSelector}>
                {[2, 3, 3.5, 4, 4.5, 5, 6].map((roomCount) => (
                  <TouchableOpacity
                    key={roomCount}
                    onPress={() => setRooms(roomCount)}
                    style={[styles.roomButton, rooms === roomCount && styles.roomButtonActive]}
                  >
                    <Text style={[styles.roomText, rooms === roomCount && styles.roomTextActive]}>
                      {roomCount}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 12 }]}>
                <Text style={styles.label}>Square Meters</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputPrefix}>m²</Text>
                  <TextInput
                    style={[styles.input, { paddingLeft: 44 }]}
                    value={squareMeters}
                    onChangeText={setSquareMeters}
                    placeholder="Size"
                    placeholderTextColor={theme.colors.textMuted}
                    keyboardType="number-pad"
                  />
                </View>
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Balcony m²</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputPrefix}>m²</Text>
                  <TextInput
                    style={[styles.input, { paddingLeft: 44 }]}
                    value={balconySquareMeters}
                    onChangeText={setBalconySquareMeters}
                    placeholder="Balcony"
                    placeholderTextColor={theme.colors.textMuted}
                    keyboardType="number-pad"
                  />
                </View>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Asked Price (ILS)</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputPrefix}>₪</Text>
                <TextInput
                  style={[styles.input, { paddingLeft: 44 }]}
                  value={formattedPrice}
                  onChangeText={handlePriceChange}
                  placeholder="Price"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Price per m²: <Text style={styles.infoValue}>{pricePerMeter}</Text>
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact & Origin</Text>
            <View style={styles.row}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 12 }]}>
                <Text style={styles.label}>Contact Name</Text>
                <TextInput
                  style={styles.input}
                  value={contactName}
                  onChangeText={setContactName}
                  placeholder="Name"
                  placeholderTextColor={theme.colors.textMuted}
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Phone</Text>
                <TextInput
                  style={styles.input}
                  value={contactPhone}
                  onChangeText={setContactPhone}
                  placeholder="05..."
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 12 }]}>
                <Text style={styles.label}>Source</Text>
                <TouchableOpacity 
                  style={styles.selector} 
                  onPress={() => showOptionPicker('Select Source', SOURCES.map(s => ({ label: s, value: s })), source, setSource)}
                >
                  <Text style={styles.selectorText}>{source}</Text>
                  <FeatherIcon name="chevron-down" size={16} color={theme.colors.textMuted} />
                </TouchableOpacity>
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Type</Text>
                <TouchableOpacity 
                  style={styles.selector}
                  onPress={() => showOptionPicker('Select Type', PROPERTY_TYPES.map(t => ({ label: t, value: t })), propertyType, setPropertyType)}
                >
                  <Text style={styles.selectorText}>{propertyType}</Text>
                  <FeatherIcon name="chevron-down" size={16} color={theme.colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Status</Text>
              <TouchableOpacity 
                style={styles.selector}
                onPress={() => showOptionPicker('Select Status', PROPERTY_STATUS_OPTIONS, status, setStatus)}
              >
                <Text style={styles.selectorText}>{PROPERTY_STATUS_OPTIONS.find(o => o.value === status)?.label || status}</Text>
                <FeatherIcon name="chevron-down" size={16} color={theme.colors.textMuted} />
              </TouchableOpacity>
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
              textAlign="right"
            />
            
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>Apartment Broker</Text>
                <Text style={styles.switchSublabel}>Listing includes a broker service</Text>
              </View>
              <Switch
                value={apartmentBroker}
                onValueChange={setApartmentBroker}
                trackColor={{ false: '#E5E7EB', true: theme.colors.primary }}
                thumbColor={Platform.OS === 'ios' ? '#FFF' : (apartmentBroker ? theme.colors.primary : '#F9FAFB')}
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={handleGoBack}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.submitButton} 
              onPress={handleSubmit}
              disabled={loading || !address.trim()}
            >
              <View style={[styles.submitInside, (loading || !address.trim()) && styles.disabled]}>
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <FeatherIcon name={existingProperty ? "edit-2" : "plus"} size={18} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.submitButtonText}>{existingProperty ? 'Update Property' : 'Create Property'}</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </View>

          <View style={{ height: insets.bottom + 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerIconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
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
    marginBottom: 20,
    fontFamily: theme.typography.fontFamily,
  },
  formGroup: {
    marginBottom: 20,
  },
  row: {
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
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  inputPrefix: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
    fontSize: 16,
    color: theme.colors.textMuted,
    fontWeight: '700',
    fontFamily: theme.typography.fontFamily,
  },
  geocodingIndicator: {
    position: 'absolute',
    right: 16,
  },
  predictionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    zIndex: 1000,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  predictionText: {
    fontSize: 14,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    flex: 1,
  },
  roomSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  roomButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  roomButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  roomText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
  },
  roomTextActive: {
    color: '#FFFFFF',
  },
  infoBox: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
  },
  infoValue: {
    color: theme.colors.primary,
    fontWeight: '800',
  },
  selector: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  selectorText: {
    fontSize: 16,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 16,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
  },
  switchSublabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
  },
  submitButton: {
    flex: 2,
    height: 56,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    overflow: 'hidden',
  },
  submitInside: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
  },
})
