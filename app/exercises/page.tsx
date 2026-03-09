'use client'

import { useEffect, useState } from 'react'
import { getAuthToken } from '@/lib/auth/auth-token'
import { apiClient } from '@/lib/api/client'
import { toast } from 'sonner'
import { ItemCard } from '@/components/common/item-card'
import { Skeleton } from '@/components/ui/skeleton'
import { Exercise } from '@/types'
import { ExerciseEditDialog } from '@/components/exercise/exercise-edit-dialog'
import { ExerciseDetailDialog } from '@/components/exercise/exercise-detail-dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { FilterBar } from '@/components/common/filter-bar'
import { Pagination } from '@/components/ui/pagination'
import { ExerciseModal } from '@/components/ui/exercise-modal'

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingExerciseId, setDeletingExerciseId] = useState<string | null>(
    null,
  )
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null,
  )

  // Filter and pagination state
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [muscleGroup, setMuscleGroup] = useState('all')
  const [difficulty, setDifficulty] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchExercises()
  }, [search, category, muscleGroup, difficulty, currentPage])

  const fetchExercises = async () => {
    try {
      setLoading(true)
      const token = await getAuthToken()
      if (!token) return

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      })

      if (search) params.append('search', search)
      if (category !== 'all') params.append('category', category)
      if (muscleGroup !== 'all') params.append('muscle_group', muscleGroup)
      if (difficulty !== 'all') params.append('difficulty', difficulty)

      const res = await apiClient.get(
        `/api/exercises?${params.toString()}`,
        token,
      )
      if (res.success && res.data) {
        setExercises(res.data.exercises || res.data)
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages)
          setTotal(res.data.pagination.total)
        }
      }
    } catch (err) {
      console.error('Error fetching exercises:', err)
      toast.error('Failed to load exercises')
    } finally {
      setLoading(false)
    }
  }

  const handleExerciseCreated = (newExercise: Exercise) => {
    setExercises([newExercise, ...exercises])
    setTotal(total + 1)
  }

  const handleEdit = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const exercise = exercises.find((ex) => ex._id === id)
    if (!exercise?.is_custom) {
      toast.error('Cannot edit system exercises')
      return
    }
    if (exercise) {
      setEditingExercise(exercise)
      setShowEditDialog(true)
    }
  }

  const handleClick = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    const exercise = exercises.find((ex) => ex._id === id)
    if (exercise) {
      setSelectedExercise(exercise)
      setShowDetailDialog(true)
    }
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const exercise = exercises.find((ex) => ex._id === id)
    if (!exercise?.is_custom) {
      toast.error('Cannot delete system exercises')
      return
    }

    setDeletingExerciseId(id)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!deletingExerciseId) return

    try {
      const token = await getAuthToken()
      if (!token) return

      const res = await apiClient.delete(
        `/api/exercises/${deletingExerciseId}`,
        token,
      )
      if (res.success) {
        setExercises(exercises.filter((e) => e._id !== deletingExerciseId))
        toast.success('Exercise deleted successfully')
      } else {
        toast.error('Failed to delete exercise')
      }
    } catch (err) {
      console.error('Error deleting exercise:', err)
      toast.error('Failed to delete exercise')
    } finally {
      setDeletingExerciseId(null)
    }
  }

  const handleUpdateExercise = (updatedExercise: Exercise) => {
    setExercises(
      exercises.map((e) =>
        e._id === updatedExercise._id ? updatedExercise : e,
      ),
    )
  }

  return (
    <>
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        placeholder='Search exercises...'
        onAddClick={() => setShowCreateModal(true)}
        addButtonText='New'
        filters={[
          {
            label: 'Category',
            type: 'dropdown',
            value: category,
            onChange: (val) => {
              setCategory(val)
              setCurrentPage(1)
            },
            options: [
              { label: 'All', value: 'all' },
              { label: 'Strength', value: 'strength' },
              { label: 'Cardio', value: 'cardio' },
              { label: 'Mobility', value: 'mobility' },
              { label: 'Plyometric', value: 'plyometric' },
            ],
          },
          {
            label: 'Muscle Group',
            type: 'tabs',
            value: muscleGroup,
            onChange: (val) => {
              setMuscleGroup(val)
              setCurrentPage(1)
            },
            options: [
              { label: 'All', value: 'all' },
              { label: 'Chest', value: 'chest' },
              { label: 'Back', value: 'back' },
              { label: 'Shoulders', value: 'shoulders' },
              { label: 'Biceps', value: 'biceps' },
              { label: 'Triceps', value: 'triceps' },
              { label: 'Legs', value: 'legs' },
              { label: 'Core', value: 'core' },
            ],
          },
          {
            label: 'Difficulty',
            type: 'tabs',
            value: difficulty,
            onChange: (val) => {
              setDifficulty(val)
              setCurrentPage(1)
            },
            options: [
              { label: 'All', value: 'all' },
              { label: 'Beginner', value: 'beginner' },
              { label: 'Intermediate', value: 'intermediate' },
              { label: 'Advanced', value: 'advanced' },
            ],
          },
        ]}
      />

      {loading && (
        <div className='px-6 pt-5 pb-4'>
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className='flex items-center gap-3.5 p-4 app-surface border rounded-2xl mb-2.5'
            >
              <Skeleton className='w-10 h-10 rounded-xl' />
              <div className='flex-1'>
                <Skeleton className='h-4 w-32 mb-2' />
                <Skeleton className='h-3 w-40' />
              </div>
              <div className='flex gap-1.5'>
                <Skeleton className='w-8 h-8 rounded-lg' />
                <Skeleton className='w-8 h-8 rounded-lg' />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className='px-6 pb-4'>
        {exercises.length === 0 && !loading ? (
          <div className='app-surface border rounded-2xl p-6 text-center'>
            <div className='text-[color:var(--app-text-muted)] text-sm mb-2'>
              No exercises found
            </div>
            <div className='text-[color:var(--app-text-muted)] text-xs'>
              Try adjusting your filters or create a new exercise
            </div>
          </div>
        ) : (
          exercises.map((exercise) => (
            <ItemCard
              key={exercise._id}
              id={exercise._id}
              title={exercise.name}
              subtitle={
                exercise.primary_muscle || exercise.muscle_groups.join(', ')
              }
              metadata={
                exercise.difficulty
                  ? exercise.difficulty.charAt(0).toUpperCase() +
                    exercise.difficulty.slice(1)
                  : undefined
              }
              secondaryMetadata={
                exercise.calories_per_minute
                  ? `${exercise.calories_per_minute} cal/min`
                  : exercise.exercise_type
                    ? exercise.exercise_type
                    : undefined
              }
              icon={
                exercise.category === 'cardio'
                  ? 'activity'
                  : exercise.category === 'mobility'
                    ? 'stretch-horizontal'
                    : exercise.category === 'plyometric'
                      ? 'zap'
                      : 'dumbbell'
              }
              iconColor={
                exercise.category === 'cardio'
                  ? '#10B981'
                  : exercise.category === 'mobility'
                    ? '#8B5CF6'
                    : exercise.category === 'plyometric'
                      ? '#F59E0B'
                      : '#818CF8'
              }
              iconBg={
                exercise.category === 'cardio'
                  ? 'rgba(16, 185, 129, 0.1)'
                  : exercise.category === 'mobility'
                    ? 'rgba(139, 92, 246, 0.1)'
                    : exercise.category === 'plyometric'
                      ? 'rgba(245, 158, 11, 0.1)'
                      : 'rgba(129, 140, 248, 0.1)'
              }
              href='#'
              onClick={handleClick}
              onEdit={handleEdit}
              onDelete={handleDelete}
              badge={exercise.is_custom ? 'Custom' : undefined}
            />
          ))
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      <ExerciseDetailDialog
        isOpen={showDetailDialog}
        onClose={() => {
          setShowDetailDialog(false)
          setSelectedExercise(null)
        }}
        exercise={selectedExercise}
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
          setDeletingExerciseId(null)
        }}
        onConfirm={confirmDelete}
        title='Delete Exercise'
        message='Are you sure you want to delete this exercise? This action cannot be undone.'
        confirmText='Delete'
        cancelText='Cancel'
        type='danger'
      />

      <ExerciseModal
        isOpen={showCreateModal}
        isOpenCreate={true}
        onClose={() => setShowCreateModal(false)}
        onSelectExercise={handleExerciseCreated}
      />
    </>
  )
}
