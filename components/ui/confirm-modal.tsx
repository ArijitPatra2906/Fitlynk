'use client'

import { Icon } from './icon'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
}: ConfirmModalProps) {
  if (!isOpen) return null

  const variantStyles = {
    danger: {
      iconBg: 'bg-red-500/10 border-red-500/30',
      iconColor: '#EF4444',
      confirmBtn: 'bg-gradient-to-br from-red-600 to-red-700 shadow-red-500/25 hover:shadow-red-500/40',
    },
    warning: {
      iconBg: 'bg-amber-500/10 border-amber-500/30',
      iconColor: '#F59E0B',
      confirmBtn: 'bg-gradient-to-br from-amber-600 to-amber-700 shadow-amber-500/25 hover:shadow-amber-500/40',
    },
    info: {
      iconBg: 'bg-blue-500/10 border-blue-500/30',
      iconColor: '#60A5FA',
      confirmBtn: 'bg-gradient-to-br from-blue-600 to-blue-700 shadow-blue-500/25 hover:shadow-blue-500/40',
    },
  }

  const styles = variantStyles[variant]

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center px-4'>
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-black/60 backdrop-blur-sm'
        onClick={onClose}
      />

      {/* Modal */}
      <div className='relative w-full max-w-sm bg-[#131520] rounded-2xl border border-white/10 shadow-2xl animate-scale-up'>
        {/* Icon */}
        <div className='flex justify-center pt-6 pb-4'>
          <div className={`w-14 h-14 rounded-full ${styles.iconBg} border flex items-center justify-center`}>
            <Icon name='alertTriangle' size={26} color={styles.iconColor} />
          </div>
        </div>

        {/* Content */}
        <div className='px-6 pb-6 text-center'>
          <h3 className='text-[18px] font-bold text-white mb-2'>
            {title}
          </h3>
          <p className='text-[14px] text-gray-400 leading-relaxed'>
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className='flex gap-3 px-6 pb-6'>
          <button
            onClick={onClose}
            className='flex-1 bg-white/5 border border-white/10 rounded-xl py-3 text-[14px] font-semibold text-gray-300 hover:bg-white/10 transition-colors'
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className={`flex-1 ${styles.confirmBtn} rounded-xl py-3 text-[14px] font-semibold text-white shadow-lg transition-all`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
