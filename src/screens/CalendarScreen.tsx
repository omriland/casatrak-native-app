import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
  ActionSheetIOS,
  Animated as RNAnimated,
} from 'react-native'
import RNCalendarEvents from 'react-native-calendar-events'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { Swipeable } from 'react-native-gesture-handler'
import { RootStackParamList } from '../navigation/AppNavigator'
import { theme } from '../theme/theme'
import FeatherIcon from 'react-native-vector-icons/Feather'
import CalendarMonthView from '../components/CalendarMonthView'
import { getVisits, deleteVisit, updateVisitStatus } from '../lib/visits'
import { Visit, VisitStatus } from '../types/visit'
import { getVisitStatusLabel, getVisitStatusColor, VISIT_STATUSES } from '../constants/visits'
import { getProperty, formatAddress } from '../lib/properties'
import { useFocusEffect } from '@react-navigation/native'

type NavigationProp = StackNavigationProp<RootStackParamList>

export default function CalendarScreen() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<NavigationProp>()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [visits, setVisits] = useState<Visit[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Calculate date range for current month + buffer
  const dateRange = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const startDate = new Date(year, month - 1, 1) // Previous month start
    const endDate = new Date(year, month + 2, 0) // Next month end
    return { startDate, endDate }
  }, [currentDate])

  const loadVisits = useCallback(async () => {
    try {
      const data = await getVisits(dateRange.startDate, dateRange.endDate)
      setVisits(data)
    } catch (error) {
      console.error('Error loading visits:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [dateRange])

  useFocusEffect(
    useCallback(() => {
      setLoading(true)
      loadVisits()
    }, [loadVisits])
  )

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadVisits()
  }, [loadVisits])

  const handleDateSelect = (date: Date) => {
    // Toggle selection - if same date clicked, deselect
    if (selectedDate && selectedDate.getTime() === date.getTime()) {
      setSelectedDate(null)
    } else {
      setSelectedDate(date)
    }
  }

  // Get visits for selected day
  const selectedDayVisits = useMemo(() => {
    if (!selectedDate) return []
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
    return visits.filter((visit) => {
      const visitDate = new Date(visit.scheduled_at)
      const visitDateStr = `${visitDate.getFullYear()}-${String(visitDate.getMonth() + 1).padStart(2, '0')}-${String(visitDate.getDate()).padStart(2, '0')}`
      return visitDateStr === dateStr
    })
  }, [selectedDate, visits])

  const handleMonthChange = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
    // Keep selected date if it's still in the visible month range
    if (selectedDate) {
      const selectedMonth = selectedDate.getMonth()
      const selectedYear = selectedDate.getFullYear()
      const newMonth = newDate.getMonth()
      const newYear = newDate.getFullYear()
      if (selectedMonth !== newMonth || selectedYear !== newYear) {
        setSelectedDate(null)
      }
    }
  }

  const goToToday = () => {
    setCurrentDate(new Date())
    // Optionally select today when jumping to current month
    // setSelectedDate(new Date())
  }

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const formatDateHeader = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  const handleVisitPress = (visit: Visit) => {
    navigation.navigate('VisitForm', { visit })
  }

  const handleDeleteVisit = async (visitId: string) => {
    Alert.alert('Delete Visit', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteVisit(visitId)
            // Refresh visits
            loadVisits()
          } catch (error) {
            Alert.alert('Error', 'Failed to delete visit')
          }
        },
      },
    ])
  }

  const handleChangeVisitStatus = async (visit: Visit) => {
    const otherStatuses = VISIT_STATUSES.filter((s) => s !== visit.status)

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', ...otherStatuses.map((s) => getVisitStatusLabel(s))],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex > 0) {
            const newStatus = otherStatuses[buttonIndex - 1]
            try {
              await updateVisitStatus(visit.id, newStatus)
              loadVisits()
            } catch (error) {
              Alert.alert('Error', 'Failed to update visit status')
            }
          }
        }
      )
    } else {
      Alert.alert(
        'Change Status',
        'Select new status:',
        [
          { text: 'Cancel', style: 'cancel' },
          ...otherStatuses.map((status) => ({
            text: getVisitStatusLabel(status),
            onPress: async () => {
              try {
                await updateVisitStatus(visit.id, status)
                loadVisits()
              } catch (error) {
                Alert.alert('Error', 'Failed to update visit status')
              }
            },
          })),
        ],
        { cancelable: true }
      )
    }
  }

  const handleAddVisit = () => {
    navigation.navigate('VisitForm', {
      scheduledDate: selectedDate ? selectedDate.toISOString() : undefined,
    })
  }

  const handleAddToCalendar = async (visit: Visit) => {
    try {
      const authStatus = await RNCalendarEvents.requestPermissions()

      if (authStatus === 'authorized') {
        const title = `Meeting at ${visit.property?.title || visit.property?.address || 'Property'}`
        const startDate = new Date(visit.scheduled_at)
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000) // Default 1 hour duration

        await RNCalendarEvents.saveEvent(title, {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          location: visit.property?.address || '',
          notes: visit.notes || '',
        })

        Alert.alert('Success', 'Event added to your native calendar')
      } else {
        Alert.alert('Permission Denied', 'Please enable calendar access in settings to use this feature.')
      }
    } catch (error) {
      console.error('Error adding to calendar:', error)
      Alert.alert('Error', 'Failed to add event to calendar')
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.titleText}>Calendar</Text>
          </View>
          <TouchableOpacity onPress={handleAddVisit} style={styles.addButton}>
            <FeatherIcon name="plus" size={22} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity
            onPress={() => handleMonthChange('prev')}
            style={styles.navButton}
          >
            <FeatherIcon name="chevron-left" size={20} color={theme.colors.text} />
          </TouchableOpacity>

          <TouchableOpacity onPress={goToToday} style={styles.monthYearContainer}>
            <Text style={styles.monthYearText}>{formatMonthYear(currentDate)}</Text>
            <Text style={styles.todayText}>Today</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleMonthChange('next')}
            style={styles.navButton}
          >
            <FeatherIcon name="chevron-right" size={20} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Calendar */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <>
            <CalendarMonthView
              currentDate={currentDate}
              visits={visits}
              onDateSelect={handleDateSelect}
              selectedDate={selectedDate}
            />

            {visits.length === 0 && !selectedDate && (
              <View style={styles.emptyContainer}>
                <FeatherIcon name="calendar" size={48} color={theme.colors.textMuted} style={{ opacity: 0.3 }} />
                <Text style={styles.emptyTitle}>No visits this month</Text>
                <Text style={styles.emptySubtitle}>Schedule your first property visit</Text>
                <TouchableOpacity onPress={handleAddVisit} style={styles.emptyButton}>
                  <Text style={styles.emptyButtonText}>Schedule Visit</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Selected Day Visits Section */}
            {selectedDate && (
              <View style={styles.selectedDaySection}>
                <View style={styles.selectedDayHeader}>
                  <View>
                    <Text style={styles.selectedDayTitle}>
                      {formatDateHeader(selectedDate)}
                    </Text>
                    <Text style={styles.selectedDaySubtitle}>
                      {selectedDayVisits.length === 0
                        ? 'No visits scheduled'
                        : `${selectedDayVisits.length} ${selectedDayVisits.length === 1 ? 'visit' : 'visits'}`}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedDate(null)}
                    style={styles.deselectButton}
                  >
                    <FeatherIcon name="x" size={18} color={theme.colors.textMuted} />
                  </TouchableOpacity>
                </View>

                {selectedDayVisits.length === 0 ? (
                  <View style={styles.emptyDayContainer}>
                    <TouchableOpacity
                      onPress={() => {
                        navigation.navigate('VisitForm', {
                          scheduledDate: selectedDate.toISOString(),
                        })
                      }}
                      style={styles.scheduleButton}
                    >
                      <FeatherIcon name="plus" size={16} color={theme.colors.white} style={{ marginRight: 6 }} />
                      <Text style={styles.scheduleButtonText}>Schedule Visit</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.visitsList}>
                    {selectedDayVisits.map((item) => (
                      <SwipeableVisitItem
                        key={item.id}
                        visit={item}
                        onPress={() => handleVisitPress(item)}
                        onDelete={() => handleDeleteVisit(item.id)}
                        onAddToCalendar={() => handleAddToCalendar(item)}
                        onLongPress={() => handleChangeVisitStatus(item)}
                        formatTime={formatTime}
                      />
                    ))}
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleText: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthYearContainer: {
    alignItems: 'center',
  },
  monthYearText: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
  },
  todayText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: theme.typography.fontFamily,
  },
  selectedDaySection: {
    marginTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  selectedDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  selectedDayTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    marginBottom: 4,
  },
  selectedDaySubtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily,
  },
  deselectButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  emptyDayContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  scheduleButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: theme.typography.fontFamily,
  },
  visitsList: {
    paddingBottom: 20,
  },
  deleteAction: {
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'flex-end',
    flex: 1,
    borderRadius: 16,
  },
  deleteButtonInner: {
    width: 80,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  visitItemWrapper: {
    marginBottom: 12,
  },
  visitItem: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  visitTimeContainer: {
    width: 65,
    justifyContent: 'center',
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.05)',
  },
  visitTime: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
  },
  visitContent: {
    flex: 1,
    paddingLeft: 16,
  },
  visitTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  visitProperty: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    flex: 1,
    marginRight: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  visitAddress: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
    maxWidth: '90%',
  },
  notesContainer: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    padding: 8,
    borderRadius: 8,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(0,0,0,0.05)',
  },
  visitNotes: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  visitStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  visitStatusText: {
    fontSize: 10,
    fontWeight: '900',
    fontFamily: theme.typography.fontFamily,
    letterSpacing: 0.8,
  },
  calendarAction: {
    backgroundColor: theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'flex-start',
    flex: 1,
    borderRadius: 16,
  },
  calendarButtonInner: {
    width: 80,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
})

interface SwipeableVisitItemProps {
  visit: Visit
  onPress: () => void
  onDelete: () => void
  onAddToCalendar: () => void
  onLongPress?: () => void
  formatTime: (isoString: string) => string
}

function SwipeableVisitItem({ visit, onPress, onDelete, onAddToCalendar, onLongPress, formatTime }: SwipeableVisitItemProps) {
  const swipeableRef = useRef<Swipeable>(null)

  const renderLeftActions = (
    progress: RNAnimated.AnimatedInterpolation<number>,
    dragX: RNAnimated.AnimatedInterpolation<number>
  ) => {
    const trans = dragX.interpolate({
      inputRange: [0, 100],
      outputRange: [-80, 0],
      extrapolate: 'clamp',
    })

    const scale = dragX.interpolate({
      inputRange: [0, 40, 80],
      outputRange: [0, 0.8, 1],
      extrapolate: 'clamp',
    })

    return (
      <View style={styles.calendarAction}>
        <RNAnimated.View
          style={[
            styles.calendarButtonInner,
            {
              transform: [{ translateX: trans }, { scale }],
            },
          ]}
        >
          <FeatherIcon name="calendar" size={24} color={theme.colors.white} />
        </RNAnimated.View>
      </View>
    )
  }

  const renderRightActions = (
    progress: RNAnimated.AnimatedInterpolation<number>,
    dragX: RNAnimated.AnimatedInterpolation<number>
  ) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 80],
      extrapolate: 'clamp',
    })

    const scale = dragX.interpolate({
      inputRange: [-80, -40, 0],
      outputRange: [1, 0.8, 0],
      extrapolate: 'clamp',
    })

    return (
      <View style={styles.deleteAction}>
        <RNAnimated.View
          style={[
            styles.deleteButtonInner,
            {
              transform: [{ translateX: trans }, { scale }],
            },
          ]}
        >
          <FeatherIcon name="trash-2" size={24} color={theme.colors.white} />
        </RNAnimated.View>
      </View>
    )
  }

  return (
    <View style={styles.visitItemWrapper}>
      <Swipeable
        ref={swipeableRef}
        renderLeftActions={renderLeftActions}
        renderRightActions={renderRightActions}
        onSwipeableOpen={(direction) => {
          if (direction === 'right') {
            onDelete()
            swipeableRef.current?.close()
          } else if (direction === 'left') {
            onAddToCalendar()
            swipeableRef.current?.close()
          }
        }}
        leftThreshold={100}
        rightThreshold={100}
        friction={2}
        overshootLeft={true}
        overshootRight={true}
      >
        <TouchableOpacity
          onPress={onPress}
          onLongPress={onLongPress}
          activeOpacity={0.7}
          style={styles.visitItem}
        >
          <View style={styles.visitTimeContainer}>
            <Text style={styles.visitTime}>{formatTime(visit.scheduled_at)}</Text>
          </View>

          <View style={styles.visitContent}>
            <View style={styles.visitTitleRow}>
              <Text style={styles.visitProperty} numberOfLines={1}>
                {visit.property?.title || visit.property?.address || 'Property'}
              </Text>
              <View
                style={[
                  styles.visitStatusBadge,
                  { backgroundColor: getVisitStatusColor(visit.status) + '10' },
                ]}
              >
                <Text
                  style={[
                    styles.visitStatusText,
                    { color: getVisitStatusColor(visit.status) },
                  ]}
                >
                  {getVisitStatusLabel(visit.status).toUpperCase()}
                </Text>
              </View>
            </View>

            {visit.property?.address && visit.property.title && (
              <View style={styles.locationRow}>
                <FeatherIcon name="map-pin" size={12} color={theme.colors.textMuted} style={{ marginRight: 4 }} />
                <Text style={styles.visitAddress} numberOfLines={1}>
                  {formatAddress(visit.property.address)}
                </Text>
              </View>
            )}

            {visit.notes && (
              <View style={styles.notesContainer}>
                <Text style={styles.visitNotes} numberOfLines={2}>
                  {visit.notes}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Swipeable>
    </View>
  )
}
