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
import { WorkoutPageSkeleton } from '@/components/ui/skeleton'

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
  const workoutId = searchParams.get('workoutId')
  const isTemplateMode = searchParams.get('mode') === 'template'
  const nameFromUrl = searchParams.get('name')

  const [timer, setTimer] = useState(0)
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [exercises, setExercises] = useState<ExerciseInWorkout[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showExerciseModal, setShowExerciseModal] = useState(false)
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null)
  const [workoutName, setWorkoutName] = useState(nameFromUrl || '')
  const [isPaused, setIsPaused] = useState(false)
  const [pausedAtMs, setPausedAtMs] = useState<number | null>(null)
  const [historicalMaxByExercise, setHistoricalMaxByExercise] = useState<
    Record<string, number>
  >({})
  const initializedRef = useRef(false)
  const isCompleted = !isTemplateMode && !!workout?.ended_at

  useEffect(() => {
    if (isTemplateMode) {
      setTimer(0)
      return
    }

    const syncElapsedTime = () => {
      if (!workout?.started_at) {
        setTimer(0)
        return
      }

      const startMs = new Date(workout.started_at).getTime()
      const endMs = workout.ended_at
        ? new Date(workout.ended_at).getTime()
        : isPaused && pausedAtMs
          ? pausedAtMs
          : Date.now()

      if (
        !Number.isFinite(startMs) ||
        !Number.isFinite(endMs) ||
        endMs < startMs
      ) {
        setTimer(0)
        return
      }

      setTimer(Math.floor((endMs - startMs) / 1000))
    }

    syncElapsedTime()

    // Finished or paused workout: fixed duration until resumed.
    if (workout?.ended_at || isPaused) {
      return
    }

    const interval = setInterval(syncElapsedTime, 1000)
    return () => clearInterval(interval)
  }, [
    isTemplateMode,
    workout?.started_at,
    workout?.ended_at,
    isPaused,
    pausedAtMs,
  ])

  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout)
      }
    }
  }, [saveTimeout])

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
              setWorkoutName(createRes.data.name || template.name || 'Workout')
              await loadHistoricalMaxes(token, createRes.data._id)
            }
          }
        } else if (workoutId) {
          // Load existing workout for editing
          const workoutRes = await apiClient.get(
            `/api/workouts/${workoutId}`,
            token,
          )
          if (workoutRes.success && workoutRes.data) {
            setWorkout(workoutRes.data)
            setExercises(workoutRes.data.exercises || [])
            setWorkoutName(workoutRes.data.name || 'Workout')
            await loadHistoricalMaxes(token, workoutRes.data._id)
          }
        } else {
          // Start fresh workout or template
          const workoutName =
            nameFromUrl ||
            (isTemplateMode ? 'Untitled Template' : 'Untitled Workout')
          const newWorkout: Workout = {
            name: workoutName,
            started_at: new Date().toISOString(),
            exercises: [],
            is_template: isTemplateMode,
          }

          const res = await apiClient.post('/api/workouts', newWorkout, token)
          if (res.success) {
            setWorkout(res.data)
            setExercises(res.data.exercises || [])
            setWorkoutName(res.data.name || workoutName)
            await loadHistoricalMaxes(token, res.data._id)
          }
        }
      } catch (err) {
        console.error('Error initializing workout:', err)
      } finally {
        setLoading(false)
      }
    }

    initWorkout()
  }, [templateId, workoutId])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const getDurationSeconds = (startedAt?: string, endedAt?: string) => {
    if (!startedAt) return 0
    const startMs = new Date(startedAt).getTime()
    const endMs = endedAt ? new Date(endedAt).getTime() : Date.now()
    if (
      !Number.isFinite(startMs) ||
      !Number.isFinite(endMs) ||
      endMs < startMs
    ) {
      return 0
    }
    return Math.floor((endMs - startMs) / 1000)
  }

  const getExerciseKey = (exercise: any): string | null => {
    const rawId =
      typeof exercise?.exercise_id === 'object'
        ? exercise?.exercise_id?._id
        : exercise?.exercise_id
    if (!rawId) return null
    return String(rawId)
  }

  const loadHistoricalMaxes = async (
    token: string,
    currentWorkoutId?: string,
  ) => {
    try {
      const res = await apiClient.get(
        '/api/workouts?is_template=false&completed=true&limit=200',
        token,
      )
      if (!res.success) return

      const workouts = res.data?.workouts || []
      const maxByExercise: Record<string, number> = {}

      workouts.forEach((historyWorkout: any) => {
        if (
          currentWorkoutId &&
          historyWorkout?._id?.toString() === currentWorkoutId.toString()
        ) {
          return
        }

        historyWorkout.exercises?.forEach((exercise: any) => {
          const key = getExerciseKey(exercise)
          if (!key) return

          exercise.sets?.forEach((set: any) => {
            if (
              set?.completed_at &&
              !set?.is_warmup &&
              (set?.reps || 0) > 0 &&
              (set?.weight_kg || 0) >= 0
            ) {
              const currentMax = maxByExercise[key] || 0
              if ((set?.weight_kg || 0) > currentMax) {
                maxByExercise[key] = set.weight_kg || 0
              }
            }
          })
        })
      })

      setHistoricalMaxByExercise(maxByExercise)
    } catch (error) {
      console.error('Error loading PR baselines:', error)
    }
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

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const updatedExercises = [...exercises]
    const targetExercise = updatedExercises[exerciseIndex]

    if (!targetExercise || targetExercise.sets.length <= 1) return

    targetExercise.sets = targetExercise.sets
      .filter((_, idx) => idx !== setIndex)
      .map((set, idx) => ({
        ...set,
        set_number: idx + 1,
      }))

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
        router.back()
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
        router.back()
      }
    } catch (err) {
      console.error('Error saving template:', err)
      toast.error('Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  const pauseWorkout = () => {
    if (isTemplateMode || isCompleted || isPaused) return
    setPausedAtMs(Date.now())
    setIsPaused(true)
  }

  const resumePausedWorkout = async () => {
    if (!workout?._id || !workout.started_at || !isPaused || !pausedAtMs) return

    try {
      setSaving(true)
      const token = await getAuthToken()
      if (!token) return

      const pausedDurationMs = Math.max(0, Date.now() - pausedAtMs)
      const adjustedStartedAt = new Date(
        new Date(workout.started_at).getTime() + pausedDurationMs,
      ).toISOString()

      const exercisesForBackend = exercises.map((ex) => ({
        ...ex,
        exercise_id:
          typeof ex.exercise_id === 'object'
            ? ex.exercise_id._id
            : ex.exercise_id,
      }))

      const res = await apiClient.put(
        `/api/workouts/${workout._id}`,
        {
          ...workout,
          started_at: adjustedStartedAt,
          exercises: exercisesForBackend,
        },
        token,
      )

      if (res.success && res.data) {
        setWorkout(res.data)
        setExercises(res.data.exercises || [])
      } else {
        toast.error('Failed to resume workout')
        return
      }
    } catch (err) {
      console.error('Error resuming paused workout:', err)
      toast.error('Failed to resume workout')
      return
    } finally {
      setSaving(false)
    }

    setPausedAtMs(null)
    setIsPaused(false)
  }

  const resumeWorkout = async () => {
    if (!workout?._id || !workout.ended_at) return

    try {
      setSaving(true)
      const token = await getAuthToken()
      if (!token) return

      // Keep the completed duration and continue from there.
      const completedDuration = getDurationSeconds(
        workout.started_at,
        workout.ended_at,
      )
      const resumedStartAt = new Date(
        Date.now() - completedDuration * 1000,
      ).toISOString()

      const exercisesForBackend = exercises.map((ex) => ({
        ...ex,
        exercise_id:
          typeof ex.exercise_id === 'object'
            ? ex.exercise_id._id
            : ex.exercise_id,
      }))

      const res = await apiClient.put(
        `/api/workouts/${workout._id}`,
        {
          ...workout,
          started_at: resumedStartAt,
          ended_at: null as any,
          exercises: exercisesForBackend,
        },
        token,
      )

      if (res.success && res.data) {
        setWorkout(res.data)
        setExercises(res.data.exercises || [])
        toast.success('Workout resumed')
      } else {
        toast.error('Failed to resume workout')
      }
    } catch (err) {
      console.error('Error resuming workout:', err)
      toast.error('Failed to resume workout')
    } finally {
      setSaving(false)
    }
  }

  const calculateStats = () => {
    let totalSets = 0
    let totalVolume = 0
    const prExerciseIds = new Set<string>()

    exercises.forEach((ex) => {
      const exerciseKey = getExerciseKey(ex)
      const historicalMax = exerciseKey
        ? historicalMaxByExercise[exerciseKey] || 0
        : 0

      ex.sets.forEach((set) => {
        if (set.completed_at) {
          totalSets++
          totalVolume += set.weight_kg * set.reps

          if (
            exerciseKey &&
            !set.is_warmup &&
            (set.reps || 0) > 0 &&
            (set.weight_kg || 0) > historicalMax
          ) {
            prExerciseIds.add(exerciseKey)
          }
        }
      })
    })

    return { totalSets, totalVolume, prCount: prExerciseIds.size }
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

  const handleRemoveExercise = async (exerciseIndex: number) => {
    // Remove exercise from local state
    const updatedExercises = exercises.filter((_, i) => i !== exerciseIndex)
    setExercises(updatedExercises)

    // Auto-save to backend
    if (workout?._id) {
      try {
        const token = await getAuthToken()
        if (token) {
          const updatedExercisesForBackend = updatedExercises.map((ex) => ({
            ...ex,
            exercise_id:
              typeof ex.exercise_id === 'object'
                ? ex.exercise_id._id
                : ex.exercise_id,
          }))

          const res = await apiClient.put(
            `/api/workouts/${workout._id}`,
            { ...workout, exercises: updatedExercisesForBackend },
            token,
          )
          if (!res.success) {
            toast.error('Failed to remove exercise')
          } else {
            toast.success('Exercise removed')
          }
        }
      } catch (err) {
        console.error('Error removing exercise:', err)
        toast.error('Failed to remove exercise')
      }
    }
  }

  if (loading) {
    return <WorkoutPageSkeleton />
  }

  const stats = calculateStats()

  return (
    <div className='h-full flex flex-col'>
      {/* Workout Header */}
      <div className='flex-shrink-0 border-b border-white/5 bg-gradient-to-b from-[#151a30] to-[#101525] px-4 sm:px-6 pt-safe pb-3'>
        <div className='flex items-center justify-between mb-3'>
          <button
            onClick={() => router.back()}
            className='w-9 h-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center'
          >
            <Icon name='x' size={18} color='#94A3B8' />
          </button>

          {!isTemplateMode && (
            <div className='px-3 py-1.5 rounded-xl border border-blue-500/25 bg-blue-500/10 text-[12px] font-bold text-blue-300 tracking-wide'>
              {formatTime(
                isCompleted
                  ? getDurationSeconds(workout?.started_at, workout?.ended_at)
                  : timer,
              )}
            </div>
          )}

          <div className='flex gap-1.5 sm:gap-2'>
            {isTemplateMode ? (
              <button
                onClick={saveTemplateDirectly}
                disabled={saving}
                className='h-9 px-3.5 rounded-xl border border-blue-500/30 bg-blue-500/15 text-blue-300 text-[12px] font-semibold disabled:opacity-50'
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            ) : isCompleted ? (
              <button
                onClick={resumeWorkout}
                disabled={saving}
                className='h-9 px-3.5 rounded-xl border border-orange-500/30 bg-orange-500/15 text-orange-300 text-[12px] font-semibold disabled:opacity-50'
              >
                {saving ? 'Resuming...' : 'Resume'}
              </button>
            ) : (
              <>
                {isPaused ? (
                  <button
                    onClick={resumePausedWorkout}
                    disabled={saving}
                    className='h-9 px-3 rounded-xl border border-orange-500/30 bg-orange-500/15 text-orange-300 text-[12px] font-semibold disabled:opacity-50'
                  >
                    {saving ? 'Resuming...' : 'Resume'}
                  </button>
                ) : (
                  <button
                    onClick={pauseWorkout}
                    disabled={saving}
                    className='h-9 px-3 rounded-xl border border-yellow-500/30 bg-yellow-500/15 text-yellow-300 text-[12px] font-semibold disabled:opacity-50'
                  >
                    Pause
                  </button>
                )}
                <button
                  onClick={finishWorkout}
                  disabled={saving}
                  className='h-9 px-3.5 rounded-xl border border-green-500/35 bg-green-500/20 text-green-300 text-[12px] font-semibold disabled:opacity-50'
                >
                  {saving ? 'Saving...' : 'Finish'}
                </button>
              </>
            )}
          </div>
        </div>

        <div className='mb-3'>
          <h1 className='text-white text-[22px] leading-tight font-extrabold truncate'>
            {workoutName || (isTemplateMode ? 'New Template' : 'New Workout')}
          </h1>
          {!isTemplateMode && (
            <p className='text-[11px] text-gray-400 mt-0.5'>
              {isCompleted
                ? 'Completed workout'
                : isPaused
                  ? 'Paused'
                  : 'Live session'}
            </p>
          )}
        </div>

        {!isTemplateMode && (
          <div className='grid grid-cols-3 gap-2'>
            <div className='rounded-xl border border-white/8 bg-[#0C1222] px-2 py-2 text-center'>
              <div className='text-[14px] font-bold text-white'>
                {stats.totalSets}
              </div>
              <div className='text-[10px] text-gray-400 uppercase tracking-wide'>
                Sets
              </div>
            </div>
            <div className='rounded-xl border border-white/8 bg-[#0C1222] px-2 py-2 text-center'>
              <div className='text-[14px] font-bold text-white truncate'>
                {Math.round(stats.totalVolume)} kg
              </div>
              <div className='text-[10px] text-gray-400 uppercase tracking-wide'>
                Volume
              </div>
            </div>
            <div className='rounded-xl border border-white/8 bg-[#0C1222] px-2 py-2 text-center'>
              <div className='text-[14px] font-bold text-white'>
                {stats.prCount}
              </div>
              <div className='text-[10px] text-gray-400 uppercase tracking-wide'>
                PRs
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Exercises */}
      <div className='flex-1 overflow-y-auto px-4 sm:px-6 py-4'>
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
                <div className='flex items-center justify-between mb-3'>
                  <div className='text-[15px] font-bold text-white'>
                    {getExerciseName(exercise)}
                  </div>
                  <button
                    onClick={() => handleRemoveExercise(exerciseIndex)}
                    disabled={isCompleted}
                    className='p-2 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors'
                    title='Remove exercise'
                  >
                    <Icon name='trash-2' size={16} color='#EF4444' />
                  </button>
                </div>
                {/* Set Header */}
                <div
                  className={`grid gap-1.5 sm:gap-2 mb-2 ${isTemplateMode ? 'grid-cols-[40px_1fr_1fr]' : 'grid-cols-[48px_1fr_1fr_36px]'}`}
                >
                  {['Set', 'Weight', 'Reps', 'Done'].map((header) => {
                    if (isTemplateMode && header === 'Done') {
                      return null
                    }
                    return (
                      <div
                        key={header}
                        className='text-[10px] text-gray-600 font-semibold text-center uppercase tracking-wider'
                      >
                        {header}
                      </div>
                    )
                  })}
                </div>
                {/* Sets */}
                {exercise.sets.map((set, setIndex) => (
                  <div
                    key={setIndex}
                    className={`grid gap-1.5 sm:gap-2 mb-1.5 items-center ${isTemplateMode ? 'grid-cols-[40px_1fr_1fr]' : 'grid-cols-[48px_1fr_1fr_36px]'}`}
                    style={{ opacity: set.completed_at ? 0.7 : 1 }}
                  >
                    {/* Set Number */}
                    <div className='flex items-center justify-center gap-1'>
                      {!isTemplateMode && (
                        <button
                          onClick={() => removeSet(exerciseIndex, setIndex)}
                          disabled={
                            isCompleted || isPaused || exercise.sets.length <= 1
                          }
                          className='h-[20px] w-[20px] flex items-center justify-center disabled:opacity-35'
                          title={
                            exercise.sets.length <= 1
                              ? 'At least one set is required'
                              : 'Remove set'
                          }
                        >
                          <Icon
                            name='minus-circle'
                            size={18}
                            color='#EF4444'
                            strokeWidth={2.6}
                          />
                        </button>
                      )}
                      <span className='text-[12px] sm:text-[13px] text-gray-400'>
                        {setIndex + 1}
                      </span>
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
                      placeholder='kg'
                      className={`
      rounded-lg sm:rounded-xl
      py-1.5 sm:py-2
      text-center
      text-[13px] sm:text-[14px]
      font-semibold
      text-white
      w-full
      focus:outline-none
      placeholder:text-gray-600
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
                      placeholder='reps'
                      className={`
      rounded-lg sm:rounded-xl
      py-1.5 sm:py-2
      text-center
      text-[13px] sm:text-[14px]
      font-semibold
      text-white
      w-full
      focus:outline-none
      placeholder:text-gray-600
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
                        !isTemplateMode &&
                        !isPaused &&
                        !isCompleted &&
                        toggleSetCompletion(exerciseIndex, setIndex)
                      }
                      disabled={isTemplateMode || isCompleted || isPaused}
                      className={`w-[30px] h-[30px]
      sm:w-[34px] sm:h-[34px]
      rounded-lg sm:rounded-xl
      flex items-center justify-center
      active:scale-95
      transition
      ${isTemplateMode ? 'hidden' : ''}
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
                  disabled={isCompleted}
                  className='w-full py-2.5 rounded-xl bg-indigo-500/10 border border-dashed border-indigo-500/30 text-indigo-400 text-[13px] font-semibold mt-1'
                >
                  + Add Set
                </button>
              </div>
            ))}
            <button
              onClick={() => setShowExerciseModal(true)}
              disabled={isCompleted}
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
        disabledExerciseIds={exercises.map((ex) =>
          typeof ex.exercise_id === 'object'
            ? ex.exercise_id._id
            : ex.exercise_id,
        )}
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
