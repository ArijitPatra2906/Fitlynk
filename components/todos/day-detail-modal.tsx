'use client'

import { Icon } from '@/components/ui/icon'
import { TodoItem } from './todo-item'

interface Todo {
  _id: string
  title: string
  description?: string
  completed: boolean
  completed_at?: string
  due_date?: string
  priority?: 'low' | 'medium' | 'high'
  created_at: string
  updated_at: string
}

interface DayDetailModalProps {
  isOpen: boolean
  onClose: () => void
  date: Date | null
  todos: Todo[]
  onToggle: (id: string) => void
  onEdit: (todo: Todo) => void
  onDelete: (id: string) => void
  onAddNew: () => void
}

export function DayDetailModal({
  isOpen,
  onClose,
  date,
  todos,
  onToggle,
  onEdit,
  onDelete,
  onAddNew,
}: DayDetailModalProps) {
  if (!isOpen || !date) return null

  // Check if date is in the past
  const isPastDate = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)
    return checkDate < today
  }

  const formatDate = (date: Date) => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
    }
  }

  const activeTodos = todos.filter((t) => !t.completed)
  const completedTodos = todos.filter((t) => t.completed)

  return (
    <div className='fixed inset-0 z-50 flex items-end justify-center'>
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-black/60 backdrop-blur-sm'
        onClick={onClose}
      />

      {/* Modal */}
      <div className='relative w-full max-w-lg bg-[#131520] rounded-t-3xl border-t border-x border-white/10 shadow-2xl animate-slide-up pb-safe max-h-[85vh] flex flex-col'>
        {/* Handle */}
        <div className='flex justify-center pt-3 pb-2'>
          <div className='w-10 h-1 bg-white/20 rounded-full' />
        </div>

        {/* Header */}
        <div className='px-6 pt-2 pb-4 border-b border-white/5'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-[20px] font-bold text-white'>
                {formatDate(date)}
              </h2>
              <p className='text-[13px] text-gray-400 mt-1'>
                {todos.length} {todos.length === 1 ? 'todo' : 'todos'} for this day
              </p>
            </div>
            <button
              onClick={onClose}
              className='w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors'
            >
              <Icon name='x' size={18} color='#64748B' />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className='flex-1 overflow-y-auto px-6 py-4'>
          {todos.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12'>
              <div className='w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4'>
                <Icon name='calendar' size={28} color='#60A5FA' />
              </div>
              <div className='text-[16px] font-bold text-white mb-2'>
                No todos for this day
              </div>
              <div className='text-[13px] text-gray-400 mb-6'>
                {isPastDate() ? 'This date is in the past' : 'Add a new todo to get started'}
              </div>
              {!isPastDate() && (
                <button
                  onClick={onAddNew}
                  className='px-4 py-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[13px] font-semibold hover:bg-blue-500/30 transition-colors'
                >
                  Add Todo
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Active Todos */}
              {activeTodos.length > 0 && (
                <div className='mb-6'>
                  <div className='text-[14px] font-bold text-white mb-3 flex items-center gap-2'>
                    <Icon name='circle' size={14} color='#60A5FA' />
                    Active ({activeTodos.length})
                  </div>
                  <div className='space-y-2'>
                    {activeTodos.map((todo) => (
                      <TodoItem
                        key={todo._id}
                        todo={todo}
                        onToggle={onToggle}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Todos */}
              {completedTodos.length > 0 && (
                <div>
                  <div className='text-[14px] font-bold text-white mb-3 flex items-center gap-2'>
                    <Icon name='checkCircle' size={14} color='#10B981' />
                    Completed ({completedTodos.length})
                  </div>
                  <div className='space-y-2'>
                    {completedTodos.map((todo) => (
                      <TodoItem
                        key={todo._id}
                        todo={todo}
                        onToggle={onToggle}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {todos.length > 0 && !isPastDate() && (
          <div className='px-6 py-4 border-t border-white/5'>
            <button
              onClick={onAddNew}
              className='w-full py-3.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[14px] font-semibold hover:bg-blue-500/30 transition-colors flex items-center justify-center gap-2'
            >
              <Icon name='plus' size={16} color='currentColor' />
              Add Todo for This Day
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
