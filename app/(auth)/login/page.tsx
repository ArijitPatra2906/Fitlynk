'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Icon } from '@/components/ui/icon'

function GoogleLoginButton({
  onClick,
  disabled,
}: {
  onClick: () => void
  disabled: boolean
}) {
  return (
    <button
      onClick={onClick}
      type='button'
      disabled={disabled}
      className='w-full py-3.5 rounded-2xl border border-white/15 bg-[#131520] text-white text-[14px] font-semibold flex items-center justify-center gap-2 disabled:opacity-50'
    >
      <Icon name='google' size={18} />
      Google
    </button>
  )
}

function LoginPageContent() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      console.log('[Login] Starting login attempt...')
      console.log('[Login] Email:', email)

      const { apiClient } = await import('@/lib/api/client')
      console.log('[Login] API client loaded')

      const response = await apiClient.post('/api/auth/login', {
        email,
        password,
      })

      console.log('[Login] Response received:', response)

      if (!response.success) {
        console.error('[Login] Login failed:', response.error)
        setError(response.error || 'Invalid email or password')
        return
      }

      // Store auth token
      const { token, needsOnboarding } = response.data
      console.log('[Login] Token received, saving...')
      console.log('[Login] Needs onboarding:', needsOnboarding)

      const { saveAuthToken } = await import('@/lib/auth/auth-token')
      await saveAuthToken(token)

      console.log('[Login] Login successful, redirecting...')
      router.push(needsOnboarding ? '/onboarding' : '/dashboard')
    } catch (err: any) {
      console.error('[Login] Error occurred:', err)
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true)
      setError('')
      console.log('[Google Login] Starting Firebase Google login...')

      // Use Firebase Authentication Service
      const { firebaseAuthService } = await import('@/lib/firebase/auth-service')
      const user = await firebaseAuthService.signInWithGoogle()

      if (!user) {
        throw new Error('No user returned from Firebase')
      }

      console.log('[Google Login] Firebase user:', user.email)
      console.log('[Google Login] Getting ID token...')

      // Get the Firebase ID token
      const idToken = await user.getIdToken()
      console.log('[Google Login] ID Token received:', !!idToken)

      console.log('[Google Login] Sending to backend...')
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google-firebase`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idToken: idToken,
          }),
        },
      )

      const response = await res.json()
      console.log('[Google Login] Backend response:', response)

      if (!res.ok) throw new Error(response.error || response.message || 'Authentication failed')

      // Extract data from the success response
      const { token, needsOnboarding } = response.data

      if (!token) {
        throw new Error('No auth token received from backend')
      }

      console.log('[Google Login] Token received, saving...')
      console.log('[Google Login] Needs onboarding:', needsOnboarding)

      const { saveAuthToken } = await import('@/lib/auth/auth-token')
      await saveAuthToken(token)

      console.log('[Google Login] Success! Navigating...')
      router.push(needsOnboarding ? '/onboarding' : '/dashboard')
    } catch (err: any) {
      console.error('[Google Login] Full error:', err)
      console.error('[Google Login] Error name:', err.name)
      console.error('[Google Login] Error message:', err.message)
      console.error('[Google Login] Error code:', err.code)
      setError(err.message || 'Google sign-in failed')
    } finally {
      setGoogleLoading(false)
    }
  }


  return (
    <div className='min-h-screen bg-[#0B0D17] flex items-center justify-center px-6 py-8'>
      <div className='w-full max-w-md space-y-6'>
        {/* Header */}
        <div className='text-center'>
          <h1 className='text-[28px] font-extrabold text-white tracking-tight'>
            Welcome back
          </h1>
          <p className='text-[14px] text-gray-400 mt-2'>
            Sign in to continue your journey
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className='bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-xl text-sm'>
            {error}
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className='space-y-3'>
          <div className='bg-[#131520] border border-white/10 rounded-2xl p-3.5'>
            <label
              htmlFor='email'
              className='text-[11px] text-gray-400 uppercase tracking-wider mb-1 block'
            >
              Email address
            </label>
            <input
              id='email'
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className='text-[14px] text-white bg-transparent border-none outline-none w-full'
              placeholder='alex@example.com'
            />
          </div>

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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className='text-[14px] text-white bg-transparent border-none outline-none w-full'
                placeholder='••••••••'
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

          {/* Forgot Password */}
          {/* <div className='text-right'>
            <span className='text-[13px] text-blue-500'>Forgot password?</span>
          </div> */}

          {/* Sign In Button */}
          <button
            type='submit'
            disabled={loading}
            className='w-full py-4 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white text-base font-bold text-center shadow-[0_8px_24px_rgba(59,130,246,0.35)] disabled:opacity-50 disabled:cursor-not-allowed mt-4'
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div className='flex items-center gap-3'>
          <div className='flex-1 h-px bg-white/10' />
          <span className='text-[12px] text-gray-600'>or continue with</span>
          <div className='flex-1 h-px bg-white/10' />
        </div>

        {/* OAuth Button */}
        <GoogleLoginButton
          onClick={handleGoogleLogin}
          disabled={googleLoading}
        />

        {/* Sign Up Link */}
        <p className='text-center text-[13px] text-gray-400 pb-6'>
          Don't have an account?{' '}
          <Link href='/register' className='text-blue-500 font-semibold'>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <LoginPageContent />
}
