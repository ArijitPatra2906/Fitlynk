'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAuthToken } from '@/lib/auth/auth-token'
import { apiClient } from '@/lib/api/client'
import { toast } from 'sonner'
import { ItemCard } from '@/components/common/item-card'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { FilterBar } from '@/components/common/filter-bar'
import { Pagination } from '@/components/ui/pagination'
import { WorkoutNameDialog } from '@/components/workout/workout-name-dialog'

export default function WorkoutsPage() {
  const router = useRouter()
  const [workouts, setWorkouts] = useState<any[]>([])
  const [now, setNow] = useState(Date.now())
  const [loading, setLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showWorkoutDialog, setShowWorkoutDialog] = useState(false)
  const [deletingWorkoutId, setDeletingWorkoutId] = useState<string | null>(
    null,
  )

  // Filter and pagination state
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchWorkouts()
  }, [search, currentPage])

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatElapsed = (startedAt: string) => {
    const started = new Date(startedAt).getTime()
    const elapsedMs = Math.max(0, now - started)
    const totalSeconds = Math.floor(elapsedMs / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`
    }

    return `${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`
  }

  const fetchWorkouts = async () => {
    try {
      setLoading(true)
      const token = await getAuthToken()
      if (!token) return

      const params = new URLSearchParams({
        is_template: 'false',
        page: currentPage.toString(),
        limit: '10',
      })

      if (search) params.append('search', search)

      const res = await apiClient.get(
        `/api/workouts?${params.toString()}`,
        token,
      )
      if (res.success && res.data?.workouts) {
        setWorkouts(res.data.workouts)
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages)
          setTotal(res.data.pagination.total)
        }
      }
    } catch (err) {
      console.error('Error fetching workouts:', err)
      toast.error('Failed to load workouts')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/workout?workoutId=${id}`)
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDeletingWorkoutId(id)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!deletingWorkoutId) return

    try {
      const token = await getAuthToken()
      if (!token) return

      const res = await apiClient.delete(
        `/api/workouts/${deletingWorkoutId}`,
        token,
      )
      if (res.success) {
        setWorkouts(workouts.filter((w) => w._id !== deletingWorkoutId))
        toast.success('Workout deleted successfully')
      } else {
        toast.error('Failed to delete workout')
      }
    } catch (err) {
      console.error('Error deleting workout:', err)
      toast.error('Failed to delete workout')
    } finally {
      setDeletingWorkoutId(null)
    }
  }

  const handleStartWorkout = (name: string) => {
    setShowWorkoutDialog(false)
    router.push(`/workout?name=${encodeURIComponent(name)}`)
  }

  if (loading) {
    return (
      <>
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          placeholder='Search workouts...'
        />
        <div className='px-6 pt-5 pb-4'>
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className='flex items-center gap-3.5 p-4 bg-[#131520] border border-white/5 rounded-2xl mb-2.5'
            >
              <Skeleton className='w-11 h-11 rounded-2xl' />
              <div className='flex-1'>
                <Skeleton className='h-4 w-32 mb-2' />
                <Skeleton className='h-3 w-24' />
              </div>
              <div className='flex gap-1.5'>
                <Skeleton className='w-8 h-8 rounded-lg' />
                <Skeleton className='w-8 h-8 rounded-lg' />
              </div>
            </div>
          ))}
        </div>
      </>
    )
  }

  return (
    <>
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        placeholder='Search workouts...'
        onAddClick={() => setShowWorkoutDialog(true)}
        addButtonText='New'
      />

      <div className='px-6 pb-4'>
        {workouts.length === 0 ? (
          <div className='bg-[#131520] border border-white/5 rounded-2xl p-6 text-center'>
            <div className='text-gray-400 text-sm mb-2'>No workouts yet</div>
            <div className='text-gray-500 text-xs'>
              Start a workout to track your progress
            </div>
          </div>
        ) : (
          workouts.map((workout) => (
            <ItemCard
              key={workout._id}
              id={workout._id}
              title={workout.name}
              subtitle={
                workout.ended_at
                  ? new Date(workout.started_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : `Still going · ${formatElapsed(workout.started_at)}`
              }
              metadata={`${workout.calories || 0} kcal`}
              secondaryMetadata={
                workout.ended_at
                  ? `${workout.exercises?.length || 0} exercises`
                  : `Started ${new Date(workout.started_at).toLocaleDateString(
                      'en-US',
                      {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      },
                    )}`
              }
              icon={workout.ended_at ? 'list-checks' : 'timer-reset'}
              iconColor={workout.ended_at ? '#10B981' : '#EF4444'}
              iconBg={
                workout.ended_at
                  ? 'rgba(16, 185, 129, 0.1)'
                  : 'rgba(239, 68, 68, 0.12)'
              }
              badge={workout.ended_at ? undefined : 'LIVE'}
              href={`/workout?workoutId=${workout._id}`}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false)
          setDeletingWorkoutId(null)
        }}
        onConfirm={confirmDelete}
        title='Delete Workout'
        message='Are you sure you want to delete this workout? This action cannot be undone.'
        confirmText='Delete'
        cancelText='Cancel'
        type='danger'
      />

      <WorkoutNameDialog
        isOpen={showWorkoutDialog}
        onClose={() => setShowWorkoutDialog(false)}
        onSubmit={handleStartWorkout}
        title='Start New Workout'
        placeholder='e.g., Leg Day, Push A'
      />
    </>
  )
}
