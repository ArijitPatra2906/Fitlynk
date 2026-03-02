'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAuthToken } from '@/lib/auth/auth-token'
import { apiClient } from '@/lib/api/client'
import { toast } from 'sonner'
import { ItemCard } from '@/components/common/item-card'
import { Skeleton } from '@/components/ui/skeleton'
import { Workout } from '@/types'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { FilterBar } from '@/components/common/filter-bar'
import { Pagination } from '@/components/ui/pagination'
import { WorkoutNameDialog } from '@/components/workout/workout-name-dialog'

const iconColors = ['#818CF8', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6']
const iconNames = ['layers-3', 'folder-kanban', 'clipboard-list', 'book-marked', 'target']

export default function TemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(
    null,
  )

  // Filter and pagination state
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchTemplates()
  }, [search, currentPage])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const token = await getAuthToken()
      if (!token) return

      const params = new URLSearchParams({
        is_template: 'true',
        page: currentPage.toString(),
        limit: '20',
      })

      if (search) params.append('search', search)

      const res = await apiClient.get(
        `/api/workouts?${params.toString()}`,
        token,
      )
      if (res.success && res.data?.workouts) {
        setTemplates(res.data.workouts)
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages)
          setTotal(res.data.pagination.total)
        }
      }
    } catch (err) {
      console.error('Error fetching templates:', err)
      toast.error('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/workout?workoutId=${id}&mode=template`)
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDeletingTemplateId(id)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!deletingTemplateId) return

    try {
      const token = await getAuthToken()
      if (!token) return

      const res = await apiClient.delete(
        `/api/workouts/${deletingTemplateId}`,
        token,
      )
      if (res.success) {
        setTemplates(templates.filter((t) => t._id !== deletingTemplateId))
        toast.success('Template deleted successfully')
      } else {
        toast.error('Failed to delete template')
      }
    } catch (err) {
      console.error('Error deleting template:', err)
      toast.error('Failed to delete template')
    } finally {
      setDeletingTemplateId(null)
    }
  }

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

  const handleCreateTemplate = (name: string) => {
    setShowTemplateDialog(false)
    router.push(`/workout?mode=template&name=${encodeURIComponent(name)}`)
  }

  if (loading) {
    return (
      <div className='px-6 pt-5 pb-4'>
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className='flex items-center gap-3.5 p-4 bg-[#131520] border border-white/5 rounded-2xl mb-2.5'
          >
            <Skeleton className='w-10 h-10 rounded-xl' />
            <div className='flex-1'>
              <Skeleton className='h-4 w-32 mb-2' />
              <Skeleton className='h-3 w-40' />
            </div>
            <div className='flex gap-1.5 flex-shrink-0'>
              <Skeleton className='w-8 h-8 rounded-lg' />
              <Skeleton className='w-8 h-8 rounded-lg' />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        placeholder='Search templates...'
        onAddClick={() => setShowTemplateDialog(true)}
        addButtonText='New'
      />

      <div className='px-6 pb-4'>
        {templates.length === 0 && !loading ? (
          <div className='bg-[#131520] border border-white/5 rounded-2xl p-6 text-center'>
            <div className='text-gray-400 text-sm mb-2'>No templates found</div>
            <div className='text-gray-500 text-xs'>
              Try adjusting your filters or create a new template
            </div>
          </div>
        ) : (
          templates.map((template, index) => {
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
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )
          })
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
          setDeletingTemplateId(null)
        }}
        onConfirm={confirmDelete}
        title='Delete Template'
        message='Are you sure you want to delete this template? This action cannot be undone.'
        confirmText='Delete'
        cancelText='Cancel'
        type='danger'
      />

      <WorkoutNameDialog
        isOpen={showTemplateDialog}
        onClose={() => setShowTemplateDialog(false)}
        onSubmit={handleCreateTemplate}
        title='Create Template'
        placeholder='e.g., Upper Body, Full Body'
      />
    </>
  )
}
