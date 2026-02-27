'use client'

import { usePathname } from 'next/navigation'
import { AppBar } from './app-bar'
import { BottomNav } from './bottom-nav'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname()

  console.log('[AppLayout] Current pathname:', pathname)

  // Pages that should show the bottom navigation
  const pagesWithBottomNav = [
    '/dashboard',
    '/dashboard/',
    '/exercise',
    '/exercise/',
    '/nutrition',
    '/nutrition/',
    '/progress',
    '/progress/',
    '/profile',
    '/profile/',
    '/settings/goals',
    '/settings/goals/',
  ]

  // Pages that should NOT show bottom nav (auth pages, workout session, etc.)
  const pagesWithoutBottomNav = [
    '/',
    '/login',
    '/login/',
    '/register',
    '/register/',
    '/onboarding',
    '/onboarding/',
    '/workout',
    '/workout/',
    '/food-search',
    '/food-search/',
  ]

  // Pages that need the full layout wrapper (header + content + nav)
  const pagesWithLayout = [
    '/dashboard',
    '/dashboard/',
    '/exercise',
    '/exercise/',
    '/nutrition',
    '/nutrition/',
    '/progress',
    '/progress/',
    '/profile',
    '/profile/',
    '/workout',
    '/workout/',
    '/food-search',
    '/food-search/',
    '/settings/goals',
    '/settings/goals/',
  ]

  // Check if current page should show bottom nav
  const shouldShowBottomNav = pagesWithBottomNav.includes(pathname)
  const shouldHideBottomNav = pagesWithoutBottomNav.includes(pathname)
  const showBottomNav = shouldShowBottomNav && !shouldHideBottomNav

  // Check if page needs layout wrapper
  const needsLayout = pagesWithLayout.includes(pathname)

  console.log('[AppLayout] needsLayout:', needsLayout)
  console.log('[AppLayout] showBottomNav:', showBottomNav)

  // Pages without layout (auth pages, splash) - render children directly
  if (!needsLayout) {
    console.log('[AppLayout] Rendering without layout wrapper')
    return <>{children}</>
  }

  // Pages with layout - wrap in h-screen container with AppBar
  console.log('[AppLayout] Rendering with layout wrapper')
  return (
    <div className='flex flex-col h-screen bg-[#0B0D17] overflow-hidden'>
      <AppBar />
      <div className='flex-1 overflow-y-auto'>{children}</div>
      {showBottomNav && <BottomNav />}
    </div>
  )
}
