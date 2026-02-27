'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [formData, setFormData] = useState({
    height: '',
    weight_kg: '',
    date_of_birth: '',
    gender: '',
    units: 'metric',
  })

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const { getAuthToken } = await import('@/lib/auth/auth-token')
        const token = await getAuthToken()

        if (!token) {
          router.push('/login')
          return
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/login')
      } finally {
        setCheckingAuth(false)
      }
    }

    checkAuth()
  }, [router])

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (
      !formData.height ||
      !formData.weight_kg ||
      !formData.date_of_birth ||
      !formData.gender
    ) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)

    try {
      const { getAuthToken } = await import('@/lib/auth/auth-token')
      const { apiClient } = await import('@/lib/api/client')
      const token = await getAuthToken()

      if (!token) {
        setError('Not authenticated')
        return
      }

      const response = await apiClient.put(
        '/api/auth/profile',
        {
          height: parseFloat(formData.height),
          weight_kg: parseFloat(formData.weight_kg),
          date_of_birth: formData.date_of_birth,
          gender: formData.gender,
          units: formData.units,
        },
        token,
      )

      if (!response.success) {
        throw new Error(response.error || 'Failed to update profile')
      }

      // After profile is complete, go to goals onboarding
      router.push('/onboarding/goals')
    } catch (err: any) {
      setError(err.message || 'Failed to complete profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-[#0B0D17]'>
        <div className='text-white'>Loading...</div>
      </div>
    )
  }

  return (
    <div className='h-screen bg-[#0B0D17] overflow-y-auto'>
      <div className='w-full max-w-md mx-auto px-6 py-8 space-y-6 pb-20'>
        {/* Header */}
        <div className='text-center'>
          <h1 className='text-[28px] font-extrabold text-white tracking-tight'>
            Complete Your Profile
          </h1>
          <p className='text-[14px] text-gray-400 mt-2'>
            We need a few more details to personalize your fitness journey
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className='bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-xl text-sm'>
            {error}
          </div>
        )}

        {/* Onboarding Form */}
        <form onSubmit={handleSubmit} className='space-y-3'>
          {/* Gender */}
          <div className='bg-[#131520] border border-white/10 rounded-2xl p-3.5'>
            <label
              htmlFor='gender'
              className='text-[11px] text-gray-400 uppercase tracking-wider mb-1 block'
            >
              Gender
            </label>
            <Select
              value={formData.gender}
              onValueChange={(value) => handleChange('gender', value)}
            >
              <SelectTrigger className='bg-transparent border-none text-[14px] text-white p-0 h-auto focus:ring-0'>
                <SelectValue placeholder='Select gender' />
              </SelectTrigger>
              <SelectContent className='bg-[#1A1D2E] border-white/10'>
                <SelectItem value='male' className='text-white'>
                  Male
                </SelectItem>
                <SelectItem value='female' className='text-white'>
                  Female
                </SelectItem>
                <SelectItem value='other' className='text-white'>
                  Other
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date of Birth */}
          <div className='bg-[#131520] border border-white/10 rounded-2xl p-3.5'>
            <label
              htmlFor='date_of_birth'
              className='text-[11px] text-gray-400 uppercase tracking-wider mb-1 block'
            >
              Date of Birth
            </label>
            <input
              id='date_of_birth'
              type='date'
              value={formData.date_of_birth}
              onChange={(e) => handleChange('date_of_birth', e.target.value)}
              required
              className='text-[14px] text-white bg-transparent border-none outline-none w-full [color-scheme:dark]'
            />
          </div>

          {/* Units */}
          <div className='bg-[#131520] border border-white/10 rounded-2xl p-3.5'>
            <label
              htmlFor='units'
              className='text-[11px] text-gray-400 uppercase tracking-wider mb-1 block'
            >
              Measurement System
            </label>
            <Select
              value={formData.units}
              onValueChange={(value) => handleChange('units', value)}
            >
              <SelectTrigger className='bg-transparent border-none text-[14px] text-white p-0 h-auto focus:ring-0'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className='bg-[#1A1D2E] border-white/10'>
                <SelectItem value='metric' className='text-white'>
                  Metric (kg, cm)
                </SelectItem>
                <SelectItem value='imperial' className='text-white'>
                  Imperial (lbs, inches)
                </SelectItem>
              </SelectContent>
            </Select>
            <p className='text-[11px] text-gray-500 mt-1.5'>
              Metric uses kilograms and centimeters. Imperial uses pounds and
              inches.
            </p>
          </div>

          {/* Height */}
          <div className='bg-[#131520] border border-white/10 rounded-2xl p-3.5'>
            <label
              htmlFor='height'
              className='text-[11px] text-gray-400 uppercase tracking-wider mb-1 block'
            >
              Height ({formData.units === 'metric' ? 'cm' : 'inches'})
            </label>
            <input
              id='height'
              type='number'
              value={formData.height}
              onChange={(e) => handleChange('height', e.target.value)}
              required
              min='50'
              max='300'
              step='0.1'
              className='text-[14px] text-white bg-transparent border-none outline-none w-full placeholder:text-gray-600'
              placeholder={
                formData.units === 'metric' ? 'e.g., 175' : 'e.g., 69'
              }
            />
          </div>

          {/* Weight */}
          <div className='bg-[#131520] border border-white/10 rounded-2xl p-3.5'>
            <label
              htmlFor='weight_kg'
              className='text-[11px] text-gray-400 uppercase tracking-wider mb-1 block'
            >
              Current Weight ({formData.units === 'metric' ? 'kg' : 'lbs'})
            </label>
            <input
              id='weight_kg'
              type='number'
              value={formData.weight_kg}
              onChange={(e) => handleChange('weight_kg', e.target.value)}
              required
              min='20'
              max='500'
              step='0.1'
              className='text-[14px] text-white bg-transparent border-none outline-none w-full placeholder:text-gray-600'
              placeholder={
                formData.units === 'metric' ? 'e.g., 70' : 'e.g., 154'
              }
            />
          </div>

          {/* Submit Button */}
          <button
            type='submit'
            disabled={loading}
            className='w-full py-4 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white text-base font-bold text-center shadow-[0_8px_24px_rgba(59,130,246,0.35)] disabled:opacity-50 disabled:cursor-not-allowed mt-4'
          >
            {loading ? 'Completing Profile...' : 'Complete Profile'}
          </button>
        </form>
      </div>
    </div>
  )
}
