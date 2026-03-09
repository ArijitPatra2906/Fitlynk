'use client'

import { useState, useEffect } from 'react'
import { Icon } from '@/components/ui/icon'
import { getAuthToken } from '@/lib/auth/auth-token'
import { apiClient } from '@/lib/api/client'
import { Food } from '@/types/nutrition'
import { toast } from 'sonner'

// Category icons and colors
const categoryInfo: Record<
  string,
  { icon: string; color: string; bg: string }
> = {
  fruit: { icon: 'apple', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
  vegetable: { icon: 'carrot', color: '#22C55E', bg: 'rgba(34, 197, 94, 0.1)' },
  grain: { icon: 'wheat', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
  protein: { icon: 'beef', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' },
  dairy: { icon: 'milk', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' },
  snack: { icon: 'cookie', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },
  sweet: { icon: 'candy', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.1)' },
  meal: { icon: 'utensils', color: '#F97316', bg: 'rgba(249, 115, 22, 0.1)' },
  street_food: {
    icon: 'store',
    color: '#EAB308',
    bg: 'rgba(234, 179, 8, 0.1)',
  },
  restaurant: {
    icon: 'utensils-crossed',
    color: '#DC2626',
    bg: 'rgba(220, 38, 38, 0.1)',
  },
  supplement: { icon: 'pill', color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.1)' },
  packaged: {
    icon: 'package',
    color: '#64748B',
    bg: 'rgba(100, 116, 139, 0.1)',
  },
  ingredient: { icon: 'egg', color: '#78716C', bg: 'rgba(120, 113, 108, 0.1)' },
}

// Source labels
const sourceLabels: Record<string, string> = {
  usda: 'USDA',
  indian_db: 'Indian DB',
  bengali_db: 'Bengali DB',
  open_food_facts: 'Open Food Facts',
  restaurant: 'Restaurant',
  supplement: 'Supplement',
  packaged: 'Packaged',
  street_food: 'Street Food',
  custom: 'Custom',
}

// Popular search tags
const popularTags = [
  { label: 'Favourites', emoji: '⭐' },
  { label: 'Recent', emoji: '🕒' },
  { label: 'Breakfast', emoji: '🥣' },
  { label: 'Proteins', emoji: '🍗' },
]

export default function FoodSearchPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [foods, setFoods] = useState<Food[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  // Search foods when query changes
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim()) {
        searchFoods(searchQuery)
      } else {
        // Load popular foods when no search query
        searchFoods('')
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

  const searchFoods = async (query: string) => {
    try {
      setLoading(true)
      const token = await getAuthToken()
      if (!token) return

      const params = new URLSearchParams()
      if (query) params.append('query', query)
      params.append('limit', '20')

      const res = await apiClient.get(
        `/api/nutrition/foods/search?${params.toString()}`,
        token,
      )

      if (res.success && res.data) {
        setFoods(res.data)
      }
    } catch (err) {
      console.error('Error searching foods:', err)
      toast.error('Failed to search foods')
    } finally {
      setLoading(false)
    }
  }

  const handleTagClick = (tag: string) => {
    setSelectedTag(tag)
    // Filter by tag - in a real app, this would be an API call
    if (tag === 'Proteins') {
      searchFoods('chicken protein egg')
    } else if (tag === 'Breakfast') {
      searchFoods('egg bread rice')
    } else if (tag === 'Recent') {
      // Show all foods for recent
      searchFoods('')
    }
  }

  const handleAddFood = (food: Food) => {
    // TODO: Implement add to meal log functionality
    toast.success(`Added ${food.name} to your meal`)
  }

  return (
    <div>
      {/* Search Bar */}
      <div className='px-6 pt-3 pb-3 bg-[#0B0D17] border-b border-white/5'>
        <div className='relative'>
          <div className='flex items-center gap-2.5 bg-[#131520] border border-blue-500/30 rounded-2xl py-3 px-3.5'>
            <Icon name='search' size={16} color='#3B82F6' />
            <input
              type='text'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Search food or scan barcode…'
              className='flex-1 bg-transparent text-white text-sm placeholder-gray-500 focus:outline-none'
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className='text-gray-500 hover:text-white'
              >
                <Icon name='x' size={14} color='#64748B' />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div>
        {/* Tags */}
        <div className='px-6 pt-4 pb-2'>
          <div className='flex gap-2 overflow-x-auto pb-1'>
            {popularTags.map((tag) => (
              <button
                key={tag.label}
                onClick={() => handleTagClick(tag.label)}
                className={`flex-shrink-0 py-1.5 px-3.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-colors ${
                  selectedTag === tag.label
                    ? 'bg-blue-500/20 border border-blue-500/40 text-blue-500'
                    : 'bg-[#131520] border border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                {tag.emoji} {tag.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className='px-6 pb-4'>
          <div className='text-[12px] text-gray-400 font-semibold mb-2.5 pt-1'>
            {loading ? 'Searching...' : 'SEARCH RESULTS'} — per 100g
          </div>

          {loading ? (
            // Loading skeletons
            [...Array(5)].map((_, i) => (
              <div
                key={i}
                className='bg-[#131520] border border-white/5 rounded-2xl p-3.5 mb-2 animate-pulse'
              >
                <div className='flex items-start gap-3'>
                  <div className='w-10 h-10 rounded-xl bg-white/5' />
                  <div className='flex-1'>
                    <div className='h-4 w-32 bg-white/5 rounded mb-2' />
                    <div className='h-3 w-24 bg-white/5 rounded mb-2' />
                    <div className='flex gap-2'>
                      <div className='h-3 w-12 bg-white/5 rounded' />
                      <div className='h-3 w-12 bg-white/5 rounded' />
                      <div className='h-3 w-12 bg-white/5 rounded' />
                      <div className='h-3 w-12 bg-white/5 rounded' />
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : foods.length === 0 ? (
            // Empty state
            <div className='bg-[#131520] border border-white/5 rounded-2xl p-6 text-center'>
              <div className='text-[color:var(--app-text-muted)] text-sm mb-2'>
                No foods found
              </div>
              <div className='text-[color:var(--app-text-muted)] text-xs'>
                Try a different search term
              </div>
            </div>
          ) : (
            // Food list
            foods.map((food) => {
              const catInfo =
                categoryInfo[food.category || 'ingredient'] ||
                categoryInfo.ingredient
              return (
                <div
                  key={food._id}
                  className='bg-[#131520] border border-white/5 rounded-2xl p-3.5 mb-2 hover:border-blue-500/20 transition-colors cursor-pointer'
                  onClick={() => handleAddFood(food)}
                >
                  <div className='flex items-start gap-3'>
                    {/* Category Icon */}
                    <div
                      className='w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0'
                      style={{ backgroundColor: catInfo.bg }}
                    >
                      <Icon
                        name={catInfo.icon}
                        size={18}
                        color={catInfo.color}
                      />
                    </div>

                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 mb-0.5'>
                        <div className='text-[14px] font-semibold text-white truncate'>
                          {food.name}
                        </div>
                        {/* Category Badge */}
                        {food.category && (
                          <span
                            className='px-2 py-0.5 rounded text-[10px] font-semibold flex-shrink-0'
                            style={{
                              backgroundColor: catInfo.bg,
                              color: catInfo.color,
                            }}
                          >
                            {food.category}
                          </span>
                        )}
                        {/* Local badge */}
                        {food.isLocal && (
                          <span className='px-2 py-0.5 rounded text-[10px] font-semibold bg-green-500/10 text-green-400 flex-shrink-0'>
                            Local
                          </span>
                        )}
                      </div>
                      <div className='text-[11px] text-gray-600 mb-1.5'>
                        {food.brand || 'Generic'} •{' '}
                        {sourceLabels[food.source] || food.source}
                        {food.region &&
                          food.region !== 'global' &&
                          ` • ${food.region.charAt(0).toUpperCase() + food.region.slice(1)}`}
                      </div>
                      <div className='flex gap-2 mb-2'>
                        {[
                          ['cal', food.calories_per_100g, '#F59E0B'],
                          ['P', food.protein_per_100g + 'g', '#10B981'],
                          ['C', food.carbs_per_100g + 'g', '#3B82F6'],
                          ['F', food.fat_per_100g + 'g', '#EF4444'],
                        ].map(([label, value, color]) => (
                          <div
                            key={label as string}
                            className='text-[10px] font-bold'
                          >
                            <span style={{ color: color as string }}>
                              {label}{' '}
                            </span>
                            <span className='text-gray-300'>{value}</span>
                          </div>
                        ))}
                      </div>
                      {/* Serving Sizes */}
                      {food.serving_sizes && food.serving_sizes.length > 0 && (
                        <div className='flex flex-wrap gap-1.5'>
                          {food.serving_sizes
                            .slice(0, 4)
                            .map((serving, idx) => (
                              <span
                                key={idx}
                                className='px-2 py-1 bg-white/5 rounded text-[10px] text-gray-400'
                              >
                                {serving.label || `${serving.grams}g`}
                              </span>
                            ))}
                          {food.serving_sizes.length > 4 && (
                            <span className='px-2 py-1 text-[10px] text-gray-500'>
                              +{food.serving_sizes.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <button className='w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0 mt-1 hover:bg-blue-500/25 transition-colors'>
                      <Icon
                        name='plus'
                        size={16}
                        color='#3B82F6'
                        strokeWidth={2.5}
                      />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
