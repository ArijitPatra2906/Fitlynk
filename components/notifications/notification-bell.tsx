'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/icon'
import { apiClient } from '@/lib/api/client'
import { getAuthToken } from '@/lib/auth/auth-token'

export function NotificationBell() {
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchUnreadCount = async () => {
    try {
      const token = await getAuthToken()
      if (!token) {
        setLoading(false)
        return
      }

      const response = await apiClient.get(
        '/api/notifications/unread-count',
        token
      )

      if (response.success && response.data) {
        setUnreadCount(response.data.count || 0)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUnreadCount()

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)

    // Listen for custom events that might update the count
    const handleRefresh = () => fetchUnreadCount()
    window.addEventListener('notification:refresh', handleRefresh)

    return () => {
      clearInterval(interval)
      window.removeEventListener('notification:refresh', handleRefresh)
    }
  }, [])

  const handleClick = () => {
    router.push('/notifications')
  }

  return (
    <button
      onClick={handleClick}
      className='relative w-10 h-10 rounded-xl app-surface border flex items-center justify-center'
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      <Icon name='bell' size={18} color='#64748B' />

      {!loading && unreadCount > 0 && (
        <div className='absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center px-1'>
          <span className='text-white text-[10px] font-bold'>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        </div>
      )}
    </button>
  )
}
