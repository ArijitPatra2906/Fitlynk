'use client'

import { useEffect, useMemo, useState } from 'react'
import { Icon } from '@/components/ui/icon'
import {
  ProgressChartSkeleton,
  ProgressPRsSkeleton,
  ProgressStatsSkeleton,
  ProgressTabsSkeleton,
} from '@/components/ui/skeleton'
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
  const isDenseWorkoutChart = range === 30

  const refreshData = async (selectedRange: RangeDays) => {
    setError('')
    const { getAuthToken } = await import('@/lib/auth/auth-token')
    const { apiClient } = await import('@/lib/api/client')
    const token = await getAuthToken()

    if (!token) return

    const { startDate, endDate } = buildDateRange(selectedRange === 30 ? 30 : 7)

    const [goalRes, userRes, bodyRes, workoutRes, mealRes] = await Promise.all([
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

    const bodyRows: BodyMetricRow[] = Array.isArray(bodyRes.data)
      ? bodyRes.data
      : Array.isArray((bodyRes.data as any)?.logs)
        ? ((bodyRes.data as any).logs as BodyMetricRow[])
        : []
    const goalsData = (goalRes.data || null) as GoalRow | null
    setGoals(goalsData)
    setUser(userRes.data || null)
    setBodyMetrics(bodyRows)
    setWorkouts(normalizeWorkouts(workoutRes.data))
    setMeals(normalizeMeals(mealRes.data))

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

  const weightValues = useMemo(
    () => dailyMetrics.map((m) => toNumber(m.weight_kg)),
    [dailyMetrics],
  )
  const chartDateLabels = useMemo(() => {
    return dailyMetrics.map((m) =>
      new Date(m.recorded_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      }),
    )
  }, [dailyMetrics])

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
    const startRow = rows[0]
    const currentRow = rows[rows.length - 1]
    const startWeight = toNumber(startRow?.weight_kg, toNumber(user?.weight_kg))
    const currentWeight = toNumber(
      currentRow?.weight_kg,
      toNumber(user?.weight_kg),
    )
    const delta = currentWeight - startWeight
    return {
      startWeight,
      currentWeight,
      delta,
      startDate: startRow?.recorded_at,
      currentDate: currentRow?.recorded_at || new Date().toISOString(),
      goalWeight: toNumber(goals?.weight_goal_kg, currentWeight),
    }
  }, [dailyMetrics, goals?.weight_goal_kg, user?.weight_kg])

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
            <div className='flex items-center justify-end gap-2 mb-3.5'>
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
                        ` ${chartGeometry.W - chartGeometry.PAD},${chartGeometry.H} ${chartGeometry.PAD},${chartGeometry.H}`
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
                    <div className='text-[10px] text-[color:var(--app-text-muted)]'>{item.sub}</div>
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
                <div className='text-[13px] font-bold text-[color:var(--app-text)] mb-3'>
                  Goal Weight
                </div>
                <div className='grid grid-cols-[1fr_auto] gap-2'>
                  <input
                    type='number'
                    min='20'
                    max='500'
                    step='0.1'
                    value={goalWeightInput}
                    onChange={(e) => setGoalWeightInput(e.target.value)}
                    className='bg-[var(--app-surface-2)] border border-[color:var(--app-border)] rounded-xl px-3 py-3 text-[color:var(--app-text)] text-[16px]'
                    placeholder='Set target kg'
                  />
                  <button
                    type='button'
                    onClick={handleSaveGoalWeight}
                    disabled={savingGoalWeight}
                    className='px-4 py-3 rounded-xl bg-emerald-600 text-white text-[13px] font-semibold disabled:opacity-50'
                  >
                    {savingGoalWeight ? 'Saving...' : 'Save Goal'}
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
                    {weightLogs.map((log) => (
                      <div
                        key={log._id}
                        className='bg-[var(--app-surface-2)] border border-[color:var(--app-border)] rounded-xl px-3 py-2.5 flex items-center justify-between'
                      >
                        <div>
                          <div className='text-[12px] text-[color:var(--app-text)]'>
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
                        <div className='text-right'>
                          <div className='text-[17px] font-bold text-[color:var(--app-text)] leading-none'>
                            {toNumber(log.weight_kg).toFixed(1)}
                          </div>
                          <div className='text-[11px] text-[color:var(--app-text-muted)]'>kg</div>
                        </div>
                      </div>
                    ))}
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
            <div className='app-surface border rounded-[22px] p-[18px]'>
              <div className='text-[14px] font-bold text-[color:var(--app-text)] mb-1'>
                Progress Photos
              </div>
              <div className='text-[12px] text-[color:var(--app-text-muted)]'>
                Photo timeline is coming soon. Weight, macro, and workout trends
                are live.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
