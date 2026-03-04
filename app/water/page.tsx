'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/icon'
import { Pagination } from '@/components/ui/pagination'
import { WaterPageSkeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

type WaterFilter = 7 | 30

interface WaterLogRow {
  _id: string
  date: string
  amount_ml: number
  created_at?: string
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
  water_target_ml?: number
}

const DEFAULT_WATER_GOAL_ML = 3000
const PAGE_SIZE = 10
const MAX_WATER_LOG_ML = 50000

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

const formatTime = (iso?: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function WaterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [logsLoading, setLogsLoading] = useState(false)
  const [savingGoal, setSavingGoal] = useState(false)
  const [savingWater, setSavingWater] = useState(false)
  const [error, setError] = useState('')

  const [filter, setFilter] = useState<WaterFilter>(7)
  const [page, setPage] = useState(1)
  const [waterGoalMl, setWaterGoalMl] = useState(DEFAULT_WATER_GOAL_ML)
  const [todayTotalMl, setTodayTotalMl] = useState(0)
  const [manualAmount, setManualAmount] = useState('250')
  const [goalPayload, setGoalPayload] = useState<GoalPayload>({
    goal_type: 'maintain',
    calorie_target: 2400,
    protein_g: 180,
    carbs_g: 280,
    fat_g: 80,
    activity_level: 'moderate',
    step_target: 10000,
    water_target_ml: DEFAULT_WATER_GOAL_ML,
  })
  const [logs, setLogs] = useState<WaterLogRow[]>([])
  const [expandedDay, setExpandedDay] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
  })

  const progressPercent = useMemo(() => {
    if (waterGoalMl <= 0) return 0
    return Math.max(
      0,
      Math.min(100, Math.round((todayTotalMl / waterGoalMl) * 100)),
    )
  }, [todayTotalMl, waterGoalMl])

  const groupedLogs = useMemo(() => {
    const map = new Map<
      string,
      { day: string; total_ml: number; entries: WaterLogRow[] }
    >()

    logs.forEach((log) => {
      const key = getDateKey(new Date(log.date))
      const existing = map.get(key)
      if (existing) {
        existing.total_ml += Number(log.amount_ml || 0)
        existing.entries.push(log)
      } else {
        map.set(key, {
          day: key,
          total_ml: Number(log.amount_ml || 0),
          entries: [log],
        })
      }
    })

    return Array.from(map.values()).sort((a, b) => b.day.localeCompare(a.day))
  }, [logs])

  const fetchWaterLogs = useCallback(
    async (token: string, nextFilter: WaterFilter, nextPage: number) => {
      setLogsLoading(true)
      try {
        const { apiClient } = await import('@/lib/api/client')
        const { startDate, endDate } = buildDateRange(nextFilter)

        const res = await apiClient.get(
          `/api/metrics/water?startDate=${startDate}&endDate=${endDate}&page=${nextPage}&limit=${PAGE_SIZE}`,
          token,
        )
        if (!res.success) {
          throw new Error(res.error || 'Failed to fetch water logs')
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
        setError(e.message || 'Failed to fetch water logs')
      } finally {
        setLogsLoading(false)
      }
    },
    [],
  )

  const refreshTodayWater = useCallback(async (token: string) => {
    const { apiClient } = await import('@/lib/api/client')
    const today = getDateKey(new Date())
    const waterRes = await apiClient.get(
      `/api/metrics/water?date=${today}`,
      token,
    )
    if (!waterRes.success) {
      throw new Error(waterRes.error || 'Failed to fetch today water')
    }
    const waterData = waterRes.data || {}
    setTodayTotalMl(Number(waterData.total_ml || 0))
  }, [])

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

        const resolvedWaterGoal = Number(
          currentGoal?.water_target_ml || DEFAULT_WATER_GOAL_ML,
        )

        setWaterGoalMl(resolvedWaterGoal)
        setGoalPayload({
          goal_type: currentGoal?.goal_type || 'maintain',
          calorie_target: currentGoal?.calorie_target || 2400,
          protein_g: currentGoal?.protein_g || 180,
          carbs_g: currentGoal?.carbs_g || 280,
          fat_g: currentGoal?.fat_g || 80,
          activity_level: currentGoal?.activity_level || 'moderate',
          step_target: currentGoal?.step_target || 10000,
          water_target_ml: resolvedWaterGoal,
        })

        await refreshTodayWater(token)
      } catch (e: any) {
        setError(e.message || 'Failed to load water page')
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [refreshTodayWater, router])

  useEffect(() => {
    const refreshLogs = async () => {
      const { getAuthToken } = await import('@/lib/auth/auth-token')
      const token = await getAuthToken()
      if (!token) return
      await fetchWaterLogs(token, filter, page)
    }

    refreshLogs()
  }, [fetchWaterLogs, filter, page])

  const handleFilterChange = (next: WaterFilter) => {
    setFilter(next)
    setPage(1)
  }

  const handleGoalSave = async () => {
    try {
      setSavingGoal(true)
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
          water_target_ml: waterGoalMl,
        },
        token,
      )

      if (!response.success) {
        throw new Error(response.error || 'Failed to save water goal')
      }

      setGoalPayload((prev) => ({ ...prev, water_target_ml: waterGoalMl }))
      toast.success('Water goal saved')
    } catch (e: any) {
      toast.error(e.message || 'Failed to save water goal')
    } finally {
      setSavingGoal(false)
    }
  }

  const addWater = async (amountMl: number) => {
    const safeAmount = Math.max(1, Math.min(MAX_WATER_LOG_ML, amountMl))
    try {
      setSavingWater(true)
      const { getAuthToken } = await import('@/lib/auth/auth-token')
      const { apiClient } = await import('@/lib/api/client')
      const token = await getAuthToken()
      if (!token) {
        router.push('/login')
        return
      }

      const response = await apiClient.post(
        '/api/metrics/water',
        {
          date: new Date(),
          amount_ml: safeAmount,
        },
        token,
      )
      if (!response.success) {
        throw new Error(response.error || 'Failed to log water')
      }

      await refreshTodayWater(token)
      await fetchWaterLogs(token, filter, page)
      setManualAmount('0')
      toast.success(`${safeAmount} ml logged`)
    } catch (e: any) {
      toast.error(e.message || 'Failed to log water')
    } finally {
      setSavingWater(false)
    }
  }

  return (
    <>
      {loading ? (
        <WaterPageSkeleton />
      ) : (
        <div className='px-6 pt-4 pb-24'>
          {error && (
            <div className='mb-4 rounded-xl border px-4 py-2 text-sm bg-red-500/10 border-red-500 text-red-400'>
              {error}
            </div>
          )}

          <div className='bg-gradient-to-br from-[#1a1f35] to-[#102346] border border-blue-500/20 rounded-2xl p-4 mb-4'>
            <div className='flex items-center gap-2 mb-2'>
              <div className='w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center'>
                <Icon name='water' size={16} color='#60A5FA' />
              </div>
              <div className='text-[12px] text-gray-200 font-semibold uppercase tracking-wide'>
                Today Water
              </div>
            </div>
            <div className='flex items-baseline gap-1 mb-1'>
              <div className='text-[34px] text-white font-extrabold leading-none'>
                {(todayTotalMl / 1000).toFixed(1)}
              </div>
              <div className='text-[14px] text-gray-200'>L</div>
            </div>
            <div className='text-[12px] text-gray-300 mb-3'>
              {progressPercent}% of {(waterGoalMl / 1000).toFixed(1)} L goal
            </div>
            <div className='h-2 rounded-full bg-[var(--app-surface-2)] overflow-hidden'>
              <div
                className='h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all'
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className='app-surface border rounded-2xl p-4 mb-4'>
            <div className='flex items-center justify-between mb-3'>
              <div className='text-[14px] text-[color:var(--app-text)] font-bold'>Water Goal</div>
              <div className='text-[16px] font-bold text-blue-400'>
                {(waterGoalMl / 1000).toFixed(1)} L
              </div>
            </div>
            <input
              type='range'
              min='500'
              max='8000'
              step='100'
              value={waterGoalMl}
              onChange={(e) => setWaterGoalMl(parseInt(e.target.value, 10))}
              className='w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer'
            />
            <button
              type='button'
              onClick={handleGoalSave}
              disabled={savingGoal}
              className='mt-3 w-full py-3 rounded-xl bg-blue-600 text-white text-[14px] font-semibold disabled:opacity-50'
            >
              {savingGoal ? 'Saving...' : 'Save Water Goal'}
            </button>
          </div>

          <div className='app-surface border rounded-2xl p-4 mb-4'>
            <div className='text-[14px] text-[color:var(--app-text)] font-bold mb-3'>
              Log Water
            </div>
            <div className='grid grid-cols-3 gap-2 mb-3'>
              {[250, 500, 1000].map((amount) => (
                <button
                  key={amount}
                  type='button'
                  onClick={() => setManualAmount(String(amount))}
                  disabled={savingWater}
                  className={`border rounded-lg py-2 text-[12px] font-semibold disabled:opacity-50 ${
                    Number(manualAmount) === amount
                      ? 'bg-blue-600/20 border-blue-500/40 text-blue-600'
                      : 'bg-[var(--app-surface-2)] border-[color:var(--app-border)] text-blue-500'
                  }`}
                >
                  +{amount} ml
                </button>
              ))}
            </div>

            <div className='grid grid-cols-[1fr_auto] gap-2'>
              <input
                type='number'
                min='1'
                max={String(MAX_WATER_LOG_ML)}
                value={manualAmount}
                onChange={(e) => setManualAmount(e.target.value)}
                className='bg-[var(--app-surface-2)] border border-[color:var(--app-border)] rounded-xl px-3 py-3 text-[color:var(--app-text)] text-[16px]'
                placeholder='Enter ml'
              />
              <button
                type='button'
                disabled={savingWater}
                onClick={() =>
                  void addWater(
                    Math.max(1, parseInt(manualAmount || '0', 10) || 0),
                  )
                }
                className='px-4 py-3 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-[13px] font-semibold text-white disabled:opacity-50'
              >
                {savingWater ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          <div className='flex items-center justify-between mb-3'>
            <div className='text-[15px] text-[color:var(--app-text)] font-bold'>Water Logs</div>
            <div className='flex gap-2'>
              <button
                type='button'
                onClick={() => handleFilterChange(7)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold ${
                  filter === 7
                    ? 'bg-blue-600 text-white'
                    : 'app-surface border text-[color:var(--app-text-muted)]'
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
                    : 'app-surface border text-[color:var(--app-text-muted)]'
                }`}
              >
                Last 30 days
              </button>
            </div>
          </div>

          {logsLoading ? (
            <div className='text-[color:var(--app-text-muted)] text-sm'>Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className='text-[color:var(--app-text-muted)] text-sm'>
              No water logs in this range.
            </div>
          ) : (
            <div className='space-y-2'>
              {groupedLogs.map((group) => {
                const isOpen = expandedDay === group.day
                const hitGoal = group.total_ml >= waterGoalMl
                return (
                  <div
                    key={group.day}
                    className='app-surface border rounded-xl p-3'
                  >
                    <div className='grid grid-cols-[1fr_auto_auto] items-center gap-3'>
                      <div className='min-w-0'>
                        <div className='text-[13px] text-[color:var(--app-text)] font-semibold'>
                          {formatDayTitle(group.day)}
                        </div>
                        <div className='text-[11px] text-[color:var(--app-text-muted)]'>
                          {group.entries.length} logs
                        </div>
                      </div>

                      <div className='text-right justify-self-end'>
                        {hitGoal && (
                          <div className='flex justify-end mb-0.5'>
                            <Icon name='crown' size={15} color='#F59E0B' />
                          </div>
                        )}
                        <div className='text-[20px] text-blue-500 font-bold leading-none'>
                          {Math.round(group.total_ml)}
                        </div>
                        <div className='text-[11px] text-[color:var(--app-text-muted)]'>ml</div>
                      </div>

                      <button
                        type='button'
                        onClick={() =>
                          setExpandedDay((prev) =>
                            prev === group.day ? null : group.day,
                          )
                        }
                        className='justify-self-end w-8 h-8 rounded-xl border border-[color:var(--app-border)] app-surface hover:bg-[color:var(--app-surface-2)] transition-colors flex items-center justify-center'
                        aria-label={
                          isOpen ? 'Collapse day logs' : 'Expand day logs'
                        }
                      >
                        <Icon
                          name={isOpen ? 'x' : 'plus'}
                          size={14}
                          color={isOpen ? '#64748B' : '#94A3B8'}
                        />
                      </button>
                    </div>

                    {hitGoal && (
                      <div className='mt-1 text-[11px] text-amber-500'>
                        Goal achieved
                      </div>
                    )}

                    {isOpen && (
                      <div className='mt-3 pt-3 border-t border-[color:var(--app-border)] space-y-2'>
                        {group.entries.map((entry) => (
                          <div
                            key={entry._id}
                            className='flex items-center justify-between rounded-lg bg-[var(--app-surface-2)] px-3 py-2'
                          >
                            <div className='text-[12px] text-[color:var(--app-text-muted)]'>
                              {formatTime(entry.created_at) || 'No time'}
                            </div>
                            <div className='text-[13px] font-semibold text-[color:var(--app-text)]'>
                              {Math.round(entry.amount_ml)} ml
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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
