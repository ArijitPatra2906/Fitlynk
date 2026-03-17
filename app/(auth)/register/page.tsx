'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Icon } from '@/components/ui/icon'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
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

    setLoading(true)

    try {
      const { apiClient } = await import('@/lib/api/client')
      const response = await apiClient.post('/api/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      })

      if (!response.success) {
        throw new Error(response.error || 'Registration failed')
      }

      // Store auth token
      const { token } = response.data
      const { saveAuthToken } = await import('@/lib/auth/auth-token')
      await saveAuthToken(token)

      router.push('/onboarding')
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    try {
      setGoogleLoading(true)
      setError('')
      console.log('[Google Sign-Up] Starting Firebase Google sign-up...')

      const { firebaseAuthService } = await import('@/lib/firebase/auth-service')
      const user = await firebaseAuthService.signInWithGoogle()

      if (!user) {
        throw new Error('No user returned from Firebase')
      }

      const idToken = await user.getIdToken()

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google-firebase`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: idToken }),
        },
      )

      const response = await res.json()

      if (!res.ok) throw new Error(response.error || response.message)

      const { token, needsOnboarding } = response.data

      const { saveAuthToken } = await import('@/lib/auth/auth-token')
      await saveAuthToken(token)

      router.push(needsOnboarding ? '/onboarding' : '/dashboard')
    } catch (err: any) {
      setError(err.message || 'Google sign-up failed')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-[#0B0D17] flex items-center justify-center px-6 py-8 relative'>
      {/* Full-screen loading overlay */}
      {googleLoading && (
        <div className='fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center'>
          <div className='bg-[#131520] border border-white/10 rounded-2xl p-8 flex flex-col items-center gap-4'>
            <div className='w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin' />
            <div className='text-center'>
              <div className='text-[16px] font-bold text-white mb-1'>
                Signing up with Google
              </div>
              <div className='text-[13px] text-gray-400'>
                Please wait a moment...
              </div>
            </div>
          </div>
        </div>
      )}

      <div className='w-full max-w-md space-y-6'>
        {/* Header */}
        <div className='text-center'>
          <h1 className='text-[28px] font-extrabold text-white tracking-tight'>
            Create Account
          </h1>
          <p className='text-[14px] text-gray-400 mt-2'>
            Join Fitlynk and start your fitness journey
          </p>
        </div>

        {/* Google Sign Up Button */}
        <button
          type='button'
          onClick={handleGoogleSignUp}
          disabled={googleLoading}
          className='w-full py-3.5 rounded-2xl border border-white/15 bg-[#131520] text-white text-[14px] font-semibold flex items-center justify-center gap-2 disabled:opacity-50'
        >
          <Icon name='google' size={18} />
          Continue with Google
        </button>

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
                  size={16}
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
                  size={16}
                  color='#D1D5DB'
                />
              </button>
            </div>
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
