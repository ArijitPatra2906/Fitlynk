'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/icon'
import { Skeleton } from '@/components/ui/skeleton'
import { NotificationBell } from '@/components/notifications/notification-bell'

interface AppBarConfig {
  title?: string
  subtitle?: string
  showBack?: boolean
  showNotifications?: boolean
  showAvatar?: boolean
  actions?: React.ReactNode
}

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

const dashboardConfig: AppBarConfig = {
  title: '', // Will be set dynamically
  subtitle: '', // Will be set dynamically
  showNotifications: true,
  showAvatar: true,
}

const exerciseConfig: AppBarConfig = {
  title: 'Exercise',
  showBack: false,
  showNotifications: true,
  showAvatar: true,
}

const stepsConfig: AppBarConfig = {
  title: 'Steps',
  showBack: false,
  showNotifications: true,
  showAvatar: true,
}

const waterConfig: AppBarConfig = {
  title: 'Water',
  showBack: false,
  showNotifications: true,
  showAvatar: true,
}

const nutritionConfig: AppBarConfig = {
  title: 'Nutrition',
  showBack: false,
  showNotifications: true,
  showAvatar: true,
}

const progressConfig: AppBarConfig = {
  title: 'Progress',
  showBack: false,
  showNotifications: true,
  showAvatar: true,
}

const workoutConfig: AppBarConfig = {
  title: 'Push A',
  showBack: true,
  showNotifications: true,
  showAvatar: true,
}

const foodSearchConfig: AppBarConfig = {
  title: 'Add Food',
  showBack: true,
  showNotifications: true,
  showAvatar: true,
  actions: (
    <div className='w-[42px] h-[42px] rounded-2xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center flex-shrink-0'>
      <Icon name='camera' size={18} color='#3B82F6' />
    </div>
  ),
}

const settingsGoalsConfig: AppBarConfig = {
  title: 'Nutrition Goals',
  showBack: true,
  showNotifications: true,
  showAvatar: true,
}

const workoutsConfig: AppBarConfig = {
  title: 'All Workouts',
  showBack: true,
  showNotifications: true,
  showAvatar: true,
}

const templatesConfig: AppBarConfig = {
  title: 'All Templates',
  showBack: true,
  showNotifications: true,
  showAvatar: true,
}

const exercisesConfig: AppBarConfig = {
  title: 'All Exercises',
  showBack: true,
  showNotifications: true,
  showAvatar: true,
}

const notificationsConfig: AppBarConfig = {
  title: 'Notifications',
  showBack: true,
  showNotifications: false,
  showAvatar: true,
  actions: (
    <button
      onClick={() => {
        if (typeof window !== 'undefined') {
          window.location.href = '/settings/notifications'
        }
      }}
      className='w-10 h-10 rounded-xl app-surface border border-[color:var(--app-border)] flex items-center justify-center'
    >
      <Icon name='settings' size={18} color='#64748B' />
    </button>
  ),
}

const notificationSettingsConfig: AppBarConfig = {
  title: 'Notification Settings',
  showBack: true,
  showNotifications: false,
  showAvatar: true,
}

const routeConfigs: Record<string, AppBarConfig> = {
  '/dashboard': dashboardConfig,
  '/steps': stepsConfig,
  '/water': waterConfig,
  '/exercise': exerciseConfig,
  '/nutrition': nutritionConfig,
  '/progress': progressConfig,
  '/workout': workoutConfig,
  '/food-search': foodSearchConfig,
  '/settings/goals': settingsGoalsConfig,
  '/workouts': workoutsConfig,
  '/templates': templatesConfig,
  '/exercises': exercisesConfig,
  '/notifications': notificationsConfig,
  '/settings/notifications': notificationSettingsConfig,
}

export function AppBar() {
  const pathname = usePathname()
  const router = useRouter()
  const [greeting, setGreeting] = useState('')
  const [mounted, setMounted] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const withCacheBuster = (url?: string | null, updatedAt?: string) => {
    if (!url) return null
    const sep = url.includes('?') ? '&' : '?'
    const v = updatedAt ? new Date(updatedAt).getTime() : Date.now()
    return `${url}${sep}v=${v}`
  }

  // Set greeting and fetch user data on client side only
  useEffect(() => {
    setGreeting(getGreeting())
    setMounted(true)

    const fetchUser = async () => {
      try {
        const { getAuthToken } = await import('@/lib/auth/auth-token')
        const { apiClient } = await import('@/lib/api/client')
        const token = await getAuthToken()

        if (!token) {
          setLoading(false)
          return
        }

        const response = await apiClient.get('/api/auth/me', token)
        if (response.success && response.data) {
          setUserName(response.data.name?.split(' ')[0] || 'User')
          setUserAvatar(
            withCacheBuster(response.data.avatar_url, response.data.updated_at),
          )
        }
      } catch (error) {
        console.error('[AppBar] Failed to fetch user data:', error)
      } finally {
        setLoading(false)
      }
    }

    const onProfileUpdated = (event: Event) => {
      const detail = (event as CustomEvent).detail || {}
      if (typeof detail.name === 'string' && detail.name.trim()) {
        setUserName(detail.name.split(' ')[0] || 'User')
      }
      if (typeof detail.avatar_url === 'string') {
        setUserAvatar(withCacheBuster(detail.avatar_url, detail.updated_at))
      }
    }

    window.addEventListener(
      'profile:updated',
      onProfileUpdated as EventListener,
    )
    fetchUser()

    return () => {
      window.removeEventListener(
        'profile:updated',
        onProfileUpdated as EventListener,
      )
    }
  }, [])

  // Don't show app bar on auth pages and workout (workout has custom header with timer)
  const hideAppBarPages = [
    '/',
    '/login',
    '/register',
    '/onboarding',
    '/workout',
    '/profile',
  ]
  if (hideAppBarPages.includes(pathname)) {
    return null
  }

  const config = routeConfigs[pathname] || { title: 'Fitlynk' }

  // Get user's first name for dashboard
  const userInitial = userName?.charAt(0).toUpperCase() || 'U'

  // Override title and subtitle for dashboard with user's name
  if (pathname === '/dashboard') {
    if (loading) {
      config.title = ''
      config.subtitle = ''
    } else {
      config.title = userName || 'User'
      config.subtitle = mounted ? `${greeting} 👋` : ''
    }
  }

  return (
    <div
      className='flex-shrink-0 px-6 pt-safe pb-3 flex items-center justify-between app-shell-bg border-b'
      style={{ borderColor: 'var(--app-border)' }}
    >
      {/* Left Side */}
      <div className='flex items-center gap-3 flex-1'>
        {config.showBack && (
          <button
            onClick={() => router.back()}
            className='w-10 h-10 rounded-xl bg-[#131520] border border-white/5 flex items-center justify-center'
          >
            <Icon name='chevronLeft' size={20} color='#64748B' />
          </button>
        )}

        <div suppressHydrationWarning>
          {loading && pathname === '/dashboard' ? (
            <>
              <Skeleton className='h-4 w-28 mb-1' />
              <Skeleton className='h-6 w-20' />
            </>
          ) : (
            <>
              {config.subtitle && (
                <div
                  className='text-[13px] app-muted mb-0.5'
                  suppressHydrationWarning
                >
                  {config.subtitle}
                </div>
              )}
              <div
                className={`font-extrabold tracking-tight ${
                  config.subtitle ? 'text-[22px]' : 'text-[18px]'
                }`}
                style={{ color: 'var(--app-text)' }}
                suppressHydrationWarning
              >
                {config.title}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right Side */}
      <div className='flex gap-2.5'>
        {config.actions}

        {config.showNotifications && <NotificationBell />}

        {config.showAvatar &&
          (loading ? (
            <Skeleton className='w-10 h-10 rounded-xl' />
          ) : (
            <button
              type='button'
              onClick={() => router.push('/profile')}
              aria-label='Open profile'
              className='rounded-xl'
            >
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName || 'User'}
                  className='w-10 h-10 rounded-xl border border-white/15 object-cover'
                  suppressHydrationWarning
                />
              ) : (
                <div
                  className='w-10 h-10 rounded-xl border border-white/15 bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-base font-bold text-white'
                  suppressHydrationWarning
                >
                  {userInitial}
                </div>
              )}
            </button>
          ))}
      </div>
    </div>
  )
}
