'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import notificationService from '@/lib/services/notification-service'
import { getAuthToken } from '@/lib/auth/auth-token'

/**
 * Initializes notification service when user is authenticated
 * Place this in the root layout or dashboard
 */
export function NotificationInitializer() {
  const pathname = usePathname()

  useEffect(() => {
    const initNotifications = async () => {
      // Check if user is authenticated
      const token = await getAuthToken()

      if (!token) {
        console.log('User not authenticated - skipping notification init')
        return
      }

      // Don't initialize on login/signup pages
      if (pathname.includes('/login') || pathname.includes('/signup')) {
        return
      }

      console.log('🔔 Initializing notification service...')

      try {
        await notificationService.initialize()
        console.log('✅ Notification service initialized successfully')
      } catch (error) {
        console.error('❌ Failed to initialize notification service:', error)
      }
    }

    // Small delay to ensure auth is loaded
    const timer = setTimeout(initNotifications, 1000)

    return () => {
      clearTimeout(timer)
    }
  }, [pathname])

  return null // This component doesn't render anything
}
