'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { App, URLOpenListenerEvent } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'
import { saveAuthToken } from '@/lib/auth/auth-token'

export function AppUrlListener() {
  const router = useRouter()

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return
    }

    let listenerHandle: Awaited<ReturnType<typeof App.addListener>> | null =
      null

    const handleAppUrlOpen = async (event: URLOpenListenerEvent) => {
      const url = event.url
      console.log('App opened with URL:', url)

      // Check if this is an OAuth callback
      if (url.includes('oauth')) {
        try {
          // Close the browser
          await Browser.close()

          // Extract the token directly from the URL
          const urlObj = new URL(url)
          const token = urlObj.searchParams.get('token')
          const needsOnboarding =
            urlObj.searchParams.get('onboarding') === 'true'

          if (token) {
            // Save the token
            await saveAuthToken(token)

            // Navigate based on whether user needs onboarding
            if (needsOnboarding) {
              router.push('/onboarding')
            } else {
              router.push('/dashboard')
            }
          }
          // else {
          //   // Fallback: Try the old flow with code exchange
          //   const code = urlObj.searchParams.get('code')
          //   if (code) {
          //     const result = await exchangeCodeForToken(code)
          //     if (result.token) {
          //       await saveAuthToken(result.token)
          //       router.push(
          //         result.needsOnboarding ? '/onboarding' : '/dashboard',
          //       )
          //     }
          //   }
          // }
        } catch (error) {
          console.error('Error handling OAuth callback:', error)
          router.push('/login?error=oauth_failed')
        }
      }
    }

    // Add listener for app URL open events (async in Capacitor 8)
    const setupListener = async () => {
      listenerHandle = await App.addListener('appUrlOpen', handleAppUrlOpen)
    }

    setupListener()

    return () => {
      if (listenerHandle) {
        listenerHandle.remove()
      }
    }
  }, [router])

  return null
}
