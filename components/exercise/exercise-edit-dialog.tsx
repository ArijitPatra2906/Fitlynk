'use client'

import { useState, useEffect } from 'react'
import { Icon } from '@/components/ui/icon'
import { Exercise } from '@/types'
import { getAuthToken } from '@/lib/auth/auth-token'
import { apiClient } from '@/lib/api/client'
import { toast } from 'sonner'

interface ExerciseEditDialogProps {
  isOpen: boolean
  onClose: () => void
  exercise: Exercise | null
  onUpdate: (exercise: Exercise) => void
}

export function ExerciseEditDialog({
  isOpen,
  onClose,
  exercise,
  onUpdate,
}: ExerciseEditDialogProps) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<
    'strength' | 'cardio' | 'mobility' | 'plyometric'
  >('strength')
  const [muscleGroups, setMuscleGroups] = useState<string[]>([])
  const [primaryMuscle, setPrimaryMuscle] = useState('')
  const [equipment, setEquipment] = useState('')
  const [difficulty, setDifficulty] = useState<
    'beginner' | 'intermediate' | 'advanced'
  >('beginner')
  const [exerciseType, setExerciseType] = useState<'compound' | 'isolation'>(
    'compound',
  )
  const [caloriesPerMinute, setCaloriesPerMinute] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (exercise) {
      setName(exercise.name)
      setCategory(exercise.category)
      setMuscleGroups(exercise.muscle_groups)
      setPrimaryMuscle(exercise.primary_muscle || '')
      setEquipment(exercise.equipment || '')
      setDifficulty(exercise.difficulty || 'beginner')
      setExerciseType(exercise.exercise_type || 'compound')
      setCaloriesPerMinute(exercise.calories_per_minute?.toString() || '')
    }
  }, [exercise])

  if (!isOpen || !exercise) return null

  const toggleMuscleGroup = (muscle: string) => {
    setMuscleGroups((prev) =>
      prev.includes(muscle)
        ? prev.filter((m) => m !== muscle)
        : [...prev, muscle],
    )
  }

  const handleSave = async () => {
    if (!name || muscleGroups.length === 0) {
      toast.error('Please enter exercise name and at least one muscle group')
      return
    }

    try {
      setSaving(true)
      const token = await getAuthToken()
      if (!token) return

      const updatedExercise = {
        name,
        category,
        muscle_groups: muscleGroups,
        primary_muscle: primaryMuscle || undefined,
        equipment: equipment || undefined,
        difficulty,
        exercise_type: exerciseType,
        calories_per_minute: caloriesPerMinute
          ? parseFloat(caloriesPerMinute)
          : undefined,
      }

      const res = await apiClient.put(
        `/api/exercises/${exercise._id}`,
        updatedExercise,
        token,
      )

      if (res.success) {
        onUpdate(res.data)
        toast.success('Exercise updated successfully')
        onClose()
      } else {
        toast.error('Failed to update exercise')
      }
    } catch (err) {
      console.error('Error updating exercise:', err)
      toast.error('Failed to update exercise')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className='fixed inset-0 z-50 flex items-end sm:items-center justify-center'>
      <div
        className='absolute inset-0 bg-black/60 backdrop-blur-sm'
        onClick={onClose}
      />

      <div className='relative w-full max-w-lg bg-[#0B0D17] border border-white/10 rounded-t-[28px] sm:rounded-[28px] max-h-[85vh] flex flex-col'>
        <div className='flex-shrink-0 px-6 pt-5 pb-4 border-b border-white/5'>
          <div className='flex items-center justify-between'>
            <h2 className='text-lg font-bold text-white'>Edit Exercise</h2>
            <button
              onClick={onClose}
              className='w-8 h-8 rounded-full bg-white/5 flex items-center justify-center'
            >
              <Icon name='x' size={18} color='#94A3B8' />
            </button>
          </div>
        </div>

        <div className='flex-1 overflow-y-auto px-6 py-4'>
          <div className='space-y-4'>
            <div>
              <label className='text-xs font-semibold text-gray-400 mb-2 block'>
                Exercise Name
              </label>
              <input
                type='text'
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='e.g., Bench Press'
                className='w-full px-4 py-2.5 bg-[#131520] border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500/50'
              />
            </div>

            <div>
              <label className='text-xs font-semibold text-gray-400 mb-2 block'>
                Category
              </label>
              <div className='flex gap-2 flex-wrap'>
                {['strength', 'cardio', 'mobility', 'plyometric'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat as any)}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      category === cat
                        ? 'bg-indigo-500 text-white'
                        : 'bg-[#131520] text-gray-400 border border-white/10'
                    }`}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className='text-xs font-semibold text-gray-400 mb-2 block'>
                Primary Muscle
              </label>
              <input
                type='text'
                value={primaryMuscle}
                onChange={(e) => setPrimaryMuscle(e.target.value)}
                placeholder='e.g., Chest'
                className='w-full px-4 py-2.5 bg-[#131520] border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500/50'
              />
            </div>

            <div>
              <label className='text-xs font-semibold text-gray-400 mb-2 block'>
                Difficulty
              </label>
              <div className='flex gap-2'>
                {['beginner', 'intermediate', 'advanced'].map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setDifficulty(diff as any)}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      difficulty === diff
                        ? diff === 'beginner'
                          ? 'bg-green-500 text-white'
                          : diff === 'intermediate'
                            ? 'bg-yellow-500 text-white'
                            : 'bg-red-500 text-white'
                        : 'bg-[#131520] text-gray-400 border border-white/10'
                    }`}
                  >
                    {diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className='text-xs font-semibold text-gray-400 mb-2 block'>
                Exercise Type
              </label>
              <div className='flex gap-2'>
                {['compound', 'isolation'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setExerciseType(type as any)}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      exerciseType === type
                        ? 'bg-indigo-500 text-white'
                        : 'bg-[#131520] text-gray-400 border border-white/10'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className='text-xs font-semibold text-gray-400 mb-2 block'>
                Calories per Minute (Optional)
              </label>
              <input
                type='number'
                value={caloriesPerMinute}
                onChange={(e) => setCaloriesPerMinute(e.target.value)}
                placeholder='e.g., 8.5'
                className='w-full px-4 py-2.5 bg-[#131520] border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500/50'
              />
            </div>

            <div>
              <label className='text-xs font-semibold text-gray-400 mb-2 block'>
                Muscle Groups
              </label>
              <div className='flex flex-wrap gap-2'>
                {[
                  'chest',
                  'back',
                  'shoulders',
                  'biceps',
                  'triceps',
                  'legs',
                  'core',
                  'cardio',
                ].map((muscle) => (
                  <button
                    key={muscle}
                    onClick={() => toggleMuscleGroup(muscle)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      muscleGroups.includes(muscle)
                        ? 'bg-blue-500 text-white'
                        : 'bg-[#131520] text-gray-400 border border-white/10'
                    }`}
                  >
                    {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className='text-xs font-semibold text-gray-400 mb-2 block'>
                Equipment (Optional)
              </label>
              <input
                type='text'
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                placeholder='e.g., Barbell, Dumbbell'
                className='w-full px-4 py-2.5 bg-[#131520] border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500/50'
              />
            </div>
          </div>
        </div>

        <div className='flex-shrink-0 px-6 py-4 border-t border-white/5 flex gap-3'>
          <button
            onClick={onClose}
            className='flex-1 py-2.5 rounded-xl bg-[#131520] border border-white/10 text-gray-400 text-sm font-semibold'
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name || muscleGroups.length === 0}
            className='flex-1 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold disabled:opacity-50'
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
