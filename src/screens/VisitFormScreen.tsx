import React, { useState, useEffect } from 'react'
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
  Alert,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import DateTimePicker from '@react-native-community/datetimepicker'
import { RootStackParamList } from '../navigation/AppNavigator'
import { theme } from '../theme/theme'
import { createVisit, updateVisit } from '../lib/visits'
import { getProperties } from '../lib/properties'
import { Visit, VisitInsert, VisitStatus } from '../types/visit'
import { Property } from '../types/property'
import { VISIT_STATUSES, getVisitStatusLabel, getVisitStatusColor } from '../constants/visits'
import FeatherIcon from 'react-native-vector-icons/Feather'

type NavigationProp = StackNavigationProp<RootStackParamList>
type VisitFormRouteProp = RouteProp<RootStackParamList, 'VisitForm'>

export default function VisitFormScreen() {
  const insets = useSafeAreaInsets()
  const route = useRoute<VisitFormRouteProp>()
  const navigation = useNavigation<NavigationProp>()
  const existingVisit = route.params?.visit
  const propertyId = route.params?.propertyId
  const scheduledDate = route.params?.scheduledDate

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])
  const [loadingProperties, setLoadingProperties] = useState(false)

  // Form state
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(
    propertyId || existingVisit?.property_id || ''
  )
  const [date, setDate] = useState<Date>(() => {
    if (scheduledDate) {
      const parsed = new Date(scheduledDate)
      // Set time to current time + 1 hour if only date was provided
      if (parsed.getHours() === 0 && parsed.getMinutes() === 0) {
        const now = new Date()
        parsed.setHours(now.getHours() + 1, now.getMinutes(), 0, 0)
      }
      return parsed
    }
    if (existingVisit) {
      return new Date(existingVisit.scheduled_at)
    }
    // Default: 1 hour from now
    return new Date(Date.now() + 60 * 60 * 1000)
  })
  const [notes, setNotes] = useState(existingVisit?.notes || '')
  const [status, setStatus] = useState<VisitStatus>(
    existingVisit?.status || 'scheduled'
  )

  // Picker states
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [showPropertyPicker, setShowPropertyPicker] = useState(false)
  const [showStatusPicker, setShowStatusPicker] = useState(false)

  // Load properties if creating from calendar
  useEffect(() => {
    if (!propertyId && !existingVisit) {
      loadProperties()
    }
  }, [])

  const loadProperties = async () => {
    setLoadingProperties(true)
    try {
      const data = await getProperties()
      const relevantProperties = data.filter(p => p.status !== 'Irrelevant')
      setProperties(relevantProperties)
    } catch (error) {
      console.error('Error loading properties:', error)
      Alert.alert('Error', 'Failed to load properties')
    } finally {
      setLoadingProperties(false)
    }
  }

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      navigation.navigate('MainTabs', { screen: 'Calendar' } as any)
    }
  }

  const handleSubmit = async () => {
    if (!selectedPropertyId) {
      Alert.alert('Missing Info', 'Please select a property.')
      return
    }

    if (notes.length > 500) {
      Alert.alert('Validation Error', 'Notes must be 500 characters or less.')
      return
    }

    setSaving(true)
    try {
      const visitData: VisitInsert = {
        property_id: selectedPropertyId,
        scheduled_at: date.toISOString(),
        notes: notes.trim() || null,
        status: existingVisit ? status : 'scheduled',
      }

      if (existingVisit) {
        await updateVisit(existingVisit.id, visitData)
      } else {
        await createVisit(visitData)
      }

      handleGoBack()
    } catch (error) {
      console.error('Error saving visit:', error)
      Alert.alert('Error', 'Could not save visit. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId)

  const showPropertySelector = () => {
    if (properties.length === 0) {
      Alert.alert('No Properties', 'Please add a property first.')
      return
    }

    Alert.alert(
      'Select Property',
      '',
      [
        ...properties.map((prop) => ({
          text: prop.title || prop.address,
          onPress: () => setSelectedPropertyId(prop.id),
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    )
  }

  const showStatusSelector = () => {
    Alert.alert(
      'Select Status',
      '',
      [
        ...VISIT_STATUSES.map((s) => ({
          text: getVisitStatusLabel(s),
          onPress: () => setStatus(s),
        })),
        { text: 'Cancel', style: 'cancel' },
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
        <Text style={styles.headerTitle}>
          {existingVisit ? 'Edit Visit' : 'Schedule Visit'}
        </Text>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={saving || !selectedPropertyId}
          style={[styles.headerIconButton, (saving || !selectedPropertyId) && styles.disabled]}
        >
          {saving ? (
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
          {/* Property Selector */}
          {(!propertyId && !existingVisit) && (
            <View style={styles.section}>
              <Text style={styles.label}>Property *</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={showPropertySelector}
                disabled={loadingProperties}
              >
                {loadingProperties ? (
                  <ActivityIndicator size="small" color={theme.colors.textMuted} />
                ) : selectedProperty ? (
                  <View style={styles.propertyDisplay}>
                    <Text style={styles.propertyTitle} numberOfLines={1}>
                      {selectedProperty.title || selectedProperty.address}
                    </Text>
                    {selectedProperty.title && (
                      <Text style={styles.propertyAddress} numberOfLines={1}>
                        {selectedProperty.address}
                      </Text>
                    )}
                  </View>
                ) : (
                  <Text style={styles.placeholder}>Select a property</Text>
                )}
                <FeatherIcon name="chevron-down" size={18} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>
          )}

          {/* Date Picker */}
          <View style={styles.section}>
            <Text style={styles.label}>Date *</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowDatePicker(true)}
            >
              <FeatherIcon name="calendar" size={18} color={theme.colors.textMuted} style={styles.inputIcon} />
              <Text style={styles.inputText}>{formatDate(date)}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                textColor="#000000"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios')
                  if (selectedDate) {
                    // Preserve time when changing date
                    const newDate = new Date(selectedDate)
                    newDate.setHours(date.getHours(), date.getMinutes(), 0, 0)
                    setDate(newDate)
                  }
                }}
              />
            )}
          </View>

          {/* Time Picker */}
          <View style={styles.section}>
            <Text style={styles.label}>Time *</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowTimePicker(true)}
            >
              <FeatherIcon name="clock" size={18} color={theme.colors.textMuted} style={styles.inputIcon} />
              <Text style={styles.inputText}>{formatTime(date)}</Text>
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={date}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                minuteInterval={15}
                textColor="#000000"
                onChange={(event, selectedTime) => {
                  setShowTimePicker(Platform.OS === 'ios')
                  if (selectedTime) {
                    // Preserve date when changing time
                    // Round minutes to nearest 15-minute interval
                    const minutes = Math.round(selectedTime.getMinutes() / 15) * 15
                    const newDate = new Date(date)
                    newDate.setHours(selectedTime.getHours(), minutes, 0, 0)
                    setDate(newDate)
                  }
                }}
              />
            )}
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={[styles.textArea, notes.length > 500 && styles.textAreaError]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes about this visit..."
              placeholderTextColor={theme.colors.textMuted}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <Text style={styles.charCount}>
              {notes.length}/500
            </Text>
          </View>

          {/* Status (only when editing) */}
          {existingVisit && (
            <View style={styles.section}>
              <Text style={styles.label}>Status</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={showStatusSelector}
              >
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getVisitStatusColor(status) + '15' },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getVisitStatusColor(status) },
                    ]}
                  >
                    {getVisitStatusLabel(status)}
                  </Text>
                </View>
                <FeatherIcon name="chevron-down" size={18} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  inputIcon: {
    marginRight: 12,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.black,
    fontFamily: theme.typography.fontFamily,
    fontWeight: '700',
  },
  placeholder: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily,
  },
  propertyDisplay: {
    flex: 1,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    marginBottom: 2,
  },
  propertyAddress: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
  },
  textArea: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  textAreaError: {
    borderColor: theme.colors.error,
  },
  charCount: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily,
    marginTop: 4,
    textAlign: 'right',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: theme.typography.fontFamily,
    letterSpacing: 0.5,
  },
})
