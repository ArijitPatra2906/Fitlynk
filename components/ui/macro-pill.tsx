interface MacroPillProps {
  label: string
  current: number
  target: number
  color: string
}

export function MacroPill({ label, current, target, color }: MacroPillProps) {
  const percent = target > 0 ? Math.min(100, (current / target) * 100) : 0

  const isLight =
    typeof document !== 'undefined' &&
    document.documentElement.dataset.theme === 'light'

  const trackColor = isLight ? '#E5E7EB' : '#1E293B'

  return (
    <div className='flex-1'>
      {/* Label */}
      <div className='text-[10px] text-[color:var(--app-text-muted)] mb-1 uppercase tracking-wider font-medium'>
        {label}
      </div>

      {/* Value */}
      <div className='text-[14px] font-semibold text-[color:var(--app-text)] mb-2'>
        {current}
        <span className='text-[11px] text-[color:var(--app-text-muted)] font-normal ml-1'>
          /{target}g
        </span>
      </div>

      {/* Progress Track */}
      <div
        className='h-[4px] rounded-full transition-colors duration-300'
        style={{ backgroundColor: trackColor }}
      >
        <div
          className='h-full rounded-full transition-all duration-500'
          style={{
            backgroundColor: color,
            width: `${percent}%`,
          }}
        />
      </div>
    </div>
  )
}
