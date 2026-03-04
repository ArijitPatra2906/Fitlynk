import { useState, useEffect } from 'react'
import { apiClient } from '../api/client'
import { getAuthToken } from '../auth/auth-token'
import { NotificationPreferences } from '@/types/notification'

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPreferences = async () => {
    try {
      setLoading(true)
      const token = await getAuthToken()

      if (!token) {
        setError('Not authenticated')
        setLoading(false)
        return
      }

      const response = await apiClient.get('/api/notifications/preferences', token)

      if (response.success && response.data) {
        setPreferences(response.data)
        setError(null)
      } else {
        setError(response.error || 'Failed to load preferences')
      }
    } catch (err) {
      console.error('Error fetching notification preferences:', err)
      setError('Failed to load preferences')
    } finally {
      setLoading(false)
    }
  }

  const togglePushNotifications = async () => {
    if (!preferences) return false

    try {
      const newValue = !preferences.push_notifications_enabled
      const token = await getAuthToken()

      if (!token) return false

      const response = await apiClient.put(
        '/api/notifications/preferences',
        {
          ...preferences,
          push_notifications_enabled: newValue,
        },
        token
      )

      if (response.success) {
        setPreferences({
          ...preferences,
          push_notifications_enabled: newValue,
        })
        return true
      }

      return false
    } catch (err) {
      console.error('Error toggling push notifications:', err)
      return false
    }
  }

  useEffect(() => {
    fetchPreferences()
  }, [])

  return {
    preferences,
    loading,
    error,
    togglePushNotifications,
    refetch: fetchPreferences,
  }
}
