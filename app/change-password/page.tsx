'use client'

import { Icon } from '@/components/ui/icon'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

export default function ChangePasswordPage() {
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [authProvider, setAuthProvider] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is using email authentication
    const checkAuthProvider = async () => {
      try {
        const { getAuthToken } = await import('@/lib/auth/auth-token')
        const { apiClient } = await import('@/lib/api/client')
        const token = await getAuthToken()
        if (!token) {
          router.push('/login')
          return
        }

        const res = await apiClient.get('/api/auth/me', token)
        if (!res.success || !res.data) {
          router.push('/login')
          return
        }

        setAuthProvider(res.data.auth_provider)

        if (res.data.auth_provider !== 'email') {
          toast.error('Password change is only available for email accounts')
          router.back()
        }
      } catch (error) {
        console.error('Error checking auth provider:', error)
        router.back()
      } finally {
        setLoading(false)
      }
    }

    checkAuthProvider()
  }, [router])

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: '', color: '' }
    if (password.length < 8)
      return { strength: 1, label: 'Too short', color: '#EF4444' }

    let strength = 0
    if (password.length >= 8) strength++
    if (password.length >= 12) strength++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[^a-zA-Z0-9]/.test(password)) strength++

    if (strength <= 2) return { strength: 2, label: 'Weak', color: '#F59E0B' }
    if (strength <= 3) return { strength: 3, label: 'Medium', color: '#3B82F6' }
    return { strength: 4, label: 'Strong', color: '#10B981' }
  }

  const passwordStrength = getPasswordStrength(newPassword)

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all fields')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    if (currentPassword === newPassword) {
      toast.error('New password must be different from current password')
      return
    }

    try {
      setSaving(true)
      const { getAuthToken } = await import('@/lib/auth/auth-token')
      const { apiClient } = await import('@/lib/api/client')
      const token = await getAuthToken()
      if (!token) {
        toast.error('Session expired. Please login again.')
        return
      }

      const res = await apiClient.put(
        '/api/auth/change-password',
        { currentPassword, newPassword },
        token,
      )
      if (!res.success) {
        throw new Error(res.error || 'Failed to change password')
      }

      toast.success('Password changed successfully')

      // Clear form
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

      // Navigate back after a short delay
      setTimeout(() => {
        router.back()
      }, 1000)
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className='h-full flex items-center justify-center'>
        <div className='w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin' />
      </div>
    )
  }

  if (authProvider !== 'email') {
    return null
  }

  return (
    <div className='h-full flex flex-col overflow-hidden'>
      {/* Header */}
      <div className='flex-shrink-0 app-surface border-b border-[color:var(--app-border)] px-6 py-4'>
        <div className='flex items-center gap-3'>
          <button
            onClick={() => router.back()}
            className='w-9 h-9 rounded-xl bg-[color:var(--app-surface)] border border-[color:var(--app-border)] flex items-center justify-center hover:bg-[color:var(--app-surface-2)] transition-colors'
          >
            <Icon name='arrow-left' size={18} color='var(--app-text)' />
          </button>
          <div>
            <h1 className='text-[20px] font-bold text-[color:var(--app-text)]'>
              Change Password
            </h1>
            <p className='text-[12px] text-[color:var(--app-text-muted)]'>
              Update your account password
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-y-auto px-6 py-6'>
        <div className='max-w-lg mx-auto space-y-6'>
          {/* Security Notice */}
          <div className='app-surface border border-blue-500/30 bg-blue-500/5 rounded-2xl p-4'>
            <div className='flex items-start gap-3'>
              <div className='w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0'>
                <Icon name='shield' size={16} color='#3B82F6' />
              </div>
              <div>
                <h3 className='text-[13px] font-semibold text-[color:var(--app-text)] mb-1'>
                  Security Tips
                </h3>
                <ul className='text-[12px] text-[color:var(--app-text-muted)] space-y-1'>
                  <li>• Use at least 8 characters</li>
                  <li>• Mix uppercase and lowercase letters</li>
                  <li>• Include numbers and symbols</li>
                  <li>• Don't reuse passwords from other sites</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Current Password */}
          <div>
            <label className='text-[13px] font-semibold text-[color:var(--app-text)] mb-2 block'>
              Current Password
            </label>
            <div className='relative'>
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder='Enter your current password'
                className='w-full px-4 py-3 pr-12 rounded-2xl bg-[color:var(--app-surface)] border border-[color:var(--app-border)] text-[14px] text-[color:var(--app-text)] placeholder-[color:var(--app-text-muted)] focus:outline-none focus:border-blue-500/50'
              />
              <button
                type='button'
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className='absolute right-4 top-1/2 -translate-y-1/2 text-[color:var(--app-text-muted)] hover:text-[color:var(--app-text)] transition-colors'
              >
                <Icon
                  name={showCurrentPassword ? 'eyeOff' : 'eye'}
                  size={18}
                  color='currentColor'
                />
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className='text-[13px] font-semibold text-[color:var(--app-text)] mb-2 block'>
              New Password
            </label>
            <div className='relative'>
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder='Enter your new password'
                className='w-full px-4 py-3 pr-12 rounded-2xl bg-[color:var(--app-surface)] border border-[color:var(--app-border)] text-[14px] text-[color:var(--app-text)] placeholder-[color:var(--app-text-muted)] focus:outline-none focus:border-blue-500/50'
              />
              <button
                type='button'
                onClick={() => setShowNewPassword(!showNewPassword)}
                className='absolute right-4 top-1/2 -translate-y-1/2 text-[color:var(--app-text-muted)] hover:text-[color:var(--app-text)] transition-colors'
              >
                <Icon
                  name={showNewPassword ? 'eyeOff' : 'eye'}
                  size={18}
                  color='currentColor'
                />
              </button>
            </div>

            {/* Password Strength Indicator */}
            {newPassword && (
              <div className='mt-3'>
                <div className='flex items-center justify-between mb-1.5'>
                  <span className='text-[11px] text-[color:var(--app-text-muted)]'>
                    Password Strength
                  </span>
                  <span
                    className='text-[11px] font-semibold'
                    style={{ color: passwordStrength.color }}
                  >
                    {passwordStrength.label}
                  </span>
                </div>
                <div className='flex gap-1'>
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className='h-1.5 flex-1 rounded-full transition-all'
                      style={{
                        backgroundColor:
                          level <= passwordStrength.strength
                            ? passwordStrength.color
                            : '#1F2937',
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm New Password */}
          <div>
            <label className='text-[13px] font-semibold text-[color:var(--app-text)] mb-2 block'>
              Confirm New Password
            </label>
            <div className='relative'>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder='Re-enter your new password'
                className='w-full px-4 py-3 pr-12 rounded-2xl bg-[color:var(--app-surface)] border border-[color:var(--app-border)] text-[14px] text-[color:var(--app-text)] placeholder-[color:var(--app-text-muted)] focus:outline-none focus:border-blue-500/50'
              />
              <button
                type='button'
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className='absolute right-4 top-1/2 -translate-y-1/2 text-[color:var(--app-text-muted)] hover:text-[color:var(--app-text)] transition-colors'
              >
                <Icon
                  name={showConfirmPassword ? 'eyeOff' : 'eye'}
                  size={18}
                  color='currentColor'
                />
              </button>
            </div>

            {/* Password Match Indicator */}
            {confirmPassword && (
              <div className='mt-2 flex items-center gap-2'>
                {newPassword === confirmPassword ? (
                  <>
                    <Icon name='check-circle' size={14} color='#10B981' />
                    <span className='text-[11px] text-green-500'>
                      Passwords match
                    </span>
                  </>
                ) : (
                  <>
                    <Icon name='x-circle' size={14} color='#EF4444' />
                    <span className='text-[11px] text-red-400'>
                      Passwords don't match
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className='flex gap-3 pt-2'>
            <button
              onClick={() => router.back()}
              disabled={saving}
              className='flex-1 py-3 rounded-2xl bg-[color:var(--app-surface)] border border-[color:var(--app-border)] text-[color:var(--app-text)] text-[14px] font-semibold hover:bg-[color:var(--app-surface-2)] transition-colors disabled:opacity-50'
            >
              Cancel
            </button>
            <button
              onClick={handleChangePassword}
              disabled={saving}
              className='flex-1 py-3 rounded-2xl bg-blue-500 text-white text-[14px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors'
            >
              {saving ? (
                <span className='flex items-center justify-center gap-2'>
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                  Changing...
                </span>
              ) : (
                'Change Password'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
