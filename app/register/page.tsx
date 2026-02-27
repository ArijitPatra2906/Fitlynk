'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Capacitor } from '@capacitor/core'
import Link from 'next/link'
import { Icon } from '@/components/ui/icon'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    height: '',
    weight_kg: '',
    date_of_birth: '',
    gender: '',
    units: 'metric',
  })

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

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
      const { apiClient } = await import('@/lib/api/client')
      const response = await apiClient.post('/api/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        height: parseFloat(formData.height),
        weight_kg: parseFloat(formData.weight_kg),
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        units: formData.units,
      })

      if (!response.success) {
        throw new Error(response.error || 'Registration failed')
      }

      // Store auth token
      const { token } = response.data
      const { saveAuthToken } = await import('@/lib/auth/auth-token')
      await saveAuthToken(token)

      router.push('/onboarding/goals')
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // const handleGoogleSignIn = async () => {
  //   if (Capacitor.isNativePlatform()) {
  //     // Mobile: Use Capacitor Browser for OAuth
  //     try {
  //       await signInWithGoogleMobile()
  //       // The OAuth callback will be handled by the app listener
  //     } catch (error) {
  //       console.error('Mobile Google sign in error:', error)
  //       setError('Failed to sign in with Google')
  //     }
  //   } else {
  //     // Web: Google OAuth - TODO: Implement web Google OAuth or disable
  //     setError('Google sign-in is currently only available on mobile')
  //   }
  // }

  return (
    <div className='h-screen bg-[#0B0D17] overflow-y-auto'>
      <div className='w-full max-w-md mx-auto px-6 py-8 space-y-6 pb-20'>
        {/* Header */}
        <div className='text-center'>
          <h1 className='text-[28px] font-extrabold text-white tracking-tight'>
            Create Account
          </h1>
          <p className='text-[14px] text-gray-400 mt-2'>
            Join Fitlynk and start your fitness journey
          </p>
        </div>

        {/* Google Sign In Button */}
        {/* <button
          type='button'
          onClick={handleGoogleSignIn}
          disabled={loading}
          className='w-full py-3.5 rounded-2xl border border-white/15 bg-[#131520] text-white text-[14px] font-semibold flex items-center justify-center gap-2 disabled:opacity-50'
        >
          <svg className='w-5 h-5' viewBox='0 0 24 24'>
            <path
              fill='currentColor'
              d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
            />
            <path
              fill='currentColor'
              d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
            />
            <path
              fill='currentColor'
              d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
            />
            <path
              fill='currentColor'
              d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
            />
          </svg>
          Continue with Google
        </button> */}

        {/* Divider */}
        <div className='flex items-center gap-3'>
          <div className='flex-1 h-px bg-white/10' />
          <span className='text-[12px] text-gray-600'>
            or register with email
          </span>
          <div className='flex-1 h-px bg-white/10' />
        </div>

        {/* Error Message */}
        {error && (
          <div className='bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-xl text-sm'>
            {error}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className='space-y-3'>
          {/* Name */}
          <div className='bg-[#131520] border border-white/10 rounded-2xl p-3.5'>
            <label
              htmlFor='name'
              className='text-[11px] text-gray-400 uppercase tracking-wider mb-1 block'
            >
              Full Name
            </label>
            <input
              id='name'
              type='text'
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
              className='text-[14px] text-white bg-transparent border-none outline-none w-full placeholder:text-gray-600'
              placeholder='John Doe'
            />
          </div>

          {/* Email */}
          <div className='bg-[#131520] border border-white/10 rounded-2xl p-3.5'>
            <label
              htmlFor='email'
              className='text-[11px] text-gray-400 uppercase tracking-wider mb-1 block'
            >
              Email
            </label>
            <input
              id='email'
              type='email'
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
              className='text-[14px] text-white bg-transparent border-none outline-none w-full placeholder:text-gray-600'
              placeholder='john@example.com'
            />
          </div>

          {/* Password */}
          <div className='bg-[#131520] border border-white/10 rounded-2xl p-3.5'>
            <label
              htmlFor='password'
              className='text-[11px] text-gray-400 uppercase tracking-wider mb-1 block'
            >
              Password
            </label>
            <div className='flex items-center gap-2'>
              <input
                id='password'
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                required
                minLength={6}
                className='text-[14px] text-white bg-transparent border-none outline-none w-full placeholder:text-gray-600'
                placeholder='At least 6 characters'
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='text-gray-300 hover:text-white focus:outline-none transition-colors flex-shrink-0'
              >
                <Icon
                  name={showPassword ? 'eyeOff' : 'eye'}
                  size={20}
                  color='#D1D5DB'
                />
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className='bg-[#131520] border border-white/10 rounded-2xl p-3.5'>
            <label
              htmlFor='confirmPassword'
              className='text-[11px] text-gray-400 uppercase tracking-wider mb-1 block'
            >
              Confirm Password
            </label>
            <div className='flex items-center gap-2'>
              <input
                id='confirmPassword'
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) =>
                  handleChange('confirmPassword', e.target.value)
                }
                required
                className='text-[14px] text-white bg-transparent border-none outline-none w-full placeholder:text-gray-600'
                placeholder='Re-enter password'
              />
              <button
                type='button'
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className='text-gray-300 hover:text-white focus:outline-none transition-colors flex-shrink-0'
              >
                <Icon
                  name={showConfirmPassword ? 'eyeOff' : 'eye'}
                  size={20}
                  color='#D1D5DB'
                />
              </button>
            </div>
          </div>

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
              className='text-[14px] text-white bg-transparent border-none outline-none w-full'
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
              Weight ({formData.units === 'metric' ? 'kg' : 'lbs'})
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
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Sign In Link */}
        <p className='text-center text-[13px] text-gray-400 pb-6'>
          Already have an account?{' '}
          <Link href='/login' className='text-blue-500 font-semibold'>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
