'use client'

import { useState, useEffect } from 'react'
import { Icon } from '@/components/ui/icon'
import { getAuthToken } from '@/lib/auth/auth-token'
import { apiClient } from '@/lib/api/client'
import { toast } from 'sonner'
import { Exercise } from '@/types'
import { ExerciseDetailDialog } from '@/components/exercise/exercise-detail-dialog'

interface ExerciseModalProps {
  isOpen: boolean
  isOpenCreate?: boolean
  onClose: () => void
  onSelectExercise: (exercise: Exercise) => void
  disabledExerciseIds?: string[] // List of exercise IDs already in the workout
}

export function ExerciseModal({
  isOpen,
  isOpenCreate = false,
  onClose,
  onSelectExercise,
  disabledExerciseIds = [],
}: ExerciseModalProps) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | 'strength' | 'cardio' | 'mobility' | 'plyometric'
  >('all')
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('all')
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(isOpenCreate || false)
  const [creating, setCreating] = useState(false)
  const [detailExercise, setDetailExercise] = useState<Exercise | null>(null)
  const [newExercise, setNewExercise] = useState({
    name: '',
    category: 'strength' as 'strength' | 'cardio' | 'mobility' | 'plyometric',
    muscle_groups: [] as string[],
    primary_muscle: '',
    equipment: '',
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    exercise_type: 'compound' as 'compound' | 'isolation',
    calories_per_minute: '',
  })

  // Fetch exercises when filters change
  useEffect(() => {
    if (isOpen) {
      fetchExercises()
    }
  }, [isOpen, selectedCategory, selectedMuscleGroup, searchQuery])

  const fetchExercises = async () => {
    try {
      setLoading(true)
      const token = await getAuthToken()
      if (!token) return

      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (selectedCategory !== 'all')
        params.append('category', selectedCategory)
      if (selectedMuscleGroup !== 'all')
        params.append('muscle_group', selectedMuscleGroup)
      params.append('limit', '50')

      const res = await apiClient.get(
        `/api/exercises?${params.toString()}`,
        token,
      )
      if (res.success) {
        setExercises(res.data.exercises || res.data)
      }
    } catch (err) {
      console.error('Error fetching exercises:', err)
    } finally {
      setLoading(false)
    }
  }

  const isExerciseDisabled = (exerciseId: string) => {
    return disabledExerciseIds.includes(exerciseId)
  }

  const handleSelectExercise = (exercise: Exercise) => {
    onSelectExercise(exercise)
    onClose()
    setSearchQuery('')
    setSelectedCategory('all')
    setSelectedMuscleGroup('all')
  }

  const handleCreateExercise = async () => {
    if (!newExercise.name || newExercise.muscle_groups.length === 0) {
      toast.error('Please enter exercise name and at least one muscle group')
      return
    }

    try {
      setCreating(true)
      const token = await getAuthToken()
      if (!token) return

      const res = await apiClient.post('/api/exercises', newExercise, token)
      if (res.success) {
        // Add to list and select it
        setExercises([...exercises, res.data])
        onSelectExercise(res.data)
        onClose()
        setShowCreateForm(false)
        setNewExercise({
          name: '',
          category: 'strength',
          muscle_groups: [],
          primary_muscle: '',
          equipment: '',
          difficulty: 'beginner',
          exercise_type: 'compound',
          calories_per_minute: '',
        })
        toast.success('Exercise created successfully!')
      }
    } catch (err) {
      console.error('Error creating exercise:', err)
      toast.error('Failed to create exercise')
    } finally {
      setCreating(false)
    }
  }

  const toggleMuscleGroup = (muscle: string) => {
    setNewExercise((prev) => ({
      ...prev,
      muscle_groups: prev.muscle_groups.includes(muscle)
        ? prev.muscle_groups.filter((m) => m !== muscle)
        : [...prev.muscle_groups, muscle],
    }))
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 z-50 flex items-end sm:items-center justify-center'>
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-black/60 backdrop-blur-sm'
        onClick={onClose}
      />

      {/* Modal */}
      <div className='relative w-full max-w-lg bg-[#0B0D17] border border-white/10 rounded-t-[28px] sm:rounded-[28px] max-h-[85vh] flex flex-col'>
        {/* Header */}
        <div className='flex-shrink-0 px-6 pt-5 pb-4 border-b border-white/5'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-lg font-bold text-white'>
              {showCreateForm ? 'Create Exercise' : 'Select Exercise'}
            </h2>
            <button
              onClick={onClose}
              className='w-8 h-8 rounded-full bg-white/5 flex items-center justify-center'
            >
              <Icon name='x' size={18} color='#94A3B8' />
            </button>
          </div>

          {!showCreateForm && (
            <>
              {/* Search */}
              <div className='relative mb-3'>
                <input
                  type='text'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder='Search exercises...'
                  className='w-full px-4 py-2.5 bg-[#131520] border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500/50'
                />
                <Icon
                  name='search'
                  size={16}
                  color='#64748B'
                  className='absolute right-3 top-1/2 -translate-y-1/2'
                />
              </div>

              {/* Filters Row */}
              <div className='space-y-2'>
                {/* Category Filter */}
                <div>
                  <label className='text-[10px] font-semibold text-gray-500 mb-1 block uppercase tracking-wide'>
                    Category
                  </label>
                  <div className='flex gap-1.5 flex-wrap'>
                    {[
                      { label: 'All', value: 'all' },
                      { label: 'Strength', value: 'strength' },
                      { label: 'Cardio', value: 'cardio' },
                      { label: 'Mobility', value: 'mobility' },
                      { label: 'Plyometric', value: 'plyometric' },
                    ].map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => setSelectedCategory(cat.value as any)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                          selectedCategory === cat.value
                            ? 'bg-indigo-500 text-white'
                            : 'bg-[#131520] text-gray-400 border border-white/10'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Muscle Group Filter */}
                <div>
                  <label className='text-[10px] font-semibold text-gray-500 mb-1 block uppercase tracking-wide'>
                    Muscle Group
                  </label>
                  <div className='flex gap-1.5 flex-wrap'>
                    {[
                      { label: 'All', value: 'all' },
                      { label: 'Chest', value: 'chest' },
                      { label: 'Back', value: 'back' },
                      { label: 'Shoulders', value: 'shoulders' },
                      { label: 'Biceps', value: 'biceps' },
                      { label: 'Triceps', value: 'triceps' },
                      { label: 'Legs', value: 'legs' },
                      { label: 'Core', value: 'core' },
                    ].map((muscle) => (
                      <button
                        key={muscle.value}
                        onClick={() => setSelectedMuscleGroup(muscle.value)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                          selectedMuscleGroup === muscle.value
                            ? 'bg-blue-500 text-white'
                            : 'bg-[#131520] text-gray-400 border border-white/10'
                        }`}
                      >
                        {muscle.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Exercise List or Create Form */}
        <div className='flex-1 overflow-y-auto px-6 py-4'>
          {showCreateForm ? (
            <div className='space-y-4'>
              <div>
                <label className='text-xs font-semibold text-gray-400 mb-2 block'>
                  Exercise Name
                </label>
                <input
                  type='text'
                  value={newExercise.name}
                  onChange={(e) =>
                    setNewExercise({ ...newExercise, name: e.target.value })
                  }
                  placeholder='e.g., Bench Press'
                  className='w-full px-4 py-2.5 bg-[#131520] border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500/50'
                />
              </div>

              <div>
                <label className='text-xs font-semibold text-gray-400 mb-2 block'>
                  Category
                </label>
                <div className='flex gap-2 flex-wrap'>
                  {['strength', 'cardio', 'mobility', 'plyometric'].map(
                    (cat) => (
                      <button
                        key={cat}
                        onClick={() =>
                          setNewExercise({
                            ...newExercise,
                            category: cat as any,
                          })
                        }
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                          newExercise.category === cat
                            ? 'bg-indigo-500 text-white'
                            : 'bg-[#131520] text-gray-400 border border-white/10'
                        }`}
                      >
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div>
                <label className='text-xs font-semibold text-gray-400 mb-2 block'>
                  Primary Muscle
                </label>
                <input
                  type='text'
                  value={newExercise.primary_muscle}
                  onChange={(e) =>
                    setNewExercise({
                      ...newExercise,
                      primary_muscle: e.target.value,
                    })
                  }
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
                      onClick={() =>
                        setNewExercise({
                          ...newExercise,
                          difficulty: diff as any,
                        })
                      }
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        newExercise.difficulty === diff
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
                      onClick={() =>
                        setNewExercise({
                          ...newExercise,
                          exercise_type: type as any,
                        })
                      }
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        newExercise.exercise_type === type
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
                  value={newExercise.calories_per_minute}
                  onChange={(e) =>
                    setNewExercise({
                      ...newExercise,
                      calories_per_minute: e.target.value,
                    })
                  }
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
                        newExercise.muscle_groups.includes(muscle)
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
                  value={newExercise.equipment}
                  onChange={(e) =>
                    setNewExercise({
                      ...newExercise,
                      equipment: e.target.value,
                    })
                  }
                  placeholder='e.g., Barbell, Dumbbell'
                  className='w-full px-4 py-2.5 bg-[#131520] border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500/50'
                />
              </div>

              <div className='flex gap-2 pt-2'>
                <button
                  onClick={() => {
                    onClose?.()
                    if (!onClose) {
                      setShowCreateForm(false)
                      setNewExercise({
                        name: '',
                        category: 'strength',
                        muscle_groups: [],
                        primary_muscle: '',
                        equipment: '',
                        difficulty: 'beginner',
                        exercise_type: 'compound',
                        calories_per_minute: '',
                      })
                    }
                  }}
                  className='flex-1 py-2.5 rounded-xl bg-[#131520] border border-white/10 text-gray-400 text-sm font-semibold'
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateExercise}
                  disabled={
                    creating ||
                    !newExercise.name ||
                    newExercise.muscle_groups.length === 0
                  }
                  className='flex-1 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold disabled:opacity-50'
                >
                  {creating ? 'Creating...' : 'Create Exercise'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {loading ? (
                <div className='text-center py-8 text-gray-400'>
                  Loading exercises...
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className='w-full mb-3 py-3 rounded-xl bg-blue-500/10 border border-dashed border-blue-500/30 text-blue-500 text-sm font-semibold hover:bg-blue-500/20 transition-colors'
                  >
                    + Create New Exercise
                  </button>

                  {exercises.length === 0 ? (
                    <div className='text-center py-8'>
                      <div className='text-gray-400 text-sm mb-2'>
                        No exercises found
                      </div>
                      <div className='text-gray-600 text-xs mb-4'>
                        Create your first exercise to get started
                      </div>
                    </div>
                  ) : (
                    <div className='space-y-2'>
                      {exercises.map((exercise: Exercise) => {
                        const isDisabled = isExerciseDisabled(exercise._id)
                        return (
                          <div key={exercise._id} className='relative'>
                            <button
                              onClick={() =>
                                !isDisabled && handleSelectExercise(exercise)
                              }
                              disabled={isDisabled}
                              className={`w-full flex items-center gap-3 p-3 bg-[#131520] border border-white/5 rounded-xl transition-colors ${
                                isDisabled
                                  ? 'opacity-40 cursor-not-allowed'
                                  : 'hover:border-indigo-500/30'
                              }`}
                            >
                              <div className='w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0'>
                                <Icon
                                  name={
                                    exercise.category === 'cardio'
                                      ? 'activity'
                                      : 'dumbbell'
                                  }
                                  size={18}
                                  color='#818CF8'
                                />
                              </div>
                              <div className='flex-1 text-left'>
                                <div className='text-sm font-semibold text-white mb-0.5'>
                                  {exercise.name}
                                </div>
                                <div className='text-xs text-gray-400'>
                                  {exercise.primary_muscle ||
                                    exercise.muscle_groups.join(', ')}
                                  {exercise.difficulty &&
                                    ` • ${exercise.difficulty}`}
                                  {exercise.exercise_type &&
                                    ` • ${exercise.exercise_type}`}
                                </div>
                              </div>
                              {exercise.is_custom && (
                                <div className='px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 rounded text-[10px] text-blue-400 font-semibold'>
                                  Custom
                                </div>
                              )}
                              {isDisabled && (
                                <div className='px-2 py-0.5 bg-red-500/10 border border-red-500/30 rounded text-[10px] text-red-400 font-semibold'>
                                  Added
                                </div>
                              )}
                              {/* Info Button - opens detail dialog */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setDetailExercise(exercise)
                                }}
                                className='p-1 text-gray-400 hover:text-white transition-colors'
                              >
                                <Icon name='info' size={14} />
                              </button>
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
      <ExerciseDetailDialog
        isOpen={!!detailExercise}
        onClose={() => setDetailExercise(null)}
        exercise={detailExercise}
      />
    </div>
  )
}
