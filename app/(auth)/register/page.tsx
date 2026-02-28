'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Icon } from '@/components/ui/icon'
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth'
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google'
import { isWeb } from '@/lib/utils/platform'

function GoogleSignUpButton({
  onClick,
  onWebSignUp,
  disabled,
}: {
  onClick: () => void
  onWebSignUp: (response: any) => void
  disabled: boolean
}) {
  const login = useGoogleLogin({
    onSuccess: onWebSignUp,
    onError: () => {
      console.error('Google web sign-up failed')
    },
    flow: 'implicit',
  })

  const handleClick = () => {
    if (isWeb()) {
      login()
    } else {
      onClick()
    }
  }

  return (
    <button
      type='button'
      onClick={handleClick}
      disabled={disabled}
      className='w-full py-3.5 rounded-2xl border border-white/15 bg-[#131520] text-white text-[14px] font-semibold flex items-center justify-center gap-2 disabled:opacity-50'
    >
      <Icon name='google' size={18} />
      Continue with Google
    </button>
  )
}

function RegisterPageContent() {
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
    // Native platform - use Capacitor Google Auth
    try {
      setLoading(true)
      console.log('[Google Sign-Up Native] Starting native Google sign-up...')

      const user = await GoogleAuth.signIn()

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google-mobile`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idToken: user.authentication.idToken,
          }),
        },
      )

      const response = await res.json()
      console.log('[Google Sign-Up Native] Response:', response)

      if (!res.ok) throw new Error(response.error || response.message)

      // Extract data from the success response
      const { token, needsOnboarding } = response.data

      console.log('[Google Sign-Up Native] Token received:', !!token)
      console.log('[Google Sign-Up Native] Needs onboarding:', needsOnboarding)

      const { saveAuthToken } = await import('@/lib/auth/auth-token')
      await saveAuthToken(token)

      console.log('[Google Sign-Up Native] Token saved, navigating...')
      router.push(needsOnboarding ? '/onboarding' : '/dashboard')
    } catch (err: any) {
      console.error('[Google Sign-Up Native] Error:', err)
      setError(err.message || 'Google sign-up failed')
    } finally {
      setLoading(false)
    }
  }

  const handleWebGoogleSignUp = async (tokenResponse: any) => {
    try {
      setLoading(true)
      setError('')

      console.log('[Google Sign-Up] Starting web Google sign-up...')

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google-web`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: tokenResponse.access_token,
          }),
        },
      )

      const response = await res.json()
      console.log('[Google Sign-Up] Response:', response)

      if (!res.ok) throw new Error(response.error || 'Google sign-up failed')

      // Extract data from the success response
      const { token, needsOnboarding } = response.data

      console.log('[Google Sign-Up] Token received:', !!token)
      console.log('[Google Sign-Up] Needs onboarding:', needsOnboarding)

      const { saveAuthToken } = await import('@/lib/auth/auth-token')
      await saveAuthToken(token)

      console.log('[Google Sign-Up] Token saved, navigating...')
      router.push(needsOnboarding ? '/onboarding' : '/dashboard')
    } catch (err: any) {
      console.error('[Google Sign-Up] Error:', err)
      setError(err.message || 'Google sign-up failed')
    } finally {
      setLoading(false)
    }
  }

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

        {/* Google Sign Up Button */}
        <GoogleSignUpButton
          onClick={handleGoogleSignUp}
          onWebSignUp={handleWebGoogleSignUp}
          disabled={loading}
        />

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

export default function RegisterPage() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <RegisterPageContent />
    </GoogleOAuthProvider>
  )
}
