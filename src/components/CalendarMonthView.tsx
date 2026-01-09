import React, { useMemo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { theme } from '../theme/theme'
import { Visit } from '../types/visit'
import { getVisitStatusColor } from '../constants/visits'
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated'

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  visits: Visit[]
}

interface CalendarMonthViewProps {
  currentDate: Date
  visits: Visit[]
  onDateSelect: (date: Date) => void
  selectedDate?: Date | null
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity)

export default function CalendarMonthView({
  currentDate,
  visits,
  onDateSelect,
  selectedDate,
}: CalendarMonthViewProps) {
  // Get first day of month and number of days
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Calculate calendar days
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const firstDayOfWeek = firstDay.getDay() // 0 = Sunday, 6 = Saturday

    const days: CalendarDay[] = []

    // Add days from previous month
    const prevMonth = new Date(year, month, 0)
    const daysInPrevMonth = prevMonth.getDate()
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, daysInPrevMonth - i)
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        visits: [],
      })
    }

    // Add days from current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      const dayVisits = visits.filter((visit) => {
        const visitDate = new Date(visit.scheduled_at)
        const visitDateStr = `${visitDate.getFullYear()}-${String(visitDate.getMonth() + 1).padStart(2, '0')}-${String(visitDate.getDate()).padStart(2, '0')}`
        return visitDateStr === dateStr
      })

      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
        visits: dayVisits,
      })
    }

    // Add days from next month to fill the grid (42 days = 6 weeks)
    const totalDays = days.length
    const remainingDays = 42 - totalDays
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day)
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        visits: [],
      })
    }

    return days
  }, [year, month, visits, today])

  // Group visits by status for indicators
  const getVisitIndicators = (dayVisits: Visit[]) => {
    const statuses = new Set(dayVisits.map((v) => v.status))
    return Array.from(statuses)
  }

  const isSameDay = (date1: Date, date2: Date | null | undefined): boolean => {
    if (!date2) return false
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    )
  }

  const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  return (
    <View style={styles.container}>
      {/* Weekday Headers */}
      <View style={styles.weekdayRow}>
        {weekdays.map((day, index) => (
          <View key={index} style={styles.weekdayCell}>
            <Text style={styles.weekdayText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {calendarDays.map((day, index) => {
          const isSelected = isSameDay(day.date, selectedDate)
          const indicators = getVisitIndicators(day.visits)
          const hasVisits = day.visits.length > 0

          return (
            <DayCell
              key={index}
              day={day}
              isSelected={isSelected}
              indicators={indicators}
              hasVisits={hasVisits}
              onPress={() => {
                if (day.isCurrentMonth) {
                  onDateSelect(day.date)
                }
              }}
            />
          )
        })}
      </View>
    </View>
  )
}

interface DayCellProps {
  day: CalendarDay
  isSelected: boolean
  indicators: string[]
  hasVisits: boolean
  onPress: () => void
}

function DayCell({ day, isSelected, indicators, hasVisits, onPress }: DayCellProps) {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 150 })
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 })
  }

  return (
    <AnimatedTouchable
      style={[styles.dayCell, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!day.isCurrentMonth}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.dayContent,
          day.isToday && styles.todayContent,
          isSelected && styles.selectedContent,
        ]}
      >
        <Text
          style={[
            styles.dayNumber,
            !day.isCurrentMonth && styles.dayNumberOtherMonth,
            day.isToday && styles.dayNumberToday,
            isSelected && styles.dayNumberSelected,
          ]}
        >
          {day.date.getDate()}
        </Text>
        {hasVisits && (
          <View style={styles.indicatorsContainer}>
            {indicators.slice(0, 3).map((status, idx) => (
              <View
                key={idx}
                style={[
                  styles.indicator,
                  { backgroundColor: getVisitStatusColor(status as any) },
                ]}
              />
            ))}
            {indicators.length > 3 && (
              <Text style={styles.indicatorMore}>+{indicators.length - 3}</Text>
            )}
          </View>
        )}
      </View>
    </AnimatedTouchable>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%', // 100% / 7 days
    aspectRatio: 1,
    padding: 4,
  },
  dayContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  todayContent: {
    backgroundColor: theme.colors.secondary + '15',
    borderWidth: 1,
    borderColor: theme.colors.secondary + '40',
  },
  selectedContent: {
    backgroundColor: theme.colors.primary + '10',
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    marginBottom: 2,
  },
  dayNumberOtherMonth: {
    color: theme.colors.textMuted,
    opacity: 0.3,
  },
  dayNumberToday: {
    color: theme.colors.secondary,
    fontWeight: '800',
  },
  dayNumberSelected: {
    color: theme.colors.primary,
  },
  indicatorsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    marginTop: 2,
  },
  indicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  indicatorMore: {
    fontSize: 8,
    color: theme.colors.textMuted,
    fontWeight: '700',
    marginLeft: 1,
  },
})
