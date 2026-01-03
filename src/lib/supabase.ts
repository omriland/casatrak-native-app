import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient, SupabaseClientOptions } from '@supabase/supabase-js'
import { CONFIG } from './config'

// Ensure URL is properly formatted as a string
const supabaseUrl = String(CONFIG.SUPABASE_URL).trim()
const supabaseAnonKey = CONFIG.SUPABASE_ANON_KEY

console.log('Initializing Supabase client with URL:', supabaseUrl)

// Configuration that avoids realtime initialization issues
const options: SupabaseClientOptions<'public'> = {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, options)
