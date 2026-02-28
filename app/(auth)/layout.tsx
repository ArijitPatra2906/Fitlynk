'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getAuthToken } from '@/lib/auth/auth-token'
import { apiClient } from '@/lib/api/client'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getAuthToken()

      // For login and register pages
      if (pathname === '/login' || pathname === '/register') {
        if (token) {
          console.log('[Auth Layout] User already authenticated, redirecting to dashboard...')
          router.push('/dashboard')
        }
        return
      }

      // For onboarding pages
      if (pathname?.startsWith('/onboarding')) {
        if (!token) {
          console.log('[Auth Layout] User not authenticated, redirecting to login...')
          router.push('/login')
          return
        }

        // Check if user has already completed onboarding
        const userRes = await apiClient.get('/api/auth/me', token)
        if (userRes.success && userRes.data?.onboarding_completed) {
          console.log('[Auth Layout] User already completed onboarding, redirecting to dashboard...')
          router.push('/dashboard')
        }
      }
    }

    checkAuth()
  }, [router, pathname])

  return <>{children}</>
}
