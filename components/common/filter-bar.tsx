'use client'

import { Icon } from '@/components/ui/icon'
import { useState, useEffect } from 'react'

interface FilterOption {
  label: string
  value: string
}

interface FilterBarFilter {
  label: string
  options: FilterOption[]
  value: string
  onChange: (value: string) => void
  type?: 'tabs' | 'dropdown'
}

interface FilterBarProps {
  searchValue: string
  onSearchChange: (value: string) => void
  filters?: FilterBarFilter[]
  onAddClick?: () => void
  addButtonText?: string
  placeholder?: string
}

export function FilterBar({
  searchValue,
  onSearchChange,
  filters,
  onAddClick,
  addButtonText = 'Add',
  placeholder = 'Search...',
}: FilterBarProps) {
  const [localSearch, setLocalSearch] = useState(searchValue)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearch)
    }, 300)

    return () => clearTimeout(timer)
  }, [localSearch, onSearchChange])

  return (
    <div className='px-6 pt-4 pb-3 space-y-3'>
      {/* Search and Add Button */}
      <div className='flex gap-2'>
        <div className='relative flex-1'>
          <input
            type='text'
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder={placeholder}
            className='w-full px-4 py-2.5 pl-10 bg-[#131520] border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500/50'
          />
          <Icon
            name='search'
            size={16}
            color='#64748B'
            className='absolute left-3 top-1/2 -translate-y-1/2'
          />
        </div>
        {onAddClick && (
          <button
            onClick={onAddClick}
            className='px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors flex items-center gap-2'
          >
            <Icon name='plus' size={16} color='#FFFFFF' />
            {addButtonText}
          </button>
        )}
      </div>

      {/* Filters */}
      {filters && filters.length > 0 && (
        <div className='flex gap-3 flex-wrap'>
          {filters.map((filter, index) => (
            <div key={index} className='w-full'>
              {filter.type === 'dropdown' ? (
                <div className='flex flex-col gap-1 w-full'>
                  <span className='text-xs text-gray-400'>{filter.label}</span>
                  <select
                    value={filter.value}
                    onChange={(e) => filter.onChange(e.target.value)}
                    className='bg-[#131520] border border-white/10 text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500/50'
                  >
                    {filter.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className=''>
                  <span className='text-xs text-gray-400'>{filter.label}</span>
                  <div className='flex gap-2 overflow-x-auto pb-1'>
                    {filter.options.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => filter.onChange(option.value)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                          filter.value === option.value
                            ? 'bg-blue-500 text-white'
                            : 'bg-[#131520] text-gray-400 border border-white/10 hover:bg-[#1a1f35]'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
