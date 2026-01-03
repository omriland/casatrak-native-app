import AsyncStorage from '@react-native-async-storage/async-storage'
import { CONFIG } from './config'

const AUTH_KEY = 'casatrack_auth'
const AUTH_PASSWORD = CONFIG.AUTH_PASSWORD

export async function login(password: string): Promise<boolean> {
  if (password === AUTH_PASSWORD) {
    await AsyncStorage.setItem(AUTH_KEY, 'authenticated')
    return true
  }
  return false
}

export async function logout(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_KEY)
}

export async function isAuthenticated(): Promise<boolean> {
  const auth = await AsyncStorage.getItem(AUTH_KEY)
  return auth === 'authenticated'
}
