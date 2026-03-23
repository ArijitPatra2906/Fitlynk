'use client'

import { useState, useEffect } from 'react'
import { Icon } from '@/components/ui/icon'

interface Todo {
  _id: string
  title: string
  description?: string
  completed: boolean
  completed_at?: string
  due_date?: string
  reminder_time?: string
  priority?: 'low' | 'medium' | 'high'
  recurs_daily?: boolean
  created_at: string
  updated_at: string
}

interface TodoModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (todo: Partial<Todo>) => void
  todo?: Todo | null
  prefilledDueDate?: string | null
  saving?: boolean
}

export function TodoModal({ isOpen, onClose, onSave, todo, prefilledDueDate, saving = false }: TodoModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [dueDate, setDueDate] = useState('')
  const [reminderTime, setReminderTime] = useState('')
  const [recursDaily, setRecursDaily] = useState(false)

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date()
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  useEffect(() => {
    if (todo) {
      setTitle(todo.title)
      setDescription(todo.description || '')
      setPriority(todo.priority || 'medium')
      setDueDate(
        todo.due_date ? todo.due_date.split('T')[0] : ''
      )
      setReminderTime(todo.reminder_time || '')
      setRecursDaily(todo.recurs_daily || false)
    } else {
      setTitle('')
      setDescription('')
      setPriority('medium')
      setDueDate(prefilledDueDate || '')
      setReminderTime('')
      setRecursDaily(false)
    }
  }, [todo, isOpen, prefilledDueDate])

  const handleSave = () => {
    if (!title.trim()) return

    const todoData: Partial<Todo> = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      due_date: dueDate || undefined,
      reminder_time: reminderTime || undefined,
      recurs_daily: recursDaily,
    }

    onSave(todoData)
  }

  if (!isOpen) return null

  const priorityOptions = [
    {
      value: 'low',
      label: 'Low',
      color: '#10B981',
      bgClass: 'bg-green-500/10 border-green-500/30',
      textClass: 'text-green-400',
    },
    {
      value: 'medium',
      label: 'Medium',
      color: '#F59E0B',
      bgClass: 'bg-amber-500/10 border-amber-500/30',
      textClass: 'text-amber-400',
    },
    {
      value: 'high',
      label: 'High',
      color: '#EF4444',
      bgClass: 'bg-red-500/10 border-red-500/30',
      textClass: 'text-red-400',
    },
  ]

  return (
    <div className='fixed inset-0 z-50 flex items-end justify-center'>
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-black/60 backdrop-blur-sm'
        onClick={onClose}
      />

      {/* Modal */}
      <div className='relative w-full max-w-lg bg-[#131520] rounded-t-3xl border-t border-x border-white/10 shadow-2xl animate-slide-up pb-safe max-h-[90vh] overflow-y-auto'>
        {/* Handle */}
        <div className='flex justify-center pt-3 pb-2 sticky top-0 bg-[#131520] z-10'>
          <div className='w-10 h-1 bg-white/20 rounded-full' />
        </div>

        {/* Header */}
        <div className='px-6 pt-2 pb-4 border-b border-white/5 sticky top-9 bg-[#131520] z-10'>
          <div className='flex items-center justify-between'>
            <h2 className='text-[20px] font-bold text-white'>
              {todo ? 'Edit Todo' : 'New Todo'}
            </h2>
            <button
              onClick={onClose}
              className='w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center'
            >
              <Icon name='x' size={18} color='#64748B' />
            </button>
          </div>
          <p className='text-[13px] text-gray-400 mt-1'>
            {todo ? 'Update your todo details' : 'Create a new todo item'}
          </p>
        </div>

        {/* Content */}
        <div className='px-6 py-6'>
          {/* Title */}
          <div className='mb-5'>
            <label className='text-[12px] text-gray-400 font-semibold uppercase tracking-wide mb-2 block'>
              Title *
            </label>
            <input
              type='text'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className='w-full bg-[#1a1f35] border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] font-medium text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors'
              placeholder='Enter todo title'
              autoFocus
            />
          </div>

          {/* Description */}
          <div className='mb-5'>
            <label className='text-[12px] text-gray-400 font-semibold uppercase tracking-wide mb-2 block'>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className='w-full bg-[#1a1f35] border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] font-medium text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors resize-none'
              placeholder='Add details (optional)'
              rows={3}
            />
          </div>

          {/* Priority */}
          <div className='mb-5'>
            <label className='text-[12px] text-gray-400 font-semibold uppercase tracking-wide mb-2 block'>
              Priority
            </label>
            <div className='grid grid-cols-3 gap-2'>
              {priorityOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setPriority(option.value as 'low' | 'medium' | 'high')}
                  className={`py-3 rounded-xl text-[13px] font-semibold border transition-all ${
                    priority === option.value
                      ? `${option.bgClass} ${option.textClass}`
                      : 'bg-[#1a1f35] border-white/10 text-gray-400 hover:border-white/20'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Due Date */}
          <div className='mb-4'>
            <label className='text-[12px] text-gray-400 font-semibold uppercase tracking-wide mb-2 block'>
              Due Date
            </label>
            <div className='relative'>
              <input
                type='date'
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={minDate}
                className='w-full bg-[#1a1f35] border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] font-medium text-white focus:outline-none focus:border-blue-500/50 transition-colors'
              />
              <div className='absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none'>
                <Icon name='calendar' size={18} color='#64748B' />
              </div>
            </div>
            {dueDate && (
              <button
                type='button'
                onClick={() => setDueDate('')}
                className='mt-2.5 text-[12px] font-semibold text-red-400 hover:text-red-300 transition-colors flex items-center gap-1.5'
              >
                <Icon name='x' size={14} color='currentColor' />
                Clear date
              </button>
            )}
          </div>

          {/* Reminder Time */}
          <div className='mb-4'>
            <label className='text-[12px] text-gray-400 font-semibold uppercase tracking-wide mb-2 block'>
              Reminder Time
            </label>
            <div className='relative'>
              <input
                type='time'
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className='w-full bg-[#1a1f35] border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] font-medium text-white focus:outline-none focus:border-blue-500/50 transition-colors'
              />
              <div className='absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none'>
                <Icon name='clock' size={18} color='#64748B' />
              </div>
            </div>
            {reminderTime && (
              <button
                type='button'
                onClick={() => setReminderTime('')}
                className='mt-2.5 text-[12px] font-semibold text-red-400 hover:text-red-300 transition-colors flex items-center gap-1.5'
              >
                <Icon name='x' size={14} color='currentColor' />
                Clear time
              </button>
            )}
            <p className='text-[11px] text-gray-500 mt-2'>
              You'll receive a notification at this time
            </p>
          </div>

          {/* Repeat Daily Toggle */}
          <div className='mb-6'>
            <button
              type='button'
              onClick={() => setRecursDaily(!recursDaily)}
              className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                recursDaily
                  ? 'bg-blue-500/10 border-blue-500/30'
                  : 'bg-[#1a1f35] border-white/10'
              }`}
            >
              <div className='flex items-center gap-3'>
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    recursDaily ? 'bg-blue-500/20' : 'bg-white/5'
                  }`}
                >
                  <Icon
                    name='repeat'
                    size={18}
                    color={recursDaily ? '#60A5FA' : '#64748B'}
                  />
                </div>
                <div className='text-left'>
                  <div
                    className={`text-[14px] font-semibold ${
                      recursDaily ? 'text-blue-400' : 'text-white'
                    }`}
                  >
                    Repeat Daily
                  </div>
                  <div className='text-[11px] text-gray-400 mt-0.5'>
                    Automatically creates for every day
                  </div>
                </div>
              </div>
              <div
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  recursDaily ? 'bg-blue-500' : 'bg-white/10'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    recursDaily ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </div>
            </button>
          </div>

          {/* Action Buttons */}
          <div className='flex gap-3'>
            <button
              onClick={onClose}
              className='flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 text-[15px] font-semibold text-gray-300 hover:bg-white/10 transition-colors'
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim() || saving}
              className='flex-1 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl py-4 text-[15px] font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
            >
              {saving && (
                <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
              )}
              {saving ? 'Saving...' : (todo ? 'Update' : 'Create')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
