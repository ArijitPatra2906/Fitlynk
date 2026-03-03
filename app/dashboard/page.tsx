'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/icon'
import { BarChart } from '@/components/ui/bar-chart'
import { ProgressRing } from '@/components/ui/progress-ring'
import { MacroPill } from '@/components/ui/macro-pill'
import {
  DashboardCalorieSkeleton,
  DashboardMetricsSkeleton,
  DashboardActivitySkeleton,
} from '@/components/ui/skeleton'
import { ItemCard } from '@/components/common/item-card'
import { stepTracker } from '@/lib/services/step-tracker'

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
  type: 'meal' | 'workout' | 'water' | 'weight' | 'steps'
  name: string
  description: string
  metadata: string
  timestamp: string
}

interface DashboardSnapshot {
  dateKey: string
  expiresAt: number
  nutrition: DailyNutrition
  goals: Goals
  stepGoal: number
  waterGoalMl: number
  waterIntake: number
  activeMinutes: number
  workoutActiveMinutes: number
  streak: number
  weeklyVolume: number[]
  recentActivity: RecentActivity[]
}

const DEFAULT_NUTRITION: DailyNutrition = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
}

const DEFAULT_GOALS: Goals = {
  calories: 2400,
  protein: 180,
  carbs: 280,
  fat: 80,
}

const DASHBOARD_CACHE_TTL_MS = 45_000
let dashboardSnapshotCache: DashboardSnapshot | null = null

const normalizeList = (payload: any) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.meals)) return payload.meals
  if (Array.isArray(payload?.workouts)) return payload.workouts
  return []
}

const getMealTotals = (meal: any) => {
  if (Array.isArray(meal?.items)) {
    return meal.items.reduce(
      (acc: DailyNutrition, item: any) => {
        acc.calories += item.calories || 0
        acc.protein += item.protein_g || 0
        acc.carbs += item.carbs_g || 0
        acc.fat += item.fat_g || 0
        return acc
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    )
  }

  return {
    calories: meal?.calories || 0,
    protein: meal?.protein_g || 0,
    carbs: meal?.carbs_g || 0,
    fat: meal?.fat_g || 0,
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const RECENT_ACTIVITY_BATCH_SIZE = 5
  const [dailySteps, setDailySteps] = useState(0)
  const [stepGoal, setStepGoal] = useState(10000)
  const [waterGoalMl, setWaterGoalMl] = useState(3000)

  // Dynamic data states
  const [nutrition, setNutrition] = useState<DailyNutrition>(DEFAULT_NUTRITION)
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS)
  const [waterIntake, setWaterIntake] = useState(0)
  const [activeMinutes, setActiveMinutes] = useState(0)
  const [workoutActiveMinutes, setWorkoutActiveMinutes] = useState(0)
  const [streak, setStreak] = useState(0)
  const [weeklyVolume, setWeeklyVolume] = useState<number[]>([
    0, 0, 0, 0, 0, 0, 0,
  ])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [visibleRecentActivityCount, setVisibleRecentActivityCount] = useState(
    RECENT_ACTIVITY_BATCH_SIZE,
  )
  const [loading, setLoading] = useState(true)

  const getLocalDateKey = (date = new Date()) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const applyDashboardSnapshot = (snapshot: DashboardSnapshot) => {
    setNutrition(snapshot.nutrition)
    setGoals(snapshot.goals)
    setStepGoal(snapshot.stepGoal)
    setWaterGoalMl(snapshot.waterGoalMl)
    setWaterIntake(snapshot.waterIntake)
    setActiveMinutes(snapshot.activeMinutes)
    setWorkoutActiveMinutes(snapshot.workoutActiveMinutes)
    setStreak(snapshot.streak)
    setWeeklyVolume(snapshot.weeklyVolume)
    setRecentActivity(snapshot.recentActivity)
  }

  const refreshActiveMinutesFromBackend = async (token?: string) => {
    try {
      const { getAuthToken } = await import('@/lib/auth/auth-token')
      const { apiClient } = await import('@/lib/api/client')
      const authToken = token || (await getAuthToken())
      if (!authToken) return

      const today = getLocalDateKey()
      const stepsRes = await apiClient.get(
        `/api/metrics/steps?startDate=${today}&endDate=${today}`,
        authToken,
      )
      if (!stepsRes.success || !Array.isArray(stepsRes.data)) return

      const todayLog = stepsRes.data[0]
      const minutes = Number(
        todayLog?.active_minutes ||
          (Number(todayLog?.slow_minutes || 0) +
            Number(todayLog?.brisk_minutes || 0)),
      )
      setActiveMinutes(Math.max(0, minutes || 0))
    } catch (error) {
      console.error('[Dashboard] Failed to refresh active minutes:', error)
    }
  }

  const refreshWaterIntakeFromBackend = async (token?: string) => {
    try {
      const { getAuthToken } = await import('@/lib/auth/auth-token')
      const { apiClient } = await import('@/lib/api/client')
      const authToken = token || (await getAuthToken())
      if (!authToken) return

      const today = getLocalDateKey()
      const waterRes = await apiClient.get(`/api/metrics/water?date=${today}`, authToken)
      if (!waterRes.success) return

      const waterData = waterRes.data || {}
      setWaterIntake(Number(waterData.total_ml || 0))
    } catch (error) {
      console.error('[Dashboard] Failed to refresh water intake:', error)
    }
  }

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async (silent = false) => {
      try {
        if (!silent) setLoading(true)
        const today = new Date().toISOString().split('T')[0]

        // Get auth token
        const { getAuthToken } = await import('@/lib/auth/auth-token')
        const { apiClient } = await import('@/lib/api/client')
        const token = await getAuthToken()

        if (!token) {
          console.error('No auth token found')
          router.push('/login')
          return
        }

        // Check if user has completed onboarding
        const userRes = await apiClient.get('/api/auth/me', token)
        if (userRes.success && userRes.data) {
          const user = userRes.data
          // Check if onboarding is incomplete
          if (!user.onboarding_completed) {
            console.log(
              '[Dashboard] User onboarding incomplete, redirecting to onboarding',
            )
            router.push('/onboarding')
            return
          }
        }

        // Load primary dashboard data in parallel to reduce time-to-interactive.
        const [
          mealsRes,
          goalsRes,
          waterRes,
          stepsRes,
          workoutsRes,
        ] = await Promise.all([
          apiClient.get(`/api/nutrition/meals?date=${today}`, token),
          apiClient.get('/api/metrics/goals/current', token),
          apiClient.get(`/api/metrics/water?date=${today}`, token),
          apiClient.get(`/api/metrics/steps?startDate=${today}&endDate=${today}`, token),
          apiClient.get('/api/workouts?limit=30&is_template=false', token),
        ])

        // Fetch today's meals and calculate nutrition
        let nextNutrition: DailyNutrition = DEFAULT_NUTRITION
        if (mealsRes.success) {
          const meals = normalizeList(mealsRes.data)
          // Calculate daily totals
          const dailyNutrition = meals.reduce(
            (acc: DailyNutrition, meal: any) => {
              const totals = getMealTotals(meal)
              acc.calories += totals.calories
              acc.protein += totals.protein
              acc.carbs += totals.carbs
              acc.fat += totals.fat
              return acc
            },
            { calories: 0, protein: 0, carbs: 0, fat: 0 },
          )

          nextNutrition = dailyNutrition
          setNutrition(dailyNutrition)
        }

        // Fetch current goals
        let nextGoals: Goals = DEFAULT_GOALS
        let nextStepGoal = 10000
        let nextWaterGoalMl = 3000
        if (goalsRes.success && goalsRes.data) {
          nextGoals = {
            calories: goalsRes.data.calorie_target || 2400,
            protein: goalsRes.data.protein_g || 180,
            carbs: goalsRes.data.carbs_g || 280,
            fat: goalsRes.data.fat_g || 80,
          }
          nextStepGoal = goalsRes.data.step_target || 10000
          nextWaterGoalMl = goalsRes.data.water_target_ml || 3000
          setGoals(nextGoals)
          setStepGoal(nextStepGoal)
          setWaterGoalMl(nextWaterGoalMl)
        }

        let nextWaterIntake = 0
        if (waterRes.success) {
          const waterData = waterRes.data || {}
          nextWaterIntake = Number(waterData.total_ml || 0)
          setWaterIntake(nextWaterIntake)
        }

        let nextActiveMinutes = 0
        if (stepsRes.success && Array.isArray(stepsRes.data)) {
          const todayLog = stepsRes.data[0]
          const minutes = Number(
            todayLog?.active_minutes ||
              (Number(todayLog?.slow_minutes || 0) +
                Number(todayLog?.brisk_minutes || 0)),
          )
          nextActiveMinutes = Math.max(0, minutes || 0)
          setActiveMinutes(nextActiveMinutes)
        }

        // Fetch recent workouts for streak calculation
        let nextStreak = 0
        let nextWeeklyVolume: number[] = [0, 0, 0, 0, 0, 0, 0]
        let nextWorkoutActiveMinutes = 0
        if (workoutsRes.success) {
          const workouts = normalizeList(workoutsRes.data)

          // Calculate streak (consecutive days with workouts)
          nextStreak = calculateStreak(workouts)
          nextWeeklyVolume = calculateWeeklyVolume(workouts)
          nextWorkoutActiveMinutes = calculateTodayWorkoutMinutes(workouts)
          setStreak(nextStreak)
          setWeeklyVolume(nextWeeklyVolume)
          setWorkoutActiveMinutes(nextWorkoutActiveMinutes)
        }

        dashboardSnapshotCache = {
          dateKey: getLocalDateKey(),
          expiresAt: Date.now() + DASHBOARD_CACHE_TTL_MS,
          nutrition: nextNutrition,
          goals: nextGoals,
          stepGoal: nextStepGoal,
          waterGoalMl: nextWaterGoalMl,
          waterIntake: nextWaterIntake,
          activeMinutes: nextActiveMinutes,
          workoutActiveMinutes: nextWorkoutActiveMinutes,
          streak: nextStreak,
          weeklyVolume: nextWeeklyVolume,
          recentActivity: dashboardSnapshotCache?.recentActivity || [],
        }

        // Load recent activity in background so it doesn't block initial render.
        void (async () => {
          try {
            const recentRes = await apiClient.get(
              '/api/metrics/recent-activity?limit=50',
              token,
            )
            if (!recentRes.success || !Array.isArray(recentRes.data)) {
              return
            }

            const activities = recentRes.data.map((item: any) => ({
              type: item.type as RecentActivity['type'],
              name: item.name || 'Activity',
              description: item.description || '',
              metadata: item.metadata || '',
              timestamp: item.timestamp || new Date().toISOString(),
            }))

            setRecentActivity(activities)
            setVisibleRecentActivityCount(RECENT_ACTIVITY_BATCH_SIZE)
            if (dashboardSnapshotCache) {
              dashboardSnapshotCache = {
                ...dashboardSnapshotCache,
                recentActivity: activities,
                expiresAt: Date.now() + DASHBOARD_CACHE_TTL_MS,
              }
            }
          } catch (e) {
            console.error('[Dashboard] Failed to load recent activity:', e)
          }
        })()
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        if (!silent) setLoading(false)
      }
    }

    const todayKey = getLocalDateKey()
    if (
      dashboardSnapshotCache &&
      dashboardSnapshotCache.dateKey === todayKey &&
      dashboardSnapshotCache.expiresAt > Date.now()
    ) {
      applyDashboardSnapshot(dashboardSnapshotCache)
      setLoading(false)
      void fetchDashboardData(true)
      return
    }

    fetchDashboardData()
  }, [])

  // Calculate workout streak
  const calculateStreak = (workouts: any[]) => {
    if (!Array.isArray(workouts) || workouts.length === 0) return 0

    const dayKey = (date: Date) => {
      const d = new Date(date)
      d.setHours(0, 0, 0, 0)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }

    // Build a set of unique workout days using ended_at (preferred) or started_at.
    const workoutDays = new Set<string>()
    workouts.forEach((workout: any) => {
      const rawDate = workout.ended_at || workout.started_at
      if (!rawDate) return
      const dt = new Date(rawDate)
      if (!Number.isFinite(dt.getTime())) return
      workoutDays.add(dayKey(dt))
    })

    if (workoutDays.size === 0) return 0

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // If no workout today, allow streak to continue from yesterday.
    let cursor = today
    if (!workoutDays.has(dayKey(today))) {
      if (!workoutDays.has(dayKey(yesterday))) return 0
      cursor = yesterday
    }

    let streak = 0
    while (workoutDays.has(dayKey(cursor))) {
      streak++
      cursor = new Date(cursor)
      cursor.setDate(cursor.getDate() - 1)
    }

    return streak
  }

  const calculateWeeklyVolume = (workouts: any[]): number[] => {
    // [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
    const volumeByDay: number[] = [0, 0, 0, 0, 0, 0, 0]
    const today = new Date()
    const currentDayOfWeek = today.getDay() // 0=Sun ... 6=Sat

    const startOfWeek = new Date(today)
    const daysSinceMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1
    startOfWeek.setDate(today.getDate() - daysSinceMonday)
    startOfWeek.setHours(0, 0, 0, 0)

    workouts.forEach((workout: any) => {
      if (!workout.started_at || !workout.exercises) return

      const workoutDate = new Date(workout.started_at)
      workoutDate.setHours(0, 0, 0, 0)

      const daysSinceWeekStart = Math.floor(
        (workoutDate.getTime() - startOfWeek.getTime()) / (1000 * 60 * 60 * 24),
      )

      if (daysSinceWeekStart >= 0 && daysSinceWeekStart < 7) {
        let totalVolume = 0

        workout.exercises.forEach((ex: any) => {
          ex.sets?.forEach((set: any) => {
            if (
              set.weight_kg &&
              set.reps &&
              !set.is_warmup &&
              set.completed_at
            ) {
              totalVolume += set.weight_kg * set.reps
            }
          })
        })

        volumeByDay[daysSinceWeekStart] += totalVolume
      }
    })

    return volumeByDay
  }

  const calculateTodayWorkoutMinutes = (workouts: any[]): number => {
    const now = new Date()
    const dayStart = new Date(now)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)

    let totalMs = 0
    workouts.forEach((workout: any) => {
      if (!workout?.started_at) return

      const start = new Date(workout.started_at)
      const end = workout.ended_at ? new Date(workout.ended_at) : now
      if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
        return
      }

      const overlapStart = Math.max(start.getTime(), dayStart.getTime())
      const overlapEnd = Math.min(end.getTime(), dayEnd.getTime())
      if (overlapEnd > overlapStart) {
        totalMs += overlapEnd - overlapStart
      }
    })

    return Math.max(0, Math.round(totalMs / (1000 * 60)))
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

      // Always hydrate from backend first (historical source of truth).
      const savedSteps = await stepTracker.getTodayStepsFromBackend()
      if (savedSteps > 0) {
        setDailySteps(savedSteps)
      }
      await refreshActiveMinutesFromBackend()

      if (stepTracker.isSupported()) {
        try {
          console.log('[Dashboard] Requesting permissions...')
          // Request permissions
          const hasPermission = await stepTracker.requestPermissions()
          console.log('[Dashboard] Permission granted:', hasPermission)

          if (hasPermission) {
            // Sync cached steps from in-app Android background service (if available).
            await stepTracker.syncOfflineAndHistoricalSteps()

            console.log("[Dashboard] Getting today's steps...")
            // Get today's steps
            const steps = await stepTracker.getTodaySteps()
            const stats = await stepTracker.getTodayActivityStats()
            console.log('[Dashboard] Steps fetched:', steps)
            setDailySteps(steps)
            setActiveMinutes(Math.max(0, stats.activeMinutes || 0))
            await stepTracker.syncSteps(steps)

            console.log('[Dashboard] Starting real-time tracking...')
            // Start real-time tracking
            await stepTracker.startTracking((updatedSteps) => {
              console.log('[Dashboard] Step update received:', updatedSteps)
              setDailySteps(updatedSteps)
              void stepTracker
                .getTodayActivityStats()
                .then((s) => setActiveMinutes(Math.max(0, s.activeMinutes || 0)))
                .catch((e) =>
                  console.error('[Dashboard] Failed to refresh active minutes:', e),
                )
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

  useEffect(() => {
    let appListener: { remove: () => Promise<void> } | null = null

    const setupAppResumeSync = async () => {
      if (!stepTracker.isSupported()) return

      try {
        const { App } = await import('@capacitor/app')
        appListener = await App.addListener('appStateChange', async ({ isActive }) => {
          if (!isActive) return

          try {
            await stepTracker.syncOfflineAndHistoricalSteps()
            const steps = await stepTracker.getTodaySteps()
            const stats = await stepTracker.getTodayActivityStats()
            setDailySteps(steps)
            setActiveMinutes(Math.max(0, stats.activeMinutes || 0))
            await stepTracker.syncSteps(steps)
          } catch (error) {
            console.error('[Dashboard] Error refreshing steps on resume:', error)
          }
        })
      } catch (error) {
        console.error('[Dashboard] Failed to set app resume listener:', error)
      }
    }

    setupAppResumeSync()

    return () => {
      if (appListener) {
        appListener.remove()
      }
    }
  }, [])

  return (
    <div className='relative h-full'>
      {/* Scrollable Content */}
      <div className='h-full overflow-y-auto px-6 pt-5 pb-4'>
        {/* Calorie Card */}
        {loading && nutrition.calories === 0 ? (
          <DashboardCalorieSkeleton />
        ) : (
          <div className='bg-gradient-to-br from-[#1a1f35] to-[#0d1b3e] border border-blue-500/20 rounded-3xl p-5 mb-4'>
            <div className='flex items-center justify-between mb-4'>
              <div>
                <div className='text-[11px] text-gray-400 uppercase tracking-wider mb-1'>
                  Today's Calories
                </div>
                <div className='text-[30px] font-extrabold text-white tracking-tight leading-none'>
                  {Math.round(nutrition.calories).toLocaleString()}
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
        )}

        {/* Activity Metrics - 2x2 Grid */}
        {loading && nutrition.calories === 0 ? (
          <DashboardMetricsSkeleton />
        ) : (
          <div className='grid grid-cols-2 gap-2.5 mb-4'>
            <>
              {/* Streak Card */}
              <div className='order-1 bg-[#131520] border border-white/5 rounded-2xl p-3.5 min-h-[154px] flex flex-col'>
                <div className='flex items-center gap-2 mb-2'>
                  <div className='w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center'>
                    <Icon name='fire' size={14} color='#EF4444' />
                  </div>
                  <span className='text-[11px] text-gray-400 font-semibold uppercase tracking-wide'>
                    Streak
                  </span>
                </div>
                <div className='flex items-baseline gap-1'>
                  <div className='text-[26px] font-extrabold text-white leading-none'>
                    {streak}
                  </div>
                  <span className='text-[12px] text-gray-400 font-medium'>
                    days
                  </span>
                </div>
                <div className='mt-auto pt-2 border-t border-white/5 text-[11px] text-gray-400'>
                  Keep it up!
                </div>
              </div>

              {/* Water Card */}
              <button
                type='button'
                onClick={() => router.push('/water')}
                className='order-4 col-span-2 bg-[#131520] border border-white/5 rounded-2xl p-3.5 min-h-[126px] flex flex-col text-left hover:border-blue-500/30 transition-colors'
              >
                <div className='flex items-center gap-2 mb-2'>
                  <div className='w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center'>
                    <Icon name='water' size={14} color='#3B82F6' />
                  </div>
                  <span className='text-[11px] text-gray-400 font-semibold uppercase tracking-wide'>
                    Water
                  </span>
                </div>
                <div className='flex items-center justify-between gap-3'>
                  <div className='flex items-baseline gap-1'>
                    <div className='text-[28px] font-extrabold text-white leading-none'>
                      {(waterIntake / 1000).toFixed(1)}
                    </div>
                    <span className='text-[12px] text-gray-400 font-medium'>
                      L
                    </span>
                  </div>
                  <div className='text-[11px] text-blue-300 font-semibold'>
                    Open logs
                  </div>
                </div>
                <div className='mt-1 text-[11px] text-gray-400'>
                  / {(waterGoalMl / 1000).toFixed(1)} L goal
                </div>
                <div className='mt-auto pt-3 border-t border-white/5'>
                  <div className='h-1.5 w-full bg-[#1e2030] rounded-full overflow-hidden'>
                    <div
                      className='h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all'
                      style={{
                        width: `${Math.min(100, (waterIntake / waterGoalMl) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className='mt-2 text-[11px] text-gray-400'>
                    Tap to add water and view daily logs
                  </div>
                </div>
              </button>

              {/* Steps Card */}
              <button
                className='order-3 col-span-2 bg-[#131520] border border-white/5 rounded-2xl p-3.5 text-left w-full hover:border-purple-500/30 transition-colors min-h-[128px] flex flex-col'
                onClick={() => router.push('/steps')}
              >
                <div className='flex items-center gap-2 mb-2'>
                  <div className='w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center'>
                    <Icon name='activity' size={14} color='#A855F7' />
                  </div>
                  <span className='text-[11px] text-gray-400 font-semibold uppercase tracking-wide'>
                    Steps
                  </span>
                </div>
                <div className='flex items-baseline gap-1'>
                  <div className='text-[30px] font-extrabold text-white leading-none'>
                    {dailySteps.toLocaleString()}
                  </div>
                </div>
                <div className='mt-auto pt-2.5 border-t border-white/5 w-full'>
                  <div className='w-full h-1.5 bg-[#1e2030] rounded-full overflow-hidden'>
                    <div
                      className='h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all'
                      style={{
                        width: `${Math.min(100, (dailySteps / stepGoal) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className='text-[11px] text-gray-400 mt-1.5'>
                    {Math.round((dailySteps / stepGoal) * 100)}% of{' '}
                    {stepGoal.toLocaleString()}
                  </div>
                  <div className='mt-2 text-[11px] text-gray-400'>
                    Tap to add steps and view daily logs
                  </div>
                </div>
              </button>

              {/* Active Minutes Card */}
              <div className='order-2 bg-[#131520] border border-white/5 rounded-2xl p-3.5 min-h-[154px] flex flex-col'>
                <div className='flex items-center gap-2 mb-2'>
                  <div className='w-7 h-7 rounded-lg bg-green-500/15 flex items-center justify-center'>
                    <Icon name='zap' size={14} color='#10B981' />
                  </div>
                  <span className='text-[11px] text-gray-400 font-semibold uppercase tracking-wide'>
                    Active
                  </span>
                </div>
                <div className='flex items-baseline gap-1'>
                  <div className='text-[28px] font-extrabold text-white leading-none'>
                    {activeMinutes + workoutActiveMinutes}
                  </div>
                  <span className='text-[12px] text-gray-400 font-medium'>
                    min
                  </span>
                </div>
                <div className='mt-auto pt-2.5 border-t border-white/5 grid grid-cols-2 gap-2'>
                  <div>
                    <div className='text-[10px] uppercase tracking-wide text-gray-500'>
                      Steps
                    </div>
                    <div className='text-[14px] font-semibold text-white'>
                      {activeMinutes}m
                    </div>
                  </div>
                  <div>
                    <div className='text-[10px] uppercase tracking-wide text-gray-500'>
                      Workout
                    </div>
                    <div className='text-[14px] font-semibold text-white'>
                      {workoutActiveMinutes}m
                    </div>
                  </div>
                </div>
              </div>
            </>
          </div>
        )}

        {/* Weekly Volume */}
        <div className='bg-[#131520] border border-white/5 rounded-[22px] p-[18px] mb-4'>
          <div className='text-[13px] font-bold text-white mb-1'>
            Volume This Week
          </div>
          <div className='text-[11px] text-gray-400 mb-3.5'>
            Total weight lifted (kg)
          </div>
          <BarChart
            data={weeklyVolume}
            color='#818CF8'
            labels={['M', 'T', 'W', 'T', 'F', 'S', 'S']}
          />
        </div>

        {/* Recent Activity */}
        <div className='mb-4'>
          <div className='text-[14px] font-bold text-white mb-3'>
            Recent Activity
          </div>
          {loading && nutrition.calories === 0 ? (
            <>
              <DashboardActivitySkeleton />
              <DashboardActivitySkeleton />
              <DashboardActivitySkeleton />
            </>
          ) : recentActivity.length === 0 ? (
            <div className='text-center py-8 text-gray-400'>
              No recent activity
            </div>
          ) : (
            recentActivity
              .slice(0, visibleRecentActivityCount)
              .map((item, index) => {
              const iconByType: Record<RecentActivity['type'], string> = {
                meal: 'utensils',
                workout: 'dumbbell',
                water: 'water',
                weight: 'trending',
                steps: 'activity',
              }
              const colorByType: Record<RecentActivity['type'], string> = {
                meal: '#F59E0B',
                workout: '#818CF8',
                water: '#3B82F6',
                weight: '#10B981',
                steps: '#A855F7',
              }
              const icon = iconByType[item.type]
              const color = colorByType[item.type]

              return (
                <ItemCard
                  key={`${item.type}-${item.timestamp}-${index}`}
                  id={`${item.type}-${index}`}
                  title={item.name}
                  subtitle={item.description}
                  metadata={item.metadata}
                  secondaryMetadata={formatTimeAgo(item.timestamp)}
                  icon={icon}
                  iconColor={color}
                  canEdit={false}
                  canDelete={false}
                />
              )
              })
          )}
          {recentActivity.length > visibleRecentActivityCount && (
            <button
              type='button'
              onClick={() =>
                setVisibleRecentActivityCount(
                  (prev) => prev + RECENT_ACTIVITY_BATCH_SIZE,
                )
              }
              className='mt-3 w-full h-10 rounded-xl border border-white/10 bg-[#0B0D17] text-[13px] font-semibold text-gray-200 hover:text-white'
            >
              See more
            </button>
          )}
        </div>
      </div>

    </div>
  )
}

