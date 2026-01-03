import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { theme } from '../theme/theme'

export default function KanbanScreen() {
  return (
    <View style={styles.container}>
      {/* Refined Placeholder */}
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.placeholderEmoji}>▦</Text>
        </View>
        <Text style={styles.placeholderText}>Kanban Board</Text>
        <Text style={styles.placeholderSubtext}>
          Drag and drop properties between status columns to track your progress.
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  placeholderEmoji: {
    fontSize: 40,
  },
  placeholderText: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    marginBottom: 12,
  },
  placeholderSubtext: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
    textAlign: 'center',
    lineHeight: 22,
  },
})

