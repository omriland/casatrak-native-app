import { Linking } from 'react-native'
import { getProperty } from './properties'
import { navigationRef } from './navigation'
import { Property } from '../types/property'

// Deep link configuration for React Navigation
export const linking = {
  prefixes: [
    'casatrack://',
    'https://casa-track.netlify.app',
    'http://casa-track.netlify.app',
  ],
  
  // Custom function to handle the URL parsing
  async getInitialURL(): Promise<string | null> {
    // First, check if app was opened from a deep link
    const url = await Linking.getInitialURL()
    return url
  },

  // Listen to incoming links from deep linking
  subscribe(listener: (url: string) => void) {
    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      listener(url)
    })

    return () => {
      linkingSubscription.remove()
    }
  },

  // Config for React Navigation (we handle navigation manually for more control)
  config: {
    screens: {
      MainTabs: {
        screens: {
          Home: '',
        },
      },
    },
  },
}

/**
 * Parse a deep link URL and extract the property ID if present
 */
export function parseDeepLink(url: string): { propertyId: string | null } {
  try {
    // Handle both full URLs and custom scheme
    let propertyId: string | null = null

    // Parse URL
    if (url.includes('casa-track.netlify.app') || url.startsWith('casatrack://')) {
      // Extract query parameters
      const urlObj = new URL(url.replace('casatrack://', 'https://casatrack.app/'))
      propertyId = urlObj.searchParams.get('property')
    }

    return { propertyId }
  } catch (error) {
    console.error('Error parsing deep link:', error)
    return { propertyId: null }
  }
}

/**
 * Handle incoming deep link and navigate to the appropriate screen
 */
export async function handleDeepLink(url: string): Promise<boolean> {
  console.log('Handling deep link:', url)
  
  const { propertyId } = parseDeepLink(url)
  
  if (propertyId) {
    try {
      // Fetch the property from the database
      const property = await getProperty(propertyId)
      
      if (property && navigationRef.isReady()) {
        // Navigate to the property detail screen
        navigationRef.navigate('PropertyDetail', { property })
        return true
      } else {
        console.warn('Property not found or navigation not ready:', propertyId)
      }
    } catch (error) {
      console.error('Error fetching property for deep link:', error)
    }
  }
  
  return false
}

/**
 * Initialize deep link handling - call this once when the app starts
 */
export async function initializeDeepLinking(): Promise<void> {
  // Handle the initial URL (if app was opened via deep link)
  const initialUrl = await Linking.getInitialURL()
  if (initialUrl) {
    // Small delay to ensure navigation is ready
    setTimeout(() => {
      handleDeepLink(initialUrl)
    }, 500)
  }

  // Listen for incoming links while app is running
  Linking.addEventListener('url', ({ url }) => {
    handleDeepLink(url)
  })
}
