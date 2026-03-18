'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getAuthToken, isAuthenticated } from '@/lib/auth/auth-token'
import { Icon } from '../ui/icon'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)

  // Pages that don't require authentication
  const publicPages = ['/', '/login', '/register', '/onboarding']

  useEffect(() => {
    const checkAuth = async () => {
      // Skip auth check for public pages
      if (publicPages.includes(pathname)) {
        setIsChecking(false)
        return
      }

      try {
        // Check if user has a valid token
        const authenticated = await isAuthenticated()

        if (!authenticated) {
          console.log(
            '[AuthGuard] Token invalid/expired, redirecting to login...',
          )
          router.push('/login')
          return
        }

        setIsChecking(false)
      } catch (error) {
        console.error('[AuthGuard] Error checking authentication:', error)
        router.push('/login')
      }
    }

    checkAuth()
  }, [pathname, router])

  // Show professional loading screen while checking authentication
  if (isChecking && !publicPages.includes(pathname)) {
    return (
      <div className='flex items-center justify-center h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f1420] to-[#0a0e1a]'>
        <div className='flex flex-col items-center gap-6'>
          {/* Logo/Brand */}
          <div className='relative'>
            <div className='absolute inset-0 bg-blue-500/20 blur-3xl rounded-full' />
            <div className='relative w-20 h-20 bg-gradient-to-br from-blue-500 to-green-500 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-500/25'>
              <Icon name='dumbbell' size={36} color='white' strokeWidth={2.5} />
            </div>
          </div>

          {/* Loading text */}
          <div className='flex flex-col items-center gap-2'>
            <p className='text-[15px] font-semibold text-white'>
              Verifying Session
            </p>
            <p className='text-[13px] text-gray-500'>Please wait a moment...</p>
          </div>

          {/* Animated dots */}
          <div className='flex gap-2'>
            <div
              className='w-2 h-2 bg-blue-500 rounded-full animate-bounce'
              style={{ animationDelay: '0ms' }}
            />
            <div
              className='w-2 h-2 bg-blue-500 rounded-full animate-bounce'
              style={{ animationDelay: '150ms' }}
            />
            <div
              className='w-2 h-2 bg-blue-500 rounded-full animate-bounce'
              style={{ animationDelay: '300ms' }}
            />
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
