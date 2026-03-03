'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/icon'
import { Pagination } from '@/components/ui/pagination'
import { StepsPageSkeleton } from '@/components/ui/skeleton'
import {
  stepTracker,
  type StepActivityStats,
} from '@/lib/services/step-tracker'
import { toast } from 'sonner'

type StepFilter = 7 | 30

interface StepLogRow {
  _id: string
  date: string
  steps: number
  source?: 'manual' | 'device' | 'synced'
  distance_km?: number
  calories_burned?: number
  active_minutes?: number
  slow_minutes?: number
  brisk_minutes?: number
  slow_steps?: number
  brisk_steps?: number
}

interface GoalPayload {
  goal_type: 'lose' | 'maintain' | 'gain'
  calorie_target: number
  protein_g: number
  carbs_g: number
  fat_g: number
  activity_level:
    | 'sedentary'
    | 'light'
    | 'moderate'
    | 'very_active'
    | 'extra_active'
  step_target?: number
}

const DEFAULT_STEP_GOAL = 10000
const PAGE_SIZE = 10

const getDateKey = (date: Date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const buildDateRange = (days: number) => {
  const end = new Date()
  end.setHours(0, 0, 0, 0)
  const start = new Date(end)
  start.setDate(start.getDate() - (days - 1))
  return {
    startDate: getDateKey(start),
    endDate: getDateKey(end),
  }
}

const formatDayTitle = (isoDate: string) => {
  const d = new Date(isoDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const target = new Date(d)
  target.setHours(0, 0, 0, 0)

  if (target.getTime() === today.getTime()) return 'Today'
  if (target.getTime() === yesterday.getTime()) return 'Yesterday'

  const weekday = d.toLocaleDateString(undefined, { weekday: 'short' })
  const month = d.toLocaleDateString(undefined, { month: 'short' })
  return `${weekday}, ${d.getDate()} ${month}`
}

interface StepDayGroup {
  dayKey: string
  steps: number
  distance_km: number
  calories_burned: number
  active_minutes: number
  source?: StepLogRow['source']
  entries: StepLogRow[]
}

const buildFallbackStats = (steps: number): StepActivityStats => {
  const safeSteps = Math.max(0, steps)
  const slowSteps = Math.round(safeSteps * 0.62)
  const briskSteps = Math.max(0, safeSteps - slowSteps)
  const slowMinutes = Math.round(slowSteps / 85)
  const briskMinutes = Math.round(briskSteps / 130)
  const activeMinutes = slowMinutes + briskMinutes
  const distanceKm = Math.round(((safeSteps * 0.762) / 1000) * 100) / 100
  const caloriesBurned = Math.round(safeSteps * 0.04)

  return {
    steps: safeSteps,
    slowSteps,
    briskSteps,
    slowMinutes,
    briskMinutes,
    activeMinutes,
    distanceKm,
    caloriesBurned,
  }
}

const mergePreferHigherSteps = (
  primary: StepActivityStats,
  secondary: StepActivityStats,
): StepActivityStats => {
  return secondary.steps > primary.steps ? secondary : primary
}

const percent = (part: number, total: number) => {
  if (total <= 0) return 0
  return Math.round((part / total) * 100)
}

export default function StepsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [logsLoading, setLogsLoading] = useState(false)
  const [savingGoal, setSavingGoal] = useState(false)
  const [savingSteps, setSavingSteps] = useState(false)
  const [error, setError] = useState('')

  const [filter, setFilter] = useState<StepFilter>(7)
  const [page, setPage] = useState(1)
  const [stepGoal, setStepGoal] = useState(DEFAULT_STEP_GOAL)
  const [manualSteps, setManualSteps] = useState('0')
  const [todayStats, setTodayStats] = useState<StepActivityStats>(
    buildFallbackStats(0),
  )
  const [goalPayload, setGoalPayload] = useState<GoalPayload>({
    goal_type: 'maintain',
    calorie_target: 2400,
    protein_g: 180,
    carbs_g: 280,
    fat_g: 80,
    activity_level: 'moderate',
    step_target: DEFAULT_STEP_GOAL,
  })
  const [logs, setLogs] = useState<StepLogRow[]>([])
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
  })

  const progressPercent = useMemo(() => {
    if (stepGoal <= 0) return 0
    return Math.max(
      0,
      Math.min(100, Math.round((todayStats.steps / stepGoal) * 100)),
    )
  }, [todayStats.steps, stepGoal])

  const slowPct = useMemo(
    () => percent(todayStats.slowSteps, todayStats.steps),
    [todayStats],
  )
  const briskPct = useMemo(() => Math.max(0, 100 - slowPct), [slowPct])

  const groupedLogs = useMemo<StepDayGroup[]>(() => {
    const map = new Map<string, StepDayGroup>()

    logs.forEach((log) => {
      const d = new Date(log.date)
      const dayKey = getDateKey(d)

      const active =
        Number(log.active_minutes || 0) ||
        (Number(log.slow_minutes || 0) + Number(log.brisk_minutes || 0))

      const existing = map.get(dayKey)
      if (existing) {
        existing.steps += Number(log.steps || 0)
        existing.distance_km += Number(log.distance_km || 0)
        existing.calories_burned += Number(log.calories_burned || 0)
        existing.active_minutes += Number(active || 0)
        existing.entries.push(log)
      } else {
        map.set(dayKey, {
          dayKey,
          steps: Number(log.steps || 0),
          distance_km: Number(log.distance_km || 0),
          calories_burned: Number(log.calories_burned || 0),
          active_minutes: Number(active || 0),
          source: log.source,
          entries: [log],
        })
      }
    })

    return Array.from(map.values()).sort((a, b) =>
      b.dayKey.localeCompare(a.dayKey),
    )
  }, [logs])

  const fetchStepLogs = useCallback(
    async (token: string, nextFilter: StepFilter, nextPage: number) => {
      setLogsLoading(true)
      try {
        const { apiClient } = await import('@/lib/api/client')
        const { startDate, endDate } = buildDateRange(nextFilter)

        const res = await apiClient.get(
          `/api/metrics/steps?startDate=${startDate}&endDate=${endDate}&page=${nextPage}&limit=${PAGE_SIZE}`,
          token,
        )

        if (!res.success) {
          throw new Error(res.error || 'Failed to fetch step logs')
        }

        const payload = res.data || {}
        const items = Array.isArray(payload.logs) ? payload.logs : []
        const pager = payload.pagination || {}

        setLogs(items)
        setPagination({
          total: Number(pager.total || 0),
          totalPages: Math.max(1, Number(pager.totalPages || 1)),
        })
      } catch (e: any) {
        setError(e.message || 'Failed to fetch step logs')
      } finally {
        setLogsLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true)
        setError('')
        const { getAuthToken } = await import('@/lib/auth/auth-token')
        const { apiClient } = await import('@/lib/api/client')
        const token = await getAuthToken()

        if (!token) {
          router.push('/login')
          return
        }

        const goalsRes = await apiClient.get(
          '/api/metrics/goals/current',
          token,
        )
        const currentGoal =
          goalsRes.success && goalsRes.data ? goalsRes.data : null

        const resolvedStepGoal = Number(
          currentGoal?.step_target || DEFAULT_STEP_GOAL,
        )
        setStepGoal(resolvedStepGoal)
        setGoalPayload({
          goal_type: currentGoal?.goal_type || 'maintain',
          calorie_target: currentGoal?.calorie_target || 2400,
          protein_g: currentGoal?.protein_g || 180,
          carbs_g: currentGoal?.carbs_g || 280,
          fat_g: currentGoal?.fat_g || 80,
          activity_level: currentGoal?.activity_level || 'moderate',
          step_target: resolvedStepGoal,
        })

        const backendToday = await stepTracker.getTodayStepsFromBackend()
        let stats = buildFallbackStats(backendToday)

        if (stepTracker.isSupported()) {
          const hasPermission = await stepTracker.requestPermissions()
          if (hasPermission) {
            try {
              const deviceStats = await stepTracker.getTodayActivityStats()
              stats = mergePreferHigherSteps(stats, deviceStats)
              await stepTracker.syncSteps(stats.steps)
            } catch (e) {
              console.error('[Steps] Failed to refresh from device:', e)
            }
          }
        }

        setTodayStats(stats)
        setManualSteps('0')
      } catch (e: any) {
        setError(e.message || 'Failed to load steps')
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [router])

  useEffect(() => {
    const refreshList = async () => {
      const { getAuthToken } = await import('@/lib/auth/auth-token')
      const token = await getAuthToken()
      if (!token) return
      await fetchStepLogs(token, filter, page)
    }

    refreshList()
  }, [page, filter, fetchStepLogs])

  const handleFilterChange = (next: StepFilter) => {
    setFilter(next)
    setPage(1)
  }

  const handleGoalSave = async () => {
    try {
      setSavingGoal(true)
      setError('')

      const { getAuthToken } = await import('@/lib/auth/auth-token')
      const { apiClient } = await import('@/lib/api/client')
      const token = await getAuthToken()

      if (!token) {
        router.push('/login')
        return
      }

      const response = await apiClient.post(
        '/api/metrics/goals',
        {
          ...goalPayload,
          step_target: stepGoal,
        },
        token,
      )

      if (!response.success) {
        throw new Error(response.error || 'Failed to save step goal')
      }

      setGoalPayload((prev) => ({ ...prev, step_target: stepGoal }))
      toast.success('Step goal saved')
    } catch (e: any) {
      toast.error(e.message || 'Failed to save step goal')
    } finally {
      setSavingGoal(false)
    }
  }

  const handleManualSave = async () => {
    try {
      setSavingSteps(true)
      setError('')

      const parsedSteps = Math.max(0, parseInt(manualSteps || '0', 10) || 0)
      const manualStats = buildFallbackStats(parsedSteps)

      const { getAuthToken } = await import('@/lib/auth/auth-token')
      const { apiClient } = await import('@/lib/api/client')
      const token = await getAuthToken()

      if (!token) {
        router.push('/login')
        return
      }

      const payload = {
        steps: parsedSteps,
        date: new Date(),
        source: 'manual' as const,
        distance_km: manualStats.distanceKm,
        calories_burned: manualStats.caloriesBurned,
        active_minutes: manualStats.activeMinutes,
        slow_minutes: manualStats.slowMinutes,
        brisk_minutes: manualStats.briskMinutes,
        slow_steps: manualStats.slowSteps,
        brisk_steps: manualStats.briskSteps,
      }

      const res = await apiClient.post('/api/metrics/steps', payload, token)
      if (!res.success) {
        throw new Error(res.error || 'Failed to save steps')
      }

      setTodayStats(manualStats)
      setManualSteps('0')
      toast.success('Steps saved')
      await fetchStepLogs(token, filter, page)
    } catch (e: any) {
      toast.error(e.message || 'Failed to save steps')
    } finally {
      setSavingSteps(false)
    }
  }

  const handleSyncFromDevice = async () => {
    try {
      setError('')
      if (!stepTracker.isSupported()) {
        toast.error('Device step sensor is not available on this platform')
        return
      }

      const hasPermission = await stepTracker.requestPermissions()
      if (!hasPermission) {
        toast.error('Activity permission is required to sync device steps')
        return
      }

      const backendToday = await stepTracker.getTodayStepsFromBackend()
      const backendStats = buildFallbackStats(backendToday)
      const deviceStats = await stepTracker.getTodayActivityStats()
      const stats = mergePreferHigherSteps(backendStats, deviceStats)
      await stepTracker.syncSteps(stats.steps)
      setTodayStats(stats)
      setManualSteps('0')

      const { getAuthToken } = await import('@/lib/auth/auth-token')
      const token = await getAuthToken()
      if (token) {
        await fetchStepLogs(token, filter, page)
      }

      toast.success('Synced from device')
    } catch (e: any) {
      toast.error(e.message || 'Failed to sync from device')
    }
  }

  return (
    <>
      {loading ? (
        <StepsPageSkeleton />
      ) : (
        <div className='px-6 pt-4 pb-24'>
          {error && (
            <div className='mb-4 rounded-xl border px-4 py-2 text-sm bg-red-500/10 border-red-500 text-red-400'>
              {error}
            </div>
          )}

          <div className='bg-gradient-to-br from-[#1a1f35] to-[#0d1b3e] border border-blue-500/20 rounded-2xl p-3.5 mb-4'>
            <div className='relative'>
              <svg viewBox='0 0 240 140' className='w-full h-[118px]'>
                <path
                  d='M20 120 A100 100 0 0 1 220 120'
                  fill='none'
                  stroke='#2A3150'
                  strokeWidth='10'
                  strokeLinecap='round'
                  pathLength='100'
                  strokeDasharray='0.8 2.2'
                />
                <path
                  d='M20 120 A100 100 0 0 1 220 120'
                  fill='none'
                  stroke='#3B82F6'
                  strokeWidth='8'
                  strokeLinecap='round'
                  pathLength='100'
                  strokeDasharray={`${Math.max(2, progressPercent)} 100`}
                />
              </svg>

              <div className='absolute inset-0 flex flex-col items-center justify-center -mt-1'>
                <div className='text-[12px] text-gray-300'>Steps</div>
                <div className='text-[34px] leading-none font-semibold text-white tracking-tight'>
                  {todayStats.steps.toLocaleString()}
                </div>
              </div>
            </div>

            <div className='flex items-end justify-between text-[16px] text-white font-semibold mt-[-2px]'>
              <div>
                {todayStats.slowSteps.toLocaleString()}{' '}
                <span className='text-[13px] text-gray-300'>{slowPct}%</span>
              </div>
              <div>
                {todayStats.briskSteps.toLocaleString()}{' '}
                <span className='text-[13px] text-gray-300'>{briskPct}%</span>
              </div>
            </div>

            <div className='w-full h-2 rounded-full overflow-hidden bg-[#1e2030] mt-2 mb-1'>
              <div className='h-full flex'>
                <div
                  className='h-full bg-[#818CF8]'
                  style={{ width: `${slowPct}%` }}
                />
                <div
                  className='h-full bg-[#3B82F6]'
                  style={{ width: `${briskPct}%` }}
                />
              </div>
            </div>

            <div className='flex items-center justify-between text-[11px] text-gray-300 mb-2.5'>
              <div>Slow walking</div>
              <div>Brisk walking</div>
            </div>

            <div className='border-t border-blue-500/20 pt-3 grid grid-cols-2 gap-3'>
              <div className='text-center'>
                <div className='text-[11px] text-gray-400'>Distance</div>
                <div className='text-[24px] leading-none text-white font-semibold tracking-tight'>
                  {todayStats.distanceKm.toFixed(2)}
                </div>
                <div className='text-[11px] text-gray-300 mt-1'>km</div>
              </div>
              <div className='text-center border-l border-blue-500/20'>
                <div className='text-[11px] text-gray-400'>Calories</div>
                <div className='text-[24px] leading-none text-white font-semibold tracking-tight'>
                  {todayStats.caloriesBurned}
                </div>
                <div className='text-[11px] text-gray-300 mt-1'>kcal</div>
              </div>
            </div>
          </div>

          <div className='bg-[#131520] border border-white/10 rounded-2xl p-4 mb-4'>
            <div className='flex items-center justify-between mb-3'>
              <div className='text-[14px] text-white font-bold'>Step Goal</div>
              <div className='text-[16px] font-bold text-blue-400'>
                {stepGoal.toLocaleString()}
              </div>
            </div>
            <input
              type='range'
              min='1000'
              max='50000'
              step='500'
              value={stepGoal}
              onChange={(e) => setStepGoal(parseInt(e.target.value, 10))}
              className='w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer'
            />
            <button
              type='button'
              onClick={handleGoalSave}
              disabled={savingGoal}
              className='mt-3 w-full py-3 rounded-xl bg-blue-600 text-white text-[14px] font-semibold disabled:opacity-50'
            >
              {savingGoal ? 'Saving...' : 'Save Step Goal'}
            </button>
          </div>

          <div className='bg-[#131520] border border-white/10 rounded-2xl p-4 mb-4'>
            <div className='text-[14px] text-white font-bold mb-3'>
              Log Today Steps
            </div>
            <div className='flex gap-2 mb-3'>
              {[1000, 2500, 5000].map((amount) => (
                <button
                  key={amount}
                  type='button'
                  onClick={() => setManualSteps(String(amount))}
                  className={`flex-1 border rounded-lg py-2 text-[12px] font-semibold ${
                    Number(manualSteps) === amount
                      ? 'bg-blue-600/20 border-blue-500/40 text-blue-200'
                      : 'bg-[#1a1f35] border-white/10 text-blue-300'
                  }`}
                >
                  +{amount}
                </button>
              ))}
            </div>
            <input
              type='number'
              min='0'
              value={manualSteps}
              onChange={(e) => setManualSteps(e.target.value)}
              className='w-full bg-[#1a1f35] border border-white/10 rounded-xl px-3 py-3 text-white text-[16px] mb-3'
            />
            <div className='grid grid-cols-2 gap-2'>
              <button
                type='button'
                onClick={handleSyncFromDevice}
                className='py-3 rounded-xl bg-white/5 border border-white/10 text-[13px] font-semibold text-white'
              >
                Sync Device
              </button>
              <button
                type='button'
                onClick={handleManualSave}
                disabled={savingSteps}
                className='py-3 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-[13px] font-semibold text-white disabled:opacity-50'
              >
                {savingSteps ? 'Saving...' : 'Save Steps'}
              </button>
            </div>
          </div>

          <div className='flex items-center justify-between mb-3'>
            <div className='text-[15px] text-white font-bold'>Step Logs</div>
            <div className='flex gap-2'>
              <button
                type='button'
                onClick={() => handleFilterChange(7)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold ${
                  filter === 7
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#131520] border border-white/10 text-gray-300'
                }`}
              >
                Last 7 days
              </button>
              <button
                type='button'
                onClick={() => handleFilterChange(30)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold ${
                  filter === 30
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#131520] border border-white/10 text-gray-300'
                }`}
              >
                Last 30 days
              </button>
            </div>
          </div>

          {logsLoading ? (
            <div className='text-gray-400 text-sm'>Loading logs...</div>
          ) : groupedLogs.length === 0 ? (
            <div className='text-gray-400 text-sm'>
              No step logs in this range.
            </div>
          ) : (
            <div className='space-y-2'>
              {groupedLogs.map((log) => {
                const hitGoal = log.steps >= stepGoal
                return (
                  <div
                    key={log.dayKey}
                    className='bg-[#131520] border border-white/10 rounded-xl p-3'
                  >
                    <div className='flex items-center justify-between mb-1'>
                      <div className='text-[13px] text-white font-semibold'>
                        {formatDayTitle(log.dayKey)}
                      </div>
                    </div>
                    <div className='flex items-center justify-between'>
                      <div className='text-[11px] text-gray-400'>
                        {hitGoal ? 'Goal achieved' : 'Goal not achieved'}
                      </div>
                      <div className='text-right'>
                        {hitGoal && (
                          <div className='flex justify-end mb-0.5'>
                            <Icon name='crown' size={15} color='#F59E0B' />
                          </div>
                        )}
                        <div className='text-[17px] text-white font-bold leading-none'>
                          {log.steps.toLocaleString()}
                        </div>
                        <div className='text-[11px] text-gray-400'>steps</div>
                      </div>
                    </div>
                    <div className='mt-2 pt-2 border-t border-white/5 grid grid-cols-3 gap-2 text-center'>
                      <div>
                        <div className='text-[10px] text-gray-500'>
                          Distance
                        </div>
                        <div className='text-[12px] text-gray-200 font-semibold'>
                          {(log.distance_km || 0).toFixed(2)} km
                        </div>
                      </div>
                      <div>
                        <div className='text-[10px] text-gray-500'>
                          Calories
                        </div>
                        <div className='text-[12px] text-gray-200 font-semibold'>
                          {Math.round(log.calories_burned || 0)} kcal
                        </div>
                      </div>
                      <div>
                        <div className='text-[10px] text-gray-500'>Time</div>
                        <div className='text-[12px] text-gray-200 font-semibold'>
                          {Math.max(0, Number(log.active_minutes || 0))} min
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {pagination.total > PAGE_SIZE && (
            <div className='mt-4'>
              <Pagination
                currentPage={page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      )}
    </>
  )
}
