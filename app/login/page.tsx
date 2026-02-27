'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Icon } from '@/components/ui/icon'
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
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
      const { token } = response.data
      console.log('[Login] Token received, saving...')

      const { saveAuthToken } = await import('@/lib/auth/auth-token')
      await saveAuthToken(token)

      console.log('[Login] Login successful, redirecting to dashboard')
      router.push('/dashboard')
    } catch (err: any) {
      console.error('[Login] Error occurred:', err)
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
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

      const data = await res.json()
      if (!res.ok) throw new Error(data.message)

      localStorage.setItem('token', data.token)

      window.location.href = data.needsOnboarding ? '/onboarding' : '/dashboard'
    } catch (err) {
      console.error('Google login failed', err)
      setError('Google sign-in failed')
    }
  }

  return (
    <div className='flex flex-col min-h-screen bg-[#0B0D17] px-6 py-5'>
      {/* Title */}
      <div className='text-[28px] font-extrabold text-white tracking-tight mt-4 mb-1.5'>
        Welcome back
      </div>
      <div className='text-[14px] text-gray-400 mb-9'>
        Sign in to continue your journey
      </div>

      {error && (
        <div className='bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-xl text-sm mb-4'>
          {error}
        </div>
      )}

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className='flex flex-col gap-3 mb-6'>
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
                size={20}
                color='#D1D5DB'
              />
            </button>
          </div>
        </div>

        {/* Forgot Password */}
        <div className='text-right mb-1'>
          <span className='text-[13px] text-blue-500'>Forgot password?</span>
        </div>

        {/* Sign In Button */}
        <button
          type='submit'
          disabled={loading}
          className='py-4 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white text-base font-bold text-center shadow-[0_8px_24px_rgba(59,130,246,0.35)] disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      {/* Divider */}
      <div className='flex items-center gap-3 mb-6'>
        <div className='flex-1 h-px bg-white/10' />
        <span className='text-[12px] text-gray-600'>or continue with</span>
        <div className='flex-1 h-px bg-white/10' />
      </div>

      {/* OAuth Buttons */}
      <div className='flex gap-3 mb-auto'>
        <button
          onClick={handleGoogleLogin}
          type='button'
          disabled={loading}
          className='flex-1 py-3.5 rounded-2xl border border-white/15 bg-[#131520] text-white text-[14px] font-semibold flex items-center justify-center gap-2 disabled:opacity-50'
        >
          <Icon name='google' size={18} />
          Google
        </button>
        <button
          type='button'
          disabled
          className='flex-1 py-3.5 rounded-2xl border border-white/15 bg-[#131520] text-white text-[14px] font-semibold flex items-center justify-center gap-2 opacity-50 cursor-not-allowed'
        >
          <Icon name='apple' size={18} />
          Apple
        </button>
      </div>

      {/* Sign Up Link */}
      <div className='text-center pt-6'>
        <span className='text-[13px] text-gray-400'>
          Don't have an account?{' '}
        </span>
        <Link
          href='/register'
          className='text-[13px] text-blue-500 font-semibold'
        >
          Sign up
        </Link>
      </div>
    </div>
  )
}
