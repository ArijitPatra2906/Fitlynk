'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/icon'

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
}

const nutritionConfig: AppBarConfig = {
  title: 'Nutrition',
  showBack: false,
  actions: (
    <div className='flex gap-1.5 bg-[#131520] rounded-xl p-1 border border-white/5'>
      {['Today', 'Week'].map((label, i) => (
        <div
          key={label}
          className={`py-1.5 px-3.5 rounded-lg text-[12px] font-semibold ${
            i === 0 ? 'bg-blue-600 text-white' : 'text-gray-400'
          }`}
        >
          {label}
        </div>
      ))}
    </div>
  ),
}

const progressConfig: AppBarConfig = {
  title: 'Progress',
  showBack: false,
}

const workoutConfig: AppBarConfig = {
  title: 'Push A',
  showBack: true,
}

const foodSearchConfig: AppBarConfig = {
  title: 'Add Food',
  showBack: true,
  actions: (
    <div className='w-[42px] h-[42px] rounded-2xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center flex-shrink-0'>
      <Icon name='camera' size={18} color='#3B82F6' />
    </div>
  ),
}

const settingsGoalsConfig: AppBarConfig = {
  title: 'Nutrition Goals',
  subtitle: 'Set your daily targets',
  showBack: true,
}

const routeConfigs: Record<string, AppBarConfig> = {
  '/dashboard': dashboardConfig,
  '/exercise': exerciseConfig,
  '/nutrition': nutritionConfig,
  '/progress': progressConfig,
  '/workout': workoutConfig,
  '/food-search': foodSearchConfig,
  '/settings/goals': settingsGoalsConfig,
}

export function AppBar() {
  const pathname = usePathname()
  const router = useRouter()
  const [greeting, setGreeting] = useState('')
  const [mounted, setMounted] = useState(false)
  const [userName, setUserName] = useState('User')
  const [userAvatar, setUserAvatar] = useState<string | null>(null)

  // Set greeting and fetch user data on client side only
  useEffect(() => {
    setGreeting(getGreeting())
    setMounted(true)

    // Fetch user data
    const fetchUser = async () => {
      try {
        const { getAuthToken } = await import('@/lib/auth/auth-token')
        const { apiClient } = await import('@/lib/api/client')
        const token = await getAuthToken()

        if (!token) {
          return
        }

        const response = await apiClient.get('/api/auth/me', token)
        if (response.success && response.data) {
          setUserName(response.data.name?.split(' ')[0] || 'User')
          setUserAvatar(response.data.avatar_url || null)
        }
      } catch (error) {
        console.error('[AppBar] Failed to fetch user data:', error)
      }
    }

    fetchUser()
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
  const userInitial = userName.charAt(0).toUpperCase()

  // Override title and subtitle for dashboard with user's name
  if (pathname === '/dashboard' || pathname === '/dashboard/') {
    config.title = userName
    config.subtitle = mounted ? `${greeting} 👋` : ''
  }

  return (
    <div className='flex-shrink-0 px-6 pt-safe pb-3 flex items-center justify-between bg-[#0B0D17] border-b border-white/5'>
      {/* Left Side */}
      <div className='flex items-center gap-3 flex-1'>
        {config.showBack && (
          <button
            onClick={() => router.back()}
            className='w-10 h-10 rounded-xl bg-[#131520] border border-white/5 flex items-center justify-center'
          >
            <Icon name='arrowLeft' size={20} color='#64748B' />
          </button>
        )}

        <div suppressHydrationWarning>
          {config.subtitle && (
            <div
              className='text-[13px] text-gray-400 mb-0.5'
              suppressHydrationWarning
            >
              {config.subtitle}
            </div>
          )}
          <div
            className={`font-extrabold text-white tracking-tight ${
              config.subtitle ? 'text-[22px]' : 'text-[18px]'
            }`}
            suppressHydrationWarning
          >
            {config.title}
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className='flex gap-2.5'>
        {config.actions}

        {config.showNotifications && (
          <button className='w-10 h-10 rounded-xl bg-[#131520] border border-white/5 flex items-center justify-center'>
            <Icon name='bell' size={18} color='#64748B' />
          </button>
        )}

        {config.showAvatar &&
          (userAvatar ? (
            <img
              src={userAvatar}
              alt={userName}
              className='w-10 h-10 rounded-full object-cover'
              suppressHydrationWarning
            />
          ) : (
            <div
              className='w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-base font-bold text-white'
              suppressHydrationWarning
            >
              {userInitial}
            </div>
          ))}
      </div>
    </div>
  )
}
