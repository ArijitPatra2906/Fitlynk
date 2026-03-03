interface ProgressRingProps {
  percent: number
  size?: number
  stroke?: number
  color?: string
  label?: string
  sublabel?: string
}

export function ProgressRing({
  percent,
  size = 80,
  stroke = 7,
  color = '#3B82F6',
  label,
  sublabel,
}: ProgressRingProps) {
  const radius = (size - stroke * 2) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = ((100 - percent) / 100) * circumference

  const isLight =
    typeof document !== 'undefined' &&
    document.documentElement.dataset.theme === 'light'

  // Softer background ring in light mode
  const trackColor = isLight ? '#E5E7EB' : '#1E293B'

  return (
    <div className='relative' style={{ width: size, height: size }}>
      <svg width={size} height={size} className='transform -rotate-90'>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill='none'
          stroke={trackColor}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill='none'
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap='round'
          className='transition-all duration-500 ease-out'
        />
      </svg>

      {label && (
        <div className='absolute inset-0 flex flex-col items-center justify-center'>
          {/* MAIN LABEL */}
          <div className='text-[color:var(--app-text)] font-bold text-lg leading-none'>
            {label}
          </div>

          {/* SUB LABEL */}
          {sublabel && (
            <div className='text-[color:var(--app-text-muted)] text-[10px] mt-0.5'>
              {sublabel}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
