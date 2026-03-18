'use client'

import { useState } from 'react'
import { Icon } from '@/components/ui/icon'

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

interface CalendarViewProps {
  todos: Todo[]
  onTodoClick: (todo: Todo) => void
  onDateClick: (date: Date) => void
}

export function CalendarView({
  todos,
  onTodoClick,
  onDateClick,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const getMonthDays = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDayOfWeek = firstDay.getDay()

    return { daysInMonth, startDayOfWeek, firstDay, lastDay }
  }

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const { daysInMonth, startDayOfWeek } = getMonthDays(year, month)

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
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

  const isToday = (day: number) => {
    const today = new Date()
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    )
  }

  const isPast = (day: number) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkDate = new Date(year, month, day)
    return checkDate < today
  }

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const calendarDays = []

  // Add empty cells for days before month starts
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(null)
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  const priorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return '#EF4444'
      case 'medium':
        return '#F59E0B'
      case 'low':
        return '#10B981'
      default:
        return '#60A5FA'
    }
  }

  return (
    <div className='flex flex-col h-full'>
      {/* Calendar Header */}
      <div className='px-6 pt-5 pb-4 border-b border-white/5'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-[20px] font-bold text-white'>
            {monthNames[month]} {year}
          </h2>
          <button
            onClick={goToToday}
            className='px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors'
          >
            Today
          </button>
        </div>

        <div className='flex items-center justify-between'>
          <button
            onClick={previousMonth}
            className='w-9 h-9 rounded-xl bg-[#1a1f35] border border-white/10 flex items-center justify-center hover:border-blue-500/30 transition-colors'
          >
            <Icon name='chevronLeft' size={16} color='#9CA3AF' />
          </button>

          <div className='text-[13px] text-gray-400 font-medium'>
            {
              todos.filter((t) => {
                if (!t.due_date) return false
                const todoDate = new Date(t.due_date)
                return (
                  todoDate.getMonth() === month &&
                  todoDate.getFullYear() === year
                )
              }).length
            }{' '}
            todos this month
          </div>

          <button
            onClick={nextMonth}
            className='w-9 h-9 rounded-xl bg-[#1a1f35] border border-white/10 flex items-center justify-center hover:border-blue-500/30 transition-colors'
          >
            <Icon name='chevronRight' size={16} color='#9CA3AF' />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className='flex-1 overflow-y-auto px-6 pt-4 pb-28'>
        {/* Day Names */}
        <div className='grid grid-cols-7 gap-1 mb-2'>
          {dayNames.map((day) => (
            <div
              key={day}
              className='text-center text-[11px] font-semibold text-gray-500 uppercase py-2'
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className='grid grid-cols-7 gap-1'>
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className='aspect-square' />
            }

            const date = new Date(year, month, day)
            const dayTodos = getTodosForDate(date)
            const isCurrentDay = isToday(day)
            const isPastDay = isPast(day)

            return (
              <button
                key={day}
                onClick={() => onDateClick(date)}
                className={`aspect-square rounded-xl border transition-all relative ${
                  isCurrentDay
                    ? 'bg-blue-500/20 border-blue-500/40 ring-2 ring-blue-500/30'
                    : isPastDay
                    ? 'bg-[#0B0D17] border-white/5 cursor-not-allowed'
                    : 'bg-[#131520] border-white/10 hover:border-blue-500/30 cursor-pointer'
                }`}
              >
                <div className='h-full flex flex-col items-center justify-start p-1.5 gap-1'>
                  <div
                    className={`text-[13px] font-semibold ${
                      isCurrentDay
                        ? 'text-blue-400'
                        : isPastDay
                        ? 'text-gray-600'
                        : 'text-white'
                    }`}
                  >
                    {day}
                  </div>

                  {/* Todo Indicators */}
                  {dayTodos.length > 0 && (
                    <div className='w-full mt-auto mb-0.5'>
                      <div
                        className={`h-1 w-full rounded-full ${
                          dayTodos[0].completed ? 'opacity-40' : ''
                        }`}
                        style={{
                          backgroundColor: priorityColor(dayTodos[0].priority),
                        }}
                      />
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className='mt-6 p-4 bg-[#131520] border border-white/10 rounded-2xl'>
          <div className='text-[12px] font-semibold text-white mb-3'>
            Priority Legend
          </div>
          <div className='grid grid-cols-3 gap-3'>
            <div className='flex items-center gap-2'>
              <div className='w-3 h-3 rounded-full bg-red-500' />
              <span className='text-[11px] text-gray-400'>High</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-3 h-3 rounded-full bg-amber-500' />
              <span className='text-[11px] text-gray-400'>Medium</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-3 h-3 rounded-full bg-green-500' />
              <span className='text-[11px] text-gray-400'>Low</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
