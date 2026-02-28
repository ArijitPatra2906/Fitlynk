'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/icon'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/login')
    }, 2500) // Auto-navigate after 2.5 seconds

    return () => clearTimeout(timer)
  }, [router])

  return (
    <main className='flex min-h-screen flex-col items-center justify-center p-10 bg-gradient-to-br from-[#0B0D17] via-[#0d1b3e] to-[#0B0D17]'>
      <div className='flex flex-col items-center gap-0'>
        {/* Logo */}
        <div className='mb-6 relative'>
          <div className='w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center shadow-[0_0_60px_rgba(59,130,246,0.5)]'>
            <Icon name='zap' size={36} color='white' strokeWidth={2.5} />
          </div>
          <div className='absolute inset-[-8px] rounded-[32px] border border-blue-500/20 animate-pulse' />
        </div>

        {/* Brand */}
        <h1 className='text-5xl font-extrabold text-white tracking-tight mb-2'>
          Fitlynk
        </h1>
        <p className='text-gray-400 text-sm tracking-[0.1em] uppercase'>
          Your fitness, unified.
        </p>
      </div>
    </main>
  )
}
