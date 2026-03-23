'use client'

import { useEffect, useMemo, useState } from 'react'
import { Icon } from '@/components/ui/icon'
import {
  ProgressChartSkeleton,
  ProgressPRsSkeleton,
  ProgressStatsSkeleton,
  ProgressTabsSkeleton,
  ProgressPhotosGridSkeleton,
} from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'

type ProgressTab = 'weight' | 'macros' | 'workouts' | 'photos'
type RangeDays = 7 | 30

interface BodyMetricRow {
  _id: string
  weight_kg: number
  body_fat_pct?: number
  recorded_at: string
}

interface GoalRow {
  goal_type?: 'lose' | 'maintain' | 'gain'
  calorie_target?: number
  protein_g?: number
  carbs_g?: number
  fat_g?: number
  activity_level?:
    | 'sedentary'
    | 'light'
    | 'moderate'
    | 'very_active'
    | 'extra_active'
  step_target?: number
  water_target_ml?: number
  weight_goal_kg?: number
}

interface UserRow {
  weight_kg?: number
  created_at?: string
}

interface WorkoutSetRow {
  reps?: number
  weight_kg?: number
  completed_at?: string
}

interface WorkoutExerciseRow {
  exercise_id?: { _id?: string; name?: string } | string
  sets?: WorkoutSetRow[]
}

interface WorkoutRow {
  _id: string
  name: string
  started_at: string
  ended_at?: string
  exercises?: WorkoutExerciseRow[]
}

interface MealRow {
  date: string
  calories?: number
  protein_g?: number
  carbs_g?: number
  fat_g?: number
}

interface ChartPoint {
  x: number
  y: number
}

const TABS: Array<{ id: ProgressTab; label: string }> = [
  { id: 'weight', label: 'Weight' },
  { id: 'macros', label: 'Macros' },
  { id: 'workouts', label: 'Workouts' },
  { id: 'photos', label: 'Photos' },
]
const WEIGHT_LOG_PAGE_SIZE = 5

const getDateKey = (date: Date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const buildDateRange = (days: number) => {
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  const start = new Date(end)
  start.setDate(start.getDate() - (days - 1))
  start.setHours(0, 0, 0, 0)
  return {
    startDate: getDateKey(start),
    endDate: getDateKey(end),
    start,
    end,
  }
}

const formatShortDate = (value?: string) => {
  if (!value) return '-'
  const d = new Date(value)
  if (!Number.isFinite(d.getTime())) return '-'
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

const toNumber = (value: any, fallback = 0) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

const normalizeMeals = (payload: any): MealRow[] => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.meals)) return payload.meals
  return []
}

const normalizeWorkouts = (payload: any): WorkoutRow[] => {
  if (Array.isArray(payload)) return payload as WorkoutRow[]
  if (Array.isArray(payload?.workouts)) return payload.workouts as WorkoutRow[]
  return []
}

export default function ProgressPage() {
  const [tab, setTab] = useState<ProgressTab>('weight')
  const [range, setRange] = useState<RangeDays>(7)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingWeight, setSavingWeight] = useState(false)
  const [savingGoalWeight, setSavingGoalWeight] = useState(false)
  const [weightLogsLoading, setWeightLogsLoading] = useState(false)
  const [weightLogPage, setWeightLogPage] = useState(1)

  const [goals, setGoals] = useState<GoalRow | null>(null)
  const [user, setUser] = useState<UserRow | null>(null)
  const [bodyMetrics, setBodyMetrics] = useState<BodyMetricRow[]>([])
  const [workouts, setWorkouts] = useState<WorkoutRow[]>([])
  const [meals, setMeals] = useState<MealRow[]>([])
  const [weightInput, setWeightInput] = useState('')
  const [goalWeightInput, setGoalWeightInput] = useState('')
  const [weightLogs, setWeightLogs] = useState<BodyMetricRow[]>([])
  const [weightLogPagination, setWeightLogPagination] = useState({
    total: 0,
    totalPages: 1,
  })
  const [progressPhotos, setProgressPhotos] = useState<any[]>([])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null)
  const [photoModalOpen, setPhotoModalOpen] = useState(false)
  const [isGoalDrawerOpen, setIsGoalDrawerOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [photoToDelete, setPhotoToDelete] = useState<any>(null)
  const isDenseWorkoutChart = range === 30

  const refreshData = async (selectedRange: RangeDays) => {
    setError('')
    const { getAuthToken } = await import('@/lib/auth/auth-token')
    const { apiClient } = await import('@/lib/api/client')
    const token = await getAuthToken()

    if (!token) return

    const { startDate, endDate } = buildDateRange(selectedRange === 30 ? 30 : 7)

    const [goalRes, userRes, bodyRes, workoutRes, mealRes, photosRes] =
      await Promise.all([
        apiClient.get('/api/metrics/goals/current', token),
        apiClient.get('/api/auth/me', token),
        apiClient.get(
          `/api/metrics/body?startDate=${startDate}&endDate=${endDate}&limit=300`,
          token,
        ),
        apiClient.get(
          `/api/workouts?is_template=false&completed=true&startDate=${startDate}&endDate=${endDate}&limit=300`,
          token,
        ),
        apiClient.get(
          `/api/nutrition/meals?startDate=${startDate}&endDate=${endDate}`,
          token,
        ),
        apiClient.get(`/api/metrics/progress-photos?limit=50`, token),
      ])

    if (!goalRes.success)
      throw new Error(goalRes.error || 'Failed to load goals')
    if (!userRes.success)
      throw new Error(userRes.error || 'Failed to load profile')
    if (!bodyRes.success)
      throw new Error(bodyRes.error || 'Failed to load body metrics')
    if (!workoutRes.success)
      throw new Error(workoutRes.error || 'Failed to load workouts')
    if (!mealRes.success)
      throw new Error(mealRes.error || 'Failed to load meals')
    if (!photosRes.success)
      throw new Error(photosRes.error || 'Failed to load progress photos')

    const bodyRows: BodyMetricRow[] = Array.isArray(bodyRes.data)
      ? bodyRes.data
      : Array.isArray((bodyRes.data as any)?.logs)
      ? ((bodyRes.data as any).logs as BodyMetricRow[])
      : []
    const goalsData = (goalRes.data || null) as GoalRow | null
    const photosData = Array.isArray(photosRes.data)
      ? photosRes.data
      : Array.isArray((photosRes.data as any)?.photos)
      ? (photosRes.data as any).photos
      : []
    setGoals(goalsData)
    setUser(userRes.data || null)
    setBodyMetrics(bodyRows)
    setWorkouts(normalizeWorkouts(workoutRes.data))
    setMeals(normalizeMeals(mealRes.data))
    setProgressPhotos(photosData)

    if (bodyRows.length > 0 && bodyRows[0]?.weight_kg) {
      setWeightInput(String(Math.round(bodyRows[0].weight_kg * 10) / 10))
    } else if (userRes.data?.weight_kg) {
      setWeightInput(
        String(Math.round(Number(userRes.data.weight_kg) * 10) / 10),
      )
    }

    if (goalsData?.weight_goal_kg) {
      setGoalWeightInput(
        String(Math.round(Number(goalsData.weight_goal_kg) * 10) / 10),
      )
    } else if (userRes.data?.weight_kg) {
      setGoalWeightInput(
        String(Math.round(Number(userRes.data.weight_kg) * 10) / 10),
      )
    }
  }

  const refreshWeightLogs = async (nextPage: number, append = false) => {
    setWeightLogsLoading(true)
    try {
      const { getAuthToken } = await import('@/lib/auth/auth-token')
      const { apiClient } = await import('@/lib/api/client')
      const token = await getAuthToken()
      if (!token) return

      const res = await apiClient.get(
        `/api/metrics/body?page=${nextPage}&limit=${WEIGHT_LOG_PAGE_SIZE}`,
        token,
      )
      if (!res.success) {
        throw new Error(res.error || 'Failed to load weight logs')
      }

      const payload = res.data || {}
      const items = Array.isArray(payload.logs)
        ? (payload.logs as BodyMetricRow[])
        : Array.isArray(payload)
        ? (payload as BodyMetricRow[])
        : []
      const pager = payload.pagination || {}

      setWeightLogs((prev) => (append ? [...prev, ...items] : items))
      setWeightLogPagination({
        total: toNumber(pager.total, items.length),
        totalPages: Math.max(1, toNumber(pager.totalPages, 1)),
      })
    } catch (e: any) {
      setError(e.message || 'Failed to load weight logs')
    } finally {
      setWeightLogsLoading(false)
    }
  }

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true)
        await refreshData(range)
        await refreshWeightLogs(1)
      } catch (e: any) {
        setError(e.message || 'Failed to load progress')
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  useEffect(() => {
    const refresh = async () => {
      if (loading) return
      try {
        await refreshData(range)
      } catch (e: any) {
        setError(e.message || 'Failed to refresh progress data')
      }
    }

    refresh()
  }, [range])

  // Reset goal weight input when drawer opens
  useEffect(() => {
    if (isGoalDrawerOpen) {
      // Set to current saved goal when opening
      setGoalWeightInput(
        goals?.weight_goal_kg ? String(goals.weight_goal_kg) : '80'
      )
    }
  }, [isGoalDrawerOpen, goals?.weight_goal_kg])

  const rangeBounds = useMemo(() => buildDateRange(range), [range])

  const filteredMetrics = useMemo(() => {
    const asc = [...bodyMetrics].sort(
      (a, b) =>
        new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
    )

    if (asc.length === 0 && user?.weight_kg) {
      return [
        {
          _id: 'fallback-current',
          weight_kg: Number(user.weight_kg),
          recorded_at: new Date().toISOString(),
        } as BodyMetricRow,
      ]
    }

    return asc
  }, [bodyMetrics, user?.weight_kg])

  const dailyMetrics = useMemo(() => {
    // Keep only the latest entry for each day to avoid inflated same-day deltas.
    const byDay = new Map<string, BodyMetricRow>()

    filteredMetrics.forEach((row) => {
      const dayKey = getDateKey(new Date(row.recorded_at))
      const existing = byDay.get(dayKey)
      if (!existing) {
        byDay.set(dayKey, row)
        return
      }

      const prevMs = new Date(existing.recorded_at).getTime()
      const nextMs = new Date(row.recorded_at).getTime()
      if (nextMs >= prevMs) {
        byDay.set(dayKey, row)
      }
    })

    return Array.from(byDay.values()).sort(
      (a, b) =>
        new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
    )
  }, [filteredMetrics])

  const weightValues = useMemo(() => {
    const values = dailyMetrics.map((m) => toNumber(m.weight_kg))

    // If we have only 1 logged weight and a baseline weight, prepend the baseline as the starting point
    // Use the range start date instead of user.created_at to keep it within the selected period
    if (values.length === 1 && user?.weight_kg) {
      const baselineWeight = toNumber(user.weight_kg)
      return [baselineWeight, ...values]
    }

    return values
  }, [dailyMetrics, user?.weight_kg])

  const chartDateLabels = useMemo(() => {
    const labels = dailyMetrics.map((m) =>
      new Date(m.recorded_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      }),
    )

    // If we have only 1 logged weight, prepend the range start date for the baseline
    if (labels.length === 1 && user?.weight_kg) {
      const rangeStartLabel = new Date(rangeBounds.startDate).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
      return [rangeStartLabel, ...labels]
    }

    return labels
  }, [dailyMetrics, user?.weight_kg, rangeBounds.startDate])

  const chartGeometry = useMemo(() => {
    const H = 100
    const W = 280
    const PAD = 20

    const values = weightValues.length > 0 ? weightValues : [0]
    const minW = Math.min(...values)
    const maxW = Math.max(...values)
    const span = maxW - minW || 1
    const seriesCount = Math.max(1, values.length - 1)

    const points: ChartPoint[] = values.map((w, i) => {
      const x = PAD + (i / seriesCount) * (W - PAD * 2)
      const y = PAD + ((maxW - w) / span) * (H - PAD * 2)
      return { x, y }
    })

    return { H, W, PAD, points, minW, maxW }
  }, [weightValues])

  const weightStats = useMemo(() => {
    const rows = dailyMetrics
    const currentRow = rows[rows.length - 1]

    const startWeight = toNumber(user?.weight_kg)

    const currentWeight = toNumber(currentRow?.weight_kg, startWeight)
    const delta = currentWeight - startWeight
    return {
      startWeight,
      currentWeight,
      delta,
      startDate: user?.created_at,
      currentDate: currentRow?.recorded_at || new Date().toISOString(),
      goalWeight: toNumber(goals?.weight_goal_kg, currentWeight),
    }
  }, [dailyMetrics, goals?.weight_goal_kg, user?.weight_kg, user?.created_at])

  const workoutDerived = useMemo(() => {
    const inRange = workouts

    const volumeByDay: Record<string, number> = {}
    const prByExercise: Record<
      string,
      { weight: number; reps: number; date: string }
    > = {}

    inRange.forEach((w) => {
      const dayKey = getDateKey(new Date(w.ended_at || w.started_at))
      let sessionVolume = 0

      ;(w.exercises || []).forEach((exercise) => {
        const exerciseName =
          typeof exercise.exercise_id === 'object'
            ? exercise.exercise_id?.name || 'Exercise'
            : 'Exercise'

        ;(exercise.sets || []).forEach((set) => {
          const reps = toNumber(set.reps)
          const weight = toNumber(set.weight_kg)
          if (set.completed_at) {
            sessionVolume += weight * reps
          }

          if (weight > 0) {
            const current = prByExercise[exerciseName]
            if (!current || weight > current.weight) {
              prByExercise[exerciseName] = {
                weight,
                reps,
                date: w.ended_at || w.started_at,
              }
            }
          }
        })
      })

      volumeByDay[dayKey] = (volumeByDay[dayKey] || 0) + sessionVolume
    })

    const prList = Object.entries(prByExercise)
      .map(([exercise, record]) => ({ exercise, ...record }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 8)

    const days: string[] = []
    for (let i = range - 1; i >= 0; i -= 1) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push(getDateKey(d))
    }
    const volumeSeries = days.map((d) => Math.round(volumeByDay[d] || 0))

    return {
      totalSessions: inRange.length,
      totalVolume: Math.round(
        inRange.reduce((sum, w) => {
          const sessionVolume = (w.exercises || []).reduce((acc, ex) => {
            return (
              acc +
              (ex.sets || []).reduce((setAcc, s) => {
                return setAcc + toNumber(s.weight_kg) * toNumber(s.reps)
              }, 0)
            )
          }, 0)
          return sum + sessionVolume
        }, 0),
      ),
      volumeSeries,
      dayLabels: days.map((d) =>
        new Date(d)
          .toLocaleDateString(undefined, { weekday: 'short' })
          .slice(0, 1),
      ),
      prs: prList,
    }
  }, [workouts, range])

  const macroDerived = useMemo(() => {
    const dayTotals: Record<
      string,
      { calories: number; protein: number; carbs: number; fat: number }
    > = {}

    meals.forEach((meal) => {
      const day = getDateKey(new Date(meal.date))
      if (!dayTotals[day]) {
        dayTotals[day] = { calories: 0, protein: 0, carbs: 0, fat: 0 }
      }

      dayTotals[day].calories += toNumber(meal.calories)
      dayTotals[day].protein += toNumber(meal.protein_g)
      dayTotals[day].carbs += toNumber(meal.carbs_g)
      dayTotals[day].fat += toNumber(meal.fat_g)
    })

    const days = Object.keys(dayTotals).sort()
    const avg = days.length
      ? days.reduce(
          (acc, day) => {
            acc.calories += dayTotals[day].calories
            acc.protein += dayTotals[day].protein
            acc.carbs += dayTotals[day].carbs
            acc.fat += dayTotals[day].fat
            return acc
          },
          { calories: 0, protein: 0, carbs: 0, fat: 0 },
        )
      : { calories: 0, protein: 0, carbs: 0, fat: 0 }

    const denom = Math.max(1, days.length)
    return {
      trackedDays: days.length,
      avgCalories: Math.round(avg.calories / denom),
      avgProtein: Math.round(avg.protein / denom),
      avgCarbs: Math.round(avg.carbs / denom),
      avgFat: Math.round(avg.fat / denom),
    }
  }, [meals])

  const handleSaveWeight = async () => {
    try {
      const parsed = Number(weightInput)
      if (!Number.isFinite(parsed) || parsed <= 0) {
        toast.error('Enter a valid weight')
        return
      }

      setSavingWeight(true)
      const { getAuthToken } = await import('@/lib/auth/auth-token')
      const { apiClient } = await import('@/lib/api/client')
      const token = await getAuthToken()
      if (!token) return

      const res = await apiClient.post(
        '/api/metrics/body',
        {
          weight_kg: parsed,
          recorded_at: new Date().toISOString(),
        },
        token,
      )

      if (!res.success) {
        throw new Error(res.error || 'Failed to save weight')
      }

      toast.success('Weight logged')
      await refreshData(range)
      setWeightLogPage(1)
      await refreshWeightLogs(1)
    } catch (e: any) {
      toast.error(e.message || 'Failed to save weight')
    } finally {
      setSavingWeight(false)
    }
  }

  const handleSaveGoalWeight = async () => {
    try {
      const parsedGoal = Number(goalWeightInput)
      if (!Number.isFinite(parsedGoal) || parsedGoal <= 0) {
        toast.error('Enter a valid goal weight')
        return
      }

      setSavingGoalWeight(true)
      const { getAuthToken } = await import('@/lib/auth/auth-token')
      const { apiClient } = await import('@/lib/api/client')
      const token = await getAuthToken()
      if (!token) return

      const payload = {
        goal_type: goals?.goal_type || 'maintain',
        calorie_target: toNumber(goals?.calorie_target, 2400),
        protein_g: toNumber(goals?.protein_g, 180),
        carbs_g: toNumber(goals?.carbs_g, 280),
        fat_g: toNumber(goals?.fat_g, 80),
        activity_level: goals?.activity_level || 'moderate',
        step_target: toNumber(goals?.step_target, 10000),
        water_target_ml: toNumber(goals?.water_target_ml, 3000),
        weight_goal_kg: parsedGoal,
      }

      const res = await apiClient.post('/api/metrics/goals', payload, token)
      if (!res.success) {
        throw new Error(res.error || 'Failed to save goal weight')
      }

      toast.success('Goal weight saved')
      await refreshData(range)
    } catch (e: any) {
      toast.error(e.message || 'Failed to save goal weight')
    } finally {
      setSavingGoalWeight(false)
    }
  }

  const weightTrendText = useMemo(() => {
    const value = weightStats.delta
    const abs = Math.abs(value).toFixed(1)
    if (value < 0) return `-${abs} kg in selected period`
    if (value > 0) return `+${abs} kg in selected period`
    return 'No weight change in selected period'
  }, [weightStats.delta])

  const hasMoreWeightLogs =
    weightLogs.length < weightLogPagination.total &&
    weightLogPage < weightLogPagination.totalPages

  const handleLoadMoreWeightLogs = async () => {
    if (weightLogsLoading || !hasMoreWeightLogs) return
    const nextPage = weightLogPage + 1
    setWeightLogPage(nextPage)
    await refreshWeightLogs(nextPage, true)
  }

  const handleDeletePhoto = async () => {
    if (!photoToDelete) return

    try {
      const { getAuthToken } = await import('@/lib/auth/auth-token')
      const { apiClient } = await import('@/lib/api/client')
      const token = await getAuthToken()
      if (!token) return

      const response = await apiClient.delete(
        `/api/metrics/progress-photos/${photoToDelete._id}`,
        token,
      )

      if (response.success) {
        toast.success('Photo deleted')
        setProgressPhotos(
          progressPhotos.filter((p) => p._id !== photoToDelete._id),
        )
        setPhotoModalOpen(false)
        setPhotoToDelete(null)
      } else {
        toast.error(response.error || 'Failed to delete photo')
      }
    } catch (error) {
      console.error('Error deleting photo:', error)
      toast.error('Failed to delete photo')
    }
  }

  return (
    <div className='px-6 pt-4 pb-20'>
      {loading ? (
        <>
          <ProgressTabsSkeleton />
          <ProgressChartSkeleton />
          <ProgressStatsSkeleton />
          <ProgressPRsSkeleton />
        </>
      ) : (
        <>
          {error && (
            <div className='mb-4 rounded-xl border px-4 py-2 text-sm bg-red-500/10 border-red-500 text-red-400'>
              {error}
            </div>
          )}

          <div className='mb-4 rounded-2xl app-surface border border-[color:var(--app-border)] p-1 grid grid-cols-4 gap-1'>
            {TABS.map((item) => (
              <button
                key={item.id}
                type='button'
                onClick={() => setTab(item.id)}
                className={`h-9 rounded-xl text-[12px] font-semibold transition-colors ${
                  tab === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-[color:var(--app-text-muted)] hover:text-[color:var(--app-text)]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {(tab === 'weight' || tab === 'workouts' || tab === 'macros') && (
            <div className='flex items-center justify-between gap-2 mb-3.5'>
              {tab === 'weight' && (
                <button
                  onClick={() => setIsGoalDrawerOpen(true)}
                  className='flex items-center gap-2 px-3 py-2 rounded-xl bg-[#131520] border border-white/10 hover:border-blue-500/30 transition-colors'
                >
                  <Icon name='settings' size={16} color='#9CA3AF' />
                  <span className='text-[12px] text-gray-300 font-semibold'>
                    Manage Goal
                  </span>
                </button>
              )}
              {(tab === 'workouts' || tab === 'macros') && <div />}
              <div className='flex items-center gap-2'>
                {[7, 30].map((d) => (
                  <button
                    key={d}
                    type='button'
                    onClick={() => setRange(d as RangeDays)}
                    className={`h-8 px-3 rounded-lg text-[11px] font-semibold border transition-colors
                    ${
                      range === d
                        ? 'bg-blue-500/15 border-blue-500/40 text-blue-600'
                        : 'app-surface border-[color:var(--app-border)] text-[color:var(--app-text-muted)] hover:text-[color:var(--app-text)]'
                    }`}
                  >
                    {d} days
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === 'weight' && (
            <>
              <div className='app-surface border rounded-[22px] p-[18px] mb-3.5'>
                <div className='flex justify-between items-start mb-3.5'>
                  <div>
                    <div className='text-[12px] text-[color:var(--app-text-muted)] mb-0.5'>
                      Body Weight
                    </div>
                    <div className='text-[26px] font-extrabold text-[color:var(--app-text)] tracking-tight'>
                      {weightStats.currentWeight.toFixed(1)}{' '}
                      <span className='text-[14px] text-[color:var(--app-text-muted)] font-normal'>
                        kg
                      </span>
                    </div>
                    <div
                      className={`text-[12px] flex items-center gap-1 mt-0.5 ${
                        weightStats.delta <= 0
                          ? 'text-green-500'
                          : 'text-orange-400'
                      }`}
                    >
                      <Icon
                        name={
                          weightStats.delta <= 0 ? 'trending' : 'trendingUp'
                        }
                        size={12}
                        color={weightStats.delta <= 0 ? '#10B981' : '#FB923C'}
                      />{' '}
                      {weightTrendText}
                    </div>
                  </div>
                  <div className='text-[12px] text-[color:var(--app-text-muted)] bg-[var(--app-surface-2)] rounded-lg py-1 px-2.5'>
                    {range} days
                  </div>
                </div>

                <svg
                  viewBox={`0 0 ${chartGeometry.W} ${chartGeometry.H}`}
                  className='w-full h-[100px] overflow-visible'
                >
                  <defs>
                    <linearGradient
                      id='weight-grad'
                      x1='0'
                      y1='0'
                      x2='0'
                      y2='1'
                    >
                      <stop offset='0%' stopColor='#3B82F6' stopOpacity='0.4' />
                      <stop offset='100%' stopColor='#3B82F6' stopOpacity='0' />
                    </linearGradient>
                  </defs>

                  {chartGeometry.points.length > 1 && (
                    <polygon
                      points={
                        chartGeometry.points
                          .map((p) => `${p.x},${p.y}`)
                          .join(' ') +
                        ` ${chartGeometry.W - chartGeometry.PAD},${
                          chartGeometry.H
                        } ${chartGeometry.PAD},${chartGeometry.H}`
                      }
                      fill='url(#weight-grad)'
                    />
                  )}

                  <polyline
                    points={chartGeometry.points
                      .map((p) => `${p.x},${p.y}`)
                      .join(' ')}
                    fill='none'
                    stroke='#3B82F6'
                    strokeWidth='2.5'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />

                  {chartGeometry.points.map((p, i) => (
                    <circle
                      key={i}
                      cx={p.x}
                      cy={p.y}
                      r={i === chartGeometry.points.length - 1 ? 5 : 3}
                      fill={
                        i === chartGeometry.points.length - 1
                          ? '#3B82F6'
                          : '#1e2030'
                      }
                      stroke='#3B82F6'
                      strokeWidth='2'
                    />
                  ))}
                </svg>
                {chartDateLabels.length > 0 && (
                  <div className='flex justify-between mt-1.5'>
                    {chartDateLabels.map((label, idx) => (
                      <div
                        key={`${label}-${idx}`}
                        className='text-[10px] text-[color:var(--app-text-muted)]'
                      >
                        {label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className='grid grid-cols-3 gap-2.5 mb-3.5'>
                {[
                  {
                    label: 'Start',
                    val: `${weightStats.startWeight.toFixed(1)} kg`,
                    sub: formatShortDate(weightStats.startDate),
                    color: '#64748B',
                  },
                  {
                    label: 'Current',
                    val: `${weightStats.currentWeight.toFixed(1)} kg`,
                    sub: formatShortDate(weightStats.currentDate),
                    color: '#3B82F6',
                  },
                  {
                    label: 'Goal',
                    val: `${weightStats.goalWeight.toFixed(1)} kg`,
                    sub: 'Target',
                    color: '#10B981',
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className='app-surface border rounded-2xl p-3.5 text-center'
                  >
                    <div className='text-[10px] text-[color:var(--app-text-muted)] uppercase tracking-wider mb-1'>
                      {item.label}
                    </div>
                    <div
                      className='text-[15px] font-extrabold'
                      style={{ color: item.color }}
                    >
                      {item.val}
                    </div>
                    <div className='text-[10px] text-[color:var(--app-text-muted)]'>
                      {item.sub}
                    </div>
                  </div>
                ))}
              </div>

              <div className='app-surface border rounded-[22px] p-[18px] mb-3.5'>
                <div className='text-[13px] font-bold text-[color:var(--app-text)] mb-3'>
                  Log Weight
                </div>
                <div className='grid grid-cols-[1fr_auto] gap-2'>
                  <input
                    type='number'
                    min='20'
                    max='500'
                    step='0.1'
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    className='bg-[var(--app-surface-2)] border border-[color:var(--app-border)] rounded-xl px-3 py-3 text-[color:var(--app-text)] text-[16px]'
                    placeholder='Enter kg'
                  />
                  <button
                    type='button'
                    onClick={handleSaveWeight}
                    disabled={savingWeight}
                    className='px-4 py-3 rounded-xl bg-blue-600 text-white text-[13px] font-semibold disabled:opacity-50'
                  >
                    {savingWeight ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>

              <div className='app-surface border rounded-[22px] p-[18px] mb-3.5'>
                <div className='text-[14px] font-bold text-[color:var(--app-text)] mb-3'>
                  Weight Logs
                </div>

                {weightLogsLoading ? (
                  <div className='text-[13px] text-[color:var(--app-text-muted)]'>
                    Loading logs...
                  </div>
                ) : weightLogs.length === 0 ? (
                  <div className='text-[13px] text-[color:var(--app-text-muted)]'>
                    No weight logs yet.
                  </div>
                ) : (
                  <div className='space-y-2'>
                    {weightLogs.map((log, idx) => {
                      const currentWeight = toNumber(log.weight_kg)
                      const previousWeight =
                        idx < weightLogs.length - 1
                          ? toNumber(weightLogs[idx + 1].weight_kg)
                          : currentWeight
                      const weightChange = currentWeight - previousWeight
                      const hasChange = idx < weightLogs.length - 1 && Math.abs(weightChange) > 0.05

                      return (
                        <div
                          key={log._id}
                          className='app-surface border rounded-xl p-3'
                        >
                          <div className='flex items-center justify-between mb-1'>
                            <div className='text-[13px] text-[color:var(--app-text)] font-semibold'>
                              {new Date(log.recorded_at).toLocaleDateString(
                                undefined,
                                {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                },
                              )}
                            </div>
                            <div className='text-[11px] text-[color:var(--app-text-muted)]'>
                              {new Date(log.recorded_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                          <div className='flex items-center justify-between'>
                            <div className='text-[11px] text-[color:var(--app-text-muted)]'>
                              {hasChange ? (
                                weightChange < 0 ? (
                                  <span className='text-green-500'>
                                    {weightChange.toFixed(1)} kg from previous
                                  </span>
                                ) : (
                                  <span className='text-orange-400'>
                                    +{weightChange.toFixed(1)} kg from previous
                                  </span>
                                )
                              ) : (
                                'Body weight'
                              )}
                            </div>
                            <div className='text-right'>
                              <div className='text-[17px] text-[color:var(--app-text)] font-bold leading-none'>
                                {currentWeight.toFixed(1)}
                              </div>
                              <div className='text-[11px] text-[color:var(--app-text-muted)]'>
                                kg
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {hasMoreWeightLogs && (
                  <div className='mt-3'>
                    <button
                      type='button'
                      onClick={handleLoadMoreWeightLogs}
                      disabled={weightLogsLoading}
                      className='w-full h-10 rounded-xl border border-[color:var(--app-border)] bg-[var(--app-surface-2)] text-[13px] font-semibold text-[color:var(--app-text)] hover:text-[color:var(--app-text)] disabled:opacity-50'
                    >
                      {weightLogsLoading ? 'Loading...' : 'See more'}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {tab === 'workouts' && (
            <>
              <div className='app-surface border rounded-[22px] p-[18px] mb-3.5'>
                <div className='text-[13px] font-bold text-[color:var(--app-text)] mb-1'>
                  Volume This Period
                </div>
                <div className='text-[11px] text-[color:var(--app-text-muted)] mb-3.5'>
                  Total: {workoutDerived.totalVolume.toLocaleString()} kg
                </div>
                <div className='grid grid-cols-2 gap-2.5 mb-3'>
                  <div className='bg-[var(--app-surface-2)] border border-[color:var(--app-border)] rounded-xl p-3'>
                    <div className='text-[10px] text-[color:var(--app-text-muted)] uppercase'>
                      Sessions
                    </div>
                    <div className='text-[20px] text-[color:var(--app-text)] font-extrabold'>
                      {workoutDerived.totalSessions}
                    </div>
                  </div>
                  <div className='bg-[var(--app-surface-2)] border border-[color:var(--app-border)] rounded-xl p-3'>
                    <div className='text-[10px] text-[color:var(--app-text-muted)] uppercase'>
                      Volume
                    </div>
                    <div className='text-[20px] text-[color:var(--app-text)] font-extrabold'>
                      {workoutDerived.totalVolume.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div
                  className={`flex items-end h-[70px] overflow-hidden ${
                    isDenseWorkoutChart ? 'gap-0.5' : 'gap-1.5'
                  }`}
                >
                  {workoutDerived.volumeSeries.map((value, idx, arr) => {
                    const max = Math.max(1, ...arr)
                    const h = Math.max(6, Math.round((value / max) * 60))
                    const showLabel =
                      !isDenseWorkoutChart ||
                      idx === 0 ||
                      idx === arr.length - 1 ||
                      idx % 5 === 0
                    return (
                      <div
                        key={idx}
                        className='flex-1 flex flex-col items-center justify-end'
                      >
                        <div
                          className='w-full rounded-md bg-blue-500/70'
                          style={{ height: `${h}px` }}
                        />
                        <div className='text-[10px] text-[color:var(--app-text-muted)] mt-1 leading-none min-h-[10px]'>
                          {showLabel ? workoutDerived.dayLabels[idx] : ''}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className='app-surface border rounded-[22px] p-[18px]'>
                <div className='flex items-center gap-2 mb-3.5'>
                  <Icon name='award' size={16} color='#F59E0B' />
                  <span className='text-[14px] font-bold text-[color:var(--app-text)]'>
                    Personal Records
                  </span>
                </div>

                {workoutDerived.prs.length === 0 ? (
                  <div className='text-[13px] text-[color:var(--app-text-muted)]'>
                    No PR data available yet.
                  </div>
                ) : (
                  workoutDerived.prs.map((item) => (
                    <div
                      key={item.exercise}
                      className='flex justify-between py-2.5 border-b border-[color:var(--app-border)] last:border-0'
                    >
                      <span className='text-[13px] text-[color:var(--app-text)]'>
                        {item.exercise}
                      </span>
                      <div className='text-right'>
                        <div className='text-[13px] font-bold text-amber-500'>
                          {item.weight} kg x {item.reps || 0}
                        </div>
                        <div className='text-[11px] text-[color:var(--app-text-muted)]'>
                          {formatShortDate(item.date)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* Goal Weight Management Drawer */}
          {isGoalDrawerOpen && (
            <div className='fixed inset-0 z-50 flex items-end justify-center'>
              {/* Backdrop */}
              <div
                className='absolute inset-0 bg-black/60 backdrop-blur-sm'
                onClick={() => {
                  setIsGoalDrawerOpen(false)
                  // Reset to saved goal when closing without saving
                  setGoalWeightInput(
                    goals?.weight_goal_kg ? String(goals.weight_goal_kg) : '80'
                  )
                }}
              />

              {/* Drawer */}
              <div className='relative w-full max-w-lg bg-[#131520] rounded-t-3xl border-t border-x border-white/10 shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto'>
                {/* Handle */}
                <div className='flex justify-center pt-3 pb-2 sticky top-0 bg-[#131520] z-10'>
                  <div className='w-10 h-1 bg-white/20 rounded-full' />
                </div>

                {/* Header */}
                <div className='px-5 pt-1 pb-3 border-b border-white/5 sticky top-9 bg-[#131520] z-10'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <h2 className='text-[18px] font-bold text-white'>
                        Goal Weight
                      </h2>
                      <p className='text-[12px] text-gray-400 mt-0.5'>
                        Set your target weight goal
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setIsGoalDrawerOpen(false)
                        // Reset to saved goal when closing without saving
                        setGoalWeightInput(
                          goals?.weight_goal_kg ? String(goals.weight_goal_kg) : '80'
                        )
                      }}
                      className='w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors'
                    >
                      <Icon name='x' size={16} color='#64748B' />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className='px-5 py-5'>
                  {/* Current Goal Display */}
                  <div className='bg-gradient-to-br from-blue-600/20 via-blue-500/10 to-cyan-500/20 border border-blue-500/30 rounded-2xl p-4 mb-5'>
                    <div className='text-[11px] text-blue-300 font-semibold uppercase tracking-wide mb-2'>
                      Current Goal
                    </div>
                    <div className='flex items-end gap-2'>
                      <div className='text-[32px] text-white font-extrabold leading-none'>
                        {Number(goalWeightInput || goals?.weight_goal_kg || 80).toFixed(1)}
                      </div>
                      <div className='text-[16px] text-gray-300 mb-1.5'>kg</div>
                    </div>
                    <div className='text-[11px] text-gray-400 mt-1.5'>
                      Set a realistic target based on your goals
                    </div>
                  </div>

                  {/* Slider */}
                  <div className='mb-5'>
                    <label className='text-[12px] text-gray-400 font-semibold uppercase tracking-wide mb-2.5 block'>
                      Adjust Goal
                    </label>
                    <input
                      type='range'
                      min='40'
                      max='150'
                      step='0.5'
                      value={goalWeightInput || goals?.weight_goal_kg || 80}
                      onChange={(e) => setGoalWeightInput(e.target.value)}
                      className='w-full h-2.5 bg-white/10 rounded-lg appearance-none cursor-pointer slider-thumb-blue'
                    />
                    <div className='flex items-center justify-between mt-1.5'>
                      <span className='text-[10px] text-gray-500'>40kg</span>
                      <span className='text-[12px] text-blue-400 font-semibold'>
                        {Number(goalWeightInput || goals?.weight_goal_kg || 80).toFixed(1)}kg
                      </span>
                      <span className='text-[10px] text-gray-500'>150kg</span>
                    </div>
                  </div>

                  {/* Quick Goal Presets */}
                  <div className='mb-5'>
                    <label className='text-[12px] text-gray-400 font-semibold uppercase tracking-wide mb-2.5 block'>
                      Quick Presets
                    </label>
                    <div className='grid grid-cols-4 gap-2'>
                      {[60, 70, 80, 90].map((preset) => (
                        <button
                          key={preset}
                          type='button'
                          onClick={() => setGoalWeightInput(String(preset))}
                          className={`py-2 rounded-xl text-[11px] font-semibold border transition-all ${
                            Number(goalWeightInput || 0) === preset
                              ? 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                              : 'bg-[#1a1f35] border-white/10 text-gray-400 hover:border-blue-500/30'
                          }`}
                        >
                          {preset}kg
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Save Button */}
                  <button
                    type='button'
                    onClick={async () => {
                      await handleSaveGoalWeight()
                      setIsGoalDrawerOpen(false)
                    }}
                    disabled={savingGoalWeight}
                    className='w-full py-3.5 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white text-[14px] font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95'
                  >
                    {savingGoalWeight ? 'Saving...' : 'Save Goal'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'macros' && (
            <div className='app-surface border rounded-[22px] p-[18px]'>
              <div className='text-[14px] font-bold text-[color:var(--app-text)] mb-3.5'>
                Macro Trends
              </div>
              <div className='grid grid-cols-2 gap-2.5'>
                <div className='bg-[var(--app-surface-2)] border border-[color:var(--app-border)] rounded-xl p-3'>
                  <div className='text-[10px] text-[color:var(--app-text-muted)] uppercase'>
                    Tracked Days
                  </div>
                  <div className='text-[19px] text-[color:var(--app-text)] font-extrabold'>
                    {macroDerived.trackedDays}
                  </div>
                </div>
                <div className='bg-[var(--app-surface-2)] border border-[color:var(--app-border)] rounded-xl p-3'>
                  <div className='text-[10px] text-[color:var(--app-text-muted)] uppercase'>
                    Avg Calories
                  </div>
                  <div className='text-[19px] text-[color:var(--app-text)] font-extrabold'>
                    {macroDerived.avgCalories}
                  </div>
                </div>
                <div className='bg-[var(--app-surface-2)] border border-[color:var(--app-border)] rounded-xl p-3'>
                  <div className='text-[10px] text-[color:var(--app-text-muted)] uppercase'>
                    Avg Protein
                  </div>
                  <div className='text-[19px] text-[color:var(--app-text)] font-extrabold'>
                    {macroDerived.avgProtein}g
                  </div>
                </div>
                <div className='bg-[var(--app-surface-2)] border border-[color:var(--app-border)] rounded-xl p-3'>
                  <div className='text-[10px] text-[color:var(--app-text-muted)] uppercase'>
                    Avg Carbs
                  </div>
                  <div className='text-[19px] text-[color:var(--app-text)] font-extrabold'>
                    {macroDerived.avgCarbs}g
                  </div>
                </div>
                <div className='bg-[var(--app-surface-2)] border border-[color:var(--app-border)] rounded-xl p-3 col-span-2'>
                  <div className='text-[10px] text-[color:var(--app-text-muted)] uppercase'>
                    Avg Fat
                  </div>
                  <div className='text-[19px] text-[color:var(--app-text)] font-extrabold'>
                    {macroDerived.avgFat}g
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'photos' && (
            <>
              {loading ? (
                <ProgressPhotosGridSkeleton />
              ) : (
                <>
                  {/* Upload Buttons */}
                  <div className='mb-4 grid grid-cols-2 gap-2'>
                    <label
                      htmlFor='photo-camera'
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[13px] font-semibold transition-colors ${
                        uploadingPhoto
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-blue-500/30 cursor-pointer active:scale-95'
                      }`}
                    >
                      {uploadingPhoto ? (
                        <>
                          <div className='w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin' />
                        </>
                      ) : (
                        <>
                          <Icon name='camera' size={16} color='currentColor' />
                          Take Photo
                        </>
                      )}
                    </label>
                    <label
                      htmlFor='photo-gallery'
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[13px] font-semibold transition-colors ${
                        uploadingPhoto
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-blue-500/30 cursor-pointer active:scale-95'
                      }`}
                    >
                      {uploadingPhoto ? (
                        <>
                          <div className='w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin' />
                        </>
                      ) : (
                        <>
                          <Icon name='image' size={16} color='currentColor' />
                          From Gallery
                        </>
                      )}
                    </label>
                    <input
                      id='photo-camera'
                      type='file'
                      accept='image/*'
                      capture='environment'
                      className='hidden'
                      disabled={uploadingPhoto}
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return

                        // Check file size (max 50MB before compression)
                        if (file.size > 50 * 1024 * 1024) {
                          toast.error('Image too large. Max size is 50MB')
                          e.target.value = ''
                          return
                        }

                        setUploadingPhoto(true)
                        try {
                          // Compress image before uploading
                          const compressedImage = await new Promise<string>(
                            (resolve, reject) => {
                              const reader = new FileReader()
                              reader.onload = (event) => {
                                const img = new Image()
                                img.onload = () => {
                                  const canvas = document.createElement('canvas')
                                  let width = img.width
                                  let height = img.height

                                  // Resize if image is too large (max 1920px on longest side)
                                  const maxDimension = 1920
                                  if (width > maxDimension || height > maxDimension) {
                                    if (width > height) {
                                      height = (height / width) * maxDimension
                                      width = maxDimension
                                    } else {
                                      width = (width / height) * maxDimension
                                      height = maxDimension
                                    }
                                  }

                                  canvas.width = width
                                  canvas.height = height

                                  const ctx = canvas.getContext('2d')
                                  ctx?.drawImage(img, 0, 0, width, height)

                                  // Compress to JPEG with 0.85 quality
                                  const compressedDataUrl = canvas.toDataURL(
                                    'image/jpeg',
                                    0.85,
                                  )
                                  resolve(compressedDataUrl)
                                }
                                img.onerror = reject
                                img.src = event.target?.result as string
                              }
                              reader.onerror = reject
                              reader.readAsDataURL(file)
                            },
                          )

                          const { getAuthToken } = await import(
                            '@/lib/auth/auth-token'
                          )
                          const { apiClient } = await import('@/lib/api/client')
                          const token = await getAuthToken()
                          if (!token) {
                            setUploadingPhoto(false)
                            return
                          }

                          const latestWeight =
                            bodyMetrics[bodyMetrics.length - 1]?.weight_kg

                          const response = await apiClient.post(
                            '/api/metrics/progress-photos',
                            {
                              imageData: compressedImage,
                              taken_at: new Date().toISOString(),
                              weight_kg: latestWeight || undefined,
                            },
                            token,
                          )

                          if (response.success) {
                            toast.success('Progress photo uploaded!')
                            setProgressPhotos([response.data, ...progressPhotos])
                          } else {
                            toast.error(
                              response.error || 'Failed to upload photo',
                            )
                          }
                        } catch (error) {
                          console.error('Error uploading photo:', error)
                          toast.error('Failed to upload photo')
                        } finally {
                          setUploadingPhoto(false)
                          e.target.value = ''
                        }
                      }}
                    />
                    <input
                      id='photo-gallery'
                      type='file'
                      accept='image/*'
                      className='hidden'
                      disabled={uploadingPhoto}
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return

                        // Check file size (max 50MB before compression)
                        if (file.size > 50 * 1024 * 1024) {
                          toast.error('Image too large. Max size is 50MB')
                          e.target.value = ''
                          return
                        }

                        setUploadingPhoto(true)
                        try {
                          // Compress image before uploading
                          const compressedImage = await new Promise<string>(
                            (resolve, reject) => {
                              const reader = new FileReader()
                              reader.onload = (event) => {
                                const img = new Image()
                                img.onload = () => {
                                  const canvas = document.createElement('canvas')
                                  let width = img.width
                                  let height = img.height

                                  // Resize if image is too large (max 1920px on longest side)
                                  const maxDimension = 1920
                                  if (width > maxDimension || height > maxDimension) {
                                    if (width > height) {
                                      height = (height / width) * maxDimension
                                      width = maxDimension
                                    } else {
                                      width = (width / height) * maxDimension
                                      height = maxDimension
                                    }
                                  }

                                  canvas.width = width
                                  canvas.height = height

                                  const ctx = canvas.getContext('2d')
                                  ctx?.drawImage(img, 0, 0, width, height)

                                  // Compress to JPEG with 0.85 quality
                                  const compressedDataUrl = canvas.toDataURL(
                                    'image/jpeg',
                                    0.85,
                                  )
                                  resolve(compressedDataUrl)
                                }
                                img.onerror = reject
                                img.src = event.target?.result as string
                              }
                              reader.onerror = reject
                              reader.readAsDataURL(file)
                            },
                          )

                          const { getAuthToken } = await import(
                            '@/lib/auth/auth-token'
                          )
                          const { apiClient } = await import('@/lib/api/client')
                          const token = await getAuthToken()
                          if (!token) {
                            setUploadingPhoto(false)
                            return
                          }

                          const latestWeight =
                            bodyMetrics[bodyMetrics.length - 1]?.weight_kg

                          const response = await apiClient.post(
                            '/api/metrics/progress-photos',
                            {
                              imageData: compressedImage,
                              taken_at: new Date().toISOString(),
                              weight_kg: latestWeight || undefined,
                            },
                            token,
                          )

                          if (response.success) {
                            toast.success('Progress photo uploaded!')
                            setProgressPhotos([response.data, ...progressPhotos])
                          } else {
                            toast.error(
                              response.error || 'Failed to upload photo',
                            )
                          }
                        } catch (error) {
                          console.error('Error uploading photo:', error)
                          toast.error('Failed to upload photo')
                        } finally {
                          setUploadingPhoto(false)
                          e.target.value = ''
                        }
                      }}
                    />
                  </div>

                  {/* Upload Overlay */}
                  {uploadingPhoto && (
                    <div className='fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in'>
                      <div className='bg-gradient-to-br from-[#131520] to-[#0f1426] rounded-3xl p-8 border border-white/10 shadow-2xl flex flex-col items-center gap-5 max-w-sm mx-4 animate-scale-up'>
                        {/* Animated Upload Icon */}
                        <div className='relative'>
                          {/* Outer spinning ring */}
                          <div className='w-24 h-24 rounded-full border-4 border-blue-500/20 absolute animate-spin-slow' />

                          {/* Inner pulsing ring */}
                          <div className='w-24 h-24 rounded-full border-4 border-t-blue-500 border-r-blue-400 border-b-transparent border-l-transparent animate-spin' />

                          {/* Center icon with pulse */}
                          <div className='absolute inset-0 flex items-center justify-center'>
                            <div className='w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center animate-pulse-slow'>
                              <Icon name='camera' size={28} color='#3B82F6' />
                            </div>
                          </div>
                        </div>

                        {/* Text content */}
                        <div className='text-center space-y-2'>
                          <div className='text-white text-[18px] font-bold'>
                            Uploading Photo
                          </div>
                          <div className='text-gray-400 text-[13px] max-w-[240px]'>
                            Processing your progress photo...
                          </div>
                        </div>

                        {/* Progress dots */}
                        <div className='flex gap-1.5'>
                          <div className='w-2 h-2 rounded-full bg-blue-500 animate-bounce-dot' style={{ animationDelay: '0s' }} />
                          <div className='w-2 h-2 rounded-full bg-blue-500 animate-bounce-dot' style={{ animationDelay: '0.2s' }} />
                          <div className='w-2 h-2 rounded-full bg-blue-500 animate-bounce-dot' style={{ animationDelay: '0.4s' }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Photos Grid */}
                  {progressPhotos.length === 0 ? (
                    <div className='app-surface border rounded-[22px] p-[18px] text-center'>
                      <div className='w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-3'>
                        <Icon name='camera' size={28} color='#60A5FA' />
                      </div>
                      <div className='text-[16px] font-bold text-[color:var(--app-text)] mb-2'>
                        No Progress Photos Yet
                      </div>
                      <div className='text-[13px] text-[color:var(--app-text-muted)]'>
                        Start tracking your transformation by adding your first
                        photo
                      </div>
                    </div>
                  ) : (
                    <div className='grid grid-cols-2 gap-3'>
                      {progressPhotos.map((photo) => (
                        <button
                          key={photo._id}
                          onClick={() => {
                            setSelectedPhoto(photo)
                            setPhotoModalOpen(true)
                          }}
                          className='relative aspect-square rounded-2xl overflow-hidden border border-white/10 hover:border-blue-500/30 transition-all active:scale-95'
                        >
                          <img
                            src={photo.thumbnail_url || photo.photo_url}
                            alt={photo.caption || 'Progress photo'}
                            className='w-full h-full object-cover'
                          />
                          <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent' />
                          <div className='absolute bottom-2 left-2 right-2'>
                            <div className='text-[11px] text-white font-semibold'>
                              {formatShortDate(photo.taken_at)}
                            </div>
                            {photo.weight_kg && (
                              <div className='text-[10px] text-white/80'>
                                {photo.weight_kg.toFixed(1)} kg
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Photo Detail Modal */}
                  {photoModalOpen && selectedPhoto && (
                    <div
                      className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm overflow-y-auto p-4'
                      onClick={() => setPhotoModalOpen(false)}
                    >
                      <div
                        className='relative w-full max-w-lg my-auto'
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setPhotoModalOpen(false)}
                          className='absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors z-10'
                        >
                          <Icon name='x' size={20} color='white' />
                        </button>

                        <img
                          src={selectedPhoto.photo_url}
                          alt={selectedPhoto.caption || 'Progress photo'}
                          className='w-full rounded-2xl'
                        />

                        <div className='mt-4 app-surface border rounded-2xl p-4'>
                          <div className='flex items-center justify-between mb-3'>
                            <div>
                              <div className='text-[14px] font-bold text-[color:var(--app-text)]'>
                                {new Date(
                                  selectedPhoto.taken_at,
                                ).toLocaleDateString('en-US', {
                                  month: 'long',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </div>
                              <div className='text-[11px] text-[color:var(--app-text-muted)] mt-0.5'>
                                {new Date(selectedPhoto.taken_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setPhotoToDelete(selectedPhoto)
                                setDeleteConfirmOpen(true)
                              }}
                              className='w-8 h-8 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors flex items-center justify-center'
                            >
                              <Icon name='trash-2' size={16} color='#F87171' />
                            </button>
                          </div>

                          {selectedPhoto.weight_kg && (
                            <div className='flex items-center gap-2 text-[13px] text-[color:var(--app-text-muted)] mb-2'>
                              <Icon name='activity' size={14} color='#9CA3AF' />
                              Weight: {selectedPhoto.weight_kg.toFixed(1)} kg
                            </div>
                          )}

                          {selectedPhoto.caption && (
                            <div className='text-[13px] text-[color:var(--app-text-muted)] mt-2'>
                              {selectedPhoto.caption}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}

      {/* Delete Photo Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false)
          setPhotoToDelete(null)
        }}
        onConfirm={handleDeletePhoto}
        title="Delete Progress Photo"
        message="Are you sure you want to delete this photo? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  )
}
