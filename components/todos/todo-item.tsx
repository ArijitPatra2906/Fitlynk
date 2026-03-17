'use client'

import { Icon } from '@/components/ui/icon'
import { useState } from 'react'

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

interface TodoItemProps {
  todo: Todo
  onToggle: (id: string) => void
  onEdit: (todo: Todo) => void
  onDelete: (id: string) => void
}

export function TodoItem({ todo, onToggle, onEdit, onDelete }: TodoItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const priorityColors = {
    low: '#10B981',
    medium: '#F59E0B',
    high: '#EF4444',
  }

  const priorityBgColors = {
    low: 'bg-green-500/10 border-green-500/20',
    medium: 'bg-amber-500/10 border-amber-500/20',
    high: 'bg-red-500/10 border-red-500/20',
  }

  const priorityTextColors = {
    low: 'text-green-400',
    medium: 'text-amber-400',
    high: 'text-red-400',
  }

  const priority = todo.priority || 'medium'

  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return 'Overdue'
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays <= 7) return `In ${diffDays} days`

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div
      className={`bg-[#131520] border rounded-xl overflow-hidden transition-all ${
        todo.completed ? 'border-white/5 opacity-60' : 'border-white/10'
      }`}
    >
      <div className='p-3'>
        <div className='flex items-start gap-2.5'>
          {/* Checkbox */}
          <button
            onClick={() => onToggle(todo._id)}
            className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all mt-0.5 ${
              todo.completed
                ? 'bg-green-500/20 border-green-500'
                : 'border-white/20 active:border-blue-500/50'
            }`}
          >
            {todo.completed && <Icon name='check' size={12} color='#10B981' strokeWidth={3} />}
          </button>

          {/* Content */}
          <div className='flex-1 min-w-0'>
            <div
              className={`text-[14px] font-semibold mb-1 leading-tight ${
                todo.completed ? 'text-gray-500 line-through' : 'text-white'
              }`}
            >
              {todo.title}
            </div>

            {todo.description && (
              <div
                className={`text-[12px] mb-2 leading-snug ${
                  todo.completed ? 'text-gray-600' : 'text-gray-400'
                } ${isExpanded ? '' : 'line-clamp-2'}`}
              >
                {todo.description}
              </div>
            )}

            {/* Meta Info */}
            <div className='flex items-center gap-1.5 flex-wrap'>
              {/* Priority Indicator */}
              <div
                className='w-1.5 h-1.5 rounded-full'
                style={{ backgroundColor: priorityColors[priority] }}
              />
              <span className={`text-[10px] font-semibold ${priorityTextColors[priority]}`}>
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </span>

              {/* Due Date */}
              {todo.due_date && (
                <>
                  <span className='text-gray-600'>•</span>
                  <div className='text-[10px] font-medium text-purple-400 flex items-center gap-1'>
                    <Icon name='calendar' size={9} color='#C084FC' />
                    {formatDate(todo.due_date)}
                  </div>
                </>
              )}

              {/* Recurring Indicator */}
              {todo.recurs_daily && (
                <>
                  <span className='text-gray-600'>•</span>
                  <div className='text-[10px] font-medium text-blue-400 flex items-center gap-1'>
                    <Icon name='repeat' size={9} color='#60A5FA' />
                    Daily
                  </div>
                </>
              )}

              {/* Completed Date */}
              {todo.completed && todo.completed_at && (
                <>
                  <span className='text-gray-700'>•</span>
                  <div className='text-[10px] text-gray-500 font-medium'>
                    Done {new Date(todo.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </>
              )}
            </div>

            {/* Expand/Collapse for long descriptions */}
            {todo.description && todo.description.length > 100 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className='text-[11px] text-blue-400 mt-1.5 font-medium active:text-blue-300'
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>

          {/* Actions */}
          <div className='flex gap-1.5 flex-shrink-0'>
            <button
              onClick={() => onEdit(todo)}
              className='w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center active:bg-blue-500/20 transition-colors'
            >
              <Icon name='edit' size={13} color='#60A5FA' />
            </button>
            <button
              onClick={() => onDelete(todo._id)}
              className='w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center active:bg-red-500/20 transition-colors'
            >
              <Icon name='trash' size={13} color='#EF4444' />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
