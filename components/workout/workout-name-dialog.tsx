'use client'

import { useState } from 'react'
import { Icon } from '@/components/ui/icon'

interface WorkoutNameDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (name: string) => void
  title: string
  placeholder?: string
  defaultValue?: string
  submitButtonText?: string
}

export function WorkoutNameDialog({
  isOpen,
  onClose,
  onSubmit,
  title,
  placeholder = 'Enter workout name',
  defaultValue = '',
  submitButtonText = 'Start',
}: WorkoutNameDialogProps) {
  const [name, setName] = useState(defaultValue)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim() && !isSubmitting) {
      setIsSubmitting(true)
      onSubmit(name.trim())
      setName('')
      // Reset after a short delay
      setTimeout(() => setIsSubmitting(false), 500)
    }
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6'>
      <div className='bg-[#131520] border border-white/10 rounded-3xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200'>
        {/* Header */}
        <div className='flex items-center justify-between mb-5'>
          <h2 className='text-[20px] font-bold text-white'>{title}</h2>
          <button
            onClick={onClose}
            className='w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors'
          >
            <Icon name='x' size={18} color='#9CA3AF' />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <input
            type='text'
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={placeholder}
            autoFocus
            className='w-full px-4 py-3.5 bg-[#0B0D17] border border-white/10 rounded-2xl text-white text-[15px] placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors mb-4'
          />

          {/* Actions */}
          <div className='flex gap-3'>
            <button
              type='button'
              onClick={onClose}
              className='flex-1 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-300 font-semibold text-[15px] transition-colors'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={!name.trim() || isSubmitting}
              className='flex-1 py-3 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white font-bold text-[15px] shadow-[0_8px_24px_rgba(59,130,246,0.35)] disabled:opacity-50 disabled:cursor-not-allowed transition-opacity'
            >
              {isSubmitting ? 'Starting...' : submitButtonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
