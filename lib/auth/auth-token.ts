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
