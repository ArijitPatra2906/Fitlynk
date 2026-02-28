'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Icon } from '@/components/ui/icon'
import Link from 'next/link'
import { getAuthToken } from '@/lib/auth/auth-token'
import { apiClient } from '@/lib/api/client'
import { ExerciseModal } from '@/components/ui/exercise-modal'
import { toast } from 'sonner'
import { Exercise, Workout, ExerciseInWorkout } from '@/types'

type SetData = {
  set_number: number
  reps: number
  weight_kg: number
  is_warmup: boolean
  completed_at?: string
}

function WorkoutPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const templateId = searchParams.get('templateId')
  const isTemplateMode = searchParams.get('mode') === 'template'

  const [timer, setTimer] = useState(0)
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [exercises, setExercises] = useState<ExerciseInWorkout[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showExerciseModal, setShowExerciseModal] = useState(false)
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null)
  const [workoutName, setWorkoutName] = useState('')
  const initializedRef = useRef(false)

  useEffect(() => {
    // Only run timer if not in template mode
    if (isTemplateMode) return

    const interval = setInterval(() => setTimer((prev) => prev + 1), 1000)
    return () => {
      clearInterval(interval)
      // Clean up pending save timeout
      if (saveTimeout) {
        clearTimeout(saveTimeout)
      }
    }
  }, [saveTimeout, isTemplateMode])

  useEffect(() => {
    // Prevent duplicate initialization in React StrictMode
    if (initializedRef.current) return
    initializedRef.current = true

    const initWorkout = async () => {
      try {
        const token = await getAuthToken()
        if (!token) {
          setLoading(false)
          return
        }

        if (templateId) {
          // Load template and create a new workout based on it
          const templateRes = await apiClient.get(
            `/api/workouts/${templateId}`,
            token,
          )
          if (templateRes.success) {
            const template = templateRes.data

            // Create a new workout based on the template
            const newWorkout: Workout = {
              name: template.name || 'Workout',
              started_at: new Date().toISOString(),
              exercises: template.exercises || [],
              is_template: false,
              template_id: templateId,
            }

            const createRes = await apiClient.post(
              '/api/workouts',
              newWorkout,
              token,
            )
            if (createRes.success) {
              setWorkout(createRes.data)
              setExercises(createRes.data.exercises || [])
            }
          }
        } else {
          // Start fresh workout or template
          // Use temporary name for initial creation, user will change it
          const tempName = isTemplateMode
            ? 'Untitled Template'
            : 'Untitled Workout'
          const newWorkout: Workout = {
            name: tempName,
            started_at: new Date().toISOString(),
            exercises: [],
            is_template: isTemplateMode,
          }

          const res = await apiClient.post('/api/workouts', newWorkout, token)
          if (res.success) {
            setWorkout(res.data)
            setExercises(res.data.exercises || [])
            // Set empty string so user sees placeholder
            setWorkoutName('')
          }
        }
      } catch (err) {
        console.error('Error initializing workout:', err)
      } finally {
        setLoading(false)
      }
    }

    initWorkout()
  }, [templateId])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  // Debounced auto-save function
  const autoSaveWorkout = async (updatedExercises: ExerciseInWorkout[]) => {
    if (!workout?._id) return

    try {
      const token = await getAuthToken()
      if (!token) return

      // Convert exercise_id to string IDs for backend
      const exercisesForBackend = updatedExercises.map((ex) => ({
        ...ex,
        exercise_id:
          typeof ex.exercise_id === 'object'
            ? ex.exercise_id._id
            : ex.exercise_id,
      }))

      const res = await apiClient.put(
        `/api/workouts/${workout._id}`,
        { ...workout, exercises: exercisesForBackend },
        token,
      )

      // Sync with server response
      if (res.success && res.data) {
        setWorkout(res.data)
      }
    } catch (err) {
      console.error('Error auto-saving workout:', err)
    }
  }

  // Debounced save wrapper
  const debouncedSave = (updatedExercises: ExerciseInWorkout[]) => {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }

    const timeout = setTimeout(() => {
      autoSaveWorkout(updatedExercises)
    }, 1000) // Wait 1 second after last change

    setSaveTimeout(timeout)
  }

  const toggleSetCompletion = (exerciseIndex: number, setIndex: number) => {
    const updatedExercises = [...exercises]
    const set = updatedExercises[exerciseIndex].sets[setIndex]

    if (set.completed_at) {
      set.completed_at = undefined
    } else {
      set.completed_at = new Date().toISOString()
    }

    setExercises(updatedExercises)
    debouncedSave(updatedExercises)
  }

  const addSet = (exerciseIndex: number) => {
    const updatedExercises = [...exercises]
    const exercise = updatedExercises[exerciseIndex]
    const lastSet = exercise.sets[exercise.sets.length - 1]

    const newSet: SetData = {
      set_number: exercise.sets.length + 1,
      reps: lastSet?.reps || 10,
      weight_kg: lastSet?.weight_kg || 0,
      is_warmup: false,
    }

    exercise.sets.push(newSet)
    setExercises(updatedExercises)
    debouncedSave(updatedExercises)
  }

  const updateSet = (
    exerciseIndex: number,
    setIndex: number,
    field: 'reps' | 'weight_kg',
    value: number,
  ) => {
    const updatedExercises = [...exercises]
    updatedExercises[exerciseIndex].sets[setIndex][field] = value
    setExercises(updatedExercises)
    debouncedSave(updatedExercises)
  }

  // Auto-save workout name changes
  const handleNameChange = (newName: string) => {
    setWorkoutName(newName)

    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }

    const timeout = setTimeout(async () => {
      if (!workout?._id || !newName.trim()) return

      try {
        const token = await getAuthToken()
        if (!token) return

        const exercisesForBackend = exercises.map((ex) => ({
          ...ex,
          exercise_id:
            typeof ex.exercise_id === 'object'
              ? ex.exercise_id._id
              : ex.exercise_id,
        }))

        await apiClient.put(
          `/api/workouts/${workout._id}`,
          { ...workout, name: newName, exercises: exercisesForBackend },
          token,
        )
      } catch (err) {
        console.error('Error auto-saving workout name:', err)
      }
    }, 1000)

    setSaveTimeout(timeout)
  }

  const finishWorkout = async () => {
    // Use the workout name from state if entered, otherwise use the stored name
    const finalName = workoutName.trim() || workout?.name || 'Untitled Workout'

    try {
      setSaving(true)
      const token = await getAuthToken()
      if (!token || !workout?._id) return

      // Convert exercise_id to IDs for backend
      const exercisesForBackend = exercises.map((ex) => ({
        ...ex,
        exercise_id:
          typeof ex.exercise_id === 'object'
            ? ex.exercise_id._id
            : ex.exercise_id,
      }))

      const updatedWorkout = {
        ...workout,
        name: finalName,
        ended_at: new Date().toISOString(),
        exercises: exercisesForBackend,
      }

      const res = await apiClient.put(
        `/api/workouts/${workout._id}`,
        updatedWorkout,
        token,
      )
      if (res.success) {
        toast.success('Workout saved successfully!')
        router.push('/exercise')
      }
    } catch (err) {
      console.error('Error finishing workout:', err)
      toast.error('Failed to save workout')
    } finally {
      setSaving(false)
    }
  }

  const saveTemplateDirectly = async () => {
    if (!workout?._id) return

    // Use the workout name from state if entered, otherwise use the stored name
    const finalName = workoutName.trim() || workout?.name || 'Untitled Template'

    try {
      setSaving(true)
      const token = await getAuthToken()
      if (!token) return

      // Convert exercise_id to IDs for backend
      const exercisesForBackend = exercises.map((ex) => ({
        ...ex,
        exercise_id:
          typeof ex.exercise_id === 'object'
            ? ex.exercise_id._id
            : ex.exercise_id,
      }))

      // Update the existing template with the new name
      const res = await apiClient.put(
        `/api/workouts/${workout._id}`,
        { ...workout, name: finalName, exercises: exercisesForBackend },
        token,
      )

      if (res.success) {
        toast.success('Template saved successfully!')
        router.push('/exercise')
      }
    } catch (err) {
      console.error('Error saving template:', err)
      toast.error('Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  const calculateStats = () => {
    let totalSets = 0
    let totalVolume = 0

    exercises.forEach((ex) => {
      ex.sets.forEach((set) => {
        if (set.completed_at) {
          totalSets++
          totalVolume += set.weight_kg * set.reps
        }
      })
    })

    return { totalSets, totalVolume }
  }

  const getExerciseName = (ex: ExerciseInWorkout): string => {
    if (typeof ex.exercise_id === 'object' && ex.exercise_id !== null) {
      return ex.exercise_id.name
    }
    return 'Exercise'
  }

  const handleAddExercise = async (exercise: Exercise) => {
    // Create exercise with ID reference for backend
    const newExerciseForBackend: ExerciseInWorkout = {
      exercise_id: exercise._id, // Store only the ID for backend
      order_index: exercises.length,
      sets: [
        {
          set_number: 1,
          reps: 10,
          weight_kg: 0,
          is_warmup: false,
        },
      ],
    }

    // Create exercise with full object for frontend display
    const newExerciseForDisplay: ExerciseInWorkout = {
      exercise_id: exercise, // Store full object for immediate display
      order_index: exercises.length,
      sets: [
        {
          set_number: 1,
          reps: 10,
          weight_kg: 0,
          is_warmup: false,
        },
      ],
    }

    // Update local state immediately with full object
    const updatedExercisesForDisplay = [...exercises, newExerciseForDisplay]
    setExercises(updatedExercisesForDisplay)

    // Auto-save to backend with ID reference
    if (workout?._id) {
      try {
        const token = await getAuthToken()
        if (token) {
          const updatedExercisesForBackend = [
            ...exercises.map((ex) => ({
              ...ex,
              exercise_id:
                typeof ex.exercise_id === 'object'
                  ? ex.exercise_id._id
                  : ex.exercise_id,
            })),
            newExerciseForBackend,
          ]

          const res = await apiClient.put(
            `/api/workouts/${workout._id}`,
            { ...workout, exercises: updatedExercisesForBackend },
            token,
          )

          // Sync with server response
          if (res.success && res.data) {
            setWorkout(res.data)
            setExercises(res.data.exercises || [])
          }
        }
      } catch (err) {
        console.error('Error auto-saving workout:', err)
      }
    }
  }

  if (loading) {
    return (
      <div className='h-full flex items-center justify-center'>
        <div className='text-gray-400'>Loading workout...</div>
      </div>
    )
  }

  const stats = calculateStats()

  return (
    <div className='h-full flex flex-col'>
      {/* Custom Header with Timer */}
      <div className='flex-shrink-0 bg-[#131520] border-b border-white/5 px-6 pt-safe pb-3'>
        <div className='flex items-center justify-between mb-2.5'>
          <Link href='/exercise'>
            <Icon name='x' size={22} color='#64748B' />
          </Link>
          <div className='flex-1 mx-3 flex flex-col items-center gap-1'>
            {!isTemplateMode && (
              <div className='text-[12px] text-gray-400 uppercase tracking-wider'>
                {formatTime(timer)}
              </div>
            )}
            <input
              type='text'
              value={workoutName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder={
                isTemplateMode ? 'Template name...' : 'Workout name...'
              }
              className='w-full px-3 py-1.5 bg-[#0B0D17] border border-white/10 rounded-xl text-white text-center text-lg font-extrabold placeholder-gray-600 focus:outline-none focus:border-blue-500/50'
            />
          </div>
          <div className='flex gap-2'>
            {isTemplateMode ? (
              <button
                onClick={saveTemplateDirectly}
                disabled={saving || exercises.length === 0}
                className='py-1.5 px-3.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-500 text-[13px] font-bold disabled:opacity-50'
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            ) : (
              <button
                onClick={finishWorkout}
                disabled={saving}
                className='py-1.5 px-3.5 rounded-xl bg-green-500/15 border border-green-500/30 text-green-500 text-[13px] font-bold disabled:opacity-50'
              >
                {saving ? 'Saving...' : 'Finish'}
              </button>
            )}
          </div>
        </div>
        {!isTemplateMode && (
          <div className='flex gap-2.5'>
            <div className='flex-1 text-center bg-[#0B0D17] rounded-xl py-2'>
              <div className='text-[14px] font-bold text-white'>
                {stats.totalSets}
              </div>
              <div className='text-[10px] text-gray-400'>Sets</div>
            </div>
            <div className='flex-1 text-center bg-[#0B0D17] rounded-xl py-2'>
              <div className='text-[14px] font-bold text-white'>
                {Math.round(stats.totalVolume)} kg
              </div>
              <div className='text-[10px] text-gray-400'>Volume</div>
            </div>
            <div className='flex-1 text-center bg-[#0B0D17] rounded-xl py-2'>
              <div className='text-[14px] font-bold text-white'>0 🏆</div>
              <div className='text-[10px] text-gray-400'>PRs</div>
            </div>
          </div>
        )}
      </div>

      {/* Exercises */}
      <div className='flex-1 overflow-y-auto px-6 py-4'>
        {exercises.length === 0 ? (
          <div className='text-center py-12'>
            <div className='text-gray-400 text-sm mb-4'>No exercises yet</div>
            <button
              onClick={() => setShowExerciseModal(true)}
              className='py-3.5 px-6 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-500 text-[14px] font-semibold'
            >
              + Add Exercise
            </button>
          </div>
        ) : (
          <>
            {exercises.map((exercise, exerciseIndex) => (
              <div
                key={exerciseIndex}
                className='bg-[#131520] border border-white/5 rounded-2xl p-4 mb-3'
              >
                <div className='text-[15px] font-bold text-white mb-3'>
                  {getExerciseName(exercise)}
                </div>
                {/* Set Header */}
                <div className='grid grid-cols-[36px_1fr_1fr_36px] gap-2 mb-2'>
                  {['Set', 'Weight (kg)', 'Reps', '✓'].map((header) => (
                    <div
                      key={header}
                      className='text-[10px] text-gray-600 font-semibold text-center uppercase tracking-wider'
                    >
                      {header}
                    </div>
                  ))}
                </div>
                {/* Sets */}
                {exercise.sets.map((set, setIndex) => (
                  <div
                    key={setIndex}
                    className='
    grid 
    grid-cols-[28px_1fr_1fr_32px] 
    sm:grid-cols-[36px_1fr_1fr_36px]
    gap-1.5 sm:gap-2
    mb-1.5 
    items-center
  '
                    style={{ opacity: set.completed_at ? 0.7 : 1 }}
                  >
                    {/* Set Number */}
                    <div className='text-[12px] sm:text-[13px] text-gray-400 text-center'>
                      {setIndex + 1}
                    </div>

                    {/* Weight */}
                    <input
                      type='number'
                      inputMode='decimal'
                      value={set.weight_kg}
                      onChange={(e) =>
                        updateSet(
                          exerciseIndex,
                          setIndex,
                          'weight_kg',
                          Number(e.target.value),
                        )
                      }
                      className={`
      rounded-lg sm:rounded-xl
      py-1.5 sm:py-2
      text-center
      text-[13px] sm:text-[14px]
      font-semibold
      text-white
      w-full
      focus:outline-none
      ${
        set.completed_at
          ? 'bg-green-500/10 border border-green-500/25'
          : 'bg-[#1a1f35] border border-white/10'
      }
    `}
                    />

                    {/* Reps */}
                    <input
                      type='number'
                      inputMode='numeric'
                      value={set.reps}
                      onChange={(e) =>
                        updateSet(
                          exerciseIndex,
                          setIndex,
                          'reps',
                          Number(e.target.value),
                        )
                      }
                      className={`
      rounded-lg sm:rounded-xl
      py-1.5 sm:py-2
      text-center
      text-[13px] sm:text-[14px]
      font-semibold
      text-white
      w-full
      focus:outline-none
      ${
        set.completed_at
          ? 'bg-green-500/10 border border-green-500/25'
          : 'bg-[#1a1f35] border border-white/10'
      }
    `}
                    />

                    {/* Complete Button */}
                    <button
                      onClick={() =>
                        toggleSetCompletion(exerciseIndex, setIndex)
                      }
                      className={`
      w-[30px] h-[30px]
      sm:w-[34px] sm:h-[34px]
      rounded-lg sm:rounded-xl
      flex items-center justify-center
      active:scale-95
      transition
      ${
        set.completed_at
          ? 'bg-green-500 border border-green-500'
          : 'bg-[#1a1f35] border border-white/10'
      }
    `}
                    >
                      {set.completed_at && (
                        <Icon name='check' size={14} className='sm:hidden' />
                      )}
                      {set.completed_at && (
                        <Icon
                          name='check'
                          size={16}
                          className='hidden sm:block'
                        />
                      )}
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addSet(exerciseIndex)}
                  className='w-full py-2.5 rounded-xl bg-indigo-500/10 border border-dashed border-indigo-500/30 text-indigo-400 text-[13px] font-semibold mt-1'
                >
                  + Add Set
                </button>
              </div>
            ))}
            <button
              onClick={() => setShowExerciseModal(true)}
              className='w-full py-3.5 rounded-2xl bg-blue-500/10 border border-dashed border-blue-500/30 text-blue-500 text-[14px] font-semibold'
            >
              + Add Exercise
            </button>
          </>
        )}
      </div>

      {/* Exercise Selection Modal */}
      <ExerciseModal
        isOpen={showExerciseModal}
        onClose={() => setShowExerciseModal(false)}
        onSelectExercise={handleAddExercise}
      />
    </div>
  )
}

export default function WorkoutPage() {
  return (
    <Suspense
      fallback={
        <div className='h-full flex items-center justify-center'>
          <div className='text-gray-400'>Loading workout...</div>
        </div>
      }
    >
      <WorkoutPageContent />
    </Suspense>
  )
}
