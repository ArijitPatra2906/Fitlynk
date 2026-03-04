'use client'

import { useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/icon'

interface PageHeaderProps {
  title: string
  subtitle?: string
  onBack?: () => void
  action?: {
    icon: string
    onClick: () => void
    label?: string
  }
}

export function PageHeader({ title, subtitle, onBack, action }: PageHeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.back()
    }
  }

  return (
    <div className='flex-shrink-0 px-6 pt-5 pb-4 app-shell-bg border-b border-[color:var(--app-border)]'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <button
            onClick={handleBack}
            className='w-10 h-10 rounded-xl app-surface border border-[color:var(--app-border)] flex items-center justify-center'
            aria-label='Go back'
          >
            <Icon name='arrowLeft' size={20} color='#64748B' />
          </button>

          <div>
            <div className='text-[18px] font-extrabold text-[color:var(--app-text)]'>
              {title}
            </div>
            {subtitle && (
              <div className='text-[12px] text-[color:var(--app-text-muted)]'>
                {subtitle}
              </div>
            )}
          </div>
        </div>

        {action && (
          <button
            onClick={action.onClick}
            className='w-10 h-10 rounded-xl app-surface border border-[color:var(--app-border)] flex items-center justify-center'
            aria-label={action.label || 'Action'}
          >
            <Icon name={action.icon} size={18} color='#64748B' />
          </button>
        )}
      </div>
    </div>
  )
}
