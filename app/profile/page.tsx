'use client'

import { type ChangeEvent, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Icon } from '@/components/ui/icon'
import {
  ProfileHeaderSkeleton,
  ProfileSectionSkeleton,
} from '@/components/ui/skeleton'
import { User } from '@/types'
import {
  getResolvedTheme,
  setTheme,
  type ThemeMode,
} from '@/lib/theme/theme-manager'
import { useNotificationPreferences } from '@/lib/hooks/useNotificationPreferences'

type AvatarChoice = {
  label: string
  url: string
}

type DiceBearStyle =
  | 'adventurer'
  | 'adventurer-neutral'
  | 'avataaars'
  | 'bottts'
  | 'fun-emoji'
  | 'initials'
  | 'lorelei'
  | 'personas'

const AVATAR_BATCH_SIZE = 8
const DICEBEAR_STYLES: DiceBearStyle[] = [
  'adventurer',
  'adventurer-neutral',
  'avataaars',
  'bottts',
  'fun-emoji',
  'initials',
  'lorelei',
  'personas',
]
const DICEBEAR_SEEDS = [
  'fitlynk-athlete',
  'gym-mode',
  'strength-pro',
  'cardio-day',
  'power-runner',
  'lift-heavy',
  'core-focus',
  'fitness-goal',
  'health-track',
  'peak-form',
]
const CUSTOM_BG_COLORS = [
  'b6e3f4',
  'c0aede',
  'd1d4f9',
  'ffd5dc',
  'ffdfbf',
  'fcd34d',
  '86efac',
  '93c5fd',
]

const buildDiceBearUrl = (style: DiceBearStyle, seed: string) =>
  `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`

const buildDiceBearBatch = (offset: number, count: number): AvatarChoice[] =>
  Array.from({ length: count }, (_, i) => {
    const idx = offset + i
    const style = DICEBEAR_STYLES[idx % DICEBEAR_STYLES.length]
    const seed = DICEBEAR_SEEDS[idx % DICEBEAR_SEEDS.length]
    const name = `${seed}-${idx + 1}`
    return {
      label: `${style} ${idx + 1}`,
      url: buildDiceBearUrl(style, name),
    }
  })

const optimizeAvatarImage = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read image'))
    reader.onload = () => {
      const src = String(reader.result || '')
      if (!src) {
        reject(new Error('Invalid image data'))
        return
      }

      const img = new Image()
      img.onerror = () => reject(new Error('Failed to load image'))
      img.onload = () => {
        const maxSide = 512
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
        const width = Math.max(1, Math.round(img.width * scale))
        const height = Math.max(1, Math.round(img.height * scale))

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to process image'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.src = src
    }
    reader.readAsDataURL(file)
  })

export default function ProfilePage() {
  const [userData, setUserData] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark')

  const [nameInput, setNameInput] = useState('')
  const [heightInput, setHeightInput] = useState('')
  const [weightInput, setWeightInput] = useState('')
  const [dobInput, setDobInput] = useState('')
  const [genderInput, setGenderInput] = useState<'male' | 'female' | 'other'>(
    'male',
  )
  const [unitsInput, setUnitsInput] = useState<'metric' | 'imperial'>('metric')
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState('')
  const [avatarChoices, setAvatarChoices] = useState<AvatarChoice[]>([])
  const [avatarOffset, setAvatarOffset] = useState(AVATAR_BATCH_SIZE)
  const [avatarRefreshCursor, setAvatarRefreshCursor] = useState(0)
  const [customStyle, setCustomStyle] = useState<DiceBearStyle>('avataaars')
  const [customSeed, setCustomSeed] = useState('fitlynk-athlete')
  const [customBgColor, setCustomBgColor] = useState('b6e3f4')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Notification preferences
  const { preferences: notificationPrefs, togglePushNotifications } =
    useNotificationPreferences()

  useEffect(() => {
    setThemeMode(getResolvedTheme())
    const onThemeChanged = (event: Event) => {
      const detail = (event as CustomEvent).detail || {}
      if (detail.mode === 'dark' || detail.mode === 'light') {
        setThemeMode(detail.mode as ThemeMode)
      }
    }
    window.addEventListener('theme:changed', onThemeChanged as EventListener)
    return () => {
      window.removeEventListener(
        'theme:changed',
        onThemeChanged as EventListener,
      )
    }
  }, [])

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { getAuthToken } = await import('@/lib/auth/auth-token')
        const { apiClient } = await import('@/lib/api/client')
        const token = await getAuthToken()

        if (!token) {
          setLoading(false)
          return
        }

        const response = await apiClient.get('/api/auth/me', token)
        if (!response.success || !response.data) {
          setLoading(false)
          return
        }

        const user = response.data as User
        setUserData(user)
        setNameInput(user.name || '')
        setHeightInput(user.height ? String(user.height) : '')
        setWeightInput(user.weight_kg ? String(user.weight_kg) : '')
        setDobInput(
          user.date_of_birth
            ? new Date(user.date_of_birth).toISOString().slice(0, 10)
            : '',
        )
        setGenderInput((user.gender as 'male' | 'female' | 'other') || 'male')
        setUnitsInput(user.units || 'metric')
      } catch (error) {
        console.error('Failed to fetch user data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const toggleThemeMode = () => {
    const nextMode: ThemeMode = themeMode === 'dark' ? 'light' : 'dark'
    setTheme(nextMode)
    setThemeMode(nextMode)
  }

  const loadInitialAvatars = () => {
    setAvatarChoices(buildDiceBearBatch(avatarRefreshCursor, AVATAR_BATCH_SIZE))
    setAvatarOffset(AVATAR_BATCH_SIZE)
  }

  const handleRefreshAvatars = () => {
    const nextCursor = avatarRefreshCursor + AVATAR_BATCH_SIZE
    setAvatarRefreshCursor(nextCursor)
    setAvatarChoices(buildDiceBearBatch(nextCursor, AVATAR_BATCH_SIZE))
    setAvatarOffset(AVATAR_BATCH_SIZE)
  }

  const handleCancelEdit = () => {
    setSelectedAvatarUrl(userData?.avatar_url || '')
    loadInitialAvatars()
    setIsEditOpen(false)
  }

  const buildCustomAvatarUrl = () =>
    `${buildDiceBearUrl(customStyle, customSeed)}&backgroundColor=${customBgColor}&radius=50`

  const applyCustomAvatar = () => {
    const seed = customSeed.trim()
    if (!seed) {
      toast.error('Enter a custom avatar name/seed')
      return
    }
    const url = buildCustomAvatarUrl()
    setSelectedAvatarUrl(url)
    setAvatarChoices((prev) => [{ label: 'Custom avatar', url }, ...prev])
  }

  const randomizeCustomAvatar = () => {
    const randomStyle =
      DICEBEAR_STYLES[Math.floor(Math.random() * DICEBEAR_STYLES.length)]
    const randomSeed = `gym-${Math.random().toString(36).slice(2, 8)}`
    const randomBg =
      CUSTOM_BG_COLORS[Math.floor(Math.random() * CUSTOM_BG_COLORS.length)]
    setCustomStyle(randomStyle)
    setCustomSeed(randomSeed)
    setCustomBgColor(randomBg)
    setSelectedAvatarUrl(
      `${buildDiceBearUrl(randomStyle, randomSeed)}&backgroundColor=${randomBg}&radius=50`,
    )
  }

  const loadMoreAvatars = () => {
    const nextBatch = buildDiceBearBatch(avatarOffset, AVATAR_BATCH_SIZE)
    setAvatarChoices((prev) => [...prev, ...nextBatch])
    setAvatarOffset((prev) => prev + AVATAR_BATCH_SIZE)
  }

  const handlePickAvatarFromDevice = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    try {
      setAvatarUploading(true)
      const optimized = await optimizeAvatarImage(file)
      const { getAuthToken } = await import('@/lib/auth/auth-token')
      const { apiClient } = await import('@/lib/api/client')
      const token = await getAuthToken()
      if (!token) {
        toast.error('Session expired. Please login again.')
        return
      }

      const uploadRes = await apiClient.post(
        '/api/auth/avatar/upload',
        { imageData: optimized },
        token,
      )
      if (!uploadRes.success || !uploadRes.data?.avatar_url) {
        throw new Error(uploadRes.error || 'Avatar upload failed')
      }

      const cloudUrl = String(uploadRes.data.avatar_url)
      setSelectedAvatarUrl(cloudUrl)
      setAvatarChoices((prev) => [
        { label: 'Uploaded from device', url: cloudUrl },
        ...prev,
      ])
      toast.success('Image uploaded. Save profile to apply.')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to upload image',
      )
    } finally {
      setAvatarUploading(false)
      event.target.value = ''
    }
  }

  const handleLogout = async () => {
    const { removeAuthToken } = await import('@/lib/auth/auth-token')
    await removeAuthToken()

    // Reset step tracker state to prevent syncing previous user's data
    const { stepTracker } = await import('@/lib/services/step-tracker')
    stepTracker.resetTrackerState()

    window.location.href = '/login'
  }

  const calculateAge = (dob?: string) => {
    if (!dob) return '-'
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--
    }
    return age.toString()
  }

  const formatHeight = (height?: number, units?: string) => {
    if (!height) return '-'
    if (units === 'imperial') return `${Math.round(height / 2.54)} in`
    return `${height} cm`
  }

  const formatWeight = (weight?: number, units?: string) => {
    if (!weight) return '-'
    if (units === 'imperial') return `${Math.round(weight * 2.20462)} lbs`
    return `${weight} kg`
  }

  const handleSaveProfile = async () => {
    try {
      if (avatarUploading) {
        toast.error('Please wait for avatar upload to finish')
        return
      }
      const trimmedName = nameInput.trim()
      if (!trimmedName) {
        toast.error('Name is required')
        return
      }

      const height = Number(heightInput)
      const payload: Record<string, any> = {
        name: trimmedName,
        units: unitsInput,
        gender: genderInput,
        avatar_url: selectedAvatarUrl || undefined,
      }
      if (Number.isFinite(height) && height > 0) payload.height = height
      // Weight changes should come only from Weight Log to keep progress data consistent.
      if (dobInput) payload.date_of_birth = dobInput

      setSaving(true)
      const { getAuthToken } = await import('@/lib/auth/auth-token')
      const { apiClient } = await import('@/lib/api/client')
      const token = await getAuthToken()
      if (!token) {
        toast.error('Session expired. Please login again.')
        return
      }

      const res = await apiClient.put('/api/auth/profile', payload, token)
      if (!res.success || !res.data) {
        throw new Error(res.error || 'Failed to update profile')
      }

      setUserData(res.data as User)
      window.dispatchEvent(
        new CustomEvent('profile:updated', {
          detail: {
            name: res.data?.name,
            avatar_url: res.data?.avatar_url,
            updated_at: res.data?.updated_at,
          },
        }),
      )
      setIsEditOpen(false)
      toast.success('Profile updated')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const userInitial = userData?.name?.charAt(0).toUpperCase() || 'U'
  const userAvatar = userData?.avatar_url

  if (loading) {
    return (
      <div>
        <ProfileHeaderSkeleton />
        <div className='px-6 pb-4'>
          <ProfileSectionSkeleton />
          <ProfileSectionSkeleton />
          <ProfileSectionSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className='h-full flex flex-col overflow-hidden'>
      <div className='flex-shrink-0'>
        <div className='app-surface px-6 pt-14 pb-8 text-center border-b border-[color:var(--app-border)]'>
          {/* Avatar */}
          <div className='relative w-20 h-20 mx-auto mb-4'>
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userData?.name || 'User'}
                className='w-20 h-20 rounded-[28px] object-cover shadow-md'
              />
            ) : (
              <div className='w-20 h-20 rounded-[28px] bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-[32px] font-extrabold text-white shadow-md'>
                {userInitial}
              </div>
            )}

            <button
              type='button'
              onClick={async () => {
                setSelectedAvatarUrl(userData?.avatar_url || '')
                setIsEditOpen(true)
                if (avatarChoices.length === 0) {
                  loadInitialAvatars()
                }
              }}
              className='absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-blue-600 border border-white flex items-center justify-center shadow-sm'
              aria-label='Edit profile'
            >
              <Icon name='edit' size={14} color='#ffffff' />
            </button>
          </div>

          {/* Name */}
          <div className='text-2xl font-extrabold text-[color:var(--app-text)] mb-1'>
            {userData?.name || 'User'}
          </div>

          {/* Email */}
          <div className='text-[13px] text-[color:var(--app-text-muted)] mb-4'>
            {userData?.email || ''}
          </div>

          {/* Stats */}
          <div className='flex justify-center gap-8'>
            {[
              {
                label: 'Height',
                val: formatHeight(userData?.height, userData?.units),
              },
              {
                label: 'Baseline Weight',
                val: formatWeight(userData?.weight_kg, userData?.units),
              },
              { label: 'Age', val: calculateAge(userData?.date_of_birth) },
            ].map((item) => (
              <div key={item.label} className='text-center'>
                <div className='text-[16px] font-bold text-[color:var(--app-text)]'>
                  {item.val}
                </div>
                <div className='text-[11px] text-[color:var(--app-text-muted)]'>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className='flex-1 overflow-y-auto px-6 pb-6'>
        <div className='mb-5 pt-3'>
          <div className='text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2'>
            My Goals
          </div>
          <div className='bg-[#131520] border border-white/5 rounded-2xl overflow-hidden'>
            <Link
              href='/settings/goals'
              className='flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors'
            >
              <div className='w-[34px] h-[34px] rounded-xl flex items-center justify-center bg-blue-500/10'>
                <Icon name='target' size={16} color='#3B82F6' />
              </div>
              <span className='flex-1 text-[14px] font-medium text-white'>
                Nutrition Goals
              </span>
              <span className='text-[13px] text-gray-400'>Set targets</span>
              <Icon name='chevronRight' size={16} color='#374151' />
            </Link>
          </div>
        </div>

        <div className='mb-5'>
          <div className='text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2'>
            Settings
          </div>
          <div className='bg-[#131520] border border-white/5 rounded-2xl overflow-hidden'>
            {/* Units Setting */}
            <div className='flex items-center gap-3 px-4 py-3.5 border-b border-white/5'>
              <div className='w-[34px] h-[34px] rounded-xl flex items-center justify-center bg-blue-500/10'>
                <Icon name='repeat' size={16} color='#3B82F6' />
              </div>
              <span className='flex-1 text-[14px] font-medium text-white'>
                Units
              </span>
              <span className='text-[13px] text-gray-400'>
                {userData?.units === 'metric' ? 'Metric' : 'Imperial'}
              </span>
              <Icon name='chevronRight' size={16} color='#374151' />
            </div>

            {/* Notifications Toggle */}
            <button
              type='button'
              onClick={async () => {
                const success = await togglePushNotifications()
                if (success) {
                  toast.success(
                    notificationPrefs?.push_notifications_enabled
                      ? 'Push notifications disabled'
                      : 'Push notifications enabled'
                  )
                } else {
                  toast.error('Failed to update notification settings')
                }
              }}
              className='w-full flex items-center gap-3 px-4 py-3.5 text-left border-b border-white/5'
            >
              <div className='w-[34px] h-[34px] rounded-xl flex items-center justify-center bg-blue-500/10'>
                <Icon name='bell' size={16} color='#3B82F6' />
              </div>
              <span className='flex-1 text-[14px] font-medium text-white'>
                Push Notifications
              </span>
              <span className='text-[13px] text-gray-400'>
                {notificationPrefs?.push_notifications_enabled ? 'On' : 'Off'}
              </span>
              <div
                className={`w-11 h-6 rounded-full p-1 transition-colors ${
                  notificationPrefs?.push_notifications_enabled
                    ? 'bg-blue-600'
                    : 'bg-slate-500'
                }`}
              >
                <div
                  className={`h-4 w-4 rounded-full bg-white transition-transform ${
                    notificationPrefs?.push_notifications_enabled
                      ? 'translate-x-5'
                      : 'translate-x-0'
                  }`}
                />
              </div>
            </button>

            {/* Link to Detailed Settings */}
            <Link
              href='/settings/notifications'
              className='flex items-center gap-3 px-4 py-3.5 border-b border-white/5'
            >
              <div className='w-[34px] h-[34px] rounded-xl flex items-center justify-center bg-blue-500/10'>
                <Icon name='settings' size={16} color='#3B82F6' />
              </div>
              <span className='flex-1 text-[14px] font-medium text-white'>
                Notification Settings
              </span>
              <span className='text-[13px] text-gray-400'>Customize</span>
              <Icon name='chevronRight' size={16} color='#374151' />
            </Link>
            <button
              type='button'
              onClick={toggleThemeMode}
              className='w-full flex items-center gap-3 px-4 py-3.5 text-left'
            >
              <div className='w-[34px] h-[34px] rounded-xl flex items-center justify-center bg-blue-500/10'>
                <Icon name='moon' size={16} color='#3B82F6' />
              </div>
              <span className='flex-1 text-[14px] font-medium text-white'>
                Dark Mode
              </span>
              {/* <span className='text-[13px] text-gray-400'>On</span> */}
              <span className='text-[13px] text-gray-400'>
                {themeMode === 'dark' ? 'On' : 'Off'}
              </span>
              <div
                className={`w-11 h-6 rounded-full p-1 transition-colors ${
                  themeMode === 'dark' ? 'bg-blue-600' : 'bg-slate-500'
                }`}
              >
                <div
                  className={`h-4 w-4 rounded-full bg-white transition-transform ${
                    themeMode === 'dark' ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
              {/* <Icon name='chevronRight' size={16} color='#374151' /> */}
            </button>
          </div>
        </div>

        <div className='mb-5'>
          <div className='text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2'>
            Account
          </div>
          <div className='bg-[#131520] border border-white/5 rounded-2xl overflow-hidden'>
            {[
              { label: 'Export Data', val: '', icon: 'edit', action: null },
              { label: 'Privacy Policy', val: '', icon: 'mail', action: null },
              {
                label: 'Log Out',
                val: '',
                icon: 'logout',
                action: handleLogout,
              },
            ].map((item, i, arr) => (
              <button
                key={item.label}
                onClick={item.action || undefined}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left ${
                  i < arr.length - 1 ? 'border-b border-white/5' : ''
                } ${item.label === 'Log Out' ? 'text-red-500' : ''}`}
              >
                <div
                  className={`w-[34px] h-[34px] rounded-xl flex items-center justify-center ${
                    item.label === 'Log Out'
                      ? 'bg-red-500/10'
                      : 'bg-blue-500/10'
                  }`}
                >
                  <Icon
                    name={item.icon}
                    size={16}
                    color={item.label === 'Log Out' ? '#EF4444' : '#3B82F6'}
                  />
                </div>
                <span
                  className={`flex-1 text-[14px] font-medium ${
                    item.label === 'Log Out' ? 'text-red-500' : 'text-white'
                  }`}
                >
                  {item.label}
                </span>
                {item.val && (
                  <span className='text-[13px] text-gray-400'>{item.val}</span>
                )}
                <Icon name='chevronRight' size={16} color='#374151' />
              </button>
            ))}
          </div>
        </div>
      </div>

      {isEditOpen && (
        <div className='fixed inset-0 z-50 bg-black/65 flex items-end sm:items-center justify-center p-3'>
          <div className='w-full max-w-xl bg-[#131520] border border-white/10 rounded-2xl p-4 max-h-[88vh] overflow-y-auto'>
            <div className='flex items-center justify-between mb-3'>
              <div className='text-[14px] font-bold text-white'>
                Edit Profile
              </div>
              <button
                type='button'
                onClick={handleCancelEdit}
                className='w-8 h-8 rounded-lg bg-[#1a1f35] border border-white/10 flex items-center justify-center'
                aria-label='Close'
              >
                <Icon name='x' size={14} color='#9CA3AF' />
              </button>
            </div>

            <div className='mb-3'>
              <div className='text-[12px] text-gray-400 mb-2'>Avatar</div>
              <div className='flex items-center gap-2 mb-2'>
                <button
                  type='button'
                  onClick={handleRefreshAvatars}
                  className='h-9 px-3 rounded-xl bg-blue-600 text-white text-[12px] font-semibold disabled:opacity-60'
                >
                  Refresh avatars
                </button>
                <button
                  type='button'
                  onClick={() => fileInputRef.current?.click()}
                  className='h-9 px-3 rounded-xl bg-[#1a1f35] border border-white/10 text-gray-200 text-[12px] font-semibold'
                >
                  Choose from device
                </button>
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='image/*'
                  onChange={handlePickAvatarFromDevice}
                  className='hidden'
                />
              </div>
              <div className='grid grid-cols-4 gap-2'>
                {avatarChoices.map((choice, idx) => (
                  <button
                    key={`${choice.url}-${idx}`}
                    type='button'
                    onClick={() => setSelectedAvatarUrl(choice.url)}
                    className={`relative h-16 flex items-center justify-center transition-transform ${
                      selectedAvatarUrl === choice.url
                        ? 'scale-110'
                        : 'scale-100'
                    }`}
                    title={choice.label}
                  >
                    <img
                      src={choice.url}
                      alt={choice.label || `Avatar option ${idx + 1}`}
                      className='w-14 h-14 object-contain'
                    />
                    {selectedAvatarUrl === choice.url && (
                      <span className='absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center'>
                        <Icon name='check' size={12} color='#ffffff' />
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <button
                type='button'
                onClick={loadMoreAvatars}
                className='mt-2 w-full h-9 rounded-xl bg-[#1a1f35] border border-white/10 text-[12px] text-gray-200 font-semibold'
              >
                Load more avatars
              </button>
            </div>

            <div className='mb-3 rounded-xl border border-white/10 bg-[#0f1426] p-3'>
              <div className='text-[12px] text-gray-300 mb-2'>
                Customize Avatar
              </div>
              <div className='grid grid-cols-2 gap-2 mb-2'>
                <select
                  value={customStyle}
                  onChange={(e) =>
                    setCustomStyle(e.target.value as DiceBearStyle)
                  }
                  className='bg-[#1a1f35] border border-white/10 rounded-xl px-3 py-2 text-white text-[13px]'
                >
                  {DICEBEAR_STYLES.map((style) => (
                    <option key={style} value={style}>
                      {style}
                    </option>
                  ))}
                </select>
                <input
                  type='text'
                  value={customSeed}
                  onChange={(e) => setCustomSeed(e.target.value)}
                  placeholder='Name / seed'
                  className='bg-[#1a1f35] border border-white/10 rounded-xl px-3 py-2 text-white text-[13px]'
                />
              </div>
              <div className='flex items-center gap-2 mb-2'>
                {CUSTOM_BG_COLORS.map((color) => (
                  <button
                    key={color}
                    type='button'
                    onClick={() => setCustomBgColor(color)}
                    className={`w-6 h-6 rounded-full border ${
                      customBgColor === color
                        ? 'border-white'
                        : 'border-white/20'
                    }`}
                    style={{ backgroundColor: `#${color}` }}
                    aria-label={`Background ${color}`}
                  />
                ))}
              </div>
              <div className='flex items-center gap-2'>
                <button
                  type='button'
                  onClick={applyCustomAvatar}
                  className='flex-1 h-9 rounded-xl bg-blue-600 text-white text-[12px] font-semibold'
                >
                  Apply Custom
                </button>
                <button
                  type='button'
                  onClick={randomizeCustomAvatar}
                  className='h-9 px-3 rounded-xl bg-[#1a1f35] border border-white/10 text-gray-200 text-[12px] font-semibold'
                >
                  Randomize
                </button>
              </div>
            </div>

            <div className='grid gap-2.5'>
              <input
                type='text'
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder='Name'
                className='bg-[#1a1f35] border border-white/10 rounded-xl px-3 py-2.5 text-white text-[14px]'
              />
              <div className='grid grid-cols-2 gap-2'>
                <input
                  type='number'
                  value={heightInput}
                  onChange={(e) => setHeightInput(e.target.value)}
                  placeholder={
                    unitsInput === 'metric' ? 'Height (cm)' : 'Height (in)'
                  }
                  className='bg-[#1a1f35] border border-white/10 rounded-xl px-3 py-2.5 text-white text-[14px]'
                />
                <input
                  type='number'
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  placeholder={
                    unitsInput === 'metric' ? 'Baseline Weight (kg)' : 'Baseline Weight (lbs)'
                  }
                  disabled
                  className='bg-[#1a1f35] border border-white/10 rounded-xl px-3 py-2.5 text-gray-400 text-[14px] opacity-70 cursor-not-allowed'
                />
              </div>
              <div className='text-[11px] text-gray-500 -mt-1'>
                Baseline weight is set during onboarding. Track current weight from Progress page.
              </div>
              <input
                type='date'
                value={dobInput}
                onChange={(e) => setDobInput(e.target.value)}
                className='bg-[#1a1f35] border border-white/10 rounded-xl px-3 py-2.5 text-white text-[14px]'
              />
              <div className='grid grid-cols-2 gap-2'>
                <select
                  value={genderInput}
                  onChange={(e) =>
                    setGenderInput(
                      e.target.value as 'male' | 'female' | 'other',
                    )
                  }
                  className='bg-[#1a1f35] border border-white/10 rounded-xl px-3 py-2.5 text-white text-[14px]'
                >
                  <option value='male'>Male</option>
                  <option value='female'>Female</option>
                  <option value='other'>Other</option>
                </select>
                <select
                  value={unitsInput}
                  onChange={(e) =>
                    setUnitsInput(e.target.value as 'metric' | 'imperial')
                  }
                  className='bg-[#1a1f35] border border-white/10 rounded-xl px-3 py-2.5 text-white text-[14px]'
                >
                  <option value='metric'>Metric</option>
                  <option value='imperial'>Imperial</option>
                </select>
              </div>
            </div>

            <button
              type='button'
              onClick={handleSaveProfile}
              disabled={saving || avatarUploading}
              className='mt-3 w-full h-10 rounded-xl bg-blue-600 text-white text-[13px] font-semibold disabled:opacity-50'
            >
              {avatarUploading
                ? 'Uploading avatar...'
                : saving
                  ? 'Saving...'
                  : 'Save Profile'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
