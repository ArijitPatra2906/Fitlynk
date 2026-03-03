'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/icon'
import Link from 'next/link'
import { getAuthToken } from '@/lib/auth/auth-token'
import { apiClient } from '@/lib/api/client'
import {
  ExercisePageSkeleton,
} from '@/components/ui/skeleton'
import { Workout, Exercise } from '@/types'
import { ItemCard } from '@/components/common/item-card'
import { WorkoutNameDialog } from '@/components/workout/workout-name-dialog'
import { toast } from 'sonner'
import { ExerciseEditDialog } from '@/components/exercise/exercise-edit-dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

const iconColors = ['#818CF8', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6']
const iconNames = ['layers-3', 'folder-kanban', 'clipboard-list', 'book-marked', 'target']

export default function ExercisePage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<Workout[]>([])
  const [completedWorkouts, setCompletedWorkouts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showWorkoutDialog, setShowWorkoutDialog] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteType, setDeleteType] = useState<
    'template' | 'exercise' | 'workout'
  >('template')
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getAuthToken()
        if (!token) {
          setError('Not authenticated')
          setLoading(false)
          return
        }

        // Fetch workout templates
        const templatesRes = await apiClient.get(
          '/api/workouts?is_template=true&limit=50',
          token,
        )
        if (templatesRes.success && templatesRes.data?.workouts) {
          setTemplates(templatesRes.data.workouts)
        } else {
          console.error('Error fetching templates:', templatesRes.error)
          setTemplates([])
        }

        // Fetch recent workouts
        const workoutsRes = await apiClient.get(
          '/api/workouts?is_template=false&limit=100',
          token,
        )
        if (workoutsRes.success && workoutsRes.data?.workouts) {
          setCompletedWorkouts(workoutsRes.data.workouts)
        }

        // Fetch all exercises
        const exercisesRes = await apiClient.get('/api/exercises', token)
        if (exercisesRes.success) {
          setExercises(exercisesRes.data.exercises)
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getExerciseNames = (template: Workout): string => {
    const exercises = template.exercises
      .slice(0, 3)
      .map((ex) => {
        if (typeof ex.exercise_id === 'object' && ex.exercise_id !== null) {
          return ex.exercise_id.name
        }
        return ''
      })
      .filter((name) => name !== '')
      .join(' · ')

    return exercises || 'No exercises'
  }

  const getTotalSets = (template: Workout): number => {
    return template.exercises.reduce(
      (total, ex) => total + (ex.sets?.length || 0),
      0,
    )
  }

  const handleStartWorkout = (name: string) => {
    setShowWorkoutDialog(false)
    router.push(`/workout?name=${encodeURIComponent(name)}`)
  }

  const handleCreateTemplate = (name: string) => {
    setShowTemplateDialog(false)
    router.push(`/workout?mode=template&name=${encodeURIComponent(name)}`)
  }

  const getLastDone = (template: Workout): string => {
    // Find completed workouts that match this template's ID
    const matchingWorkouts = completedWorkouts.filter(
      (workout) => workout.template_id === template._id && workout.ended_at,
    )

    if (matchingWorkouts.length === 0) {
      return 'Not logged yet'
    }

    // Sort by ended_at to get the most recent
    matchingWorkouts.sort(
      (a, b) => new Date(b.ended_at).getTime() - new Date(a.ended_at).getTime(),
    )

    const lastWorkout = matchingWorkouts[0]
    const lastDate = new Date(lastWorkout.ended_at)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - lastDate.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return 'Today'
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7)
      return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`
    } else {
      const months = Math.floor(diffDays / 30)
      return months === 1 ? '1 month ago' : `${months} months ago`
    }
  }

  const handleDeleteTemplate = (templateId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDeleteType('template')
    setDeletingItemId(templateId)
    setShowDeleteDialog(true)
  }

  const handleEditTemplate = (templateId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/workout?templateId=${templateId}&mode=template`)
  }

  const handleDeleteExercise = (exerciseId: string) => {
    const exercise = exercises.find((e) => e._id === exerciseId)
    if (!exercise?.is_custom) {
      toast.error('Cannot delete system exercises')
      return
    }

    setDeleteType('exercise')
    setDeletingItemId(exerciseId)
    setShowDeleteDialog(true)
  }

  const handleEditExercise = (exercise: Exercise) => {
    if (!exercise.is_custom) {
      toast.error('Cannot edit system exercises')
      return
    }
    setEditingExercise(exercise)
    setShowEditDialog(true)
  }

  const handleUpdateExercise = (updatedExercise: Exercise) => {
    setExercises(
      exercises.map((e) =>
        e._id === updatedExercise._id ? updatedExercise : e,
      ),
    )
  }

  const handleDeleteWorkout = (workoutId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDeleteType('workout')
    setDeletingItemId(workoutId)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!deletingItemId) return

    try {
      const token = await getAuthToken()
      if (!token) return

      if (deleteType === 'template') {
        const res = await apiClient.delete(
          `/api/workouts/${deletingItemId}`,
          token,
        )
        if (res.success) {
          setTemplates(templates.filter((t) => t._id !== deletingItemId))
          toast.success('Template deleted successfully')
        } else {
          toast.error('Failed to delete template')
        }
      } else if (deleteType === 'exercise') {
        const res = await apiClient.delete(
          `/api/exercises/${deletingItemId}`,
          token,
        )
        if (res.success) {
          setExercises(exercises.filter((e) => e._id !== deletingItemId))
          toast.success('Exercise deleted successfully')
        } else {
          toast.error('Failed to delete exercise')
        }
      } else if (deleteType === 'workout') {
        const res = await apiClient.delete(
          `/api/workouts/${deletingItemId}`,
          token,
        )
        if (res.success) {
          setCompletedWorkouts(
            completedWorkouts.filter((w) => w._id !== deletingItemId),
          )
          toast.success('Workout deleted successfully')
        } else {
          toast.error('Failed to delete workout')
        }
      }
    } catch (err) {
      console.error(`Error deleting ${deleteType}:`, err)
      toast.error(`Failed to delete ${deleteType}`)
    } finally {
      setDeletingItemId(null)
    }
  }

  const handleEditWorkout = (workoutId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/workout?workoutId=${workoutId}`)
  }

  if (loading) {
    return <ExercisePageSkeleton />
  }

  if (error) {
    return (
      <div className='px-6 pt-5 pb-4'>
        <div className='bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm'>
          Error: {error}
        </div>
      </div>
    )
  }

  return (
    <div className='px-6 pt-5 pb-4'>
      {/* Quick Actions */}
      <div className='grid grid-cols-2 gap-2.5 mb-4'>
        <button
          onClick={() => setShowWorkoutDialog(true)}
          className='text-left bg-gradient-to-br from-[#1a1f35] to-[#0d1b3e] border border-indigo-500/25 rounded-2xl p-3.5 min-h-[126px] flex flex-col shadow-[0_8px_18px_rgba(5,10,30,0.35)]'
        >
          <div className='flex items-center justify-between mb-2.5'>
            <div className='w-9 h-9 rounded-xl bg-indigo-500/18 border border-indigo-400/20 flex items-center justify-center'>
              <Icon name='dumbbell' size={17} color='#818CF8' />
            </div>
            <div className='flex items-center gap-1 text-indigo-300 text-[11px] font-semibold tracking-wide uppercase'>
              Start <Icon name='chevronRight' size={12} color='#818CF8' />
            </div>
          </div>
          <div className='text-[18px] leading-none font-extrabold text-white mb-1.5'>
            Quick
          </div>
          <div className='text-[11px] text-gray-400 leading-snug'>
            Start workout now
          </div>
        </button>

        <button
          onClick={() => setShowTemplateDialog(true)}
          className='text-left bg-gradient-to-br from-[#0d1b3e] to-[#1a1f35] border border-blue-500/25 rounded-2xl p-3.5 min-h-[126px] flex flex-col shadow-[0_8px_18px_rgba(5,10,30,0.35)]'
        >
          <div className='flex items-center justify-between mb-2.5'>
            <div className='w-9 h-9 rounded-xl bg-blue-500/18 border border-blue-400/20 flex items-center justify-center'>
              <Icon name='plus' size={17} color='#3B82F6' />
            </div>
            <div className='flex items-center gap-1 text-blue-300 text-[11px] font-semibold tracking-wide uppercase'>
              Create <Icon name='chevronRight' size={12} color='#3B82F6' />
            </div>
          </div>
          <div className='text-[18px] leading-none font-extrabold text-white mb-1.5'>
            Template
          </div>
          <div className='text-[11px] text-gray-400 leading-snug'>
            Build reusable plan
          </div>
        </button>
      </div>

      <Link
        href='/steps'
        className='mb-4 bg-[#131520] border border-white/10 rounded-2xl p-3.5 flex items-center justify-between'
      >
        <div className='flex items-center gap-3'>
          <div className='w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-400/20 flex items-center justify-center'>
            <Icon name='activity' size={18} color='#22D3EE' />
          </div>
          <div>
            <div className='text-[14px] font-bold text-white'>Steps Tracker</div>
            <div className='text-[11px] text-gray-400'>
              Goal, logs, and manual entry
            </div>
          </div>
        </div>
        <Icon name='chevronRight' size={16} color='#64748B' />
      </Link>

      {/* Recent Workouts */}
      <div className='flex items-center justify-between mb-3'>
        <div className='text-[14px] font-bold text-white'>Recent Workouts</div>
        {completedWorkouts.length > 5 && (
          <Link
            href='/workouts'
            className='text-[12px] text-blue-400 font-semibold'
          >
            See more
          </Link>
        )}
      </div>
      {completedWorkouts.length === 0 ? (
        <div className='bg-[#131520] border border-white/5 rounded-2xl p-6 text-center mb-5'>
          <div className='text-gray-400 text-sm mb-2'>No workouts yet</div>
          <div className='text-gray-500 text-xs'>
            Start a workout to track your progress
          </div>
        </div>
      ) : (
        <div className='mb-5'>
          {completedWorkouts?.slice(0, 5).map((workout) => (
            <ItemCard
              key={workout._id}
              id={workout._id}
              title={workout.name}
              subtitle={new Date(workout.started_at).toLocaleDateString(
                'en-US',
                {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                },
              )}
              metadata={`${workout.calories || 0} kcal`}
              secondaryMetadata={`${workout.exercises?.length || 0} exercises`}
              icon={workout.ended_at ? 'dumbbell' : 'timer-reset'}
              iconColor={workout.ended_at ? '#3B82F6' : '#F59E0B'}
              iconBg={
                workout.ended_at
                  ? 'rgba(59, 130, 246, 0.12)'
                  : 'rgba(245, 158, 11, 0.12)'
              }
              badge={workout.ended_at ? undefined : 'LIVE'}
              href={`/workout?workoutId=${workout._id}`}
              onEdit={handleEditWorkout}
              onDelete={handleDeleteWorkout}
            />
          ))}
        </div>
      )}

      {/* Templates */}
      <div className='flex items-center justify-between mb-3'>
        <div className='text-[14px] font-bold text-white'>My Templates</div>
        {templates.length > 5 && (
          <Link
            href='/templates'
            className='text-[12px] text-blue-400 font-semibold'
          >
            See more
          </Link>
        )}
      </div>
      {templates.length === 0 ? (
        <div className='bg-[#131520] border border-white/5 rounded-2xl p-6 text-center mb-5'>
          <div className='text-gray-400 text-sm mb-2'>No templates yet</div>
          <div className='text-gray-500 text-xs'>
            Create a workout template to get started
          </div>
        </div>
      ) : (
        <div className='mb-5'>
          {templates.slice(0, 5).map((template, index) => {
            const color = iconColors[index % iconColors.length]
            const icon = iconNames[index % iconNames.length]
            const totalSets = getTotalSets(template)

            return (
              <ItemCard
                key={template._id}
                id={template._id!}
                title={template.name}
                subtitle={getExerciseNames(template)}
                metadata={`${template.exercises?.length || 0} exercises`}
                secondaryMetadata={`${totalSets} ${totalSets === 1 ? 'set' : 'sets'}`}
                icon={icon}
                iconColor={color}
                href={`/workout?templateId=${template._id}`}
                onEdit={handleEditTemplate}
                onDelete={handleDeleteTemplate}
              />
            )
          })}
        </div>
      )}

      {/* All Exercises */}
      <div className='flex items-center justify-between mb-3'>
        <div className='text-[14px] font-bold text-white'>All Exercises</div>
        {exercises.length > 5 && (
          <Link
            href='/exercises'
            className='text-[12px] text-blue-400 font-semibold'
          >
            See more
          </Link>
        )}
      </div>
      {exercises.length === 0 ? (
        <div className='bg-[#131520] border border-white/5 rounded-2xl p-6 text-center mb-5'>
          <div className='text-gray-400 text-sm mb-2'>No exercises yet</div>
          <div className='text-gray-500 text-xs'>
            Create an exercise to get started
          </div>
        </div>
      ) : (
        <div className='mb-5'>
          {exercises &&
            exercises?.slice(0, 5).map((exercise) => (
              <ItemCard
                key={exercise._id}
                id={exercise._id}
                title={exercise.name}
                subtitle={exercise.muscle_groups.join(', ')}
                icon={exercise.category === 'cardio' ? 'activity' : 'dumbbell'}
                iconColor='#818CF8'
                iconBg='rgba(129, 140, 248, 0.1)'
                onEdit={(id, e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  const selected = exercises.find((ex) => ex._id === id)
                  if (selected) handleEditExercise(selected)
                }}
                onDelete={(id, e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleDeleteExercise(id)
                }}
                badge={exercise.is_custom ? 'Custom' : undefined}
              />
            ))}
        </div>
      )}

      {/* Dialogs */}
      <WorkoutNameDialog
        isOpen={showWorkoutDialog}
        onClose={() => setShowWorkoutDialog(false)}
        onSubmit={handleStartWorkout}
        title='Start New Workout'
        placeholder='e.g., Leg Day, Push A'
      />

      <WorkoutNameDialog
        isOpen={showTemplateDialog}
        onClose={() => setShowTemplateDialog(false)}
        onSubmit={handleCreateTemplate}
        title='Create Template'
        placeholder='e.g., Upper Body, Full Body'
      />

      <ExerciseEditDialog
        isOpen={showEditDialog}
        onClose={() => {
          setShowEditDialog(false)
          setEditingExercise(null)
        }}
        exercise={editingExercise}
        onUpdate={handleUpdateExercise}
      />

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false)
          setDeletingItemId(null)
        }}
        onConfirm={confirmDelete}
        title={`Delete ${deleteType === 'template' ? 'Template' : deleteType === 'exercise' ? 'Exercise' : 'Workout'}`}
        message={`Are you sure you want to delete this ${deleteType}? This action cannot be undone.`}
        confirmText='Delete'
        cancelText='Cancel'
        type='danger'
      />
    </div>
  )
}
