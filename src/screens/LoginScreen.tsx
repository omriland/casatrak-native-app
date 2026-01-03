import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { theme } from '../theme/theme'
import { login } from '../lib/auth'

const { width } = Dimensions.get('window')

interface LoginScreenProps {
  onLogin: () => void
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [passcode, setPasscode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0]
  const slideAnim = useState(new Animated.Value(30))[0]

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const handleLogin = async () => {
    if (!passcode.trim() || passcode.length !== 6) {
      setError('Please enter your 6-digit passcode')
      return
    }

    setLoading(true)
    setError('')

    try {
      const success = await login(passcode)
      if (success) {
        onLogin()
      } else {
        setError('The passcode you entered is incorrect')
        setPasscode('')
      }
    } catch (err) {
      setError('Connection error. Please try again.')
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
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Top Decorative Element */}
          <View style={styles.headerSpacer} />

          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={['#7C3AED', '#4F46E5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoIcon}
            >
              <Text style={styles.logoEmoji}>🏠</Text>
            </LinearGradient>
            <Text style={styles.appName}>CasaTrack</Text>
            <Text style={styles.appTagline}>Your property journey, refined.</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>ENTER PASSCODE</Text>
              <View style={styles.passcodeWrapper}>
                {[...Array(6)].map((_, i) => (
                  <View 
                    key={i} 
                    style={[
                      styles.dot, 
                      passcode.length > i && styles.dotFilled,
                      error && styles.dotError
                    ]} 
                  />
                ))}
                <TextInput
                  style={styles.hiddenInput}
                  value={passcode}
                  onChangeText={handlePasscodeChange}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus={true}
                  caretHidden={true}
                />
              </View>
              {error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : (
                <Text style={styles.hintText}>Enter the 6-digit code to continue</Text>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.loginButton,
                (loading || passcode.length !== 6) && styles.loginButtonDisabled
              ]}
              onPress={handleLogin}
              disabled={loading || passcode.length !== 6}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.loginButtonText}>Continue</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Bottom Section */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.footerButton}>
              <Text style={styles.footerButtonText}>Forgot passcode?</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.footerButton}>
              <Text style={styles.footerButtonText}>Request Access</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
  },
  headerSpacer: {
    height: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoIcon: {
    width: 84,
    height: 84,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  logoEmoji: {
    fontSize: 40,
  },
  appName: {
    fontSize: 34,
    fontWeight: '800',
    color: '#111827',
    fontFamily: theme.typography.fontFamily,
    letterSpacing: -0.5,
  },
  appTagline: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: theme.typography.fontFamily,
    marginTop: 4,
  },
  formSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
  },
  inputContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    fontFamily: theme.typography.fontFamily,
    letterSpacing: 1.5,
    marginBottom: 30,
  },
  passcodeWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: 50,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginHorizontal: 12,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
    transform: [{ scale: 1.2 }],
  },
  dotError: {
    borderColor: '#EF4444',
  },
  hiddenInput: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    fontFamily: theme.typography.fontFamily,
    marginTop: 24,
    textAlign: 'center',
    fontWeight: '500',
  },
  hintText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontFamily: theme.typography.fontFamily,
    marginTop: 24,
    textAlign: 'center',
  },
  loginButton: {
    width: '100%',
    height: 60,
    backgroundColor: '#111827',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  loginButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    fontFamily: theme.typography.fontFamily,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerButton: {
    padding: 10,
  },
  footerButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: theme.typography.fontFamily,
  },
  divider: {
    width: 1,
    height: 14,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 10,
  },
})
