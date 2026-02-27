'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/icon'

export default function GoalsOnboardingPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'goal' | 'calories'>('goal')

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
          <div className='space-y-6'>
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
          <div className='space-y-6'>
            <button
              onClick={() => setStep('goal')}
              className='flex items-center gap-2 text-gray-400 hover:text-white transition-colors'
            >
              <Icon name='arrowLeft' size={20} color='#9CA3AF' />
              <span className='text-[14px]'>Back</span>
            </button>

            <div className='text-center'>
              <h1 className='text-[28px] font-extrabold text-white tracking-tight mb-2'>
                Daily Calorie Goal
              </h1>
              <p className='text-[14px] text-gray-400'>
                How many calories do you want to consume per day?
              </p>
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

            <button
              onClick={handleSubmit}
              disabled={saving}
              className='w-full py-4 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white text-base font-bold shadow-[0_8px_24px_rgba(59,130,246,0.35)] disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {saving ? 'Setting Up...' : 'Complete Setup'}
            </button>
          </div>
        )
    }
  }

  return (
    <div className='min-h-screen bg-[#0B0D17] flex items-center justify-center px-6 py-8 pt-16'>
      <div className='w-full max-w-md'>
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
