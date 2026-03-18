'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getAuthToken, isAuthenticated } from '@/lib/auth/auth-token'

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
          console.log('[AuthGuard] Token invalid/expired, redirecting to login...')
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

  // Show nothing while checking (you could add a loading spinner here)
  if (isChecking && !publicPages.includes(pathname)) {
    return (
      <div className='flex items-center justify-center h-screen bg-[#0a0e1a]'>
        <div className='flex flex-col items-center gap-3'>
          <div className='w-8 h-8 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin' />
          <p className='text-[13px] text-gray-400'>Verifying session...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
