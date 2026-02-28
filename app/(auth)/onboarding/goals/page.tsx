'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/icon'

export default function GoalsOnboardingPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'goal' | 'calories'>('goal')
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<any>(null)

  const [formData, setFormData] = useState({
    goal_type: 'maintain' as 'lose' | 'maintain' | 'gain',
    calorie_goal: 2400,
    protein_g: 180,
    carbs_g: 280,
    fat_g: 80,
    activity_level: 'moderate' as
      | 'sedentary'
      | 'light'
      | 'moderate'
      | 'very_active'
      | 'extra_active',
  })

  // Calculate TDEE using Mifflin-St Jeor equation
  const calculateTDEE = (user: any, activityLevel: string) => {
    if (!user?.weight_kg || !user?.height || !user?.date_of_birth || !user?.gender) {
      return 2400 // Fallback
    }

    // Calculate age from date of birth
    const birthDate = new Date(user.date_of_birth)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    // Mifflin-St Jeor BMR calculation
    let bmr: number
    if (user.gender === 'male') {
      bmr = 10 * user.weight_kg + 6.25 * user.height - 5 * age + 5
    } else {
      bmr = 10 * user.weight_kg + 6.25 * user.height - 5 * age - 161
    }

    // Activity multipliers
    const activityMultipliers: Record<string, number> = {
      sedentary: 1.2,      // Little or no exercise
      light: 1.375,        // Light exercise 1-3 days/week
      moderate: 1.55,      // Moderate exercise 3-5 days/week
      very_active: 1.725,  // Hard exercise 6-7 days/week
      extra_active: 1.9,   // Very hard exercise & physical job
    }

    const tdee = Math.round(bmr * (activityMultipliers[activityLevel] || 1.55))
    return tdee
  }

  // Fetch user data and calculate initial calories
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { getAuthToken } = await import('@/lib/auth/auth-token')
        const { apiClient } = await import('@/lib/api/client')
        const token = await getAuthToken()

        if (!token) {
          return
        }

        const response = await apiClient.get('/api/auth/me', token)

        if (response.success && response.data) {
          setUserData(response.data)

          // Calculate TDEE based on user data
          const tdee = calculateTDEE(response.data, 'moderate')
          const macros = calculateMacros('maintain', tdee)

          setFormData({
            goal_type: 'maintain',
            calorie_goal: tdee,
            protein_g: macros.protein,
            carbs_g: macros.carbs,
            fat_g: macros.fat,
            activity_level: 'moderate',
          })
        }
      } catch (err) {
        console.error('Failed to fetch user data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [router])

  // Calculate macros based on goal type
  const calculateMacros = (goalType: string, calories: number) => {
    let proteinPercent, carbsPercent, fatPercent

    switch (goalType) {
      case 'lose':
        proteinPercent = 0.35
        carbsPercent = 0.35
        fatPercent = 0.3
        break
      case 'gain':
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
      protein: Math.round((calories * proteinPercent) / 4),
      carbs: Math.round((calories * carbsPercent) / 4),
      fat: Math.round((calories * fatPercent) / 9),
    }
  }

  const handleGoalTypeChange = (goalType: 'lose' | 'maintain' | 'gain') => {
    // Calculate base TDEE
    const tdee = calculateTDEE(userData, formData.activity_level)

    // Adjust calories based on goal
    let adjustedCalories = tdee
    if (goalType === 'lose') {
      adjustedCalories = Math.round(tdee * 0.85) // 15% deficit
    } else if (goalType === 'gain') {
      adjustedCalories = Math.round(tdee * 1.10) // 10% surplus
    }

    const macros = calculateMacros(goalType, adjustedCalories)
    setFormData({
      ...formData,
      goal_type: goalType,
      calorie_goal: adjustedCalories,
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

  const handleSubmit = async () => {
    setError('')
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

      // Success! Go to dashboard
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to save goals')
      setSaving(false)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 'goal':
        return (
          <div className='space-y-6 flex-1 flex flex-col justify-center'>
            <div className='text-center'>
              <h1 className='text-[28px] font-extrabold text-white tracking-tight mb-2'>
                What's your goal?
              </h1>
              <p className='text-[14px] text-gray-400'>
                This helps us calculate your nutrition targets
              </p>
            </div>

            <div className='space-y-3'>
              {[
                {
                  value: 'lose',
                  title: 'Lose Weight',
                  desc: 'Burn fat while preserving muscle',
                  icon: 'trending',
                  color: '#EF4444',
                  gradient: 'from-red-600 to-red-700',
                },
                {
                  value: 'maintain',
                  title: 'Maintain Weight',
                  desc: 'Stay healthy and balanced',
                  icon: 'activity',
                  color: '#3B82F6',
                  gradient: 'from-blue-600 to-blue-700',
                },
                {
                  value: 'gain',
                  title: 'Gain Muscle',
                  desc: 'Build strength and size',
                  icon: 'dumbbell',
                  color: '#10B981',
                  gradient: 'from-green-600 to-green-700',
                },
              ].map((goal) => (
                <button
                  key={goal.value}
                  type='button'
                  onClick={() => {
                    handleGoalTypeChange(goal.value as any)
                    setStep('calories')
                  }}
                  className={`w-full p-5 rounded-2xl border-2 transition-all ${
                    formData.goal_type === goal.value
                      ? `border-[${goal.color}] bg-gradient-to-br ${goal.gradient} shadow-lg`
                      : 'border-white/10 bg-[#131520] hover:border-white/20'
                  }`}
                >
                  <div className='flex items-center gap-4'>
                    <div
                      className='w-14 h-14 rounded-2xl flex items-center justify-center'
                      style={{ backgroundColor: goal.color + '20' }}
                    >
                      <Icon name={goal.icon} size={28} color={goal.color} />
                    </div>
                    <div className='flex-1 text-left'>
                      <div className='text-[16px] font-bold text-white mb-0.5'>
                        {goal.title}
                      </div>
                      <div className='text-[13px] text-gray-400'>
                        {goal.desc}
                      </div>
                    </div>
                    <Icon name='chevronRight' size={20} color='#64748B' />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )

      case 'calories':
        return (
          <div className='space-y-6 flex-1 flex flex-col'>
            <div className='text-center'>
              <h1 className='text-[28px] font-extrabold text-white tracking-tight mb-2'>
                Daily Calorie Goal
              </h1>
              <p className='text-[14px] text-gray-400 mb-2'>
                Based on your profile, we suggest this daily calorie target
              </p>
              {userData && (
                <p className='text-[12px] text-gray-500'>
                  Calculated using your age, weight, height, and activity level
                </p>
              )}
            </div>

            <div className='bg-gradient-to-br from-blue-600/20 to-blue-700/20 border border-blue-500/30 rounded-3xl p-8 text-center'>
              <div className='text-[56px] font-extrabold text-white mb-2'>
                {formData.calorie_goal.toLocaleString()}
              </div>
              <div className='text-[16px] text-blue-400 font-semibold'>
                calories per day
              </div>
            </div>

            <div className='space-y-3'>
              <input
                type='range'
                min='1200'
                max='4000'
                step='50'
                value={formData.calorie_goal}
                onChange={(e) => handleCalorieChange(parseInt(e.target.value))}
                className='w-full h-3 bg-white/10 rounded-lg appearance-none cursor-pointer slider'
              />
              <div className='flex justify-between text-[12px] text-gray-500'>
                <span>1,200 kcal</span>
                <span>4,000 kcal</span>
              </div>
            </div>

            <div className='bg-[#131520] border border-white/10 rounded-2xl p-5 space-y-4'>
              <div className='text-[14px] text-white font-semibold mb-3'>
                Macronutrients Breakdown
              </div>

              {[
                {
                  label: 'Protein',
                  value: formData.protein_g,
                  color: '#10B981',
                },
                { label: 'Carbs', value: formData.carbs_g, color: '#F59E0B' },
                { label: 'Fat', value: formData.fat_g, color: '#EF4444' },
              ].map((macro) => (
                <div
                  key={macro.label}
                  className='flex items-center justify-between'
                >
                  <div className='flex items-center gap-2'>
                    <div
                      className='w-3 h-3 rounded-full'
                      style={{ backgroundColor: macro.color }}
                    />
                    <span className='text-[13px] text-gray-300'>
                      {macro.label}
                    </span>
                  </div>
                  <div className='text-[15px] font-bold text-white'>
                    {macro.value}g
                  </div>
                </div>
              ))}
            </div>

            <div className='flex gap-3'>
              <button
                onClick={() => setStep('goal')}
                className='px-6 py-4 rounded-2xl border border-white/15 bg-[#131520] text-white text-base font-semibold hover:border-white/30 transition-colors'
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className='flex-1 py-4 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white text-base font-bold shadow-[0_8px_24px_rgba(59,130,246,0.35)] disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {saving ? 'Setting Up...' : 'Complete Setup'}
              </button>
            </div>
          </div>
        )
    }
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-[#0B0D17] flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4' />
          <p className='text-gray-400 text-sm'>Calculating your personalized goals...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-[#0B0D17] flex flex-col px-6 py-8 pt-16'>
      <div className='w-full max-w-md mx-auto flex-1 flex flex-col'>
        {/* Progress Indicator */}
        <div className='flex items-center justify-center gap-2 mb-8'>
          {['goal', 'calories'].map((s, i) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                step === s
                  ? 'w-8 bg-blue-500'
                  : i < ['goal', 'calories'].indexOf(step)
                    ? 'w-6 bg-blue-500/50'
                    : 'w-6 bg-white/10'
              }`}
            />
          ))}
        </div>

        {renderStep()}
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.6);
        }

        .slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.6);
          border: none;
        }
      `}</style>
    </div>
  )
}
