'use client'

import { Icon } from '@/components/ui/icon'
import { Exercise } from '@/types'

interface ExerciseDetailDialogProps {
  exercise: Exercise | null
  isOpen: boolean
  onClose: () => void
}

// Category icons and colors
const categoryInfo: Record<
  string,
  { icon: string; color: string; bg: string }
> = {
  strength: {
    icon: 'dumbbell',
    color: '#818CF8',
    bg: 'rgba(129, 140, 248, 0.1)',
  },
  cardio: { icon: 'activity', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
  mobility: {
    icon: 'stretch-horizontal',
    color: '#8B5CF6',
    bg: 'rgba(139, 92, 246, 0.1)',
  },
  plyometric: { icon: 'zap', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
}

// Difficulty colors
const difficultyColors: Record<string, string> = {
  beginner: '#10B981',
  intermediate: '#F59E0B',
  advanced: '#EF4444',
}

export function ExerciseDetailDialog({
  exercise,
  isOpen,
  onClose,
}: ExerciseDetailDialogProps) {
  if (!isOpen || !exercise) return null

  const catInfo = categoryInfo[exercise.category] || categoryInfo.strength

  return (
    <div className='fixed inset-0 z-50 flex items-end sm:items-center justify-center'>
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-black/60 backdrop-blur-sm'
        onClick={onClose}
      />

      {/* Dialog */}
      <div className='relative w-full max-w-lg bg-[#0B0D17] border border-white/10 rounded-t-[28px] sm:rounded-[28px] max-h-[85vh] flex flex-col'>
        {/* Header */}
        <div className='flex-shrink-0 px-6 pt-5 pb-4 border-b border-white/5'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div
                className='w-12 h-12 rounded-xl flex items-center justify-center'
                style={{ backgroundColor: catInfo.bg }}
              >
                <Icon name={catInfo.icon} size={24} color={catInfo.color} />
              </div>
              <div>
                <h2 className='text-lg font-bold text-white'>
                  {exercise.name}
                </h2>
                <div className='flex items-center gap-2 mt-0.5'>
                  <span
                    className='px-2 py-0.5 rounded text-[10px] font-semibold'
                    style={{
                      backgroundColor: catInfo.bg,
                      color: catInfo.color,
                    }}
                  >
                    {exercise.category.charAt(0).toUpperCase() +
                      exercise.category.slice(1)}
                  </span>
                  {exercise.difficulty && (
                    <span
                      className='px-2 py-0.5 rounded text-[10px] font-semibold'
                      style={{
                        backgroundColor: `${difficultyColors[exercise.difficulty]}20`,
                        color: difficultyColors[exercise.difficulty],
                      }}
                    >
                      {exercise.difficulty.charAt(0).toUpperCase() +
                        exercise.difficulty.slice(1)}
                    </span>
                  )}
                  {exercise.exercise_type && (
                    <span className='px-2 py-0.5 rounded text-[10px] font-semibold bg-white/5 text-gray-400'>
                      {exercise.exercise_type.charAt(0).toUpperCase() +
                        exercise.exercise_type.slice(1)}
                    </span>
                  )}
                  {exercise.is_custom && (
                    <span className='px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400'>
                      Custom
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className='w-8 h-8 rounded-full bg-white/5 flex items-center justify-center'
            >
              <Icon name='x' size={18} color='#94A3B8' />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className='flex-1 overflow-y-auto px-6 py-4 space-y-4'>
          {/* Primary Muscle */}
          {exercise.primary_muscle && (
            <div>
              <label className='text-xs font-semibold text-gray-400 mb-2 block'>
                Primary Muscle
              </label>
              <div className='flex items-center gap-2'>
                <span className='px-3 py-1.5 bg-white/5 rounded-lg text-sm text-white capitalize'>
                  {exercise.primary_muscle}
                </span>
              </div>
            </div>
          )}

          {/* Muscle Groups */}
          {exercise.muscle_groups && exercise.muscle_groups.length > 0 && (
            <div>
              <label className='text-xs font-semibold text-gray-400 mb-2 block'>
                Muscle Groups
              </label>
              <div className='flex flex-wrap gap-2'>
                {exercise.muscle_groups.map((muscle, idx) => (
                  <span
                    key={idx}
                    className='px-3 py-1.5 bg-white/5 rounded-lg text-sm text-gray-300 capitalize'
                  >
                    {muscle}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Secondary Muscles */}
          {exercise.secondary_muscles &&
            exercise.secondary_muscles.length > 0 && (
              <div>
                <label className='text-xs font-semibold text-gray-400 mb-2 block'>
                  Secondary Muscles
                </label>
                <div className='flex flex-wrap gap-2'>
                  {exercise.secondary_muscles.map((muscle, idx) => (
                    <span
                      key={idx}
                      className='px-3 py-1.5 bg-white/5 rounded-lg text-sm text-gray-400 capitalize'
                    >
                      {muscle}
                    </span>
                  ))}
                </div>
              </div>
            )}

          {/* Equipment */}
          {exercise.equipment && (
            <div>
              <label className='text-xs font-semibold text-gray-400 mb-2 block'>
                Equipment
              </label>
              <div className='flex items-center gap-2'>
                <Icon name='package' size={16} color='#64748B' />
                <span className='text-sm text-gray-300 capitalize'>
                  {exercise.equipment}
                </span>
              </div>
            </div>
          )}

          {/* Calories per Minute */}
          {exercise.calories_per_minute && (
            <div>
              <label className='text-xs font-semibold text-gray-400 mb-2 block'>
                Calories Burned
              </label>
              <div className='flex items-center gap-2'>
                <Icon name='flame' size={16} color='#F59E0B' />
                <span className='text-sm text-gray-300'>
                  {exercise.calories_per_minute} cal/min
                </span>
              </div>
            </div>
          )}

          {/* Instructions */}
          {exercise.instructions && exercise.instructions.length > 0 && (
            <div>
              <label className='text-xs font-semibold text-gray-400 mb-2 block'>
                Instructions
              </label>
              <div className='space-y-2'>
                {exercise.instructions.map((instruction, idx) => (
                  <div
                    key={idx}
                    className='flex items-start gap-3 p-3 bg-[#131520] rounded-xl'
                  >
                    <div className='w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0'>
                      <span className='text-[10px] font-bold text-blue-400'>
                        {idx + 1}
                      </span>
                    </div>
                    <span className='text-sm text-gray-300'>{instruction}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='flex-shrink-0 px-6 py-4 border-t border-white/5'>
          <button
            onClick={onClose}
            className='w-full py-2.5 rounded-xl bg-[#131520] border border-white/10 text-gray-400 text-sm font-semibold'
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
