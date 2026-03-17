'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/icon'
import { Pagination } from '@/components/ui/pagination'
import { WaterPageSkeleton } from '@/components/ui/skeleton'
import { WaterCalendarView } from '@/components/water/water-calendar-view'
import { WaterDayDetailModal } from '@/components/water/water-day-detail-modal'
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
  const [isDayDetailOpen, setIsDayDetailOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isGoalDrawerOpen, setIsGoalDrawerOpen] = useState(false)

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

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setIsDayDetailOpen(true)
  }

  const getLogsForDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`

    return logs.filter((log) => {
      if (!log.date) return false
      const logDateStr = log.date.split('T')[0]
      return logDateStr === dateStr
    })
  }

  return (
    <>
      {loading ? (
        <WaterPageSkeleton />
      ) : (
        <div className='relative flex flex-col bg-[#0B0D17]'>
          {/* Header */}
          <div className='px-4 pt-4 pb-2'>
            {error && (
              <div className='mb-3 rounded-xl border px-4 py-2 text-sm bg-red-500/10 border-red-500 text-red-400'>
                {error}
              </div>
            )}
            <div className='flex items-center justify-end'>
              <button
                onClick={() => setIsGoalDrawerOpen(true)}
                className='flex items-center gap-2 px-3 py-2 rounded-xl bg-[#131520] border border-white/10 hover:border-blue-500/30 transition-colors'
              >
                <Icon name='settings' size={16} color='#9CA3AF' />
                <span className='text-[12px] text-gray-300 font-semibold'>
                  Manage Goal
                </span>
              </button>
            </div>
          </div>

          <div className='flex-1 px-4'>
            {/* Today's Progress - Compact Hero Card */}
            <div className='relative bg-gradient-to-br from-blue-600/20 via-blue-500/10 to-cyan-500/20 border border-blue-500/30 rounded-2xl p-4 mb-4 mt-4 overflow-hidden'>
              {/* Background decoration */}
              <div className='absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl' />
              <div className='absolute bottom-0 left-0 w-20 h-20 bg-cyan-500/10 rounded-full blur-2xl' />

              <div className='relative z-10'>
                <div className='flex items-center justify-between mb-3'>
                  <div className='flex items-center gap-2'>
                    <div className='w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center'>
                      <Icon name='water' size={16} color='#60A5FA' />
                    </div>
                    <div className='text-[11px] text-blue-300 font-semibold uppercase tracking-wide'>
                      Today's Intake
                    </div>
                  </div>
                  {progressPercent >= 100 && (
                    <div className='flex items-center gap-1 bg-blue-500/20 border border-blue-500/30 rounded-full px-2 py-0.5'>
                      <Icon name='crown' size={12} color='#F59E0B' />
                      <span className='text-[10px] text-blue-300 font-semibold'>
                        Goal!
                      </span>
                    </div>
                  )}
                </div>

                <div className='flex items-end gap-2 mb-3'>
                  <div className='text-[36px] text-white font-extrabold leading-none'>
                    {(todayTotalMl / 1000).toFixed(1)}
                  </div>
                  <div className='text-[16px] text-gray-300 mb-1.5'>L</div>
                  <div className='text-[13px] text-gray-400 mb-2 ml-auto'>
                    / {(waterGoalMl / 1000).toFixed(1)}L
                  </div>
                </div>

                {/* Progress bar */}
                <div className='mb-2'>
                  <div className='h-2.5 rounded-full bg-black/30 overflow-hidden border border-white/10'>
                    <div
                      className='h-full bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400 rounded-full transition-all duration-500 ease-out'
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className='text-[12px] text-blue-300 font-semibold'>
                  {progressPercent}% Complete
                </div>
              </div>
            </div>

            {/* Quick Add Water - Compact */}
            <div className='bg-[#131520] border border-white/10 rounded-2xl p-4 mb-4'>
              <div className='text-[14px] text-white font-bold mb-3'>
                Quick Add
              </div>

              <div className='grid grid-cols-3 gap-2 mb-3'>
                {[250, 500, 1000].map((amount) => (
                  <button
                    key={amount}
                    type='button'
                    onClick={() => addWater(amount)}
                    disabled={savingWater}
                    className='relative group bg-gradient-to-br from-[#1a1f35] to-[#131520] border border-white/10 hover:border-blue-500/40 rounded-xl py-3 transition-all disabled:opacity-50 active:scale-95'
                  >
                    <div className='text-[18px] text-white font-bold'>
                      {amount}
                    </div>
                    <div className='text-[10px] text-gray-400 font-medium'>
                      ml
                    </div>
                    <div className='absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 rounded-xl transition-all' />
                  </button>
                ))}
              </div>

              {/* Custom amount */}
              <div className='relative'>
                <input
                  type='number'
                  min='1'
                  max={String(MAX_WATER_LOG_ML)}
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                  className='w-full bg-[#1a1f35] border border-white/10 rounded-xl px-3 py-3 pr-20 text-white text-[14px] focus:outline-none focus:border-blue-500/50 transition-all'
                  placeholder='Custom (ml)'
                />
                <button
                  type='button'
                  disabled={savingWater}
                  onClick={() =>
                    void addWater(
                      Math.max(1, parseInt(manualAmount || '0', 10) || 0),
                    )
                  }
                  className='absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-[12px] font-semibold text-white disabled:opacity-50 active:scale-95 transition-all'
                >
                  {savingWater ? 'Adding...' : 'Add'}
                </button>
              </div>
            </div>

            {/* Calendar View */}
            <WaterCalendarView
              logs={logs}
              waterGoalMl={waterGoalMl}
              onDateClick={handleDateClick}
            />
          </div>

          {/* Water Day Detail Modal */}
          <WaterDayDetailModal
            isOpen={isDayDetailOpen}
            onClose={() => setIsDayDetailOpen(false)}
            date={selectedDate}
            logs={selectedDate ? getLogsForDate(selectedDate) : []}
            waterGoalMl={waterGoalMl}
          />

          {/* Goal Management Drawer */}
          {isGoalDrawerOpen && (
            <div className='fixed inset-0 z-50 flex items-end justify-center'>
              {/* Backdrop */}
              <div
                className='absolute inset-0 bg-black/60 backdrop-blur-sm'
                onClick={() => setIsGoalDrawerOpen(false)}
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
                        Water Goal
                      </h2>
                      <p className='text-[12px] text-gray-400 mt-0.5'>
                        Set your daily hydration target
                      </p>
                    </div>
                    <button
                      onClick={() => setIsGoalDrawerOpen(false)}
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
                        {(waterGoalMl / 1000).toFixed(1)}
                      </div>
                      <div className='text-[16px] text-gray-300 mb-1.5'>L</div>
                    </div>
                    <div className='text-[11px] text-gray-400 mt-1.5'>
                      Recommended: 2.0-3.5L per day
                    </div>
                  </div>

                  {/* Slider */}
                  <div className='mb-5'>
                    <label className='text-[12px] text-gray-400 font-semibold uppercase tracking-wide mb-2.5 block'>
                      Adjust Goal
                    </label>
                    <input
                      type='range'
                      min='500'
                      max='8000'
                      step='100'
                      value={waterGoalMl}
                      onChange={(e) =>
                        setWaterGoalMl(parseInt(e.target.value, 10))
                      }
                      className='w-full h-2.5 bg-white/10 rounded-lg appearance-none cursor-pointer slider-thumb-blue'
                    />
                    <div className='flex items-center justify-between mt-1.5'>
                      <span className='text-[10px] text-gray-500'>0.5L</span>
                      <span className='text-[12px] text-blue-400 font-semibold'>
                        {(waterGoalMl / 1000).toFixed(1)}L
                      </span>
                      <span className='text-[10px] text-gray-500'>8L</span>
                    </div>
                  </div>

                  {/* Quick Goal Presets */}
                  <div className='mb-5'>
                    <label className='text-[12px] text-gray-400 font-semibold uppercase tracking-wide mb-2.5 block'>
                      Quick Presets
                    </label>
                    <div className='grid grid-cols-4 gap-2'>
                      {[2000, 2500, 3000, 3500].map((preset) => (
                        <button
                          key={preset}
                          type='button'
                          onClick={() => setWaterGoalMl(preset)}
                          className={`py-2 rounded-xl text-[11px] font-semibold border transition-all ${
                            waterGoalMl === preset
                              ? 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                              : 'bg-[#1a1f35] border-white/10 text-gray-400 hover:border-blue-500/30'
                          }`}
                        >
                          {(preset / 1000).toFixed(1)}L
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Save Button */}
                  <button
                    type='button'
                    onClick={async () => {
                      await handleGoalSave()
                      setIsGoalDrawerOpen(false)
                    }}
                    disabled={savingGoal}
                    className='w-full py-3.5 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white text-[14px] font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95'
                  >
                    {savingGoal ? 'Saving...' : 'Save Goal'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
