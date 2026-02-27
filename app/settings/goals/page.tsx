'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/icon'
import Link from 'next/link'

export default function GoalsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    calorie_goal: 2400,
    protein_g: 180,
    carbs_g: 280,
    fat_g: 80,
    goal_type: 'maintain' as 'lose' | 'maintain' | 'gain',
    activity_level: 'moderate' as
      | 'sedentary'
      | 'light'
      | 'moderate'
      | 'very_active'
      | 'extra_active',
  })

  // Fetch current goals
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { getAuthToken } = await import('@/lib/auth/auth-token')
        const { apiClient } = await import('@/lib/api/client')
        const token = await getAuthToken()

        if (!token) {
          console.error('No auth token found')
          router.push('/login')
          return
        }

        // Fetch nutrition goals
        const goalsResponse = await apiClient.get(
          '/api/metrics/goals/current',
          token,
        )

        let goalsData = null

        if (goalsResponse.success) {
          goalsData = goalsResponse.data
        }

        setFormData({
          calorie_goal: goalsData?.calorie_target || 2400,
          protein_g: goalsData?.protein_g || 180,
          carbs_g: goalsData?.carbs_g || 280,
          fat_g: goalsData?.fat_g || 80,
          goal_type: goalsData?.goal_type || 'maintain',
          activity_level: goalsData?.activity_level || 'moderate',
        })
      } catch (error) {
        console.error('Error fetching goals:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  // Calculate macros based on goal type
  const calculateMacros = (goalType: string, calories: number) => {
    let proteinPercent, carbsPercent, fatPercent

    switch (goalType) {
      case 'lose':
        // Higher protein for muscle preservation
        proteinPercent = 0.35
        carbsPercent = 0.35
        fatPercent = 0.3
        break
      case 'gain':
        // Higher carbs for muscle building
        proteinPercent = 0.3
        carbsPercent = 0.45
        fatPercent = 0.25
        break
      default: // maintain
        proteinPercent = 0.3
        carbsPercent = 0.4
        fatPercent = 0.3
    }

    return {
      protein: Math.round((calories * proteinPercent) / 4), // 4 cal per gram
      carbs: Math.round((calories * carbsPercent) / 4),
      fat: Math.round((calories * fatPercent) / 9), // 9 cal per gram
    }
  }

  const handleGoalTypeChange = (goalType: 'lose' | 'maintain' | 'gain') => {
    const macros = calculateMacros(goalType, formData.calorie_goal)
    setFormData({
      ...formData,
      goal_type: goalType,
      protein_g: macros.protein,
      carbs_g: macros.carbs,
      fat_g: macros.fat,
    })
  }

  const handleCalorieChange = (calories: number) => {
    const macros = calculateMacros(formData.goal_type, calories)
    setFormData({
      ...formData,
      calorie_goal: calories,
      protein_g: macros.protein,
      carbs_g: macros.carbs,
      fat_g: macros.fat,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setSaving(true)

    try {
      const { getAuthToken } = await import('@/lib/auth/auth-token')
      const { apiClient } = await import('@/lib/api/client')
      const token = await getAuthToken()

      if (!token) {
        setError('Not authenticated')
        return
      }

      // Save nutrition goals (calories, macros, goal type)
      const goalsResponse = await apiClient.post(
        '/api/metrics/goals',
        {
          goal_type: formData.goal_type,
          calorie_target: formData.calorie_goal,
          protein_g: formData.protein_g,
          carbs_g: formData.carbs_g,
          fat_g: formData.fat_g,
          activity_level: formData.activity_level,
        },
        token,
      )

      if (!goalsResponse.success) {
        throw new Error(goalsResponse.error || 'Failed to save nutrition goals')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/profile')
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to save goals')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-[#0B0D17]'>
        <div className='text-white'>Loading...</div>
      </div>
    )
  }

  return (
    <div className='bg-[#0B0D17] pb-20'>
      <div className='px-6 pt-5'>
        {/* Messages */}
        {error && (
          <div className='bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-xl text-sm mb-4'>
            {error}
          </div>
        )}
        {success && (
          <div className='bg-green-500/10 border border-green-500 text-green-500 px-4 py-2 rounded-xl text-sm mb-4'>
            Goals saved successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-4'>
          {/* Goal Type */}
          <div>
            <label className='text-[13px] text-gray-400 font-semibold mb-2 block'>
              What's your goal?
            </label>
            <div className='grid grid-cols-3 gap-2'>
              {[
                {
                  value: 'lose',
                  label: 'Lose Weight',
                  icon: 'trending',
                  color: '#EF4444',
                },
                {
                  value: 'maintain',
                  label: 'Maintain',
                  icon: 'activity',
                  color: '#3B82F6',
                },
                {
                  value: 'gain',
                  label: 'Gain Muscle',
                  icon: 'dumbbell',
                  color: '#10B981',
                },
              ].map((goal) => (
                <button
                  key={goal.value}
                  type='button'
                  onClick={() => handleGoalTypeChange(goal.value as any)}
                  className={`p-4 rounded-2xl border ${
                    formData.goal_type === goal.value
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-white/10 bg-[#131520]'
                  } flex flex-col items-center gap-2 transition-all`}
                >
                  <div
                    className='w-10 h-10 rounded-xl flex items-center justify-center'
                    style={{ backgroundColor: goal.color + '20' }}
                  >
                    <Icon name={goal.icon} size={20} color={goal.color} />
                  </div>
                  <span className='text-[12px] text-white font-semibold text-center'>
                    {goal.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Calories */}
          <div className='bg-[#131520] border border-white/10 rounded-2xl p-4'>
            <div className='flex items-center justify-between mb-3'>
              <div>
                <div className='text-[13px] text-white font-semibold'>
                  Daily Calories
                </div>
                <div className='text-[11px] text-gray-400'>
                  Your target calorie intake
                </div>
              </div>
              <div className='text-[20px] font-bold text-blue-500'>
                {formData.calorie_goal}
              </div>
            </div>
            <input
              type='range'
              min='1200'
              max='4000'
              step='50'
              value={formData.calorie_goal}
              onChange={(e) => handleCalorieChange(parseInt(e.target.value))}
              className='w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider'
            />
            <div className='flex justify-between text-[10px] text-gray-500 mt-1'>
              <span>1,200</span>
              <span>4,000</span>
            </div>
          </div>

          {/* Macros */}
          <div className='bg-[#131520] border border-white/10 rounded-2xl p-4 space-y-4'>
            <div className='text-[13px] text-white font-semibold mb-2'>
              Macronutrients (grams)
            </div>

            {/* Protein */}
            <div>
              <div className='flex items-center justify-between mb-2'>
                <div className='flex items-center gap-2'>
                  <div className='w-3 h-3 rounded-full bg-green-500' />
                  <span className='text-[13px] text-white'>Protein</span>
                </div>
                <input
                  type='number'
                  value={formData.protein_g}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      protein_g: parseInt(e.target.value) || 0,
                    })
                  }
                  className='w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[13px] text-white text-right'
                />
              </div>
              <div className='text-[11px] text-gray-400'>
                {Math.round(
                  ((formData.protein_g * 4) / formData.calorie_goal) * 100,
                )}
                % of calories
              </div>
            </div>

            {/* Carbs */}
            <div>
              <div className='flex items-center justify-between mb-2'>
                <div className='flex items-center gap-2'>
                  <div className='w-3 h-3 rounded-full bg-amber-500' />
                  <span className='text-[13px] text-white'>Carbs</span>
                </div>
                <input
                  type='number'
                  value={formData.carbs_g}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      carbs_g: parseInt(e.target.value) || 0,
                    })
                  }
                  className='w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[13px] text-white text-right'
                />
              </div>
              <div className='text-[11px] text-gray-400'>
                {Math.round(
                  ((formData.carbs_g * 4) / formData.calorie_goal) * 100,
                )}
                % of calories
              </div>
            </div>

            {/* Fat */}
            <div>
              <div className='flex items-center justify-between mb-2'>
                <div className='flex items-center gap-2'>
                  <div className='w-3 h-3 rounded-full bg-red-500' />
                  <span className='text-[13px] text-white'>Fat</span>
                </div>
                <input
                  type='number'
                  value={formData.fat_g}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fat_g: parseInt(e.target.value) || 0,
                    })
                  }
                  className='w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[13px] text-white text-right'
                />
              </div>
              <div className='text-[11px] text-gray-400'>
                {Math.round(
                  ((formData.fat_g * 9) / formData.calorie_goal) * 100,
                )}
                % of calories
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type='submit'
            disabled={saving}
            className='w-full py-4 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white text-base font-bold shadow-[0_8px_24px_rgba(59,130,246,0.35)] disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {saving ? 'Saving...' : 'Save Goals'}
          </button>
        </form>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.5);
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.5);
          border: none;
        }
      `}</style>
    </div>
  )
}
