interface LoadingScreenProps {
  message?: string
  fullScreen?: boolean
}

export function LoadingScreen({
  message = 'Loading...',
  fullScreen = true,
}: LoadingScreenProps) {
  const containerClass = fullScreen
    ? 'fixed inset-0 z-50 flex items-center justify-center bg-[#0B0D17]'
    : 'flex items-center justify-center min-h-screen bg-[#0B0D17]'

  return (
    <div className={containerClass}>
      <div className='flex flex-col items-center gap-8'>
        {/* Modern Spinner */}
        <div className='relative w-20 h-20'>
          {/* Outer Ring */}
          <div className='absolute inset-0 rounded-full border-[3px] border-gray-800/50'></div>

          {/* Animated Gradient Arc */}
          <svg className='absolute inset-0 w-full h-full -rotate-90'>
            <circle
              cx='40'
              cy='40'
              r='36'
              fill='none'
              stroke='url(#gradient)'
              strokeWidth='3'
              strokeLinecap='round'
              strokeDasharray='226'
              strokeDashoffset='56'
              className='animate-spin origin-center'
              style={{ transformOrigin: '50% 50%' }}
            />
            <defs>
              <linearGradient id='gradient' x1='0%' y1='0%' x2='100%' y2='100%'>
                <stop offset='0%' stopColor='#3B82F6' />
                <stop offset='100%' stopColor='#10B981' />
              </linearGradient>
            </defs>
          </svg>

          {/* Inner Ring - Counter Rotate */}
          <div className='absolute inset-3 rounded-full border-2 border-transparent border-t-blue-500/40 animate-spin-reverse'></div>

          {/* Center Glow */}
          <div className='absolute inset-0 flex items-center justify-center'>
            <div className='w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-green-500 animate-pulse-slow shadow-[0_0_24px_rgba(59,130,246,0.9)]'></div>
          </div>
        </div>

        {/* Loading Text */}
        <div className='flex flex-col items-center gap-3'>
          <p className='text-white text-base font-semibold tracking-tight'>
            {message}
          </p>

          {/* Animated Progress Dots */}
          <div className='flex items-center gap-2'>
            <div
              className='w-2 h-2 rounded-full bg-blue-500 animate-bounce-dot shadow-[0_0_8px_rgba(59,130,246,0.8)]'
              style={{ animationDelay: '0ms' }}
            ></div>
            <div
              className='w-2 h-2 rounded-full bg-blue-500 animate-bounce-dot shadow-[0_0_8px_rgba(59,130,246,0.8)]'
              style={{ animationDelay: '150ms' }}
            ></div>
            <div
              className='w-2 h-2 rounded-full bg-blue-500 animate-bounce-dot shadow-[0_0_8px_rgba(59,130,246,0.8)]'
              style={{ animationDelay: '300ms' }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  )
}
