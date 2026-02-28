'use client'

import { useState, useEffect } from 'react'
import { Icon } from '@/components/ui/icon'
import { ProgressRing } from '@/components/ui/progress-ring'
import { MacroPill } from '@/components/ui/macro-pill'
import { StepModal } from '@/components/dashboard/step-modal'
import { stepTracker } from '@/lib/services/step-tracker'
import Link from 'next/link'

interface DailyNutrition {
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface Goals {
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface RecentActivity {
  type: 'meal' | 'workout'
  name: string
  description: string
  calories: number
  timestamp: string
}

export default function DashboardPage() {
  const [fabOpen, setFabOpen] = useState(false)
  const [stepModalOpen, setStepModalOpen] = useState(false)
  const [dailySteps, setDailySteps] = useState(0)
  const stepGoal = 10000

  // Dynamic data states
  const [nutrition, setNutrition] = useState<DailyNutrition>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  })
  const [goals, setGoals] = useState<Goals>({
    calories: 2400,
    protein: 180,
    carbs: 280,
    fat: 80,
  })
  const [waterIntake, setWaterIntake] = useState(0)
  const [streak, setStreak] = useState(0)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const today = new Date().toISOString().split('T')[0]

        // Get auth token
        const { getAuthToken } = await import('@/lib/auth/auth-token')
        const { apiClient } = await import('@/lib/api/client')
        const token = await getAuthToken()

        if (!token) {
          console.error('No auth token found')
          return
        }

        // Fetch today's meals and calculate nutrition
        const mealsRes = await apiClient.get(
          `/api/nutrition/meals?date=${today}`,
          token,
        )
        if (mealsRes.success) {
          const meals = mealsRes.data || []

          // Calculate daily totals
          const dailyNutrition = meals.reduce(
            (acc: DailyNutrition, meal: any) => {
              meal.items.forEach((item: any) => {
                acc.calories += item.calories || 0
                acc.protein += item.protein_g || 0
                acc.carbs += item.carbs_g || 0
                acc.fat += item.fat_g || 0
              })
              return acc
            },
            { calories: 0, protein: 0, carbs: 0, fat: 0 },
          )

          setNutrition(dailyNutrition)
        }

        // Fetch current goals
        const goalsRes = await apiClient.get(
          '/api/metrics/goals/current',
          token,
        )

        if (goalsRes.success && goalsRes.data) {
          setGoals({
            calories: goalsRes.data.calorie_target || 2400,
            protein: goalsRes.data.protein_g || 180,
            carbs: goalsRes.data.carbs_g || 280,
            fat: goalsRes.data.fat_g || 80,
          })
        }

        // Fetch water intake
        const waterRes = await apiClient.get(
          `/api/metrics/water?date=${today}`,
          token,
        )
        if (waterRes.success) {
          const waterData = waterRes.data || {}
          setWaterIntake(waterData.total_ml || 0)
        }

        // Fetch recent workouts for streak calculation
        const workoutsRes = await apiClient.get('/api/workouts?limit=30', token)
        if (workoutsRes.success) {
          const workouts = workoutsRes.data?.workouts || []

          // Calculate streak (consecutive days with workouts)
          const calculatedStreak = calculateStreak(workouts)
          setStreak(calculatedStreak)
        }

        // Fetch recent activity (last 3 meals + workouts)
        const recentMealsRes = await apiClient.get(
          `/api/nutrition/meals?limit=5`,
          token,
        )
        const recentWorkoutsRes = await apiClient.get(
          `/api/workouts?limit=5&is_template=false`,
          token,
        )

        const activities: RecentActivity[] = []

        if (recentMealsRes.success) {
          const meals = recentMealsRes.data || []
          meals.forEach((meal: any) => {
            const totalCal =
              meal.items?.reduce(
                (sum: number, item: any) => sum + (item.calories || 0),
                0,
              ) ||
              meal.calories ||
              0
            const itemNames =
              meal.items
                ?.slice(0, 2)
                .map((item: any) => item.food_name)
                .join(', ') || 'Meal'
            activities.push({
              type: 'meal',
              name:
                meal.meal_type.charAt(0).toUpperCase() +
                meal.meal_type.slice(1),
              description: itemNames,
              calories: totalCal,
              timestamp: meal.date,
            })
          })
        }

        if (recentWorkoutsRes.success) {
          const workouts = recentWorkoutsRes.data?.workouts || []
          workouts.forEach((workout: any) => {
            const exerciseNames = workout.exercises
              .slice(0, 3)
              .map((e: any) => e.exercise_id?.name || 'Exercise')
              .join(' · ')
            const totalVolume = workout.exercises.reduce(
              (sum: number, e: any) => {
                return (
                  sum +
                  e.sets.reduce(
                    (s: number, set: any) =>
                      s + (set.weight_kg || 0) * (set.reps || 0),
                    0,
                  )
                )
              },
              0,
            )
            activities.push({
              type: 'workout',
              name: workout.name,
              description: exerciseNames,
              calories: Math.round(totalVolume * 0.05), // Rough estimate
              timestamp: workout.ended_at,
            })
          })
        }

        // Sort by timestamp and take latest 3
        activities.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )
        setRecentActivity(activities.slice(0, 3))
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // Calculate workout streak
  const calculateStreak = (workouts: any[]) => {
    if (workouts.length === 0) return 0

    // Sort by date descending
    const sorted = [...workouts].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )

    let streak = 0
    let currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)

    for (const workout of sorted) {
      const workoutDate = new Date(workout.date)
      workoutDate.setHours(0, 0, 0, 0)

      const daysDiff = Math.floor(
        (currentDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24),
      )

      if (daysDiff === streak) {
        streak++
      } else if (daysDiff > streak) {
        break
      }
    }

    return streak
  }

  // Format time ago
  const formatTimeAgo = (timestamp: string) => {
    console.log('[Dashboard] formatTimeAgo:', timestamp)
    const now = new Date()
    const then = new Date(timestamp)
    const diffMs = now.getTime() - then.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes === 1) return '1m ago'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffHours === 1) return '1h ago'
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) return '1 day ago'
    return `${diffDays} days ago`
  }

  useEffect(() => {
    // Initialize step tracking when component mounts
    const initStepTracking = async () => {
      console.log('[Dashboard] Checking if step tracker is supported...')
      console.log('[Dashboard] isSupported:', stepTracker.isSupported())

      if (stepTracker.isSupported()) {
        try {
          console.log('[Dashboard] Requesting permissions...')
          // Request permissions
          const hasPermission = await stepTracker.requestPermissions()
          console.log('[Dashboard] Permission granted:', hasPermission)

          if (hasPermission) {
            console.log("[Dashboard] Getting today's steps...")
            // Get today's steps
            const steps = await stepTracker.getTodaySteps()
            console.log('[Dashboard] Steps fetched:', steps)
            setDailySteps(steps)

            console.log('[Dashboard] Starting real-time tracking...')
            // Start real-time tracking
            await stepTracker.startTracking((updatedSteps) => {
              console.log('[Dashboard] Step update received:', updatedSteps)
              setDailySteps(updatedSteps)
            })
            console.log('[Dashboard] Real-time tracking started')
          } else {
            console.log('[Dashboard] Permission denied')
          }
        } catch (error) {
          console.error('[Dashboard] Error initializing step tracking:', error)
        }
      } else {
        console.log('[Dashboard] Step tracker not supported on this platform')
      }
    }

    initStepTracking()

    // Cleanup on unmount
    return () => {
      console.log('[Dashboard] Cleaning up step tracker...')
      stepTracker.stopTracking()
    }
  }, [])

  return (
    <div className='relative h-full'>
      {/* Scrollable Content */}
      <div className='h-full overflow-y-auto px-6 pt-5 pb-4'>
        {/* Calorie Card */}
        <div className='bg-gradient-to-br from-[#1a1f35] to-[#0d1b3e] border border-blue-500/20 rounded-3xl p-5 mb-4'>
          <div className='flex items-center justify-between mb-4'>
            <div>
              <div className='text-[11px] text-gray-400 uppercase tracking-wider mb-1'>
                Today's Calories
              </div>
              <div className='text-[30px] font-extrabold text-white tracking-tight leading-none'>
                {loading
                  ? '...'
                  : Math.round(nutrition.calories).toLocaleString()}
              </div>
              <div className='text-[13px] text-gray-400'>
                of {goals.calories.toLocaleString()} kcal
              </div>
            </div>
            <ProgressRing
              percent={
                goals.calories > 0
                  ? Math.round((nutrition.calories / goals.calories) * 100)
                  : 0
              }
              size={88}
              stroke={7}
              color='#3B82F6'
              label={`${goals.calories > 0 ? Math.round((nutrition.calories / goals.calories) * 100) : 0}%`}
              sublabel='kcal'
            />
          </div>
          <div className='flex gap-4'>
            <MacroPill
              label='Protein'
              current={Math.round(nutrition.protein)}
              target={goals.protein}
              color='#10B981'
            />
            <MacroPill
              label='Carbs'
              current={Math.round(nutrition.carbs)}
              target={goals.carbs}
              color='#F59E0B'
            />
            <MacroPill
              label='Fat'
              current={Math.round(nutrition.fat)}
              target={goals.fat}
              color='#EF4444'
            />
          </div>
        </div>

        {/* Activity Metrics - 2x2 Grid */}
        <div className='grid grid-cols-2 gap-3 mb-4'>
          {/* Streak Card */}
          <div className='bg-[#131520] border border-white/5 rounded-2xl p-4'>
            <div className='flex items-center gap-2 mb-3'>
              <div className='w-[34px] h-[34px] rounded-xl bg-red-500/15 flex items-center justify-center'>
                <Icon name='fire' size={18} color='#EF4444' />
              </div>
              <span className='text-[12px] text-gray-400 font-semibold uppercase tracking-wide'>
                Streak
              </span>
            </div>
            <div className='flex items-baseline gap-1'>
              <div className='text-[32px] font-extrabold text-white leading-none'>
                {loading ? '...' : streak}
              </div>
              <span className='text-[14px] text-gray-400 font-medium'>days</span>
            </div>
            <div className='mt-2 text-[12px] text-red-400'>🔥 Keep it up!</div>
          </div>

          {/* Water Card */}
          <div className='bg-[#131520] border border-white/5 rounded-2xl p-4'>
            <div className='flex items-center gap-2 mb-3'>
              <div className='w-[34px] h-[34px] rounded-xl bg-blue-500/15 flex items-center justify-center'>
                <Icon name='water' size={18} color='#3B82F6' />
              </div>
              <span className='text-[12px] text-gray-400 font-semibold uppercase tracking-wide'>
                Water
              </span>
            </div>
            <div className='flex items-baseline gap-1'>
              <div className='text-[32px] font-extrabold text-white leading-none'>
                {loading ? '...' : (waterIntake / 1000).toFixed(1)}
              </div>
              <span className='text-[14px] text-gray-400 font-medium'>L</span>
            </div>
            <div className='mt-2 text-[12px] text-blue-400'>💧 Stay hydrated</div>
          </div>

          {/* Steps Card */}
          <button
            className='bg-[#131520] border border-white/5 rounded-2xl p-4 text-left w-full hover:border-purple-500/30 transition-colors'
            onClick={() => setStepModalOpen(true)}
          >
            <div className='flex items-center gap-2 mb-3'>
              <div className='w-[34px] h-[34px] rounded-xl bg-purple-500/15 flex items-center justify-center'>
                <Icon name='activity' size={18} color='#A855F7' />
              </div>
              <span className='text-[12px] text-gray-400 font-semibold uppercase tracking-wide'>
                Steps
              </span>
            </div>
            <div className='flex items-baseline gap-1 mb-2'>
              <div className='text-[32px] font-extrabold text-white leading-none'>
                {dailySteps.toLocaleString()}
              </div>
            </div>
            <div className='w-full h-1.5 bg-[#1e2030] rounded-full overflow-hidden'>
              <div
                className='h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all'
                style={{
                  width: `${Math.min(100, (dailySteps / stepGoal) * 100)}%`,
                }}
              />
            </div>
            <div className='text-[11px] text-gray-400 mt-1.5'>
              {Math.round((dailySteps / stepGoal) * 100)}% of {stepGoal.toLocaleString()}
            </div>
          </button>

          {/* Active Minutes Card */}
          <div className='bg-[#131520] border border-white/5 rounded-2xl p-4'>
            <div className='flex items-center gap-2 mb-3'>
              <div className='w-[34px] h-[34px] rounded-xl bg-green-500/15 flex items-center justify-center'>
                <Icon name='zap' size={18} color='#10B981' />
              </div>
              <span className='text-[12px] text-gray-400 font-semibold uppercase tracking-wide'>
                Active
              </span>
            </div>
            <div className='flex items-baseline gap-1'>
              <div className='text-[32px] font-extrabold text-white leading-none'>
                {loading ? '...' : '0'}
              </div>
              <span className='text-[14px] text-gray-400 font-medium'>min</span>
            </div>
            <div className='mt-2 text-[12px] text-green-400'>⚡ Get moving</div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className='mb-4'>
          <div className='text-[14px] font-bold text-white mb-3'>
            Recent Activity
          </div>
          {loading && (
            <div className='text-center py-8 text-gray-400'>Loading...</div>
          )}
          {!loading && recentActivity.length === 0 && (
            <div className='text-center py-8 text-gray-400'>
              No recent activity
            </div>
          )}
          {!loading &&
            recentActivity.map((item, index) => {
              const icon = item.type === 'meal' ? 'utensils' : 'dumbbell'
              const color = item.type === 'meal' ? '#F59E0B' : '#818CF8'

              return (
                <div
                  key={`${item.type}-${item.timestamp}-${index}`}
                  className='flex items-center gap-3 py-3 border-b border-white/5 last:border-0'
                >
                  <div
                    className='w-[38px] h-[38px] rounded-xl flex items-center justify-center flex-shrink-0'
                    style={{ backgroundColor: color + '20' }}
                  >
                    <Icon name={icon} size={18} color={color} />
                  </div>
                  <div className='flex-1'>
                    <div className='text-[13px] font-semibold text-white'>
                      {item.name}
                    </div>
                    <div className='text-[11px] text-gray-400'>
                      {item.description}
                    </div>
                  </div>
                  <div className='text-right'>
                    <div className='text-[13px] font-semibold text-white'>
                      {item.calories} kcal
                    </div>
                    <div className='text-[11px] text-gray-400'>
                      {formatTimeAgo(item.timestamp)}
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      </div>

      {/* FAB - Positioned absolutely, outside scrollable area */}
      {fabOpen && (
        <div className='absolute bottom-28 right-6 flex flex-col gap-2.5 items-end z-20'>
          {[
            {
              label: 'Log Meal',
              icon: 'utensils',
              color: '#F59E0B',
              href: '/nutrition',
              action: null,
            },
            {
              label: 'Log Workout',
              icon: 'dumbbell',
              color: '#818CF8',
              href: '/exercise',
              action: null,
            },
            {
              label: 'Log Steps',
              icon: 'activity',
              color: '#A855F7',
              href: null,
              action: () => setStepModalOpen(true),
            },
            {
              label: 'Log Weight',
              icon: 'trending',
              color: '#10B981',
              href: '/progress',
              action: null,
            },
          ].map((item) =>
            item.href ? (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setFabOpen(false)}
                className='flex items-center gap-2.5 py-2.5 px-4 rounded-2xl bg-[#1a1f35] border shadow-[0_4px_24px_rgba(0,0,0,0.5)]'
                style={{ borderColor: item.color + '33' }}
              >
                <span className='text-[13px] font-semibold text-white'>
                  {item.label}
                </span>
                <div
                  className='w-8 h-8 rounded-xl flex items-center justify-center'
                  style={{ backgroundColor: item.color + '22' }}
                >
                  <Icon name={item.icon} size={16} color={item.color} />
                </div>
              </Link>
            ) : (
              <button
                key={item.label}
                onClick={() => {
                  if (item.action) item.action()
                  setFabOpen(false)
                }}
                className='flex items-center gap-2.5 py-2.5 px-4 rounded-2xl bg-[#1a1f35] border shadow-[0_4px_24px_rgba(0,0,0,0.5)]'
                style={{ borderColor: item.color + '33' }}
              >
                <span className='text-[13px] font-semibold text-white'>
                  {item.label}
                </span>
                <div
                  className='w-8 h-8 rounded-xl flex items-center justify-center'
                  style={{ backgroundColor: item.color + '22' }}
                >
                  <Icon name={item.icon} size={16} color={item.color} />
                </div>
              </button>
            ),
          )}
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={() => setFabOpen(!fabOpen)}
        className='absolute bottom-6 right-6 w-[52px] h-[52px] rounded-[18px] bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-[0_8px_24px_rgba(59,130,246,0.5)] z-10 transition-transform'
        style={{ transform: fabOpen ? 'rotate(45deg)' : 'rotate(0)' }}
      >
        <Icon name='plus' size={24} color='white' strokeWidth={2.5} />
      </button>

      {/* Step Modal */}
      <StepModal
        isOpen={stepModalOpen}
        onClose={() => setStepModalOpen(false)}
        currentSteps={dailySteps}
        onSave={(steps) => setDailySteps(steps)}
      />
    </div>
  )
}
