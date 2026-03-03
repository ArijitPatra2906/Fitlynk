'use client'

import { usePathname } from 'next/navigation'
import { AppBar } from './app-bar'
import { BottomNav } from './bottom-nav'
import { GlobalQuickLogFab } from './global-quick-log-fab'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname()

  // Pages that should show the bottom navigation
  const pagesWithBottomNav = [
    '/dashboard',
    '/steps',
    '/water',
    '/exercise',
    '/nutrition',
    '/progress',
    '/profile',
    '/settings/goals',
  ]

  // Pages that should NOT show bottom nav (auth pages, workout session, etc.)
  const pagesWithoutBottomNav = [
    '/',
    '/login',
    '/register',
    '/onboarding',
    '/workout',
    '/food-search',
  ]

  const authPages = ['/', '/login', '/register', '/onboarding']

  // Pages that need the full layout wrapper (header + content + nav)
  const pagesWithLayout = [
    '/dashboard',
    '/steps',
    '/water',
    '/exercise',
    '/nutrition',
    '/progress',
    '/profile',
    '/workout',
    '/food-search',
    '/settings/goals',
    '/workouts',
    '/templates',
    '/exercises',
  ]

  // Check if current page should show bottom nav
  const shouldShowBottomNav = pagesWithBottomNav.includes(pathname)
  const shouldHideBottomNav = pagesWithoutBottomNav.includes(pathname)
  const showBottomNav = shouldShowBottomNav && !shouldHideBottomNav
  const showGlobalFab = !authPages.includes(pathname)

  // Check if page needs layout wrapper
  const needsLayout = pagesWithLayout.includes(pathname)

  // Pages without layout (auth pages, splash) - render children directly
  if (!needsLayout) {
    return <>{children}</>
  }

  return (
    <div className='flex flex-col h-screen bg-[#0B0D17] overflow-hidden'>
      <AppBar />
      <div className='flex-1 overflow-y-auto'>{children}</div>
      {showBottomNav && <BottomNav />}
      {showGlobalFab && <GlobalQuickLogFab />}
    </div>
  )
}
