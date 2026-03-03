'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Icon } from '@/components/ui/icon'

const HIDDEN_PATHS = ['/', '/login', '/register', '/onboarding']
const WITH_BOTTOM_NAV = [
  '/dashboard',
  '/steps',
  '/water',
  '/exercise',
  '/nutrition',
  '/progress',
  '/profile',
  '/settings/goals',
]

const QUICK_ACTIONS = [
  { label: 'Log Meal', icon: 'utensils', color: '#F59E0B', href: '/nutrition' },
  {
    label: 'Log Workout',
    icon: 'dumbbell',
    color: '#818CF8',
    href: '/exercise',
  },
  { label: 'Log Steps', icon: 'activity', color: '#A855F7', href: '/steps' },
  { label: 'Log Water', icon: 'water', color: '#3B82F6', href: '/water' },
  {
    label: 'Log Weight',
    icon: 'trending',
    color: '#10B981',
    href: '/progress',
  },
]

export function GlobalQuickLogFab() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  if (HIDDEN_PATHS.includes(pathname)) return null

  const bottomOffset = WITH_BOTTOM_NAV.includes(pathname)
    ? 'bottom-28'
    : 'bottom-20'

  return (
    <>
      {open && (
        <div
          className={`fixed ${bottomOffset} right-6 flex flex-col gap-2.5 items-end z-40`}
        >
          {QUICK_ACTIONS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setOpen(false)}
              className='flex items-center gap-2.5 py-2.5 px-4 rounded-2xl bg-[#1a1f35] border shadow-[0_4px_24px_rgba(0,0,0,0.5)]'
              style={{ borderColor: `${item.color}33` }}
            >
              <span className='text-[13px] font-semibold text-white'>
                {item.label}
              </span>
              <div
                className='w-8 h-8 rounded-xl flex items-center justify-center'
                style={{ backgroundColor: `${item.color}22` }}
              >
                <Icon name={item.icon} size={16} color={item.color} />
              </div>
            </Link>
          ))}
        </div>
      )}

      <button
        type='button'
        onClick={() => setOpen((prev) => !prev)}
        className={`fixed ${WITH_BOTTOM_NAV.includes(pathname) ? 'bottom-16' : 'bottom-10'} right-6 w-[40px] h-[40px] rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-[0_8px_20px_rgba(59,130,246,0.45)] z-40 transition-transform`}
        style={{ transform: open ? 'rotate(45deg)' : 'rotate(0)' }}
        aria-label='Open quick log actions'
      >
        <Icon name='plus' size={20} color='white' strokeWidth={2.3} />
      </button>
    </>
  )
}
