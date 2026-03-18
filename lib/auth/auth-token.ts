import { Capacitor } from '@capacitor/core'

// Store auth token
export async function saveAuthToken(token: string) {
  if (Capacitor.isNativePlatform()) {
    const { Preferences } = await import('@capacitor/preferences')
    await Preferences.set({ key: 'auth_token', value: token })
  } else {
    localStorage.setItem('auth_token', token)
  }
}

export async function getAuthToken(): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    const { Preferences } = await import('@capacitor/preferences')
    const { value } = await Preferences.get({ key: 'auth_token' })
    return value
  } else {
    return localStorage.getItem('auth_token')
  }
}

export async function removeAuthToken() {
  if (Capacitor.isNativePlatform()) {
    const { Preferences } = await import('@capacitor/preferences')
    await Preferences.remove({ key: 'auth_token' })
  } else {
    localStorage.removeItem('auth_token')
  }
}

// Validate token by checking if it's expired (JWT)
export function isTokenExpired(token: string): boolean {
  try {
    // JWT tokens have 3 parts: header.payload.signature
    const parts = token.split('.')
    if (parts.length !== 3) {
      return true // Invalid format
    }

    // Decode the payload (base64)
    const payload = JSON.parse(atob(parts[1]))

    // Check if token has expiration time
    if (!payload.exp) {
      return false // No expiration, consider valid
    }

    // Check if token is expired (exp is in seconds, Date.now() is in milliseconds)
    const currentTime = Math.floor(Date.now() / 1000)
    return payload.exp < currentTime
  } catch (error) {
    console.error('Error validating token:', error)
    return true // Consider invalid if we can't parse it
  }
}

// Check if user is authenticated with a valid token
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthToken()
  if (!token) {
    return false
  }

  return !isTokenExpired(token)
}

// export async function exchangeCodeForToken(code: string) {
//   try {
//     const { apiClient } = await import('@/lib/api/client')
//     const response = await apiClient.post('/api/auth/google-mobile', { code })
//     if (!response.success) {
//       throw new Error(response.error || 'Failed to exchange code for token')
//     }
//     return response.data
//   } catch (error) {
//     console.error('Error exchanging code:', error)
//     throw error
//   }
// }
