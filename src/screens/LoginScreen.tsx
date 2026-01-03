import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { theme } from '../theme/theme'
import { login } from '../lib/auth'

interface LoginScreenProps {
  onLogin: () => void
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [passcode, setPasscode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!passcode.trim() || passcode.length !== 6) {
      setError('Please enter a 6-digit passcode')
      return
    }

    setLoading(true)
    setError('')

    try {
      const success = await login(passcode)
      if (success) {
        onLogin()
      } else {
        setError('Invalid passcode')
        setPasscode('')
      }
    } catch (err) {
      setError('Login failed. Please try again.')
      setPasscode('')
    } finally {
      setLoading(false)
    }
  }

  const handlePasscodeChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '').slice(0, 6)
    setPasscode(numericText)
    setError('')
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoIconContainer}>
            <Text style={styles.logoEmoji}>🏠</Text>
          </View>
          <Text style={styles.logoText}>CasaTrack</Text>
          <Text style={styles.tagline}>Elevating your home journey</Text>
        </View>

        {/* Login Form */}
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Passcode</Text>
            <TextInput
              style={[styles.input, error ? styles.inputError : null]}
              placeholder="000000"
              placeholderTextColor={theme.colors.textMuted}
              value={passcode}
              onChangeText={handlePasscodeChange}
              keyboardType="number-pad"
              maxLength={6}
              secureTextEntry={true}
              autoFocus={true}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          <TouchableOpacity
            style={[styles.mainButton, loading || passcode.length !== 6 ? styles.buttonDisabled : null]}
            onPress={handleLogin}
            disabled={loading || passcode.length !== 6}
            activeOpacity={0.9}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.white} />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Request access</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  logoEmoji: {
    fontSize: 36,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
    marginTop: 4,
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 24,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 13,
    fontFamily: theme.typography.fontFamily,
    marginTop: 8,
    textAlign: 'center',
  },
  mainButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '800',
    fontFamily: theme.typography.fontFamily,
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  secondaryButton: {
    padding: 10,
  },
  secondaryButtonText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: theme.typography.fontFamily,
  },
})
