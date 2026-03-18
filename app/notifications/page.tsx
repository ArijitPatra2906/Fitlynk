'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/icon'
import { apiClient } from '@/lib/api/client'
import { getAuthToken } from '@/lib/auth/auth-token'
import { Notification } from '@/types/notification'
import { toast } from 'sonner'
import { NotificationsPageSkeleton } from '@/components/ui/skeleton'

const getNotificationIcon = (type: string): string => {
  switch (type) {
    case 'workout_completed':
    case 'pr_achieved':
    case 'workout_reminder':
      return 'dumbbell'
    case 'calorie_goal_reached':
    case 'macro_goal_reached':
    case 'meal_reminder':
      return 'utensils'
    case 'step_goal_reached':
    case 'step_sync_complete':
      return 'activity'
    case 'water_goal_reached':
    case 'water_reminder':
      return 'water'
    case 'perfect_day':
    case 'streak_milestone':
      return 'award'
    case 'morning_checkin':
    case 'evening_summary':
    case 'weekly_summary':
      return 'calendar'
    case 'goal_update_reminder':
      return 'target'
    case 'todo_reminder':
      return 'checkSquare'
    default:
      return 'bell'
  }
}

const getNotificationColor = (type: string): string => {
  switch (type) {
    case 'workout_completed':
    case 'pr_achieved':
      return '#3B82F6' // Blue
    case 'calorie_goal_reached':
    case 'macro_goal_reached':
      return '#10B981' // Green
    case 'step_goal_reached':
      return '#22D3EE' // Cyan
    case 'water_goal_reached':
      return '#06B6D4' // Teal
    case 'perfect_day':
    case 'streak_milestone':
      return '#F59E0B' // Orange
    case 'morning_checkin':
    case 'evening_summary':
      return '#8B5CF6' // Purple
    case 'todo_reminder':
      return '#F59E0B' // Amber
    default:
      return '#3B82F6' // Blue
  }
}

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const observerTarget = useRef<HTMLDivElement>(null)

  const ITEMS_PER_PAGE = 10

  const fetchNotifications = async (pageNum: number, append = false) => {
    try {
      if (append) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }

      const token = await getAuthToken()
      if (!token) {
        router.push('/login')
        return
      }

      const readParam = filter === 'unread' ? 'read=false&' : ''
      const queryParams = `?${readParam}page=${pageNum}&limit=${ITEMS_PER_PAGE}`
      const response = await apiClient.get(
        `/api/notifications${queryParams}`,
        token,
      )

      if (response.success && response.data) {
        const newNotifications = response.data.notifications || []
        const pagination = response.data.pagination

        if (append) {
          setNotifications((prev) => [...prev, ...newNotifications])
        } else {
          setNotifications(newNotifications)
        }

        // Check if there are more notifications to load
        if (pagination) {
          setHasMore(pagination.page < pagination.pages)
        } else {
          setHasMore(newNotifications.length === ITEMS_PER_PAGE)
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    setPage(1)
    setHasMore(true)
    fetchNotifications(1, false)
  }, [filter])

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          const nextPage = page + 1
          setPage(nextPage)
          fetchNotifications(nextPage, true)
        }
      },
      { threshold: 0.1 },
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [hasMore, loading, loadingMore, page])

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const token = await getAuthToken()
      if (!token) return

      const response = await apiClient.patch(
        `/api/notifications/${notificationId}/read`,
        {},
        token,
      )

      if (response.success) {
        setNotifications(
          notifications.map((n) =>
            n._id === notificationId
              ? { ...n, read: true, read_at: new Date().toISOString() }
              : n,
          ),
        )

        // Trigger refresh of notification bell
        window.dispatchEvent(new CustomEvent('notification:refresh'))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const token = await getAuthToken()
      if (!token) return

      const response = await apiClient.patch(
        '/api/notifications/read-all',
        {},
        token,
      )

      if (response.success) {
        setNotifications(
          notifications.map((n) => ({
            ...n,
            read: true,
            read_at: new Date().toISOString(),
          })),
        )

        // Trigger refresh of notification bell
        window.dispatchEvent(new CustomEvent('notification:refresh'))

        toast.success('All notifications marked as read')
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast.error('Failed to mark all as read')
    }
  }

  const handleDeleteNotification = async (
    notificationId: string,
    event: React.MouseEvent,
  ) => {
    event.stopPropagation() // Prevent notification click

    try {
      const token = await getAuthToken()
      if (!token) return

      const response = await apiClient.delete(
        `/api/notifications/${notificationId}`,
        token,
      )

      if (response.success) {
        setNotifications(notifications.filter((n) => n._id !== notificationId))

        // Trigger refresh of notification bell
        window.dispatchEvent(new CustomEvent('notification:refresh'))

        toast.success('Notification deleted')
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error('Failed to delete notification')
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already
    if (!notification.read) {
      await handleMarkAsRead(notification._id)
    }

    // Navigate to redirect path if available
    if (notification.redirect_path) {
      router.push(notification.redirect_path)
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  if (loading) {
    return <NotificationsPageSkeleton />
  }

  return (
    <div className='h-screen overflow-hidden app-shell-bg flex flex-col pb-[88px]'>
      {/* Filter Tabs & Actions - Below AppBar */}
      <div className='flex-shrink-0 px-6 py-3 app-shell-bg'>
        <div className='flex items-center justify-between'>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className='text-[13px] font-semibold text-blue-400 hover:text-blue-300 transition-colors'
            >
              Mark all read
            </button>
          )}

          <div className='flex gap-1.5 ml-auto'>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                filter === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'text-[color:var(--app-text-muted)] hover:bg-[color:var(--app-surface)]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all flex items-center gap-1.5 ${
                filter === 'unread'
                  ? 'bg-blue-500 text-white'
                  : 'text-[color:var(--app-text-muted)] hover:bg-[color:var(--app-surface)]'
              }`}
            >
              Unread
              {unreadCount > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                    filter === 'unread'
                      ? 'bg-white/20 text-white'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}
                >
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className='flex-1 overflow-y-auto px-6 pt-4 pb-4'>
        {notifications.length === 0 ? (
          <div className='app-surface border border-[color:var(--app-border)] rounded-2xl p-8 text-center'>
            <div className='w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-500/10 flex items-center justify-center'>
              <Icon name='bell' size={28} color='#3B82F6' />
            </div>
            <div className='text-[16px] font-bold text-[color:var(--app-text)] mb-1'>
              {filter === 'unread'
                ? 'No unread notifications'
                : 'No notifications yet'}
            </div>
            <div className='text-[13px] text-[color:var(--app-text-muted)]'>
              {filter === 'unread'
                ? "You're all caught up!"
                : 'Your notifications will appear here'}
            </div>
          </div>
        ) : (
          <div className='space-y-2'>
            {notifications.map((notification) => {
              const icon = getNotificationIcon(notification.type)
              const color = getNotificationColor(notification.type)

              return (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`relative app-surface border border-[color:var(--app-border)] rounded-2xl p-3 transition-all ${
                    !notification.read ? 'bg-blue-500/5 border-blue-500/20' : ''
                  } ${
                    notification.redirect_path
                      ? 'cursor-pointer hover:bg-[color:var(--app-surface-2)] active:scale-[0.98]'
                      : ''
                  }`}
                >
                  <div className='flex items-start gap-3'>
                    <div
                      className='w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0'
                      style={{
                        backgroundColor: `${color}15`,
                        border: `1px solid ${color}30`,
                      }}
                    >
                      <Icon name={icon} size={16} color={color} />
                    </div>

                    <div className='flex-1 min-w-0'>
                      <div className='flex items-start justify-between gap-2 mb-0.5'>
                        <div className='text-[13px] font-bold text-[color:var(--app-text)]'>
                          {notification.title}
                        </div>
                        <div className='text-[10px] text-[color:var(--app-text-muted)] flex-shrink-0'>
                          {formatTimestamp(notification.created_at)}
                        </div>
                      </div>

                      <div className='text-[12px] text-[color:var(--app-text-muted)] mb-1.5 line-clamp-2'>
                        {notification.body}
                      </div>

                      <div className='flex items-center gap-2'>
                        {!notification.read ? (
                          <button
                            onClick={() => handleMarkAsRead(notification._id)}
                            className='text-[10px] text-blue-400 hover:text-blue-300 font-medium transition-colors'
                          >
                            Mark as read
                          </button>
                        ) : (
                          <div className='text-[10px] text-[color:var(--app-text-muted)]'>
                            Read
                          </div>
                        )}

                        <button
                          onClick={(e) =>
                            handleDeleteNotification(notification._id, e)
                          }
                          className='ml-auto p-1 rounded-lg hover:bg-red-500/10 transition-colors'
                        >
                          <Icon name='trash-2' size={13} color='#EF4444' />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Infinite scroll observer target */}
            <div ref={observerTarget} className='h-4' />

            {/* Loading more indicator */}
            {loadingMore && (
              <div className='flex justify-center py-6'>
                <div className='flex items-center gap-2'>
                  <div className='w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin' />
                  <span className='text-[13px] text-[color:var(--app-text-muted)]'>
                    Loading more...
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
