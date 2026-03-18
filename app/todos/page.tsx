'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Icon } from '@/components/ui/icon'
import { TodoItem } from '@/components/todos/todo-item'
import { TodoModal } from '@/components/todos/todo-modal'
import { CalendarView } from '@/components/todos/calendar-view'
import { DayDetailModal } from '@/components/todos/day-detail-modal'
import { TodosPageSkeleton } from '@/components/ui/skeleton'

interface Todo {
  _id: string
  title: string
  description?: string
  completed: boolean
  completed_at?: string
  due_date?: string
  priority?: 'low' | 'medium' | 'high'
  recurs_daily?: boolean
  created_at: string
  updated_at: string
}

type StatusFilter = 'all' | 'active' | 'completed'
type DateRangeFilter =
  | 'all'
  | 'today'
  | 'yesterday'
  | 'tomorrow'
  | '7days'
  | '1month'
  | '3months'
type ViewMode = 'list' | 'calendar'

function TodosPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [dateRange, setDateRange] = useState<DateRangeFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [isDayDetailOpen, setIsDayDetailOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [prefilledDueDate, setPrefilledDueDate] = useState<string | null>(null)

  const fetchTodos = useCallback(async () => {
    setLoading(true)
    try {
      const { getAuthToken } = await import('@/lib/auth/auth-token')
      const { apiClient } = await import('@/lib/api/client')
      const token = await getAuthToken()

      if (!token) {
        router.push('/login')
        return
      }

      let url = '/api/todos'
      const params: string[] = []

      if (dateRange !== 'all') {
        params.push(`dateRange=${dateRange}`)
      }

      if (statusFilter === 'active') {
        params.push('completed=false')
      } else if (statusFilter === 'completed') {
        params.push('completed=true')
      }

      if (searchQuery.trim()) {
        params.push(`search=${encodeURIComponent(searchQuery.trim())}`)
      }

      if (params.length > 0) {
        url += `?${params.join('&')}`
      }

      const response = await apiClient.get(url, token)

      if (response.success) {
        setTodos(response.data || [])
      }
    } catch (error) {
      console.error('Error fetching todos:', error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, dateRange, searchQuery, router])

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTodos()
    }, 300)

    return () => clearTimeout(timer)
  }, [fetchTodos])

  // Check for 'add' query parameter to open modal
  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      setEditingTodo(null)
      setPrefilledDueDate(null)
      setIsModalOpen(true)
      // Remove the query parameter
      router.replace('/todos', { scroll: false })
    }
  }, [searchParams, router])

  const handleToggleComplete = async (todoId: string) => {
    try {
      const { getAuthToken } = await import('@/lib/auth/auth-token')
      const { apiClient } = await import('@/lib/api/client')
      const token = await getAuthToken()

      if (!token) return

      const response = await apiClient.patch(
        `/api/todos/${todoId}/toggle`,
        {},
        token,
      )

      if (response.success) {
        setTodos((prev) =>
          prev.map((todo) =>
            todo._id === todoId
              ? {
                  ...todo,
                  completed: response.data.completed,
                  completed_at: response.data.completed_at,
                }
              : todo,
          ),
        )
      }
    } catch (error) {
      console.error('Error toggling todo:', error)
    }
  }

  const handleDelete = async (todoId: string) => {
    if (!confirm('Are you sure you want to delete this todo?')) return

    try {
      const { getAuthToken } = await import('@/lib/auth/auth-token')
      const { apiClient } = await import('@/lib/api/client')
      const token = await getAuthToken()

      if (!token) return

      const response = await apiClient.delete(`/api/todos/${todoId}`, token)

      if (response.success) {
        setTodos((prev) => prev.filter((todo) => todo._id !== todoId))
      }
    } catch (error) {
      console.error('Error deleting todo:', error)
    }
  }

  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo)
    setIsModalOpen(true)
  }

  const handleSave = async (todoData: Partial<Todo>) => {
    try {
      console.log('Saving todo with data:', todoData)
      const { getAuthToken } = await import('@/lib/auth/auth-token')
      const { apiClient } = await import('@/lib/api/client')
      const token = await getAuthToken()

      if (!token) return

      let response
      if (editingTodo) {
        // Update existing todo
        response = await apiClient.put(
          `/api/todos/${editingTodo._id}`,
          todoData,
          token,
        )
      } else {
        // Create new todo
        response = await apiClient.post('/api/todos', todoData, token)
      }

      console.log('Save response:', response)

      if (response.success) {
        await fetchTodos()
        setIsModalOpen(false)
        setEditingTodo(null)
      }
    } catch (error) {
      console.error('Error saving todo:', error)
    }
  }

  const handleAddNew = () => {
    setEditingTodo(null)
    setIsModalOpen(true)
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setIsDayDetailOpen(true)
  }

  const handleDayDetailAddNew = () => {
    setIsDayDetailOpen(false)

    // Format selected date as YYYY-MM-DD in local timezone
    let dueDateStr = ''
    if (selectedDate) {
      const year = selectedDate.getFullYear()
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
      const day = String(selectedDate.getDate()).padStart(2, '0')
      dueDateStr = `${year}-${month}-${day}`
    }

    setPrefilledDueDate(dueDateStr)
    setEditingTodo(null)
    setIsModalOpen(true)
  }

  const getTodosForDate = (date: Date) => {
    // Format the date as YYYY-MM-DD in local timezone
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`

    return todos.filter((todo) => {
      if (!todo.due_date) return false
      // Extract just the date part without timezone conversion
      const todoDateStr = todo.due_date.split('T')[0]
      return todoDateStr === dateStr
    })
  }

  const activeTodos = todos
    .filter((t: Todo) => !t.completed)
    .sort((a: Todo, b: Todo) => {
      // If both have due dates, sort by due date
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      }
      // If only one has a due date, prioritize it
      if (a.due_date) return -1
      if (b.due_date) return 1
      // If neither has a due date, sort by creation date (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const completedTodos = todos
    .filter((t: Todo) => t.completed)
    .sort((a: Todo, b: Todo) => {
      // Sort completed todos by completion date (newest first)
      if (a.completed_at && b.completed_at) {
        return (
          new Date(b.completed_at).getTime() -
          new Date(a.completed_at).getTime()
        )
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  return (
    <div className='relative h-full flex flex-col'>
      {/* Header with View Toggle */}
      <div className='px-4 pt-4 pb-3 border-b border-white/5'>
        <div className='flex items-center justify-between'>
          <button
            onClick={handleAddNew}
            className='px-3 py-1.5 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white text-[13px] font-semibold flex items-center gap-1.5 shadow-lg shadow-blue-500/25 active:scale-95 transition-transform'
          >
            <Icon name='plus' size={14} color='white' strokeWidth={2.5} />
            Add
          </button>
          <div className='flex gap-1 bg-[#1a1f35] border border-white/10 rounded-lg p-0.5'>
            <button
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-gray-400'
              }`}
            >
              <Icon
                name='list'
                size={13}
                color='currentColor'
                className='inline mr-1'
              />
              List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                viewMode === 'calendar'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-gray-400'
              }`}
            >
              <Icon
                name='calendar'
                size={13}
                color='currentColor'
                className='inline mr-1'
              />
              Calendar
            </button>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' ? (
        <CalendarView
          todos={todos}
          onTodoClick={handleEdit}
          onDateClick={handleDateClick}
        />
      ) : (
        <>
          {/* Search and Filters */}
          <div className='px-4 py-2 border-b border-white/5'>
            {/* Filters Row */}
            <div className='flex gap-3 items-center justify-end'>
              {/* Search Bar */}
              <div className='flex-1 relative'>
                <input
                  type='text'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder='Search todos...'
                  className='w-full bg-[#1a1f35] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-[12px] text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors'
                />
                <div className='absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none'>
                  <Icon name='search' size={14} color='#9CA3AF' />
                </div>
              </div>

              {/* Period Filter */}
              <div className='flex flex-col items-center gap-1.5'>
                <div className='relative'>
                  <select
                    value={dateRange}
                    onChange={(e) =>
                      setDateRange(e.target.value as DateRangeFilter)
                    }
                    className='appearance-none bg-[#1a1f35] border border-white/10 rounded-lg px-2.5 py-1.5 pr-7 text-[11px] font-semibold text-white focus:outline-none focus:border-blue-500/50 transition-colors cursor-pointer'
                  >
                    <option value='all'>All Time</option>
                    <option value='today'>Today</option>
                    <option value='tomorrow'>Tomorrow</option>
                    <option value='yesterday'>Yesterday</option>
                    <option value='7days'>Last 7 Days</option>
                    <option value='1month'>Last Month</option>
                    <option value='3months'>Last 3 Months</option>
                  </select>
                  <div className='absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none'>
                    <Icon name='chevronDown' size={11} color='#9CA3AF' />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className='flex-1 overflow-y-auto pb-28'>
            {loading ? (
              <TodosPageSkeleton />
            ) : todos.length === 0 ? (
              <div className='px-4 pt-3'>
                <div className='flex flex-col items-center justify-center py-10'>
                  <div className='w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3'>
                    <Icon name='checkSquare' size={22} color='#60A5FA' />
                  </div>
                  <div className='text-[16px] font-bold text-white mb-1'>
                    No todos found
                  </div>
                  <div className='text-[13px] text-gray-400'>
                    {statusFilter === 'all'
                      ? 'Tap Add to create your first todo'
                      : statusFilter === 'active'
                      ? 'No active todos!'
                      : 'No completed todos yet'}
                  </div>
                </div>
              </div>
            ) : (
              <div className='px-4 pt-3'>
                {/* Active Todos */}
                {statusFilter !== 'completed' && activeTodos.length > 0 && (
                  <div className='mb-4'>
                    <div className='text-[11px] font-bold text-gray-400 mb-2 flex items-center gap-1.5 uppercase tracking-wide'>
                      <div className='w-1 h-1 rounded-full bg-blue-500' />
                      Active ({activeTodos.length})
                    </div>
                    <div className='space-y-2'>
                      {activeTodos.map((todo: Todo) => (
                        <TodoItem
                          key={todo._id}
                          todo={todo}
                          onToggle={handleToggleComplete}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed Todos */}
                {statusFilter !== 'active' && completedTodos.length > 0 && (
                  <div>
                    <div className='text-[11px] font-bold text-gray-400 mb-2 flex items-center gap-1.5 uppercase tracking-wide'>
                      <div className='w-1 h-1 rounded-full bg-green-500' />
                      Completed ({completedTodos.length})
                    </div>
                    <div className='space-y-2'>
                      {completedTodos.map((todo: Todo) => (
                        <TodoItem
                          key={todo._id}
                          todo={todo}
                          onToggle={handleToggleComplete}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Day Detail Modal */}
      <DayDetailModal
        isOpen={isDayDetailOpen}
        onClose={() => setIsDayDetailOpen(false)}
        date={selectedDate}
        todos={selectedDate ? getTodosForDate(selectedDate) : []}
        onToggle={handleToggleComplete}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAddNew={handleDayDetailAddNew}
      />

      {/* Todo Modal */}
      <TodoModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingTodo(null)
          setPrefilledDueDate(null)
        }}
        onSave={handleSave}
        todo={editingTodo}
        prefilledDueDate={prefilledDueDate}
      />
    </div>
  )
}

export default function TodosPage() {
  return (
    <Suspense fallback={<TodosPageSkeleton />}>
      <TodosPageContent />
    </Suspense>
  )
}
