'use client'

import { Icon } from '@/components/ui/icon'

interface WaterLog {
  _id: string
  date: string
  amount_ml: number
  created_at?: string
}

interface WaterDayDetailModalProps {
  isOpen: boolean
  onClose: () => void
  date: Date | null
  logs: WaterLog[]
  waterGoalMl: number
}

const formatTime = (iso?: string) => {
  if (!iso) return 'No time'
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function WaterDayDetailModal({
  isOpen,
  onClose,
  date,
  logs,
  waterGoalMl,
}: WaterDayDetailModalProps) {
  if (!isOpen || !date) return null

  const formatDate = (date: Date) => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
    }
  }

  const totalMl = logs.reduce((sum, log) => sum + log.amount_ml, 0)
  const hitGoal = totalMl >= waterGoalMl
  const progressPercent = Math.min(100, Math.round((totalMl / waterGoalMl) * 100))

  return (
    <div className='fixed inset-0 z-50 flex items-end justify-center'>
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-black/60 backdrop-blur-sm'
        onClick={onClose}
      />

      {/* Modal */}
      <div className='relative w-full max-w-lg bg-[#131520] rounded-t-3xl border-t border-x border-white/10 shadow-2xl animate-slide-up pb-safe max-h-[85vh] flex flex-col'>
        {/* Handle */}
        <div className='flex justify-center pt-3 pb-2'>
          <div className='w-10 h-1 bg-white/20 rounded-full' />
        </div>

        {/* Header */}
        <div className='px-6 pt-2 pb-4 border-b border-white/5'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-[20px] font-bold text-white flex items-center gap-2'>
                {formatDate(date)}
                {hitGoal && <Icon name='crown' size={18} color='#F59E0B' />}
              </h2>
              <p className='text-[13px] text-gray-400 mt-1'>
                {logs.length} {logs.length === 1 ? 'log' : 'logs'} • {(totalMl / 1000).toFixed(1)}L total
              </p>
            </div>
            <button
              onClick={onClose}
              className='w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors'
            >
              <Icon name='x' size={18} color='#64748B' />
            </button>
          </div>

          {/* Progress Bar */}
          <div className='mt-4'>
            <div className='flex items-center justify-between mb-2'>
              <span className='text-[12px] text-gray-400'>Progress</span>
              <span className='text-[12px] font-semibold text-white'>
                {progressPercent}%
              </span>
            </div>
            <div className='h-2 rounded-full bg-white/10 overflow-hidden'>
              <div
                className={`h-full rounded-full transition-all ${
                  hitGoal
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                    : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {hitGoal && (
              <div className='mt-2 text-[11px] text-amber-500 font-medium flex items-center gap-1'>
                <Icon name='checkCircle' size={12} color='#F59E0B' />
                Goal achieved
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className='flex-1 overflow-y-auto px-6 py-4'>
          {logs.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12'>
              <div className='w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4'>
                <Icon name='water' size={28} color='#60A5FA' />
              </div>
              <div className='text-[16px] font-bold text-white mb-2'>
                No water logs
              </div>
              <div className='text-[13px] text-gray-400'>
                No water logged for this day
              </div>
            </div>
          ) : (
            <div className='space-y-2'>
              {logs.map((log) => (
                <div
                  key={log._id}
                  className='flex items-center justify-between bg-[#1a1f35] border border-white/10 rounded-xl px-4 py-3'
                >
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center'>
                      <Icon name='water' size={18} color='#60A5FA' />
                    </div>
                    <div>
                      <div className='text-[14px] font-semibold text-white'>
                        {Math.round(log.amount_ml)} ml
                      </div>
                      <div className='text-[11px] text-gray-400'>
                        {formatTime(log.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className='text-[12px] font-medium text-blue-400'>
                    {(log.amount_ml / 1000).toFixed(2)}L
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
